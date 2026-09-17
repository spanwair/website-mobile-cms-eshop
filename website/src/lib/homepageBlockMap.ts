import type { SectionKey } from "@shared/types";

// Maps every visible homepage block to the admin route that manages its content. Used by the
// onboarding editor (per-block "edit in admin" deep-link) and the admin block-map overlay so a
// store owner is never left guessing where a section is configured. `reorderable` blocks are the
// ones stored in store_configs.homepage_layout; header/footer/product_grid are fixed chrome.
export interface BlockMapEntry {
  key: SectionKey | "header" | "footer" | "product_grid";
  adminPath: string;
  reorderable: boolean;
}

export const BLOCK_MAP: BlockMapEntry[] = [
  { key: "header",             adminPath: "/admin/cms/navigation",        reorderable: false },
  { key: "hero",               adminPath: "/admin/settings/content",      reorderable: true },
  { key: "subhero",            adminPath: "/admin/settings/content",      reorderable: true },
  { key: "categories",         adminPath: "/admin/categories",            reorderable: true },
  { key: "featured_products",  adminPath: "/admin/products",              reorderable: true },
  { key: "benefits",           adminPath: "/admin/settings/benefits",     reorderable: true },
  { key: "condition_explainer", adminPath: "/admin/products/conditions",  reorderable: true },
  { key: "buyback_promo",      adminPath: "/admin/settings/content",      reorderable: true },
  { key: "blog_preview",       adminPath: "/admin/cms/blog",              reorderable: true },
  { key: "newsletter",         adminPath: "/admin/settings/newsletter",   reorderable: true },
  { key: "product_grid",       adminPath: "/admin/products",              reorderable: false },
  { key: "footer",             adminPath: "/admin/settings/footer",       reorderable: false },
];

export function adminPathForBlock(key: string): string {
  return BLOCK_MAP.find((b) => b.key === key)?.adminPath ?? "/admin";
}
