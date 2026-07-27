import type { SectionKey } from "@shared/types";

// Metadata for the admin layout editor — order here is the default for new stores.
export const SECTION_REGISTRY: { key: SectionKey; label: string }[] = [
  { key: "hero",               label: "Hero banner" },
  { key: "subhero",            label: "Subhero banner" },
  { key: "categories",         label: "Category showcase" },
  { key: "featured_products",  label: "Featured products" },
  { key: "benefits",           label: "Benefits / trust badges" },
  { key: "condition_explainer", label: "Product condition explainer" },
  { key: "buyback_promo",      label: "Buyback / trade-in promo" },
  { key: "blog_preview",       label: "Blog preview" },
  { key: "newsletter",         label: "Newsletter signup" },
];

export const DEFAULT_HOMEPAGE_LAYOUT: SectionKey[] = SECTION_REGISTRY.map((s) => s.key);

// Drops unknown/removed keys so a stale homepage_layout value never crashes rendering.
export function sanitizeLayout(layout: unknown): SectionKey[] {
  if (!Array.isArray(layout)) return DEFAULT_HOMEPAGE_LAYOUT;
  const known = new Set(SECTION_REGISTRY.map((s) => s.key));
  const filtered = layout.filter((k): k is SectionKey => known.has(k as SectionKey));
  return filtered.length > 0 ? filtered : DEFAULT_HOMEPAGE_LAYOUT;
}
