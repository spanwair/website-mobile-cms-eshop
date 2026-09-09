-- Automatic monthly transition between fee_mode 'percentage' and 'fixed' for own_company
-- parties (see shared/utils/billingFeeCalc.ts decideAutoFeeMode -- threshold is
-- COMMISSION_BREAK_EVEN_CZK = 29900, single source of truth in shared/constants/sellerMode.ts).
-- Evaluated once a month, on the 1st, for the just-closed calendar month -- see
-- shared/services/feeTierService.ts and website/src/pages/api/cron/auto-fee-tier.ts.

-- New notification type for the in-app admin inbox (website/src/pages/admin/notifications) --
-- that page renders notifications.type directly with no per-type i18n mapping, so no further
-- UI change is needed here.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fee_tier_change';

-- Bug fix carried in from bod 2: get_billing_period_totals() is only ever called through
-- createAdminClient() (service-role) by recomputeBillingPeriod() -- both the manual admin
-- action in /admin/reports and this migration's own cron path. A service-role JWT has no
-- 'sub' claim, so auth.uid() is NULL and the original is_owner()/user_has_permission() check
-- always raised 'insufficient_permission' -- confirmed against the local dev DB (auth.uid()
-- returns NULL and is_owner() returns false with no JWT claims set, matching the service-role
-- shape). auth.role() correctly reports 'service_role' for that caller (distinct from 'anon'
-- and 'authenticated'), so this is a safe, narrow addition -- it does not grant anon/
-- authenticated callers anything they didn't already have.
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

-- Audit trail of every monthly evaluation (changed or not) -- the (party_id, period_start)
-- unique key is also the idempotency gate: a retried/duplicated cron run for the same closed
-- month hits a unique-violation on insert and does nothing further (see feeTierService.ts).
-- 'ledger' is never a value here -- this only ever runs for own_company parties, whose fee_mode
-- is exclusively percentage/fixed (smalljobs_commission parties stay on 'ledger', untouched).
CREATE TABLE IF NOT EXISTS eshop_fee_tier_events (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id          UUID          NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  period_start      DATE          NOT NULL,
  previous_fee_mode TEXT          NOT NULL CHECK (previous_fee_mode IN ('percentage', 'fixed')),
  new_fee_mode      TEXT          NOT NULL CHECK (new_fee_mode IN ('percentage', 'fixed')),
  changed           BOOLEAN       NOT NULL,
  gross_revenue     NUMERIC(12,2) NOT NULL,
  threshold_amount  NUMERIC(12,2) NOT NULL,
  notified_in_app   BOOLEAN       NOT NULL DEFAULT false,
  notified_email    BOOLEAN       NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (party_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_eshop_fee_tier_events_party_period
  ON eshop_fee_tier_events(party_id, period_start DESC);

ALTER TABLE eshop_fee_tier_events ENABLE ROW LEVEL SECURITY;

-- Read-only for admins/reporters, same bit as eshop_billing_periods -- lets a future UI show
-- "why did this month's mode change" without a schema change.
CREATE POLICY "Reporters read fee tier events"
  ON eshop_fee_tier_events FOR SELECT
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 512));

-- Deliberately no INSERT/UPDATE/DELETE policy for `authenticated`, not even MANAGE_AUDIT --
-- this table is written exclusively by the service-role cron (via the
-- ALTER DEFAULT PRIVILEGES ... TO service_role grant in 20260103000023), so no admin, however
-- privileged, can rewrite the auto-switch audit trail through the app.

GRANT SELECT ON eshop_fee_tier_events TO authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 03:15 UTC on the 1st -- 15 minutes after monthly-platform-fees (03:00) so the two monthly
-- jobs never overlap. Reuses the same app.settings.site_url / app.settings.cron_secret DB
-- settings as the existing crons -- no additional one-time setup needed if that was already
-- done for this environment (see 20260103000073_monthly_fee_cron.sql).
SELECT cron.schedule(
  'auto-fee-tier-transition',
  '15 3 1 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.site_url', true) || '/api/cron/auto-fee-tier',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
