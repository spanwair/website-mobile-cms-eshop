-- Every variant gets its own inventory_items row, mirroring create_default_inventory_item()
-- for products. Without this, inventory_items.variant_id is never populated, so per-variant
-- stock never exists and deduct_stock_on_order_item's variant match never fires.
--
-- ensure_variant_inventory_item is shared by the live trigger and the one-time backfill below
-- so the "first variant inherits the product-level stock" logic exists in exactly one place.
CREATE OR REPLACE FUNCTION ensure_variant_inventory_item(p_variant_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_product_id   UUID;
  v_variant_name TEXT;
  v_party_id     UUID;
  v_warehouse_id UUID;
  v_product_row  RECORD;
  v_is_first     BOOLEAN;
  v_new_inv_id   UUID;
BEGIN
  SELECT pv.product_id, pv.name, p.party_id
  INTO v_product_id, v_variant_name, v_party_id
  FROM product_variants pv JOIN products p ON p.id = pv.product_id
  WHERE pv.id = p_variant_id;

  SELECT id INTO v_warehouse_id
  FROM warehouses
  WHERE party_id = v_party_id
  FOR NO KEY UPDATE
  LIMIT 1;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'No warehouse exists for party %', v_party_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM inventory_items WHERE product_id = v_product_id AND variant_id = p_variant_id
  ) THEN
    RETURN;
  END IF;

  v_is_first := NOT EXISTS (
    SELECT 1 FROM inventory_items WHERE product_id = v_product_id AND variant_id IS NOT NULL
  );

  SELECT * INTO v_product_row
  FROM inventory_items
  WHERE product_id = v_product_id AND variant_id IS NULL AND warehouse_id = v_warehouse_id
  LIMIT 1;

  IF v_is_first THEN
    INSERT INTO inventory_items
      (party_id, product_id, variant_id, warehouse_id, qty_on_hand, low_stock_threshold, track_inventory)
    VALUES
      (v_party_id, v_product_id, p_variant_id, v_warehouse_id, 0,
       COALESCE(v_product_row.low_stock_threshold, 10), COALESCE(v_product_row.track_inventory, true))
    RETURNING id INTO v_new_inv_id;

    -- The product-level row becomes inert the moment the product gets its first variant —
    -- variant rows are the only ones ever sold against from here on. If it still held stock,
    -- move that quantity into this first variant rather than losing visibility of it.
    IF v_product_row.id IS NOT NULL THEN
      IF v_product_row.qty_on_hand > 0 THEN
        INSERT INTO stock_movements (inventory_item_id, party_id, type, quantity, reference_type, reference_id, note)
        VALUES (v_new_inv_id, v_party_id, 'adjustment', v_product_row.qty_on_hand, 'variant_migration', p_variant_id,
                'Stock moved from product-level tracking to variant "' || v_variant_name || '"');

        INSERT INTO stock_movements (inventory_item_id, party_id, type, quantity, reference_type, reference_id, note)
        VALUES (v_product_row.id, v_party_id, 'adjustment', -v_product_row.qty_on_hand, 'variant_migration', p_variant_id,
                'Stock moved to variant "' || v_variant_name || '"');
      END IF;

      UPDATE inventory_items SET track_inventory = false WHERE id = v_product_row.id;
    END IF;
  ELSE
    -- A later variant on a product that already has variant-level rows: start at zero,
    -- inheriting settings from an existing variant row (the product-level row is already inert).
    INSERT INTO inventory_items
      (party_id, product_id, variant_id, warehouse_id, qty_on_hand, low_stock_threshold, track_inventory)
    SELECT v_party_id, v_product_id, p_variant_id, v_warehouse_id, 0, low_stock_threshold, track_inventory
    FROM inventory_items
    WHERE product_id = v_product_id AND variant_id IS NOT NULL
    LIMIT 1;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION trg_ensure_variant_inventory_item()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  PERFORM ensure_variant_inventory_item(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_inventory_on_variant ON product_variants;
CREATE TRIGGER trg_auto_inventory_on_variant
  AFTER INSERT ON product_variants
  FOR EACH ROW EXECUTE FUNCTION trg_ensure_variant_inventory_item();

-- Backfill: existing variants created before this migration never got a row.
DO $$
DECLARE
  v_id UUID;
BEGIN
  FOR v_id IN
    SELECT pv.id
    FROM product_variants pv
    WHERE NOT EXISTS (
      SELECT 1 FROM inventory_items ii WHERE ii.product_id = pv.product_id AND ii.variant_id = pv.id
    )
    ORDER BY pv.product_id, pv.created_at
  LOOP
    PERFORM ensure_variant_inventory_item(v_id);
  END LOOP;
END $$;
