-- Replaces the own_company commission model (flat COMMISSION_RATE, dormant 2-band
-- standard/reduced/threshold override) with an N-band marginal/bracket schedule: each order's
-- commission is a blend across every band its slice of the calendar month's cumulative turnover
-- touches (shared/utils/billingFeeCalc.ts computeTieredCommission, shared/constants/sellerMode.ts
-- COMMISSION_TIERS). A party's custom schedule (if any) also becomes a negotiated top band for
-- the "own eshop" enterprise case above the public ladder's top threshold -- no new seller_mode,
-- no new billing path, same order_commission_ledger flow as today.
--
-- The old 2-rate+threshold override (commission_rate_override, reduced_commission_rate_override,
-- commission_threshold_override) cannot represent 4+ bands, so it is replaced by one JSONB
-- column holding an ordered tier array: [{"uptoKc": 10000, "rate": 0.05}, ..., {"uptoKc": null,
-- "rate": 0.02}]. NULL column = use the global COMMISSION_TIERS default.

ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS commission_tiers_override JSONB;

ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_commission_tiers_override_is_array;
ALTER TABLE parties
  ADD CONSTRAINT parties_commission_tiers_override_is_array
    CHECK (commission_tiers_override IS NULL OR jsonb_typeof(commission_tiers_override) = 'array');

COMMENT ON COLUMN parties.commission_tiers_override IS
  'Ordered array of {uptoKc: number|null, rate: number} bands, ascending, last entry uptoKc=null. NULL = global COMMISSION_TIERS default (shared/constants/sellerMode.ts). Resolved exclusively via resolveFeeSchedule() in shared/utils/billingFeeCalc.ts.';

-- Backfill: any party that had a custom 2-band override keeps equivalent behaviour as a 2-entry
-- tier array (first band = old standard rate up to the old threshold, second band = old reduced
-- rate above it), so no existing negotiated deal silently reverts to the public default.
UPDATE parties
SET commission_tiers_override = jsonb_build_array(
  jsonb_build_object('uptoKc', commission_threshold_override, 'rate', commission_rate_override),
  jsonb_build_object('uptoKc', NULL, 'rate', reduced_commission_rate_override)
)
WHERE commission_rate_override IS NOT NULL
  AND reduced_commission_rate_override IS NOT NULL
  AND commission_threshold_override IS NOT NULL
  AND commission_rate_override IS DISTINCT FROM reduced_commission_rate_override;

-- A party that only customized one of the three fields (effectively just a flat custom rate,
-- since the other two already matched the old global defaults) becomes a single open-ended band.
UPDATE parties
SET commission_tiers_override = jsonb_build_array(
  jsonb_build_object('uptoKc', NULL, 'rate', COALESCE(commission_rate_override, reduced_commission_rate_override))
)
WHERE commission_tiers_override IS NULL
  AND (commission_rate_override IS NOT NULL OR reduced_commission_rate_override IS NOT NULL);

ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_commission_rate_override_range;
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_reduced_commission_rate_override_range;
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_commission_threshold_override_range;
ALTER TABLE parties
  DROP COLUMN IF EXISTS commission_rate_override,
  DROP COLUMN IF EXISTS reduced_commission_rate_override,
  DROP COLUMN IF EXISTS commission_threshold_override;

-- fee_rate on eshop_billing_periods now stores the BLENDED effective rate for the period
-- (ledger fee / gross revenue), not a single tier's rate -- no schema change needed, the column
-- was already a plain NUMERIC(5,4), only its meaning changes (shared/services/billingPeriodService.ts).
