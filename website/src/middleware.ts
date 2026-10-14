import { defineMiddleware } from "astro:middleware";
import { createSupabase } from "./lib/supabase";
import { resolvePartyIdByDomain, resolveStorefrontPartyBySlug, fetchStoreConfig } from "@shared/services/storeConfigService";
import type { StorefrontParty } from "@shared/services/storeConfigService";

// ---- Edge HTML cache (Cloudflare Workers Cache API) ---------------------------------------
// Anonymous storefront page HTML is identical for every visitor (the only per-user surface, the
// cart badge, is filled client-side), so we serve it from the edge cache instead of re-running
// party resolution + SSR + Supabase on every request. A HIT short-circuits before any DB work.
// Logged-in visitors (auth cookie) and account/admin/api paths always bypass.
type EdgeCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};
type CfRuntime = {
  caches?: { default: EdgeCache };
  ctx?: { waitUntil?: (p: Promise<unknown>) => void };
  env?: Record<string, string>;
};

const DEFAULT_EDGE_TTL = 60;
const ACCOUNT_SEGMENTS = new Set([
  "cart", "checkout", "profile", "settings", "wishlist", "dashboard", "order-confirmation",
]);

function hasAuthCookie(request: Request): boolean {
  return (request.headers.get("cookie") ?? "").includes("-auth-token");
}

function isCacheableRequest(request: Request, pathname: string): boolean {
  if (request.method !== "GET") return false;
  if (hasAuthCookie(request)) return false;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/docs")
  ) return false;
  return !pathname.split("/").filter(Boolean).some((s) => ACCOUNT_SEGMENTS.has(s));
}

// Key includes host (built into the URL -> tenant/custom-domain isolation) plus the lang cookie,
// so CS and EN variants of the same URL never collide.
function buildCacheKey(url: URL, lang: string): Request {
  const keyUrl = new URL(url);
  keyUrl.searchParams.set("__lang", lang);
  return new Request(keyUrl.toString(), { method: "GET" });
}

function isStorableResponse(response: Response): boolean {
  if (response.status !== 200) return false;
  if (response.headers.get("set-cookie")) return false;
  return (response.headers.get("content-type") ?? "").startsWith("text/html");
}

function applyCharset(response: Response): Response {
  const contentType = response.headers.get("content-type");
  if (contentType?.startsWith("text/html") && !contentType.includes("charset")) {
    response.headers.set("Content-Type", "text/html; charset=UTF-8");
  }
  return response;
}

