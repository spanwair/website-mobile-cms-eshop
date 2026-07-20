-- Deduct stock automatically when an order item is added.
-- Relies on the existing apply_stock_movement() trigger to update qty_on_hand.
CREATE OR REPLACE FUNCTION deduct_stock_on_order_item()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_inv_id   UUID;
  v_party_id UUID;
BEGIN
  SELECT party_id INTO v_party_id FROM orders WHERE id = NEW.order_id;

  SELECT ii.id INTO v_inv_id
  FROM inventory_items ii
  JOIN warehouses w ON w.id = ii.warehouse_id
  WHERE ii.product_id = NEW.product_id
    AND ii.party_id   = v_party_id
    AND (NEW.variant_id IS NULL OR ii.variant_id = NEW.variant_id)
    AND (NEW.variant_id IS NOT NULL OR ii.variant_id IS NULL)
  ORDER BY w.is_default DESC
  LIMIT 1;

  IF v_inv_id IS NOT NULL THEN
    INSERT INTO stock_movements
      (inventory_item_id, party_id, type, quantity, reference_type, reference_id)
    VALUES
      (v_inv_id, v_party_id, 'sale', NEW.quantity, 'order_item', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_stock_on_order_item
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_order_item();

-- Return stock when an order is cancelled
CREATE OR REPLACE FUNCTION return_stock_on_order_cancel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_item   RECORD;
  v_inv_id UUID;
BEGIN
  IF NEW.status != 'cancelled' OR OLD.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  FOR v_item IN SELECT * FROM order_items WHERE order_id = NEW.id LOOP
    SELECT ii.id INTO v_inv_id
    FROM inventory_items ii
    JOIN warehouses w ON w.id = ii.warehouse_id
    WHERE ii.product_id = v_item.product_id
      AND ii.party_id   = NEW.party_id
      AND (v_item.variant_id IS NULL OR ii.variant_id = v_item.variant_id)
      AND (v_item.variant_id IS NOT NULL OR ii.variant_id IS NULL)
    ORDER BY w.is_default DESC
    LIMIT 1;

    IF v_inv_id IS NOT NULL THEN
      INSERT INTO stock_movements
        (inventory_item_id, party_id, type, quantity, reference_type, reference_id, note)
      VALUES
        (v_inv_id, NEW.party_id, 'return', v_item.quantity, 'order_item', v_item.id, 'Order cancelled');
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_return_stock_on_cancel
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION return_stock_on_order_cancel();
