CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TABLE IF NOT EXISTS customers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT        NOT NULL,
  last_name  TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, email)
);

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_customers_party_email ON customers(party_id, email);

CREATE TABLE IF NOT EXISTS addresses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL DEFAULT 'shipping'
                 CHECK (type IN ('shipping','billing')),
  first_name   TEXT        NOT NULL,
  last_name    TEXT        NOT NULL,
  company      TEXT,
  line1        TEXT        NOT NULL,
  line2        TEXT,
  city         TEXT        NOT NULL,
  state        TEXT,
  postal_code  TEXT        NOT NULL,
  country_code CHAR(2)     NOT NULL DEFAULT 'US',
  is_default   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER addresses_updated_at
  BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS orders (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id            UUID          NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  customer_id         UUID          NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_number        TEXT          NOT NULL,
  status              TEXT          NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status      TEXT          NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid','paid','partially_paid','refunded','failed')),
  shipping_address_id UUID          REFERENCES addresses(id),
  billing_address_id  UUID          REFERENCES addresses(id),
  subtotal            NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency            CHAR(3)       NOT NULL DEFAULT 'USD',
  notes               TEXT,
  internal_notes      TEXT,
  tracking_number     TEXT,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, order_number)
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_party_status ON orders(party_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_party_created ON orders(party_id, created_at DESC);

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::TEXT, 8, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_generate_number
  BEFORE INSERT ON orders
  FOR EACH ROW WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

CREATE TABLE IF NOT EXISTS order_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id      UUID          REFERENCES product_variants(id) ON DELETE RESTRICT,
  title           TEXT          NOT NULL,
  sku             TEXT,
  quantity        INT           NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price     NUMERIC(12,2) NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT        NOT NULL,
  changed_by   UUID        REFERENCES auth.users(id),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- MANAGE_ORDERS = 32, MANAGE_CUSTOMERS = 256
CREATE POLICY "Managers manage customers"
  ON customers FOR ALL USING (user_has_permission(auth.uid(), party_id, 256));

CREATE POLICY "Order managers read customers"
  ON customers FOR SELECT USING (user_has_permission(auth.uid(), party_id, 32));

CREATE POLICY "Managers manage addresses"
  ON addresses FOR ALL
  USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND user_has_permission(auth.uid(), c.party_id, 256)));

CREATE POLICY "Order managers read addresses"
  ON addresses FOR SELECT
  USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND user_has_permission(auth.uid(), c.party_id, 32)));

CREATE POLICY "Managers manage orders"
  ON orders FOR ALL USING (user_has_permission(auth.uid(), party_id, 32));

CREATE POLICY "Managers manage order_items"
  ON order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND user_has_permission(auth.uid(), o.party_id, 32)));

CREATE POLICY "Managers read order_status_history"
  ON order_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND user_has_permission(auth.uid(), o.party_id, 32)));

CREATE POLICY "Managers insert order_status_history"
  ON order_status_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND user_has_permission(auth.uid(), o.party_id, 32)));

GRANT SELECT, INSERT, UPDATE, DELETE ON customers, addresses, orders, order_items, order_status_history TO authenticated;
GRANT USAGE ON SEQUENCE order_number_seq TO authenticated;
