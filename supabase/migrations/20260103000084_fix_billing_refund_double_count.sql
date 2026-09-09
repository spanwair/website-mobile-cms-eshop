-- Bod 6 audit finding: get_billing_period_totals() double-counted refunds for orders refunded
-- via Stripe (refund_method = 'original_payment').
--
-- Two independent refund paths exist in this codebase:
--   1. Stripe 'charge.refunded' webhook (website/src/pages/api/stripe/webhook.ts) sets
--      orders.payment_status = 'refunded'. paid_orders in this function filters on
--      payment_status = 'paid', so a Stripe-refunded order is ALREADY excluded from
--      gross_revenue (and, via the same paid_orders join, from cogs) entirely.
--   2. The RMA workflow (website/src/pages/admin/returns/[id].astro, shared/services/
--      returnService.ts) records an independent bookkeeping row in return_requests with its
--      own refund_amount, refund_method and completed_at -- with NO link back to whether the
--      order's payment_status ever actually changed. This return_requests.refund_amount feeds
--      the 'refunded' bucket of real_costs, unconditionally.
--
-- When a return is resolved via refund_method = 'original_payment' (the normal path: admin
-- processes the RMA AND issues the actual Stripe refund), BOTH mechanisms fire for the exact
-- same money: the order's total_amount vanishes from gross_revenue (mechanism 1), and its
-- refund_amount is ALSO subtracted again via real_costs.refunded (mechanism 2). Verified with
-- a real order against this local dev DB: a 1000 Kc order, fully refunded via
-- original_payment, produced gross_revenue=0, refunded_amount=1000, real_costs=1000 ->
-- net_revenue=-1000 for a transaction that should net to ~0 (customer paid 1000, got 1000
-- back, the eshop keeps nothing and loses nothing beyond whatever COGS/shipping already
-- happened -- NOT an extra 1000 Kc of "cost").
--
-- Fix: the refunded bucket only counts return_requests whose order was NOT already removed
-- from gross via payment_status = 'refunded' -- i.e. refunds settled by store_credit or
-- bank_transfer (order stays 'paid', so it is correctly still counted in gross and needs its
-- refund cost subtracted exactly once) are unaffected. This does not touch cogs/damaged -- an
-- order excluded from gross via 'refunded' is also correctly excluded from cogs already (no
-- change needed there): if the returned goods were not restocked, that loss is expected to
-- show up via the existing 'damage' stock_movements bucket instead, a separate, deliberate
-- design already in place before this fix.

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
    JOIN orders o ON o.id = rr.order_id
    WHERE rr.party_id = p_party_id AND rr.status = 'completed'
      AND rr.completed_at >= p_range_start AND rr.completed_at < p_range_end
      -- an order already excluded from gross (payment_status = 'refunded', the Stripe
      -- charge.refunded path) must not ALSO be subtracted here -- see migration header.
      AND o.payment_status <> 'refunded'
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
