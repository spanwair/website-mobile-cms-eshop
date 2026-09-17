// SINGLE SOURCE OF TRUTH for the "no company" commissionaire selling arrangement.
// Never redefine the commission rate, VAT rate, or payout hold anywhere else.

export const SELLER_MODE = {
  OWN_COMPANY: "own_company",
  SMALLJOBS_COMMISSION: "smalljobs_commission",
} as const;

export type SellerModeValue = (typeof SELLER_MODE)[keyof typeof SELLER_MODE];

// Standard platform commission taken from gross sale price. Currently applied to BOTH seller
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

// --- Tiered own_company commission (public pricing + monthly billing) ---
// These three numbers are the SINGLE SOURCE OF TRUTH for the own_company platform fee and for
// what the public pricing/employment pages display. They are the GLOBAL DEFAULTS: every party
// may override each of them individually (parties.commission_rate_override /
// reduced_commission_rate_override / commission_threshold_override), resolved in one place via
// resolveFeeSchedule() in shared/utils/billingFeeCalc.ts. Never redefine these inline — always
// import from here, and always read a party's effective schedule through resolveFeeSchedule().
//
// The model: an own_company party pays COMMISSION_RATE of its monthly turnover, UNTIL turnover
// exceeds COMMISSION_REDUCED_THRESHOLD_CZK — from that point the whole month's turnover is
// charged at the lower REDUCED_COMMISSION_RATE instead. The reduced rate is a floor that always
// exceeds the platform's own fixed card-processor percentage, so the platform never loses money
// on high-volume stores (the old flat 2 990 Kč cap did not guarantee that). smalljobs_commission
// sellers are unaffected — they pay per-order via order_commission_ledger, not this tier.

// Reduced commission rate charged on the ENTIRE monthly turnover once turnover exceeds the
// threshold below. Replaces the old flat 2 990 Kč monthly cap.
export const REDUCED_COMMISSION_RATE = 0.05;

// Monthly turnover (Kč, strict >) above which a party switches from COMMISSION_RATE to
// REDUCED_COMMISSION_RATE for that whole month. First-class configurable value (per-party
// overridable), not derived from any cap.
export const COMMISSION_REDUCED_THRESHOLD_CZK = 29900;

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
