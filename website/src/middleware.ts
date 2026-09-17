import { defineMiddleware } from "astro:middleware";
import { createSupabase } from "./lib/supabase";
import { resolvePartyIdByDomain, resolveStorefrontPartyBySlug, fetchStoreConfig } from "@shared/services/storeConfigService";
import type { StorefrontParty } from "@shared/services/storeConfigService";

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

  const response = await next();

  // Cloudflare's Worker Response defaults to "Content-Type: text/html" with no charset,
  // which SEO/accessibility checkers flag since the byte encoding is left implicit.
  const contentType = response.headers.get("content-type");
  if (contentType?.startsWith("text/html") && !contentType.includes("charset")) {
    response.headers.set("Content-Type", "text/html; charset=UTF-8");
  }

  return response;
});
