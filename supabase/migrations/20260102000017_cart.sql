-- Shopping cart: persistent across sessions, supports both guest and logged-in users.
-- Identified by session_id (cookie) for guests, user_id for logged-in users.
-- Cart is merged into user's cart on login.

CREATE TABLE IF NOT EXISTS carts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id     UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id   TEXT,
  coupon_code  TEXT,
  coupon_id    UUID        REFERENCES coupons(id) ON DELETE SET NULL,
  notes        TEXT,
  abandoned_at TIMESTAMPTZ,
  recovery_sent_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carts_identified CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_carts_user       ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_session    ON carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_abandoned  ON carts(abandoned_at) WHERE abandoned_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_party      ON carts(party_id);

DROP TRIGGER IF EXISTS carts_updated_at ON carts;
CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID        NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  UUID        REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity    INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);

DROP TRIGGER IF EXISTS cart_items_updated_at ON cart_items;
CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Mark cart as abandoned after 1 hour of inactivity — run via a cron/Edge Function
-- This column is set by the abandonment job, not by RLS

-- RLS: carts are private to their owner
ALTER TABLE carts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User owns cart" ON carts;
CREATE POLICY "User owns cart"
  ON carts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages all carts" ON carts;
CREATE POLICY "Service role manages all carts"
  ON carts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "User owns cart items" ON cart_items;
CREATE POLICY "User owns cart items"
  ON cart_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_items.cart_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_items.cart_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role manages all cart items" ON cart_items;
CREATE POLICY "Service role manages all cart items"
  ON cart_items FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON carts      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;
