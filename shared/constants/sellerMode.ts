// SINGLE SOURCE OF TRUTH for the "no company" commissionaire selling arrangement.
// Never redefine the commission rate, VAT rate, or payout hold anywhere else.

export const SELLER_MODE = {
  OWN_COMPANY: "own_company",
  SMALLJOBS_COMMISSION: "smalljobs_commission",
} as const;

export type SellerModeValue = (typeof SELLER_MODE)[keyof typeof SELLER_MODE];

// Flat platform commission taken from gross sale price, both seller modes.
export const COMMISSION_RATE = 0.1;

// Smalljobs s.r.o.'s VAT-payer status is not yet confirmed (see shared/constants/company.ts).
// Flip this on only once that is confirmed — until then tax is computed as 0 and documents
// show "neplátce DPH", same as any non-VAT-payer seller.
export const VAT_ENABLED = false;

// CZ standard VAT rate, used when a product has no more specific tax_rate set.
export const DEFAULT_VAT_RATE = 21;

// How long a smalljobs_commission creator's net payout is held after payment, in days.
// Covers the 14-day statutory withdrawal window plus a buffer for reklamace/chargebacks
// before Smalljobs releases funds it may still need to refund a consumer.
export const PAYOUT_HOLD_DAYS = 60;
