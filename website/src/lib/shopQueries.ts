import type { SupabaseClient } from "@supabase/supabase-js";

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

async function fetchOutOfStockMap(supabase: SupabaseClient, productIds: string[]) {
  const { data: inventoryRows } = productIds.length > 0
    ? await supabase
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
      .select(`id, title, slug, price, discount_price, is_featured, review_count, rating_avg, product_images(url, is_primary), product_conditions(label, color_hex)`)
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
      };
    });
  }

  // Only embed product_categories as an inner join when actually filtering by one — as a plain
  // (non-inner) embed it wouldn't filter anything, but `!inner` unconditionally would silently
  // drop every product with zero categories from the "all products" view.
  const matchedCategory = categorySlug ? categories?.find((c) => c.slug === categorySlug) : undefined;
  const productCols = matchedCategory
    ? `id, party_id, title, slug, price, discount_price, is_featured, review_count, rating_avg,
       product_images(url, is_primary), product_conditions(label, color_hex),
       product_categories!inner(category_id)`
    : `id, party_id, title, slug, price, discount_price, is_featured, review_count, rating_avg,
       product_images(url, is_primary), product_conditions(label, color_hex)`;

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
    };
  });

  return { categories: categories ?? [], featuredProducts, products, count: count ?? 0, totalPages };
}

interface SearchStorefrontParams {
  partyId?: string | null;
  query: string;
  categoryLimit?: number;
  productLimit?: number;
}

// Powers the nav search dropdown — a trimmed-down, live-typing variant of fetchShopData's
// filtering above, kept as its own function since it returns two small ranked lists rather
// than a paginated single list.
export async function searchStorefront(supabase: SupabaseClient, params: SearchStorefrontParams) {
  const { partyId, query, categoryLimit = 5, productLimit = 6 } = params;
  const term = `%${query}%`;

  let categoryQuery = supabase
    .from("categories")
    .select("id, name, slug, icon")
    .eq("is_visible", true)
    .ilike("name", term)
    .order("sort_order", { ascending: true })
    .limit(categoryLimit);
  if (partyId) categoryQuery = categoryQuery.eq("party_id", partyId);

  let productQuery = supabase
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
  const inventoryMap = await fetchOutOfStockMap(supabase, productIds);

  const products = ((rawProducts ?? []) as any[]).map((p) => {
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

  return { categories: categories ?? [], products };
}
