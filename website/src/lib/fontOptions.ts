// Curated Google Fonts offered in the onboarding design step. All load on demand via
// googleFontsUrl() in themeEngine.ts — keep this list in sync with what that helper fetches.
export interface FontOption {
  value: string;
  label: string;
  stack: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: "Inter",             label: "Inter (default)",   stack: "'Inter', system-ui, sans-serif" },
  { value: "Lexend",            label: "Lexend",            stack: "'Lexend', system-ui, sans-serif" },
  { value: "Poppins",           label: "Poppins",           stack: "'Poppins', system-ui, sans-serif" },
  { value: "Montserrat",        label: "Montserrat",        stack: "'Montserrat', system-ui, sans-serif" },
  { value: "Nunito",            label: "Nunito",            stack: "'Nunito', system-ui, sans-serif" },
  { value: "Work Sans",         label: "Work Sans",         stack: "'Work Sans', system-ui, sans-serif" },
  { value: "DM Sans",           label: "DM Sans",           stack: "'DM Sans', system-ui, sans-serif" },
  { value: "Manrope",           label: "Manrope",           stack: "'Manrope', system-ui, sans-serif" },
  { value: "Playfair Display",  label: "Playfair Display",  stack: "'Playfair Display', Georgia, serif" },
  { value: "Merriweather",      label: "Merriweather",      stack: "'Merriweather', Georgia, serif" },
  { value: "Lora",              label: "Lora",              stack: "'Lora', Georgia, serif" },
  { value: "Source Serif 4",    label: "Source Serif",      stack: "'Source Serif 4', Georgia, serif" },
];
