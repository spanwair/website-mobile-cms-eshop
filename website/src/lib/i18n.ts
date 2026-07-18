import { getT, type AppLanguage } from "@shared/i18n/getT";
import type { AstroGlobal } from "astro";

export type Lang = AppLanguage;

export function getLang(Astro: Pick<AstroGlobal, "cookies">): Lang {
  const val = Astro.cookies.get("lang")?.value;
  return val === "en" ? "en" : "cs";
}

export function useT(Astro: Pick<AstroGlobal, "cookies">) {
  return getT(getLang(Astro));
}
