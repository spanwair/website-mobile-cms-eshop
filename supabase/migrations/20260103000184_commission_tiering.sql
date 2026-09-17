-- Tiered own_company platform commission: 10% of monthly turnover, dropping to a flat 5% of the
-- whole month's turnover once turnover exceeds 29 900 Kč. Replaces the old flat 2 990 Kč monthly
-- cap ("paušál"), which could fall below the platform's own fixed card-processor percentage on
-- high-volume stores. The three numbers (standard rate, reduced rate, threshold) live in
-- shared/constants/sellerMode.ts as global DEFAULTS; the columns added here let each party
-- override any of them. resolveFeeSchedule() in shared/utils/billingFeeCalc.ts is the single place
-- overrides are applied. See also shared/services/{billingPeriod,feeTier,monthlyFee}Service.ts.

-- 1. Per-party overrides. NULL = use the global default from shared/constants/sellerMode.ts.
ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS commission_rate_override          NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS reduced_commission_rate_override  NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS commission_threshold_override     NUMERIC(12,2);

ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_commission_rate_override_range;
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_reduced_commission_rate_override_range;
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_commission_threshold_override_range;
ALTER TABLE parties
  ADD CONSTRAINT parties_commission_rate_override_range
    CHECK (commission_rate_override IS NULL OR (commission_rate_override >= 0 AND commission_rate_override <= 1)),
  ADD CONSTRAINT parties_reduced_commission_rate_override_range
    CHECK (reduced_commission_rate_override IS NULL OR (reduced_commission_rate_override >= 0 AND reduced_commission_rate_override <= 1)),
  ADD CONSTRAINT parties_commission_threshold_override_range
    CHECK (commission_threshold_override IS NULL OR commission_threshold_override >= 0);

COMMENT ON COLUMN parties.commission_rate_override IS
  'Per-party standard commission rate (0-1). NULL = global COMMISSION_RATE.';
COMMENT ON COLUMN parties.reduced_commission_rate_override IS
  'Per-party reduced commission rate (0-1) applied above the threshold. NULL = global REDUCED_COMMISSION_RATE.';
COMMENT ON COLUMN parties.commission_threshold_override IS
  'Per-party monthly turnover (Kč) above which the reduced rate applies. NULL = global COMMISSION_REDUCED_THRESHOLD_CZK.';

-- 2. Drop the old 'fixed'-based CHECK constraints FIRST so the data migration below is allowed to
--    write the new 'reduced' label.
ALTER TABLE eshop_billing_periods DROP CONSTRAINT IF EXISTS eshop_billing_periods_fee_mode_check;
ALTER TABLE eshop_fee_tier_events  DROP CONSTRAINT IF EXISTS eshop_fee_tier_events_previous_fee_mode_check;
ALTER TABLE eshop_fee_tier_events  DROP CONSTRAINT IF EXISTS eshop_fee_tier_events_new_fee_mode_check;

-- 3. Rename the retired 'fixed' fee_mode to 'reduced' on existing rows. Historical fee_amount /
--    fee_rate are point-in-time snapshots and are intentionally NOT recomputed here -- a past,
--    possibly already-invoiced month must keep the figures the party saw. Only the mode LABEL is
--    migrated so the CHECK constraints below stay satisfiable. New computations use the 5% rate.
UPDATE eshop_billing_periods  SET fee_mode          = 'reduced' WHERE fee_mode          = 'fixed';
UPDATE eshop_fee_tier_events  SET previous_fee_mode = 'reduced' WHERE previous_fee_mode = 'fixed';
UPDATE eshop_fee_tier_events  SET new_fee_mode      = 'reduced' WHERE new_fee_mode      = 'fixed';

-- 4. Re-add the CHECK constraints with the new 'reduced' value in place of 'fixed'.
ALTER TABLE eshop_billing_periods
  ADD CONSTRAINT eshop_billing_periods_fee_mode_check
  CHECK (fee_mode IN ('percentage', 'reduced', 'ledger'));
ALTER TABLE eshop_fee_tier_events
  ADD CONSTRAINT eshop_fee_tier_events_previous_fee_mode_check
  CHECK (previous_fee_mode IN ('percentage', 'reduced'));
ALTER TABLE eshop_fee_tier_events
  ADD CONSTRAINT eshop_fee_tier_events_new_fee_mode_check
  CHECK (new_fee_mode IN ('percentage', 'reduced'));
