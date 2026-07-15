CREATE TABLE IF NOT EXISTS warehouses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  address    JSONB       NOT NULL DEFAULT '{}',
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  is_default BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, code)
);

CREATE TRIGGER warehouses_updated_at
  BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS inventory_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id            UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  product_id          UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id          UUID        REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id        UUID        NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  qty_on_hand         INT         NOT NULL DEFAULT 0,
  qty_reserved        INT         NOT NULL DEFAULT 0,
  qty_incoming        INT         NOT NULL DEFAULT 0,
  low_stock_threshold INT         NOT NULL DEFAULT 10,
  track_inventory     BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, variant_id, warehouse_id)
);

CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_inventory_party_product  ON inventory_items(party_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse       ON inventory_items(warehouse_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID        NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  party_id          UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  type              TEXT        NOT NULL
                      CHECK (type IN ('purchase','sale','adjustment','transfer','return','damage')),
  quantity          INT         NOT NULL,
  reference_type    TEXT,
  reference_id      UUID,
  note              TEXT,
  created_by        UUID        REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item_created ON stock_movements(inventory_item_id, created_at DESC);

-- Positive qty for inbound types, negative for outbound/loss types.
-- adjustment uses signed quantity directly, so caller is responsible for sign.
CREATE OR REPLACE FUNCTION apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.type IN ('purchase', 'return') THEN
    UPDATE inventory_items SET qty_on_hand = qty_on_hand + NEW.quantity WHERE id = NEW.inventory_item_id;
  ELSIF NEW.type IN ('sale', 'damage') THEN
    UPDATE inventory_items SET qty_on_hand = qty_on_hand - NEW.quantity WHERE id = NEW.inventory_item_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE inventory_items SET qty_on_hand = qty_on_hand + NEW.quantity WHERE id = NEW.inventory_item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER stock_movements_apply
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION apply_stock_movement();

CREATE OR REPLACE VIEW inventory_alerts AS
  SELECT
    ii.*,
    ii.qty_on_hand - ii.qty_reserved AS qty_available,
    p.title                           AS product_title,
    pv.name                           AS variant_name,
    w.name                            AS warehouse_name
  FROM inventory_items ii
  JOIN products p  ON p.id  = ii.product_id
  JOIN warehouses w ON w.id = ii.warehouse_id
  LEFT JOIN product_variants pv ON pv.id = ii.variant_id
  WHERE ii.track_inventory = true
    AND (ii.qty_on_hand - ii.qty_reserved) <= ii.low_stock_threshold;

ALTER TABLE warehouses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements  ENABLE ROW LEVEL SECURITY;

-- MANAGE_INVENTORY = 64
CREATE POLICY "Managers manage warehouses"
  ON warehouses FOR ALL USING (user_has_permission(auth.uid(), party_id, 64));

CREATE POLICY "Members read active warehouses"
  ON warehouses FOR SELECT
  USING (is_active AND EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = warehouses.party_id));

CREATE POLICY "Managers manage inventory_items"
  ON inventory_items FOR ALL USING (user_has_permission(auth.uid(), party_id, 64));

CREATE POLICY "Members read inventory_items"
  ON inventory_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = inventory_items.party_id));

CREATE POLICY "Managers manage stock_movements"
  ON stock_movements FOR ALL USING (user_has_permission(auth.uid(), party_id, 64));

CREATE POLICY "Members read stock_movements"
  ON stock_movements FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = stock_movements.party_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON warehouses, inventory_items, stock_movements TO authenticated;
GRANT SELECT ON inventory_alerts TO authenticated;
