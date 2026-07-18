-- Customer enrichment: GDPR compliance fields + loyalty + segmentation.
-- GDPR consent is legally required before any marketing communication.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS date_of_birth       DATE,
  ADD COLUMN IF NOT EXISTS gender              TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS marketing_opt_in    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gdpr_consent        BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gdpr_consent_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gdpr_consent_ip     INET,
  ADD COLUMN IF NOT EXISTS preferred_language  TEXT        NOT NULL DEFAULT 'cs',
  ADD COLUMN IF NOT EXISTS loyalty_points      INT         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_group      TEXT        NOT NULL DEFAULT 'standard'
                                               CHECK (customer_group IN ('standard','vip','wholesale','staff')),
  ADD COLUMN IF NOT EXISTS tags                TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lifetime_value      NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Keep lifetime_value in sync when order is delivered/paid
CREATE OR REPLACE FUNCTION sync_customer_ltv()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE customers
  SET lifetime_value = sub.total
  FROM (
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM orders
    WHERE customer_id = NEW.customer_id
      AND payment_status = 'paid'
  ) sub
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_ltv_on_order_paid ON orders;
CREATE TRIGGER sync_ltv_on_order_paid
  AFTER UPDATE OF payment_status ON orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid')
  EXECUTE FUNCTION sync_customer_ltv();

-- Loyalty points log: every earn/spend event is recorded
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id    UUID        REFERENCES orders(id) ON DELETE SET NULL,
  type        TEXT        NOT NULL CHECK (type IN ('earn','redeem','expire','adjust')),
  points      INT         NOT NULL,
  balance_after INT       NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_party    ON loyalty_transactions(party_id);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage loyalty" ON loyalty_transactions;
CREATE POLICY "Admins manage loyalty"
  ON loyalty_transactions FOR ALL
  USING (user_has_permission(auth.uid(), party_id, 256));

DROP POLICY IF EXISTS "Customers read own loyalty" ON loyalty_transactions;
CREATE POLICY "Customers read own loyalty"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON loyalty_transactions TO authenticated;
