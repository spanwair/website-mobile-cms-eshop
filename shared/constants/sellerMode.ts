// SINGLE SOURCE OF TRUTH for the "no company" commissionaire selling arrangement.
// Never redefine the commission rate, VAT rate, or payout hold anywhere else.

export const SELLER_MODE = {
  OWN_COMPANY: "own_company",
  SMALLJOBS_COMMISSION: "smalljobs_commission",
} as const;

export type SellerModeValue = (typeof SELLER_MODE)[keyof typeof SELLER_MODE];

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

// How long an own_company seller's net payout is held after payment, in days. Shorter than
// PAYOUT_HOLD_DAYS above — own_company sellers carry their own statutory seller obligations
// directly (unlike the commissionaire arrangement), so this only needs to cover the 14-day
// consumer withdrawal window itself, not an extra buffer for Smalljobs acting as seller of record.
export const OWN_COMPANY_PAYOUT_HOLD_DAYS = 14;

// --- Tiered own_company commission (public pricing + per-order billing) ---
// SINGLE SOURCE OF TRUTH for the own_company platform fee and for what the public pricing/
// calculator pages display. COMMISSION_TIERS is the GLOBAL DEFAULT schedule: every party may
// override it entirely (parties.commission_tiers_override, same shape), resolved in one place
// via resolveFeeSchedule() in shared/utils/billingFeeCalc.ts. Never redefine this inline —
// always import from here, and always read a party's effective schedule through
// resolveFeeSchedule(). smalljobs_commission sellers are unaffected — they pay flat
// NO_ICO_DEDUCTION_RATE per order, not this schedule.
//
// The model is MARGINAL/BRACKET, like income tax: a party's first COMMISSION_TIERS[0].uptoKc of
// turnover in a calendar month is charged at COMMISSION_TIERS[0].rate, the next slice (up to
// COMMISSION_TIERS[1].uptoKc) at COMMISSION_TIERS[1].rate, and so on — never a whole-month
// cliff re-rate. Each order is charged a blend across every band its slice of the month's
// cumulative turnover touches (see computeTieredCommission in shared/utils/billingFeeCalc.ts).
// The last entry's uptoKc MUST be null ("and above") so every turnover amount resolves to a
// rate. Above COMMISSION_ENTERPRISE_THRESHOLD_CZK the public ladder stops getting cheaper by
// itself — that is deliberate: a party trading above that line is meant to be offered a
// negotiated "own eshop" schedule (parties.commission_tiers_override) through a direct sales
// conversation, not a further automatic discount. See shared/services/commissionLedgerService.ts
// for the fee_tier_change in-app notification that flags when a party on the public default
// schedule first crosses that line.
export interface CommissionTier {
  uptoKc: number | null;
  rate: number;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { uptoKc: 10000, rate: 0.05 },
  { uptoKc: 30000, rate: 0.04 },
  { uptoKc: 60000, rate: 0.03 },
  { uptoKc: 90000, rate: 0.02 },
  { uptoKc: null, rate: 0.02 },
];

// Monthly turnover (Kč) above which a party on the public default schedule should be offered a
// negotiated "own eshop" enterprise schedule instead of relying on the public ladder. Equal to
// the public ladder's last finite threshold by definition — kept as its own named constant so
// the sales-trigger logic in commissionLedgerService.ts reads intention, not a magic re-lookup
// of the tier array.
export const COMMISSION_ENTERPRISE_THRESHOLD_CZK = COMMISSION_TIERS[COMMISSION_TIERS.length - 2].uptoKc as number;

// The rate charged on the first Kč of turnover each month — convenience constant for headline
// marketing copy ("already from 5%"). Always equal to COMMISSION_TIERS[0].rate; never redefine
// independently.
export const COMMISSION_ENTRY_RATE = COMMISSION_TIERS[0].rate;

// Total deduction (platform commission + statutory contributions withheld on the creator's
// behalf) for smalljobs_commission (no-IČO) sellers. Replaces the own_company COMMISSION_TIERS
// schedule for that mode once Phase 2 enforces it — own_company sellers are unaffected and
// stay on COMMISSION_TIERS.
export const NO_ICO_DEDUCTION_RATE = 0.3;

// Maximum net payout per month a no-IČO seller may legally receive through the
// smalljobs_commission arrangement. Anything above this is withheld, not paid out.
export const NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK = 12000;

// Withheld surplus above NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK expires (is forfeited) if the
// creator has not registered an IČO and claimed it within this many years of accrual.
export const NO_ICO_WITHHOLDING_EXPIRY_YEARS = 2;
