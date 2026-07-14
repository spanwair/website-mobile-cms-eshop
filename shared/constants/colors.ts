const brand = {
  primary: "#FF5E1A",
  primaryDark: "#E54D0A",
  primaryLight: "#FF7A4A",
  success: "#00E6A0",
  warning: "#FFB800",
  danger: "#FF3B55",
  info: "#4A9EFF",
  gradientTop: "transparent",
  gradientBottom: "rgba(0,0,0,0.88)",
} as const;

export const darkColors = {
  ...brand,
  textPrimary: "#FFFFFF",
  textSecondary: "#B3B3CC",
  textMuted: "#808099",
  textDisabled: "#4D4D66",
  bg: "#0F0F1A",
  bgCard: "#1A1A2E",
  bgElevated: "#252540",
  bgInput: "#1E1E35",
  border: "#252538",
  borderStrong: "#3A3A5A",
  overlay: "rgba(0,0,0,0.70)",
  overlayLight: "rgba(0,0,0,0.40)",
  tabActive: "#FF5E1A",
  tabInactive: "#808099",
  tabBg: "#0F0F1A",
} as const;

export const lightColors = {
  ...brand,
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  textDisabled: "#D1D5DB",
  bg: "#F7F8FC",
  bgCard: "#FFFFFF",
  bgElevated: "#EDEEF5",
  bgInput: "#F3F4FA",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  overlay: "rgba(255,255,255,0.70)",
  overlayLight: "rgba(255,255,255,0.40)",
  tabActive: "#FF5E1A",
  tabInactive: "#9CA3AF",
  tabBg: "#F7F8FC",
} as const;

export type ColorKey = keyof typeof darkColors;
