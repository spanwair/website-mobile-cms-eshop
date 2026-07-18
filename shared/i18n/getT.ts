import { en } from "./locales/en";
import { cs } from "./locales/cs";

export type AppLanguage = "en" | "cs";

const translations = { en, cs } as const;

export function getT(lang: AppLanguage) {
  return translations[lang] ?? translations.cs;
}
