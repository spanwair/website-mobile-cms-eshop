import type {
  StoreConfig, HeroSlide, BenefitItem, ProductCondition, BlogPost, Category,
} from "@shared/types";
import type { ProductCardData } from "./variantRegistry";

// Temporary content shown in the onboarding editor so every homepage section renders full even
// before the store has any real data. Purely for display — never written to the DB. The publish
// step (lib/onboardingSeed.ts) writes an equivalent set of real placeholder rows the owner edits.

export function placeholderImage(label: string, bg = "#e7e2dd", fg = "#8a8178"): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='${bg}'/><g fill='${fg}' font-family='sans-serif' text-anchor='middle'><text x='200' y='140' font-size='42'>&#128247;</text><text x='200' y='185' font-size='18'>${label}</text></g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PH_CATEGORIES: Pick<Category, "id" | "name" | "slug" | "icon" | "image_url">[] = [
  { id: "ph-c1", name: "Kategorie 1", slug: "ph-1", icon: "🌿", image_url: placeholderImage("Kategorie 1") },
  { id: "ph-c2", name: "Kategorie 2", slug: "ph-2", icon: "🎁", image_url: placeholderImage("Kategorie 2") },
  { id: "ph-c3", name: "Kategorie 3", slug: "ph-3", icon: "✨", image_url: placeholderImage("Kategorie 3") },
  { id: "ph-c4", name: "Kategorie 4", slug: "ph-4", icon: "🛍️", image_url: placeholderImage("Kategorie 4") },
];

function phProduct(n: number): ProductCardData {
  return {
    id: `ph-p${n}`, title: `Ukázkový produkt ${n}`, slug: `ph-produkt-${n}`,
    price: 499 + n * 100, discount_price: null, displayPrice: 499 + n * 100,
    hasVariants: false, is_featured: true, review_count: 0, rating_avg: 0,
    primaryImage: placeholderImage(`Produkt ${n}`), isOutOfStock: false, condition: null,
  };
}
export const PH_PRODUCTS: ProductCardData[] = [1, 2, 3, 4].map(phProduct);

export const PH_BENEFITS: BenefitItem[] = [
  { icon: "🚚", title: "Doprava zdarma", description: "Ukázkový popis výhody" },
  { icon: "🛡️", title: "Záruka kvality", description: "Ukázkový popis výhody" },
  { icon: "💬", title: "Osobní přístup", description: "Ukázkový popis výhody" },
  { icon: "↩️", title: "Snadné vrácení", description: "Ukázkový popis výhody" },
].map((b, i) => ({ id: `ph-b${i}`, party_id: "ph", sort_order: i, is_visible: true, ...b } as BenefitItem));

export const PH_CONDITIONS: ProductCondition[] = [
  { label: "Nové", color_hex: "#16a34a" }, { label: "Jako nové", color_hex: "#0ea5e9" },
  { label: "Použité", color_hex: "#f59e0b" },
].map((c, i) => ({ id: `ph-cond${i}`, party_id: "ph", code: `ph${i}`, sort_order: i, is_active: true, ...c } as ProductCondition));

export const PH_BLOG: BlogPost[] = [1, 2, 3].map((n) => ({
  id: `ph-blog${n}`, party_id: "ph", title: `Ukázkový článek ${n}`, slug: `ph-clanek-${n}`,
  excerpt: "Krátký ukázkový popis článku, který si později upravíte v administraci.",
  featured_image_url: placeholderImage(`Článek ${n}`), published_at: new Date().toISOString(),
} as BlogPost));

export const PH_SLIDE: HeroSlide = {
  id: "ph-hero", party_id: "ph", headline: "Váš nadpis úvodního banneru",
  subheadline: "Sem přijde krátký podtitulek, který upoutá zákazníka.",
  cta_text: "Prohlédnout nabídku", cta_link: "#featured-products",
  image_url: placeholderImage("Hlavní banner", "#c9bfb4"), overlay_opacity: 0.35,
  sort_order: 0, is_visible: true,
} as HeroSlide;

const PH_SUBHERO = "Krátký uvítací text pod hlavním bannerem. Popište zde, co vás odlišuje.";
const PH_BUYBACK = "## Výkup a protiúčet\n\nUkázkový text pro sekci výkupu. Upravíte v administraci.";

// Merge placeholder content over the real config so empty sections still render in the preview.
export function previewConfig(config: StoreConfig | null): StoreConfig {
  const base = (config ?? {}) as StoreConfig;
  return {
    ...base,
    brand_name: base.brand_name || "Váš obchod",
    tagline: base.tagline || "Sem přijde váš slogan",
    subhero_content: base.subhero_content || PH_SUBHERO,
    subhero_format: base.subhero_format || "markdown",
    buyback_content: base.buyback_content || PH_BUYBACK,
    buyback_format: base.buyback_format || "markdown",
  } as StoreConfig;
}
