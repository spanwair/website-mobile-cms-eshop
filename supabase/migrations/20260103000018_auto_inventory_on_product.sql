-- Auto-create an inventory_item when a product is created.
-- Requires a warehouse to exist for the party; silently skips if none found.
CREATE OR REPLACE FUNCTION create_default_inventory_item()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_warehouse_id UUID;
BEGIN
  SELECT id INTO v_warehouse_id
  FROM warehouses
  WHERE party_id = NEW.party_id
  ORDER BY is_default DESC, created_at ASC
  LIMIT 1;

  IF v_warehouse_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM inventory_items
    WHERE product_id = NEW.id
      AND warehouse_id = v_warehouse_id
      AND variant_id IS NULL
  ) THEN
    INSERT INTO inventory_items
      (party_id, product_id, warehouse_id, qty_on_hand, low_stock_threshold, track_inventory)
    VALUES
      (NEW.party_id, NEW.id, v_warehouse_id, 0, 10, true);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_inventory_on_product
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION create_default_inventory_item();

-- Backfill existing products that have no inventory_item yet
INSERT INTO inventory_items
  (party_id, product_id, warehouse_id, qty_on_hand, low_stock_threshold, track_inventory)
SELECT DISTINCT ON (p.id)
  p.party_id, p.id, w.id, 0, 10, true
FROM products p
JOIN warehouses w ON w.party_id = p.party_id
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_items ii WHERE ii.product_id = p.id
)
ORDER BY p.id, w.is_default DESC, w.created_at ASC;
