// SINGLE SOURCE OF TRUTH for the "no company" commissionaire selling arrangement.
// Never redefine the commission rate, VAT rate, or payout hold anywhere else.

export const SELLER_MODE = {
  OWN_COMPANY: "own_company",
  SMALLJOBS_COMMISSION: "smalljobs_commission",
} as const;

export type SellerModeValue = (typeof SELLER_MODE)[keyof typeof SELLER_MODE];

// Flat platform commission taken from gross sale price. Currently applied to BOTH seller
// modes by recordCommissionForOrder (shared/services/commissionLedgerService.ts) — that is
// the live, enforced rate today. NO_ICO_DEDUCTION_RATE below is the real target rate for
// smalljobs_commission once Phase 2 lands; until then this stays the enforced value for both.
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

// --- Public pricing/employment page constants ---
// Phase 1 (current): these are the SINGLE SOURCE OF TRUTH for what the public pricing and
// employment pages display and calculate. They are NOT YET enforced anywhere in the ledger —
// recordCommissionForOrder still charges a flat COMMISSION_RATE with no monthly cap and no
// per-payout limit. Phase 2 (separate, reviewed change) wires these into
// shared/services/commissionLedgerService.ts and website/src/pages/admin/payouts/index.astro.
// Never redefine these values inline in a component — always import from here.

// Monthly commission cap: once COMMISSION_RATE * monthly turnover would exceed this, the
// party is charged this flat amount instead for that month ("paušál").
export const MONTHLY_COMMISSION_CAP_CZK = 2990;

// Monthly turnover at which the flat cap becomes cheaper than the percentage commission.
// Derived, not independently configurable: cap / rate.
export const COMMISSION_BREAK_EVEN_CZK = MONTHLY_COMMISSION_CAP_CZK / COMMISSION_RATE;

// Total deduction (platform commission + statutory contributions withheld on the creator's
// behalf) for smalljobs_commission (no-IČO) sellers. Replaces COMMISSION_RATE for that mode
// once Phase 2 enforces it — own_company sellers are unaffected and stay on COMMISSION_RATE.
export const NO_ICO_DEDUCTION_RATE = 0.3;

// Maximum net payout per month a no-IČO seller may legally receive through the
// smalljobs_commission arrangement. Anything above this is withheld, not paid out.
export const NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK = 12000;

// Withheld surplus above NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK expires (is forfeited) if the
// creator has not registered an IČO and claimed it within this many years of accrual.
export const NO_ICO_WITHHOLDING_EXPIRY_YEARS = 2;
