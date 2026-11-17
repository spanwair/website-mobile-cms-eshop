-- Unifies own_company onto the same per-order order_commission_ledger smalljobs_commission
-- already uses (see shared/services/commissionLedgerService.ts), now that the default
-- own_company rate is flat (COMMISSION_RATE = 0.05, shared/constants/sellerMode.ts) and no
-- longer needs the old whole-month retroactive tier switch. eshop_billing_periods stays, but
-- becomes a read-only MONTHLY STATEMENT aggregated from the ledger (both seller modes) instead
-- of an independently-computed invoice — gross/deducted/net for the month, plus how much of
-- that net is already marked paid vs still outstanding as of generation time. The old
-- monthly_platform_fees table/cron and the fee-tier auto-switch cron are retired (dead once
-- /admin/billing reads the ledger directly) — left in place as frozen history, not dropped.

ALTER TABLE eshop_billing_periods
  ADD COLUMN IF NOT EXISTS paid_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN eshop_billing_periods.paid_amount IS
  'Sum of this period''s ledger net_payable already marked paid, as of computed_at. Snapshot, not live.';
COMMENT ON COLUMN eshop_billing_periods.outstanding_amount IS
  'net_payout - paid_amount, as of computed_at. The live figure is the order_commission_ledger Unpaid tab, not this snapshot.';

-- Extends get_billing_period_totals() with the ledger's net_payable totals (overall, and the
-- portion already paid) so recomputeBillingPeriod() can source a party's whole monthly
-- statement from the ledger for ANY seller_mode, not just the smalljobs_commission
-- 'ledger_fee_amount' it already returned. cogs/refunded/damaged stay informational
-- (tax-export figures), no longer used to compute the platform fee itself.
CREATE OR REPLACE FUNCTION get_billing_period_totals(p_party_id UUID, p_range_start TIMESTAMPTZ, p_range_end TIMESTAMPTZ)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (is_owner() OR user_has_permission(auth.uid(), p_party_id, 512) OR auth.role() = 'service_role') THEN
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
  ledger AS (
    SELECT
      COALESCE(SUM(ocl.commission_amount), 0) AS fee_amount,
      COALESCE(SUM(ocl.net_payable), 0) AS net_payable_total,
      COALESCE(SUM(ocl.net_payable) FILTER (WHERE ocl.status = 'paid'), 0) AS net_paid_amount
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
    'ledger_fee_amount', ledger.fee_amount,
    'net_payable_total', ledger.net_payable_total,
    'net_paid_amount', ledger.net_paid_amount
  ) INTO v_result
  FROM gross, cogs, refunded, damaged, ledger;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_billing_period_totals(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- The fee-tier auto-switch cron has nothing left to switch (both own_company and
-- smalljobs_commission are now ledger-sourced per order, not a period-level mode) — unschedule
-- it. eshop_fee_tier_events is left in place as a frozen audit trail of past switches.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-fee-tier-transition') THEN
    PERFORM cron.unschedule('auto-fee-tier-transition');
  END IF;
END $$;
