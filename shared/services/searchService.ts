import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { SearchResultCategory, SearchResultProduct, StorefrontSearchResult } from "../types";
import { variantImages } from "./productImageService";

type Client = SupabaseClient<Database>;

// Sums every tracked inventory row per product — not just the product-level (variant_id IS
// NULL) row. That row is auto-created at qty 0 by create_default_inventory_item() the moment
// a product is inserted, before any variants exist; a product stocked only at variant level
// (the common case once variants are added) would otherwise always read as 0 available and
// show a false "out of stock" badge regardless of real variant stock.
export async function fetchOutOfStockMap(client: Client, productIds: string[]): Promise<Map<string, number>> {
  const { data: inventoryRows } = productIds.length > 0
    ? await client
        .from("inventory_items")
        .select("product_id, qty_on_hand, qty_reserved")
        .in("product_id", productIds)
        .eq("track_inventory", true)
    : { data: [] };
  const map = new Map<string, number>();
  for (const r of (inventoryRows ?? []) as any[]) {
    map.set(r.product_id, (map.get(r.product_id) ?? 0) + (r.qty_on_hand - r.qty_reserved));
  }
  return map;
}

// Keyed by `${product_id}:${variant_id ?? ""}` so callers can look up the exact row that
// represents a card/detail view (first active variant, or the product-level row when there
// are none) and read its real track_inventory flag — the only source of truth for whether an
// item is genuinely made-to-order, independent of any manually-assigned "condition" label.
export async function fetchInventoryTrackingMap(client: Client, productIds: string[]): Promise<Map<string, boolean>> {
  const { data: rows } = productIds.length > 0
    ? await client
        .from("inventory_items")
        .select("product_id, variant_id, track_inventory")
        .in("product_id", productIds)
    : { data: [] };
  const map = new Map<string, boolean>();
  for (const r of (rows ?? []) as any[]) {
    map.set(`${r.product_id}:${r.variant_id ?? ""}`, r.track_inventory);
  }
  return map;
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
      product_images(url, is_primary, variant_id),
      product_variants(id, price, sort_order, is_active),
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

  // Same "first active variant represents the card" rule as the shop grid and admin list.
  const products: SearchResultProduct[] = ((rawProducts ?? []) as any[]).map((p) => {
    const firstVariant = ((p.product_variants ?? []) as any[])
      .filter((v) => v.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;
    const images = variantImages((p.product_images ?? []) as any[], firstVariant?.id ?? null);
    const primary = images.find((i: any) => i.is_primary) ?? images[0];
    const qtyAvailable = inventoryMap.has(p.id) ? inventoryMap.get(p.id)! : null;
    const categoryName = p.product_categories?.[0]?.categories?.name ?? null;
    return {
      id: p.id, title: p.title, slug: p.slug,
      price: firstVariant?.price != null ? Number(firstVariant.price) : p.price,
      discount_price: firstVariant ? null : p.discount_price,
      primaryImage: primary?.url ?? null,
      isOutOfStock: qtyAvailable !== null && qtyAvailable <= 0,
      categoryName,
    };
  });

  return { categories: (categories ?? []) as SearchResultCategory[], products };
}
