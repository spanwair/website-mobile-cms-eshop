import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./App.tsx",
    "./index.ts",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#FF5E1A",
        "primary-dark": "#E54D0A",
        danger: "#FF3B55",
        success: "#00E6A0",
        warning: "#FFB800",
        info: "#4A9EFF",
        "bg-dark": "#0F0F1A",
        "bg-card-dark": "#1A1A2E",
        "bg-input-dark": "#1E1E35",
        "bg-light": "#F7F8FC",
        "bg-card-light": "#FFFFFF",
        "bg-input-light": "#F3F4FA",
        "text-primary-dark": "#FFFFFF",
        "text-secondary-dark": "#B3B3CC",
        "text-muted-dark": "#808099",
        "text-primary-light": "#111827",
        "text-secondary-light": "#4B5563",
        "text-muted-light": "#9CA3AF",
        "border-dark": "#252538",
        "border-light": "#E5E7EB",
      },
    },
  },
} satisfies Config;
