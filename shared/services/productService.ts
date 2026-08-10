import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Product, ProductWithDetails, PaginatedResult } from "../types";
import { variantImages, resolvePrimaryMedia } from "./productImageService";

type Client = SupabaseClient<Database>;

export type ProductListRow = Product & { primaryImage: string | null; primaryImageIsVideo: boolean; displayPrice: number };

export async function fetchProducts(
  client: Client,
  partyId: string,
  opts: {
    page?: number;
    pageSize?: number;
    status?: "draft" | "active" | "inactive";
    category_id?: string;
    search?: string;
  } = {}
): Promise<PaginatedResult<ProductListRow>> {
  const { page = 1, pageSize = 20, status, category_id, search } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // A product's card everywhere (this list, storefront cards) always represents itself with
  // its first variant's price/image when it has variants — see ProductPurchasePanel for the
  // same rule on the detail page.
  let query = client
    .from("products")
    .select("*, product_variants(id, price, sort_order, is_active), product_images(url, is_primary, variant_id, media_type)", { count: "exact" })
    .eq("party_id", partyId);

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("title", `%${search}%`);
  if (category_id) {
    const { data: catRows } = await client
      .from("product_categories")
      .select("product_id")
      .eq("category_id", category_id);
    const ids = (catRows ?? []).map((r) => r.product_id);
    if (ids.length === 0) return { data: [], total: 0, page, pageSize };
    query = query.in("id", ids);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  // Fetch stock for all products in one query — summed across every tracked row per product,
  // since a product with variants has one inventory_items row per variant, not a single
  // product-level row (see fetchOutOfStockMap in searchService.ts for the same rollup).
  const productIds = (data ?? []).map((p) => p.id);
  let stockMap = new Map<string, number>();
  if (productIds.length > 0) {
    const { data: inventoryRows } = await client
      .from("inventory_items")
      .select("product_id, qty_on_hand, qty_reserved")
      .in("product_id", productIds)
      .eq("track_inventory", true);

    for (const r of inventoryRows ?? []) {
      stockMap.set(r.product_id, (stockMap.get(r.product_id) ?? 0) + (r.qty_on_hand - r.qty_reserved));
    }
  }

  const products = ((data ?? []) as any[]).map((p) => {
    const variants = ((p.product_variants ?? []) as any[])
      .filter((v) => v.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
    const firstVariant = variants[0] ?? null;
    const images = variantImages((p.product_images ?? []) as any[], firstVariant?.id ?? null);
    const primary = resolvePrimaryMedia(images);
    const { product_variants, product_images, ...rest } = p;
    return {
      ...rest,
      stock: stockMap.get(p.id) ?? null,
      primaryImage: primary?.url ?? null,
      primaryImageIsVideo: primary?.media_type === "video",
      displayPrice: firstVariant?.price != null ? Number(firstVariant.price) : Number(p.price),
    };
  }) as ProductListRow[];

  return { data: products, total: count ?? 0, page, pageSize };
}

export async function fetchProduct(
  client: Client,
  productId: string
): Promise<ProductWithDetails | null> {
  const { data, error } = await client
    .from("products")
    .select(`
      *,
      brand:brand_id(*),
      images:product_images(*),
      variants:product_variants(*),
      product_categories(category_id),
      product_tags(tag)
    `)
    .eq("id", productId)
    .single();

  if (error || !data) return null;

  const raw = data as Record<string, unknown>;
  const variants = ((raw.variants as ProductWithDetails["variants"]) ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
  return {
    ...(raw as unknown as Product),
    brand: (raw.brand as ProductWithDetails["brand"]) ?? null,
    images: (raw.images as ProductWithDetails["images"]) ?? [],
    variants,
    categories: ((raw.product_categories as Array<{ category_id: string }>) ?? []).map((r) => r.category_id),
    tags: ((raw.product_tags as Array<{ tag: string }>) ?? []).map((r) => r.tag),
  };
}

export async function createProduct(
  client: Client,
  input: Database["public"]["Tables"]["products"]["Insert"]
): Promise<{ data: Product | null; error: Error | null }> {
  const { data, error } = await client
    .from("products")
    .insert(input)
    .select()
    .single();
  return {
    data: error ? null : ({ ...data, stock: null } as Product),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateProduct(
  client: Client,
  productId: string,
  updates: Database["public"]["Tables"]["products"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("products").update(updates).eq("id", productId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteProduct(
  client: Client,
  productId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("products").delete().eq("id", productId);
  return { error: error ? new Error(error.message) : null };
}

export async function setProductCategories(
  client: Client,
  productId: string,
  categoryIds: string[]
): Promise<{ error: Error | null }> {
  const { error: delErr } = await client
    .from("product_categories")
    .delete()
    .eq("product_id", productId);
  if (delErr) return { error: new Error(delErr.message) };
  if (categoryIds.length === 0) return { error: null };
  const { error: insErr } = await client
    .from("product_categories")
    .insert(categoryIds.map((category_id) => ({ product_id: productId, category_id })));
  return { error: insErr ? new Error(insErr.message) : null };
}
