import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOutOfStockMap } from "@shared/services/searchService";

interface ShopQueryParams {
  partyId?: string | null;
  categorySlug: string;
  search: string;
  sort: string;
  page: number;
  pageSize: number;
  isHomepageView: boolean;
  conditionCode?: string;
}

// Shared by /shop (no party filter — cross-org browsing) and /eshop-[partySlug] (party-scoped).
// Passing `partyId` narrows every query to that organization's own catalog.
export async function fetchShopData(supabase: SupabaseClient, params: ShopQueryParams) {
  const { partyId, categorySlug, search, sort, page, pageSize, isHomepageView, conditionCode } = params;
  const from = (page - 1) * pageSize;

  let categoryQuery = supabase
    .from("categories")
    .select("id, name, slug, parent_id, icon, image_url")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (partyId) categoryQuery = categoryQuery.eq("party_id", partyId);
  const { data: categories } = await categoryQuery;

  let featuredProducts: any[] = [];
  if (isHomepageView) {
    let featuredQuery = supabase
      .from("products")
      .select(`id, title, slug, price, discount_price, is_featured, review_count, rating_avg, product_images(url, is_primary), product_conditions(label, color_hex), product_variants(id, name, is_active)`)
      .eq("status", "active")
      .eq("is_visible", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (partyId) featuredQuery = featuredQuery.eq("party_id", partyId);
    const { data: featuredRaw } = await featuredQuery;
    const featuredOutOfStockMap = await fetchOutOfStockMap(supabase, (featuredRaw ?? []).map((p: any) => p.id));
    featuredProducts = (featuredRaw ?? []).map((p: any) => {
      const images = p.product_images ?? [];
      const primary = images.find((i: any) => i.is_primary) ?? images[0];
      const qtyAvailable = featuredOutOfStockMap.has(p.id) ? featuredOutOfStockMap.get(p.id)! : null;
      return {
        ...p, primaryImage: primary?.url ?? null,
        isOutOfStock: qtyAvailable !== null && qtyAvailable <= 0,
        condition: p.product_conditions ?? null,
        variants: activeVariants(p.product_variants),
      };
    });
  }

  // Only embed product_categories as an inner join when actually filtering by one — as a plain
  // (non-inner) embed it wouldn't filter anything, but `!inner` unconditionally would silently
  // drop every product with zero categories from the "all products" view.
  const matchedCategory = categorySlug ? categories?.find((c) => c.slug === categorySlug) : undefined;
  const productCols = matchedCategory
    ? `id, party_id, title, slug, price, discount_price, is_featured, review_count, rating_avg,
       product_images(url, is_primary), product_conditions(label, color_hex), product_variants(id, name, is_active),
       product_categories!inner(category_id)`
    : `id, party_id, title, slug, price, discount_price, is_featured, review_count, rating_avg,
       product_images(url, is_primary), product_conditions(label, color_hex), product_variants(id, name, is_active)`;

  let productQuery = supabase
    .from("products")
    .select(productCols, { count: "exact" })
    .eq("status", "active")
    .eq("is_visible", true);
  if (partyId) productQuery = productQuery.eq("party_id", partyId);

  if (search) {
    productQuery = productQuery.ilike("title", `%${search}%`);
  }

  if (matchedCategory) {
    productQuery = productQuery.eq("product_categories.category_id", matchedCategory.id);
  }

  // Condition can live directly on a simple product, or only on its variants (e.g. same model
  // sold in multiple grades as distinct variants) — match either so the filter works for both.
  if (conditionCode) {
    const { data: cond } = await supabase
      .from("product_conditions")
      .select("id")
      .eq("code", conditionCode)
      .maybeSingle();
    if (cond) {
      const [{ data: directProducts }, { data: variantMatches }] = await Promise.all([
        supabase.from("products").select("id").eq("condition_id", cond.id),
        supabase.from("product_variants").select("product_id").eq("condition_id", cond.id),
      ]);
      const matchedIds = new Set<string>([
        ...(directProducts ?? []).map((p: any) => p.id),
        ...(variantMatches ?? []).map((v: any) => v.product_id),
      ]);
      productQuery = productQuery.in("id", [...matchedIds]);
    } else {
      productQuery = productQuery.in("id", []);
    }
  }

  switch (sort) {
    case "price_asc":  productQuery = productQuery.order("price", { ascending: true }); break;
    case "price_desc": productQuery = productQuery.order("price", { ascending: false }); break;
    case "rating":     productQuery = productQuery.order("rating_avg", { ascending: false }); break;
    default:           productQuery = productQuery.order("created_at", { ascending: false });
  }

  const { data: rawProducts, count } = await productQuery.range(from, from + pageSize - 1);
  const totalPages = Math.ceil((count ?? 0) / pageSize);
  const productIds = (rawProducts ?? []).map((p: any) => p.id);
  const inventoryMap = await fetchOutOfStockMap(supabase, productIds);

  const products = ((rawProducts ?? []) as any[]).map((p) => {
    const images = p.product_images ?? [];
    const primary = images.find((i: any) => i.is_primary) ?? images[0];
    const qtyAvailable = inventoryMap.has(p.id) ? inventoryMap.get(p.id)! : null;
    return {
      ...p, primaryImage: primary?.url ?? null,
      isOutOfStock: qtyAvailable !== null && qtyAvailable <= 0,
      condition: p.product_conditions ?? null,
      variants: activeVariants(p.product_variants),
    };
  });

  return { categories: categories ?? [], featuredProducts, products, count: count ?? 0, totalPages };
}

function activeVariants(rows: unknown): { id: string; name: string }[] {
  return ((rows as { id: string; name: string; is_active: boolean }[]) ?? [])
    .filter((v) => v.is_active)
    .map((v) => ({ id: v.id, name: v.name }));
}
