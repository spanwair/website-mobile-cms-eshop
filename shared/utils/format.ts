import type { AppLanguage } from "../i18n/getT";
import { DEFAULT_CURRENCY, currencySymbol } from "../constants/currency";

const NUMBER_LOCALE: Record<AppLanguage, string> = {
  cs: "cs-CZ",
  en: "en-US",
};

// cs: "18 850,00 Kč"  en: "18,850.00 Kč" — number formatting follows UI language,
// the currency itself follows the store/order/price-list, defaulting to CZK.
export function formatPrice(amount: number, lang: AppLanguage, currency: string = DEFAULT_CURRENCY): string {
  const number = new Intl.NumberFormat(NUMBER_LOCALE[lang] ?? NUMBER_LOCALE.cs, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${number} ${currencySymbol(currency)}`;
}

export function formatDate(iso: string, locale = "en"): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
