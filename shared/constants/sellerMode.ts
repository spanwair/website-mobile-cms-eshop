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

// --- own_company commission (public pricing + per-order billing) ---
// SINGLE SOURCE OF TRUTH for the own_company platform fee and for what the public pricing/
// calculator pages display. COMMISSION_TIERS is the GLOBAL DEFAULT schedule: every party may
// override it entirely (parties.commission_tiers_override, same shape), resolved in one place
// via resolveFeeSchedule() in shared/utils/billingFeeCalc.ts. Never redefine this inline —
// always import from here, and always read a party's effective schedule through
// resolveFeeSchedule(). smalljobs_commission sellers are unaffected — they pay flat
// NO_ICO_DEDUCTION_RATE per order, not this schedule.
//
// Two-model pricing: everybody pays a flat COMMISSION_TIERS[0].rate (1.99%) on turnover up to
// COMMISSION_ENTERPRISE_THRESHOLD_CZK (30 000 Kč/month) — there is no declining ladder anymore.
// Above that line the public default schedule stops getting automatically cheaper; a party
// trading above it is meant to be offered a negotiated "own eshop" schedule
// (parties.commission_tiers_override) through a direct sales conversation, not a further
// automatic discount. The array is still shaped as tiers (and computeTieredCommission in
// shared/utils/billingFeeCalc.ts still blends marginally across bands) purely so a per-party
// override can introduce real tiering for a negotiated deal — the public default itself just
// repeats the same flat rate in both bands. The last entry's uptoKc MUST be null ("and above")
// so every turnover amount resolves to a rate. See
// shared/services/commissionLedgerService.ts for the fee_tier_change in-app notification that
// flags when a party on the public default schedule first crosses that line.
export interface CommissionTier {
  uptoKc: number | null;
  rate: number;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { uptoKc: 30000, rate: 0.0199 },
  { uptoKc: null, rate: 0.0199 },
];

// Monthly turnover (Kč) above which a party on the public default schedule should be offered a
// negotiated "own eshop" enterprise schedule instead of relying on the public default. Equal to
// the public schedule's last finite threshold by definition — kept as its own named constant so
// the sales-trigger logic in commissionLedgerService.ts reads intention, not a magic re-lookup
// of the tier array.
export const COMMISSION_ENTERPRISE_THRESHOLD_CZK = COMMISSION_TIERS[COMMISSION_TIERS.length - 2].uptoKc as number;

// The flat rate charged on every Kč of turnover up to COMMISSION_ENTERPRISE_THRESHOLD_CZK —
// convenience constant for headline marketing copy ("just 1.99%"). Always equal to
// COMMISSION_TIERS[0].rate; never redefine independently.
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
