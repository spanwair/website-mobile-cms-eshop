-- Per-party, per-calendar-month billing period: gross revenue, real costs (COGS + completed
-- refunds + damaged stock), platform fee and net payout, for the income-tax export the party
-- needs regardless of seller_mode. period_start/period_end are the actual calendar month
-- boundaries (28-31 days, computed in shared/utils/billingPeriod.ts) -- not a fixed 30-day
-- window. fee_mode is settable per party per period; this migration only lays the model and
-- the two independent fee formulas ('percentage' vs 'fixed') -- automatically deciding WHICH
-- mode a given month should use is deliberately left to a later change (see
-- shared/utils/billingFeeCalc.ts for the reasoning). smalljobs_commission parties already pay
-- per-order via order_commission_ledger, so their period fee_amount is informational --
-- aggregated from that ledger ('ledger' fee_mode), not a new remittance workflow.

CREATE TABLE IF NOT EXISTS eshop_billing_periods (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id           UUID          NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  period_start       DATE          NOT NULL, -- first day of the calendar month (UTC)
  period_end         DATE          NOT NULL, -- last day of the calendar month (28-31, UTC)
  seller_mode        TEXT          NOT NULL, -- snapshot of parties.seller_mode at compute time
  gross_revenue      NUMERIC(12,2) NOT NULL DEFAULT 0, -- sum of paid orders' total_amount
  real_costs         NUMERIC(12,2) NOT NULL DEFAULT 0, -- COGS + completed refunds + damaged loss
  net_revenue        NUMERIC(12,2) NOT NULL DEFAULT 0, -- gross_revenue - real_costs
  fee_mode           TEXT          NOT NULL DEFAULT 'percentage'
                        CHECK (fee_mode IN ('percentage', 'fixed', 'ledger')),
  fee_rate           NUMERIC(5,4), -- snapshot of the rate used when fee_mode = 'percentage'
  fee_amount         NUMERIC(12,2) NOT NULL DEFAULT 0, -- platform remittance for the period
  net_payout         NUMERIC(12,2) NOT NULL DEFAULT 0, -- net_revenue - fee_amount
  currency           CHAR(3)       NOT NULL DEFAULT 'CZK',
  status             TEXT          NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  computed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- One row per party per calendar month -- recompute upserts on this key, same
  -- re-run-safe shape as monthly_platform_fees.
  UNIQUE (party_id, period_start)
);

CREATE TRIGGER eshop_billing_periods_updated_at
  BEFORE UPDATE ON eshop_billing_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_eshop_billing_periods_party_period
  ON eshop_billing_periods(party_id, period_start DESC);

ALTER TABLE eshop_billing_periods ENABLE ROW LEVEL SECURITY;

-- MANAGE_REPORTS = 512: viewing/exporting a party's own billing/tax data is a reporting
-- concern, same bit that already gates /admin/reports.
CREATE POLICY "Reporters read billing periods"
  ON eshop_billing_periods FOR SELECT
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 512));

-- MANAGE_AUDIT = 4096: recomputing a period or changing its fee_mode mirrors the
-- "Auditors write monthly fees" policy on monthly_platform_fees.
CREATE POLICY "Auditors write billing periods"
  ON eshop_billing_periods FOR ALL
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 4096))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 4096));

GRANT SELECT, INSERT, UPDATE, DELETE ON eshop_billing_periods TO authenticated;

-- Aggregates one party's cash-basis totals for an arbitrary date range, on the same domains
-- get_product_overview_stats() already reads (order_items/products for COGS, return_requests
-- for refunds, stock_movements for damage) plus order_commission_ledger for the
-- smalljobs_commission informational fee total. SECURITY DEFINER + explicit permission check
-- so a caller holding only MANAGE_REPORTS (512), and not MANAGE_ORDERS/MANAGE_PRODUCTS, can
-- still read it -- same pattern as get_product_overview_stats.
CREATE OR REPLACE FUNCTION get_billing_period_totals(p_party_id UUID, p_range_start TIMESTAMPTZ, p_range_end TIMESTAMPTZ)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (is_owner() OR user_has_permission(auth.uid(), p_party_id, 512)) THEN
    RAISE EXCEPTION 'insufficient_permission' USING ERRCODE = '42501';
  END IF;

  WITH paid_orders AS (
    SELECT id, total_amount, currency
    FROM orders
    WHERE party_id = p_party_id AND payment_status = 'paid'
      AND paid_at >= p_range_start AND paid_at < p_range_end
  ),
  gross AS (
    SELECT COALESCE(SUM(total_amount), 0) AS amount,
           (ARRAY_AGG(currency))[1] AS currency
    FROM paid_orders
  ),
  cogs AS (
    SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0) AS amount
    FROM order_items oi
    JOIN paid_orders po ON po.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
  ),
  refunded AS (
    SELECT COALESCE(SUM(rr.refund_amount), 0) AS amount
    FROM return_requests rr
    WHERE rr.party_id = p_party_id AND rr.status = 'completed'
      AND rr.completed_at >= p_range_start AND rr.completed_at < p_range_end
  ),
  damaged AS (
    SELECT COALESCE(SUM(sm.quantity * p.cost_price), 0) AS amount
    FROM stock_movements sm
    JOIN inventory_items ii ON ii.id = sm.inventory_item_id
    JOIN products p ON p.id = ii.product_id
    WHERE sm.party_id = p_party_id AND sm.type = 'damage'
      AND sm.created_at >= p_range_start AND sm.created_at < p_range_end
  ),
  ledger_fee AS (
    SELECT COALESCE(SUM(ocl.commission_amount), 0) AS amount
    FROM order_commission_ledger ocl
    JOIN paid_orders po ON po.id = ocl.order_id
    WHERE ocl.party_id = p_party_id AND ocl.status <> 'reversed'
  )
  SELECT jsonb_build_object(
    'gross_revenue', gross.amount,
    'currency', COALESCE(gross.currency, 'CZK'),
    'cogs', cogs.amount,
    'refunded_amount', refunded.amount,
    'damaged_loss', damaged.amount,
    'real_costs', cogs.amount + refunded.amount + damaged.amount,
    'ledger_fee_amount', ledger_fee.amount
  ) INTO v_result
  FROM gross, cogs, refunded, damaged, ledger_fee;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_billing_period_totals(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
