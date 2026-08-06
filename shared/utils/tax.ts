import { VAT_ENABLED, DEFAULT_VAT_RATE, SELLER_MODE } from "../constants/sellerMode";
import type { SellerModeValue } from "../constants/sellerMode";

export interface TaxableItem {
  unit_price: number;
  quantity: number;
  tax_rate?: number | null;
}

// unit_price is treated as VAT-inclusive (the price the customer actually pays never
// changes) — this extracts the VAT portion already embedded in gross, it does not add to
// the total. Returns 0 unless the party sells via Smalljobs commission mode and VAT_ENABLED
// is on (see shared/constants/sellerMode.ts and shared/constants/company.ts).
export function computeItemTax(item: TaxableItem, sellerMode: SellerModeValue): number {
  if (sellerMode !== SELLER_MODE.SMALLJOBS_COMMISSION || !VAT_ENABLED) return 0;
  const rate = item.tax_rate && item.tax_rate > 0 ? item.tax_rate : DEFAULT_VAT_RATE;
  const gross = item.unit_price * item.quantity;
  return Math.round(gross * (rate / (100 + rate)) * 100) / 100;
}

export function computeOrderTax(items: TaxableItem[], sellerMode: SellerModeValue): number {
  return items.reduce((sum, item) => sum + computeItemTax(item, sellerMode), 0);
}
