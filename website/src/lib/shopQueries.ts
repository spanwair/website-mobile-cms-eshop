import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOutOfStockMap, fetchInventoryTrackingMap } from "@shared/services/searchService";
import { variantImages } from "@shared/services/productImageService";

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
      .select(`id, title, slug, price, discount_price, is_featured, review_count, rating_avg, product_images(url, is_primary, media_type, variant_id), product_conditions(code, label, color_hex), product_variants(id, name, price, sort_order, is_active)`)
      .eq("status", "active")
      .eq("is_visible", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (partyId) featuredQuery = featuredQuery.eq("party_id", partyId);
    const { data: featuredRaw } = await featuredQuery;
    const featuredIds = (featuredRaw ?? []).map((p: any) => p.id);
    const [featuredOutOfStockMap, featuredTrackingMap] = await Promise.all([
      fetchOutOfStockMap(supabase, featuredIds),
      fetchInventoryTrackingMap(supabase, featuredIds),
    ]);
    featuredProducts = (featuredRaw ?? []).map((p: any) => {
      const qtyAvailable = featuredOutOfStockMap.has(p.id) ? featuredOutOfStockMap.get(p.id)! : null;
      return deriveCardFields(p, qtyAvailable !== null && qtyAvailable <= 0, featuredTrackingMap);
    });
  }

  // Only embed product_categories as an inner join when actually filtering by one — as a plain
  // (non-inner) embed it wouldn't filter anything, but `!inner` unconditionally would silently
  // drop every product with zero categories from the "all products" view.
  const matchedCategory = categorySlug ? categories?.find((c) => c.slug === categorySlug) : undefined;
  const productCols = matchedCategory
    ? `id, party_id, title, slug, price, discount_price, is_featured, review_count, rating_avg,
       product_images(url, is_primary, media_type, variant_id), product_conditions(code, label, color_hex), product_variants(id, name, price, sort_order, is_active),
       product_categories!inner(category_id)`
    : `id, party_id, title, slug, price, discount_price, is_featured, review_count, rating_avg,
       product_images(url, is_primary, media_type, variant_id), product_conditions(code, label, color_hex), product_variants(id, name, price, sort_order, is_active)`;

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
  const [inventoryMap, trackingMap] = await Promise.all([
    fetchOutOfStockMap(supabase, productIds),
    fetchInventoryTrackingMap(supabase, productIds),
  ]);

  const products = ((rawProducts ?? []) as any[]).map((p) => {
    const qtyAvailable = inventoryMap.has(p.id) ? inventoryMap.get(p.id)! : null;
    return deriveCardFields(p, qtyAvailable !== null && qtyAvailable <= 0, trackingMap);
  });

  return { categories: categories ?? [], featuredProducts, products, count: count ?? 0, totalPages };
}

// A card always represents its product with the first active variant's own price/image
// (falling back to shared images) when the product has variants — same rule as the product
// detail page (ProductPurchasePanel) and the admin product list.
//
// The "made to order" condition badge is only a label — it can drift from the actual
// inventory setting (an admin can pick that condition without checking the on-demand
// checkbox, or vice versa). So it's only trusted when the represented row's own
// track_inventory flag agrees; otherwise the badge is suppressed and the product falls back
// to normal stock-based display (isOutOfStock, computed separately from the same map).
function deriveCardFields(p: any, isOutOfStock: boolean, trackingMap: Map<string, boolean>) {
  const variants = ((p.product_variants ?? []) as any[])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const firstVariant = variants[0] ?? null;
  const { primaryImage, primaryMediaType, hasVideo } = pickPrimaryMedia(
    variantImages((p.product_images ?? []) as any[], firstVariant?.id ?? null)
  );
  const trackInventory = trackingMap.get(`${p.id}:${firstVariant?.id ?? ""}`);
  const isOnDemand = trackInventory === false;
  const rawCondition = p.product_conditions ?? null;
  const condition = rawCondition && (rawCondition.code !== "made_to_order" || isOnDemand) ? rawCondition : null;
  return {
    ...p, primaryImage, primaryMediaType, hasVideo,
    isOutOfStock,
    condition,
    variants: variants.map((v) => ({ id: v.id, name: v.name })),
    hasVariants: variants.length > 0,
    displayPrice: firstVariant?.price != null ? Number(firstVariant.price) : Number(p.price),
  };
}

// Card thumbnails prefer an image, but fall back to the product's video (a still frame is
// rendered client-side) rather than showing nothing when no image was uploaded.
function pickPrimaryMedia(rows: unknown): {
  primaryImage: string | null;
  primaryMediaType: "image" | "video";
  hasVideo: boolean;
} {
  const media = (rows as { url: string; is_primary: boolean; media_type?: string }[]) ?? [];
  const images = media.filter((m) => m.media_type !== "video");
  const videos = media.filter((m) => m.media_type === "video");
  const primary = images.find((m) => m.is_primary) ?? images[0] ?? videos.find((m) => m.is_primary) ?? videos[0];
  return {
    primaryImage: primary?.url ?? null,
    primaryMediaType: primary && videos.includes(primary) ? "video" : "image",
    hasVideo: videos.length > 0,
  };
}
