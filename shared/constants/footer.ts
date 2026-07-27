// Fixed columns every store starts with, in storefront display order. Any footer_links row
// whose column_key isn't one of these is a store-authored custom column — its column_key is
// used directly as both the value and the display label (see CreatableCombobox usage in
// admin/settings/footer.astro and the grouping logic in components/layout/Footer.astro).
export const SYSTEM_FOOTER_COLUMNS = [
  "shop",
  "information",
  "purchase_info",
  "customer_service",
  "custom",
] as const;

export type SystemFooterColumn = (typeof SYSTEM_FOOTER_COLUMNS)[number];
