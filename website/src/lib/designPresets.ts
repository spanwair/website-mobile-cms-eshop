import type { RadiusScale } from "@shared/types";

export interface DesignPreset {
  key: string;
  label: string;
  isDefault?: boolean;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_surface: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_border: string;
  font_heading: string;
  font_body: string;
  radius_scale: RadiusScale;
}

// "modern-tech" is derived from .claude/DESIGN.md (Lexend + green tech-resale palette). Two
// raw doc tokens are deliberately not used as given: color.text.secondary (#838689 on white is
// ~3.5:1, fails the doc's own WCAG AA rule for body text) is replaced with the app's existing
// safe gray, and color.surface.base/text.tertiary (black/white) have no matching field in
// store_configs today, so they're dropped rather than forced somewhere they don't belong.
export const DESIGN_PRESETS: DesignPreset[] = [
  {
    key: "modern-tech",
    label: "Modern Tech",
    isDefault: true,
    color_primary: "#7EBA28",
    color_secondary: "#89B744",
    color_background: "#FFFFFF",
    color_surface: "#F7F7F7",
    color_text_primary: "#4D4D4D",
    color_text_secondary: "#6C757D",
    color_border: "#E5E5E5",
    font_heading: "Lexend",
    font_body: "Lexend",
    radius_scale: "soft",
  },
  {
    key: "classic-indigo",
    label: "Classic Indigo",
    color_primary: "#4F46E5",
    color_secondary: "#7C3AED",
    color_background: "#FFFFFF",
    color_surface: "#F8F9FA",
    color_text_primary: "#212529",
    color_text_secondary: "#6C757D",
    color_border: "#E9ECEF",
    font_heading: "Inter",
    font_body: "Inter",
    radius_scale: "default",
  },
];

export const DEFAULT_DESIGN_PRESET: DesignPreset =
  DESIGN_PRESETS.find((p) => p.isDefault) ?? DESIGN_PRESETS[0];
