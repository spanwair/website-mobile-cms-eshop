import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { SearchResultCategory, SearchResultProduct, StorefrontSearchResult } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchOutOfStockMap(client: Client, productIds: string[]): Promise<Map<string, number>> {
  const { data: inventoryRows } = productIds.length > 0
    ? await client
        .from("inventory_items")
        .select("product_id, qty_on_hand, qty_reserved")
        .in("product_id", productIds)
        .is("variant_id", null)
        .eq("track_inventory", true)
    : { data: [] };
  return new Map(
    (inventoryRows ?? []).map((r: any) => [r.product_id, r.qty_on_hand - r.qty_reserved])
  );
}

interface SearchStorefrontParams {
  partyId?: string | null;
  query: string;
  categoryLimit?: number;
  productLimit?: number;
}

// Live-typing search across categories and products, powering the storefront nav dropdown —
// returns two small ranked lists rather than a paginated single list.
export async function searchStorefront(client: Client, params: SearchStorefrontParams): Promise<StorefrontSearchResult> {
  const { partyId, query, categoryLimit = 5, productLimit = 6 } = params;
  const term = `%${query}%`;

  let categoryQuery = client
    .from("categories")
    .select("id, name, slug, icon")
    .eq("is_visible", true)
    .ilike("name", term)
    .order("sort_order", { ascending: true })
    .limit(categoryLimit);
  if (partyId) categoryQuery = categoryQuery.eq("party_id", partyId);

  let productQuery = client
    .from("products")
    .select(`id, title, slug, price, discount_price,
      product_images(url, is_primary),
      product_categories(categories(name))`)
    .eq("status", "active")
    .eq("is_visible", true)
    .ilike("title", term)
    .order("created_at", { ascending: false })
    .limit(productLimit);
  if (partyId) productQuery = productQuery.eq("party_id", partyId);

  const [{ data: categories }, { data: rawProducts }] = await Promise.all([categoryQuery, productQuery]);

  const productIds = (rawProducts ?? []).map((p: any) => p.id);
  const inventoryMap = await fetchOutOfStockMap(client, productIds);

  const products: SearchResultProduct[] = ((rawProducts ?? []) as any[]).map((p) => {
    const images = p.product_images ?? [];
    const primary = images.find((i: any) => i.is_primary) ?? images[0];
    const qtyAvailable = inventoryMap.has(p.id) ? inventoryMap.get(p.id)! : null;
    const categoryName = p.product_categories?.[0]?.categories?.name ?? null;
    return {
      id: p.id, title: p.title, slug: p.slug, price: p.price, discount_price: p.discount_price,
      primaryImage: primary?.url ?? null,
      isOutOfStock: qtyAvailable !== null && qtyAvailable <= 0,
      categoryName,
    };
  });

  return { categories: (categories ?? []) as SearchResultCategory[], products };
}
