import type { APIRoute } from "astro";
import { createSupabase } from "../../lib/supabase";
import { searchStorefront } from "@shared/services/searchService";

export const GET: APIRoute = async (context) => {
  const query = (context.url.searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return new Response(JSON.stringify({ query, categories: [], products: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabase(context);
  // Path-based stores (/eshop-{slug}) can only be resolved from the page's own dynamic
  // route param, which this flat API route doesn't have — the client passes it explicitly
  // (see StorefrontNav's search script), same pattern as /api/newsletter/subscribe.
  const partyId = context.url.searchParams.get("partyId") || context.locals.storeParty?.id || null;
  const { categories, products } = await searchStorefront(supabase, { partyId, query });

  return new Response(JSON.stringify({ query, categories, products }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
