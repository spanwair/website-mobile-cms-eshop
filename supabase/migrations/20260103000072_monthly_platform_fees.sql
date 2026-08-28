-- Monthly platform fee for own_company parties (10% of turnover, capped at
-- MONTHLY_COMMISSION_CAP_CZK — see shared/constants/sellerMode.ts, single source of truth
-- for the actual numbers). own_company parties have no existing money-collection mechanism
-- (unlike smalljobs_commission, whose commission is deducted per-order in real time from
-- order_commission_ledger) — all order proceeds land in the platform's single central Stripe
-- account untouched. This table is a manually-reconciled invoice: a monthly cron computes
-- what a party owes, an admin marks it paid once the seller pays by bank transfer. No card is
-- charged automatically — mirrors the existing order_commission_ledger "mark as paid" pattern.

CREATE TABLE IF NOT EXISTS monthly_platform_fees (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id           UUID          NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  period_month       DATE          NOT NULL, -- first day of the billed calendar month (UTC)
  turnover_amount    NUMERIC(12,2) NOT NULL,
  fee_rate           NUMERIC(5,4)  NOT NULL, -- commission rate used at computation time
  fee_amount         NUMERIC(12,2) NOT NULL, -- min(turnover * fee_rate, cap at computation time)
  currency           CHAR(3)       NOT NULL DEFAULT 'CZK',
  status             TEXT          NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  paid_at            TIMESTAMPTZ,
  paid_by            UUID          REFERENCES auth.users(id),
  payment_reference  TEXT,
  notified_at        TIMESTAMPTZ,  -- when the "you owe X this month" email was sent
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- One fee row per party per month — the monthly cron is safe to re-run (upserts on this key).
  UNIQUE (party_id, period_month)
);

CREATE TRIGGER monthly_platform_fees_updated_at
  BEFORE UPDATE ON monthly_platform_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_monthly_platform_fees_party_status ON monthly_platform_fees(party_id, status);

ALTER TABLE monthly_platform_fees ENABLE ROW LEVEL SECURITY;

-- Same permission split as order_commission_ledger: order managers can see their own party's
-- fee history, only auditors (or the owner, via is_owner()) can write / mark paid.
CREATE POLICY "Order managers read own monthly fees"
  ON monthly_platform_fees FOR SELECT
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 32));

CREATE POLICY "Auditors write monthly fees"
  ON monthly_platform_fees FOR ALL
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 4096))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 4096));

GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_platform_fees TO authenticated;
