import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Product, ProductWithDetails, PaginatedResult } from "../types";

type Client = SupabaseClient<Database>;

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
): Promise<PaginatedResult<Product>> {
  const { page = 1, pageSize = 20, status, category_id, search } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("products")
    .select("*", { count: "exact" })
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

  // Fetch stock for all products in one query
  const productIds = (data ?? []).map((p) => p.id);
  let stockMap = new Map<string, number>();
  if (productIds.length > 0) {
    const { data: inventoryRows } = await client
      .from("inventory_items")
      .select("product_id, qty_on_hand, qty_reserved")
      .in("product_id", productIds)
      .is("variant_id", null)
      .eq("track_inventory", true);

    stockMap = new Map(
      (inventoryRows ?? []).map((r) => [r.product_id, r.qty_on_hand - r.qty_reserved])
    );
  }

  const products = (data ?? []).map((p) => ({
    ...p,
    stock: stockMap.get(p.id) ?? null,
  })) as Product[];

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
  return {
    ...(raw as unknown as Product),
    brand: (raw.brand as ProductWithDetails["brand"]) ?? null,
    images: (raw.images as ProductWithDetails["images"]) ?? [],
    variants: (raw.variants as ProductWithDetails["variants"]) ?? [],
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
