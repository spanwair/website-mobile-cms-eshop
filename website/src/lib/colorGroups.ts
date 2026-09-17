export interface ColorGroup {
  key: string;
  label: string;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_surface: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_border: string;
}

// 20 curated palettes offered in the onboarding design step. Each is a complete,
// contrast-checked set so a store owner can pick a look in one click, then tweak
// individual swatches with the custom color pickers if they want.
export const COLOR_GROUPS: ColorGroup[] = [
  { key: "forest",     label: "Forest",      color_primary: "#2F855A", color_secondary: "#38A169", color_background: "#FFFFFF", color_surface: "#F1F7F3", color_text_primary: "#1A2B22", color_text_secondary: "#5B6B63", color_border: "#DDE7E1" },
  { key: "indigo",     label: "Indigo",      color_primary: "#4F46E5", color_secondary: "#7C3AED", color_background: "#FFFFFF", color_surface: "#F6F7FB", color_text_primary: "#1E2230", color_text_secondary: "#5A6072", color_border: "#E5E7F0" },
  { key: "ocean",      label: "Ocean",       color_primary: "#0EA5E9", color_secondary: "#0369A1", color_background: "#FFFFFF", color_surface: "#EFF7FB", color_text_primary: "#0F2233", color_text_secondary: "#4A6478", color_border: "#DBE9F1" },
  { key: "sunset",     label: "Sunset",      color_primary: "#EA580C", color_secondary: "#DB2777", color_background: "#FFFFFF", color_surface: "#FDF3EE", color_text_primary: "#331A12", color_text_secondary: "#78584C", color_border: "#F1DDD2" },
  { key: "rose",       label: "Rose",        color_primary: "#E11D48", color_secondary: "#BE185D", color_background: "#FFFFFF", color_surface: "#FCEFF2", color_text_primary: "#2E1017", color_text_secondary: "#7A5560", color_border: "#F1D8DE" },
  { key: "amber",      label: "Amber",       color_primary: "#D97706", color_secondary: "#B45309", color_background: "#FFFFFF", color_surface: "#FBF5EA", color_text_primary: "#2E2411", color_text_secondary: "#736450", color_border: "#EDE0CA" },
  { key: "emerald",    label: "Emerald",     color_primary: "#059669", color_secondary: "#047857", color_background: "#FFFFFF", color_surface: "#EDF7F2", color_text_primary: "#12271F", color_text_secondary: "#4F6960", color_border: "#D6E7DF" },
  { key: "teal",       label: "Teal",        color_primary: "#0D9488", color_secondary: "#0F766E", color_background: "#FFFFFF", color_surface: "#EDF6F5", color_text_primary: "#122726", color_text_secondary: "#4E6866", color_border: "#D4E6E4" },
  { key: "violet",     label: "Violet",      color_primary: "#7C3AED", color_secondary: "#9333EA", color_background: "#FFFFFF", color_surface: "#F5F1FC", color_text_primary: "#241633", color_text_secondary: "#61557A", color_border: "#E6DCF3" },
  { key: "slate",      label: "Slate",       color_primary: "#334155", color_secondary: "#475569", color_background: "#FFFFFF", color_surface: "#F4F5F7", color_text_primary: "#1B2430", color_text_secondary: "#5B6675", color_border: "#E2E5EA" },
  { key: "crimson",    label: "Crimson",     color_primary: "#DC2626", color_secondary: "#991B1B", color_background: "#FFFFFF", color_surface: "#FBF0F0", color_text_primary: "#2E1414", color_text_secondary: "#775353", color_border: "#EFD8D8" },
  { key: "midnight",   label: "Midnight",    color_primary: "#6366F1", color_secondary: "#8B5CF6", color_background: "#0F172A", color_surface: "#1E293B", color_text_primary: "#F1F5F9", color_text_secondary: "#94A3B8", color_border: "#334155" },
  { key: "graphite",   label: "Graphite",    color_primary: "#F59E0B", color_secondary: "#FBBF24", color_background: "#18181B", color_surface: "#27272A", color_text_primary: "#FAFAFA", color_text_secondary: "#A1A1AA", color_border: "#3F3F46" },
  { key: "mint",       label: "Mint",        color_primary: "#10B981", color_secondary: "#34D399", color_background: "#FFFFFF", color_surface: "#EEFAF4", color_text_primary: "#0F2620", color_text_secondary: "#4E6B60", color_border: "#D3ECE0" },
  { key: "coral",      label: "Coral",       color_primary: "#F43F5E", color_secondary: "#FB7185", color_background: "#FFFFFF", color_surface: "#FDF0F2", color_text_primary: "#2E1318", color_text_secondary: "#785661", color_border: "#F2DAE0" },
  { key: "sky",        label: "Sky",         color_primary: "#2563EB", color_secondary: "#3B82F6", color_background: "#FFFFFF", color_surface: "#EFF4FE", color_text_primary: "#14213B", color_text_secondary: "#4C5D7A", color_border: "#DBE4F5" },
  { key: "plum",       label: "Plum",        color_primary: "#9D174D", color_secondary: "#BE185D", color_background: "#FFFFFF", color_surface: "#FAEEF3", color_text_primary: "#2B1019", color_text_secondary: "#6F5460", color_border: "#EDD6DF" },
  { key: "lime",       label: "Lime",        color_primary: "#65A30D", color_secondary: "#4D7C0F", color_background: "#FFFFFF", color_surface: "#F3F8EA", color_text_primary: "#20260F", color_text_secondary: "#5E6A4C", color_border: "#E1E9CE" },
  { key: "sand",       label: "Sand",        color_primary: "#B45309", color_secondary: "#92400E", color_background: "#FDFBF7", color_surface: "#F5EFE4", color_text_primary: "#2B2416", color_text_secondary: "#6E6350", color_border: "#E8DEC9" },
  { key: "cocoa",      label: "Cocoa",       color_primary: "#7C5C43", color_secondary: "#6B4F3A", color_background: "#FBF8F5", color_surface: "#F2EBE4", color_text_primary: "#2A211B", color_text_secondary: "#6B5D52", color_border: "#E5DACF" },
];
