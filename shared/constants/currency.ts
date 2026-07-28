// SINGLE SOURCE OF TRUTH for currency defaults and display symbols.
// Only one currency is live today; new codes get added here when multi-currency ships —
// never hardcode a currency symbol anywhere else.

export const DEFAULT_CURRENCY = "CZK";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CZK: "Kč",
};

export function currencySymbol(code: string = DEFAULT_CURRENCY): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}
