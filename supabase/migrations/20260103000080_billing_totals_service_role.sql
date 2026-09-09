-- Fix: /admin/reports recomputes billing periods through the service-role client (same
-- privilege boundary as the monthly-fee cron), where auth.uid() is NULL, so the previous
-- guard raised insufficient_permission and the billing table never populated. Allow the
-- trusted service_role caller explicitly; owner / MANAGE_REPORTS holders still pass as before.

CREATE OR REPLACE FUNCTION public.get_billing_period_totals(p_party_id uuid, p_range_start timestamptz, p_range_end timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (
    COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
    OR is_owner()
    OR user_has_permission(auth.uid(), p_party_id, 512)
  ) THEN
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
$function$;
