import type { StoreConfig } from "@shared/types";
import { DEFAULT_DESIGN_PRESET } from "./designPresets";

const RADIUS_SCALES: Record<string, { sm: string; md: string; lg: string; xl: string }> = {
  sharp:   { sm: "2px",  md: "4px",  lg: "6px",  xl: "8px" },
  default: { sm: "8px",  md: "12px", lg: "16px", xl: "24px" },
  soft:    { sm: "14px", md: "20px", lg: "28px", xl: "36px" },
};

// Used when a request has no resolved storeParty (main site, admin panel, no domain match).
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  id: "default", party_id: "default",
  brand_name: "Template", tagline: null, logo_url: null, favicon_url: null,
  color_primary: DEFAULT_DESIGN_PRESET.color_primary,
  color_secondary: DEFAULT_DESIGN_PRESET.color_secondary,
  color_background: DEFAULT_DESIGN_PRESET.color_background,
  color_surface: DEFAULT_DESIGN_PRESET.color_surface,
  color_text_primary: DEFAULT_DESIGN_PRESET.color_text_primary,
  color_text_secondary: DEFAULT_DESIGN_PRESET.color_text_secondary,
  color_border: DEFAULT_DESIGN_PRESET.color_border,
  font_heading: DEFAULT_DESIGN_PRESET.font_heading,
  font_body: DEFAULT_DESIGN_PRESET.font_body,
  radius_scale: DEFAULT_DESIGN_PRESET.radius_scale,
  product_card_variant: "classic", homepage_layout: ["hero", "categories", "featured_products", "newsletter"],
  enable_reviews: true, enable_wishlists: true,
  hero_content: null, hero_format: "markdown",
  subhero_content: null, subhero_format: "markdown",
  footer_content: null, footer_format: "markdown",
  contact_phone: null, contact_email: null, business_hours: null, currency_code: "CZK",
  buyback_content: null, buyback_format: "markdown",
  store_address: null, store_map_url: null, store_photo_url: null,
  footer_theme: "light", footer_newsletter_enabled: true,
  created_at: "", updated_at: "",
};

export function buildThemeCss(config: StoreConfig | null): string {
  const c = config ?? DEFAULT_STORE_CONFIG;
  const radius = RADIUS_SCALES[c.radius_scale] ?? RADIUS_SCALES.default;

  // !important: global.css also declares a static :root block as a load-bearing fallback for
  // any request that reaches a page without this injected style. Vite's dev-mode CSS injection
  // can place that static block *after* this one in <head>, and at equal specificity the later
  // rule wins — so without !important the real per-store theme can be silently overridden.
  return `:root {
  --bg-page: ${c.color_background} !important;
  --bg-surface: ${c.color_surface} !important;
  --bg-subtle: ${c.color_surface} !important;
  --border: ${c.color_border} !important;
  --border-default: ${c.color_border} !important;
  --border-strong: ${c.color_border} !important;
  --border-color: ${c.color_border} !important;
  --text-primary: ${c.color_text_primary} !important;
  --text-secondary: ${c.color_text_secondary} !important;
  --text-muted: ${c.color_text_secondary} !important;
  --text-placeholder: color-mix(in srgb, ${c.color_text_secondary} 60%, transparent) !important;
  --accent-primary: ${c.color_primary} !important;
  --accent-primary-hover: color-mix(in srgb, ${c.color_primary} 85%, black) !important;
  --accent-secondary: ${c.color_secondary} !important;
  --primary: ${c.color_primary} !important;
  --secondary: ${c.color_secondary} !important;
  --radius-sm: ${radius.sm} !important;
  --radius-md: ${radius.md} !important;
  --radius-lg: ${radius.lg} !important;
  --radius-xl: ${radius.xl} !important;
  --font-heading: "${c.font_heading}", system-ui, sans-serif !important;
  --font-body: "${c.font_body}", system-ui, sans-serif !important;
}
body { font-family: var(--font-body); }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }`;
}

// Custom fonts are loaded from Google Fonts on demand — "Inter" ships via the base stylesheet.
export function googleFontsUrl(config: StoreConfig | null): string | null {
  if (!config) return null;
  const families = [...new Set([config.font_heading, config.font_body])].filter((f) => f && f !== "Inter");
  if (families.length === 0) return null;
  const query = families.map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700;900`).join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
