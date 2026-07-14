import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { cs } from "./locales/cs";

export type AppLanguage = "en" | "cs";

export async function initI18n(language: AppLanguage = "en"): Promise<void> {
  await i18n.use(initReactI18next).init({
    lng: language,
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      cs: { translation: cs },
    },
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });
}

export { i18n };
