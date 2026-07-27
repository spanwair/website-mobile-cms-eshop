import { defineMiddleware } from "astro:middleware";
import { createSupabase } from "./lib/supabase";
import { resolvePartyIdByDomain, resolvePartyIdBySlug, fetchStoreConfig } from "@shared/services/storeConfigService";

export const onRequest = defineMiddleware(async (context, next) => {
  const hostname = (context.request.headers.get("host") ?? "").split(":")[0];
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
    const appDomain = (import.meta.env.PUBLIC_APP_DOMAIN ?? "").split(":")[0];
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

  return next();
});
