-- Returns management: customers initiate returns, admins approve/process.
-- Each return request links to specific order items.
-- Supports: full refund, partial refund, exchange, store credit.

CREATE TABLE IF NOT EXISTS return_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id        UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  order_id        UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id     UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  return_number   TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','rejected','received','processing','completed','cancelled')),
  reason          TEXT        NOT NULL CHECK (reason IN (
                    'wrong_item','damaged','defective','not_as_described',
                    'changed_mind','quality_issue','size_issue','other'
                  )),
  resolution      TEXT        CHECK (resolution IN ('refund','exchange','store_credit')),
  notes           TEXT,
  customer_notes  TEXT,
  refund_amount   NUMERIC(12,2),
  refund_method   TEXT        CHECK (refund_method IN ('original_payment','store_credit','bank_transfer')),
  shipping_label_url TEXT,
  received_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (party_id, return_number)
);

CREATE TABLE IF NOT EXISTS return_items (
  id                UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID      NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  order_item_id     UUID      NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  quantity          INT       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  condition         TEXT      CHECK (condition IN ('new','good','acceptable','damaged','unsellable')),
  restock           BOOLEAN   NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_order   ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_party   ON return_requests(party_id, status);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON return_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_return_items    ON return_items(return_request_id);

DROP TRIGGER IF EXISTS returns_updated_at ON return_requests;
CREATE TRIGGER returns_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq INT;
BEGIN
  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(return_number, '[^0-9]', '', 'g') AS INT)), 0) + 1
    INTO v_seq
    FROM return_requests
    WHERE party_id = NEW.party_id;
  NEW.return_number := 'RMA-' || LPAD(v_seq::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS returns_generate_number ON return_requests;
CREATE TRIGGER returns_generate_number
  BEFORE INSERT ON return_requests
  FOR EACH ROW WHEN (NEW.return_number IS NULL OR NEW.return_number = '')
  EXECUTE FUNCTION generate_return_number();

-- When a return is completed and items are marked for restock, restore inventory
CREATE OR REPLACE FUNCTION restock_returned_items()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_item RECORD;
  v_inventory_id UUID;
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    FOR r IN
      SELECT ri.*, oi.product_id, oi.variant_id
      FROM return_items ri
      JOIN order_items oi ON oi.id = ri.order_item_id
      WHERE ri.return_request_id = NEW.id AND ri.restock = true
    LOOP
      SELECT id INTO v_inventory_id
        FROM inventory_items
        WHERE product_id = r.product_id
          AND (variant_id = r.variant_id OR (variant_id IS NULL AND r.variant_id IS NULL))
        LIMIT 1;

      IF v_inventory_id IS NOT NULL THEN
        UPDATE inventory_items
          SET quantity = quantity + r.quantity
          WHERE id = v_inventory_id;

        INSERT INTO stock_movements (inventory_item_id, type, quantity, note)
          VALUES (v_inventory_id, 'return', r.quantity, 'Restocked from return ' || NEW.return_number);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restock_on_return_complete ON return_requests;
CREATE TRIGGER restock_on_return_complete
  AFTER UPDATE OF status ON return_requests
  FOR EACH ROW EXECUTE FUNCTION restock_returned_items();

-- RLS
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage returns" ON return_requests;
CREATE POLICY "Admins manage returns"
  ON return_requests FOR ALL
  USING (user_has_permission(auth.uid(), party_id, 32));

DROP POLICY IF EXISTS "Customers read own returns" ON return_requests;
CREATE POLICY "Customers read own returns"
  ON return_requests FOR SELECT
  TO authenticated
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Customers create returns" ON return_requests;
CREATE POLICY "Customers create returns"
  ON return_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage return items" ON return_items;
CREATE POLICY "Admins manage return items"
  ON return_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM return_requests r
      WHERE r.id = return_items.return_request_id
        AND user_has_permission(auth.uid(), r.party_id, 32)
    )
  );

DROP POLICY IF EXISTS "Customers read own return items" ON return_items;
CREATE POLICY "Customers read own return items"
  ON return_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM return_requests r
      JOIN customers c ON c.id = r.customer_id
      WHERE r.id = return_items.return_request_id
        AND c.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON return_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON return_items    TO authenticated;
