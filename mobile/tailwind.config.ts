import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./App.tsx",
    "./index.ts",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        "primary-hover": "#4338CA",
        "primary-secondary": "#7C3AED",
        danger: "#EF4444",
        success: "#10B981",
        warning: "#F59E0B",
        background: "#FFFFFF",
        surface: "#F8F9FA",
        subtle: "#F1F3F5",
        "border-default": "#E9ECEF",
        "border-strong": "#DEE2E6",
        "text-base": "#212529",
        "text-muted": "#6C757D",
        "text-placeholder": "#ADB5BD",
      },
    },
  },
} satisfies Config;
