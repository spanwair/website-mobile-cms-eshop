import { useColorScheme } from "react-native";
import { useState } from "react";
import { getItem, setItem } from "./storage";

const THEME_KEY = "app_theme";

export type ColorScheme = "light" | "dark" | "system";

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const [saved, setSaved] = useState<ColorScheme>(
    () => getItem<ColorScheme>(THEME_KEY) ?? "system"
  );

  const activeScheme =
    saved === "system" ? (systemScheme ?? "dark") : saved;

  function setTheme(scheme: ColorScheme) {
    setSaved(scheme);
    setItem(THEME_KEY, scheme);
  }

  return { theme: activeScheme, savedTheme: saved, setTheme };
}

export function isDark(scheme: "light" | "dark") {
  return scheme === "dark";
}