// The documentation is a Starlight site (base=/docs) published as static assets into
// public/docs by scripts/build-docs.sh. In production Cloudflare's asset layer serves
// /docs/** before this Worker ever runs, resolving directory index.html natively. But
// `astro dev` does not resolve a directory index for public subfolders (only exact files),
// so /docs/ and /docs/admin/setup/ would 404 locally. This dev-only shim reads the matching
// index.html directly. Either way /docs is not a storefront route and must skip the
// party/host resolution below.
async function serveDocsIndexInDev(pathname: string): Promise<Response | null> {
  const rel = pathname === "/docs" ? "/" : pathname.slice("/docs".length);
  const lastSegment = rel.split("/").pop() ?? "";
  if (lastSegment.includes(".")) return null; // a real asset file — let the static server handle it
  const filePath = rel.endsWith("/") ? `${rel}index.html` : `${rel}/index.html`;
  try {
    const { readFile } = await import("node:fs/promises");
    const html = await readFile(new URL(`../public/docs${filePath}`, import.meta.url));
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=UTF-8" } });
  } catch {
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === "/docs" || context.url.pathname.startsWith("/docs/")) {
    if (import.meta.env.DEV) {
      const served = await serveDocsIndexInDev(context.url.pathname);
      if (served) return served;
    }
    return next();
  }

  const hostname = (context.request.headers.get("host") ?? "").split(":")[0];
  const appDomain = (import.meta.env.PUBLIC_APP_DOMAIN ?? "").split(":")[0];

  // Canonicalize scheme/host before anything else: crawlers and browsers must only ever
  // see one reachable URL per page (https, apex domain), or Google/Seobility treat
  // http/https and www/non-www as duplicate content with a split canonical signal.
  if (import.meta.env.PROD) {
    const canonicalHost = hostname === `www.${appDomain}` ? appDomain : hostname;
    if (context.url.protocol !== "https:" || canonicalHost !== hostname) {
      // A same-host http->https upgrade Location built this way gets silently downgraded
      // back to http by `wrangler dev --local` (Miniflare can't itself terminate TLS, so it
      // appears to suppress same-authority scheme upgrades) — confirmed correct on the real
      // Cloudflare edge is the only way to verify this after deploying, `wrangler dev` will
      // under-report it.
      const location = `https://${canonicalHost}${context.url.pathname}${context.url.search}`;
      return new Response(null, { status: 301, headers: { Location: location } });
    }
  }

  // Edge-cache lookup happens BEFORE party resolution so a HIT skips all Supabase work + SSR.
  const runtime = (context.locals as { runtime?: CfRuntime }).runtime;
  const cache = runtime?.caches?.default ?? (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches?.default ?? null;
  const edgeTtl = Number(runtime?.env?.EDGE_CACHE_TTL) || DEFAULT_EDGE_TTL;
  const canCache = !!cache && isCacheableRequest(context.request, context.url.pathname);
  const lang = context.cookies.get("lang")?.value === "en" ? "en" : "cs";
  const cacheKey = canCache ? buildCacheKey(context.url, lang) : null;

  if (cache && cacheKey) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const storedAt = Number(hit.headers.get("x-stored-at") ?? 0);
      const fresh = storedAt > 0 && (Date.now() - storedAt) / 1000 <= edgeTtl;
      if (fresh) {
        const headers = new Headers(hit.headers);
        headers.set("Cache-Control", "public, max-age=0, must-revalidate");
        headers.set("x-edge-cache", "HIT");
        return new Response(hit.body, { status: hit.status, headers });
      }
    }
  }

  const supabase = createSupabase(context);

  // /eshop-[partySlug] paths resolve their own org explicitly — takes priority over
  // domain-based resolution so the same base domain can serve any organization by path.
  let party: StorefrontParty | null = context.params.partySlug
    ? await resolveStorefrontPartyBySlug(supabase, context.params.partySlug as string)
    : null;

  if (!party) {
    const domainPartyId = await resolvePartyIdByDomain(supabase, hostname);
    if (domainPartyId) party = { id: domainPartyId, status: "active" };
  }

  if (!party) {
    if (appDomain && hostname !== appDomain && hostname.endsWith(`.${appDomain}`)) {
      const slug = hostname.slice(0, -(appDomain.length + 1));
      if (slug && slug !== "www") {
        party = await resolveStorefrontPartyBySlug(supabase, slug);
      }
    }
  }

  context.locals.storeParty = party
    ? { id: party.id, status: party.status, config: await fetchStoreConfig(supabase, party.id) }
    : null;

  // Cloudflare's Worker Response defaults to "Content-Type: text/html" with no charset,
  // which SEO/accessibility checkers flag since the byte encoding is left implicit.
  const response = applyCharset(await next());

  if (cache && cacheKey && isStorableResponse(response)) {
    const body = await response.arrayBuffer();
    const base = new Headers(response.headers);
    base.delete("set-cookie");

    const edgeHeaders = new Headers(base);
    edgeHeaders.set("Cache-Control", `public, s-maxage=${edgeTtl}`);
    edgeHeaders.set("x-stored-at", String(Date.now()));
    const put = cache.put(cacheKey, new Response(body, { status: response.status, headers: edgeHeaders }));
    if (runtime?.ctx?.waitUntil) runtime.ctx.waitUntil(put); else await put;

    const browserHeaders = new Headers(base);
    browserHeaders.set("Cache-Control", "public, max-age=0, must-revalidate");
    browserHeaders.set("x-edge-cache", "MISS");
    return new Response(body, { status: response.status, headers: browserHeaders });
  }

  return response;
});
