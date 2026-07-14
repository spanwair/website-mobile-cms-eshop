import { darkColors } from "./colors";

export const colors = darkColors;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 9999,
} as const;

export const typography = {
  display:  { fontSize: 32, fontWeight: "800" as const, letterSpacing: -0.8 },
  heading:  { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.4 },
  title:    { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.2 },
  subtitle: { fontSize: 17, fontWeight: "600" as const },
  body:     { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption:  { fontSize: 13, fontWeight: "500" as const },
  micro:    { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.8, textTransform: "uppercase" as const },
} as const;

export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
