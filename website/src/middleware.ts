import { defineMiddleware } from "astro:middleware";
import { createSupabase } from "./lib/supabase";
import { resolvePartyIdByDomain, resolvePartyIdBySlug, fetchStoreConfig } from "@shared/services/storeConfigService";

export const onRequest = defineMiddleware(async (context, next) => {
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
  let partyId = context.params.partySlug
    ? await resolvePartyIdBySlug(supabase, context.params.partySlug as string)
    : null;

  if (!partyId) {
    partyId = await resolvePartyIdByDomain(supabase, hostname);
  }

  if (!partyId) {
    if (appDomain && hostname !== appDomain && hostname.endsWith(`.${appDomain}`)) {
      const slug = hostname.slice(0, -(appDomain.length + 1));
      if (slug && slug !== "www") {
        partyId = await resolvePartyIdBySlug(supabase, slug);
      }
    }
  }

  context.locals.storeParty = partyId
    ? { id: partyId, config: await fetchStoreConfig(supabase, partyId) }
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
