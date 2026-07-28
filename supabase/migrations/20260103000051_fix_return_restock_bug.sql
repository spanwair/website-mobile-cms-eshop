-- restock_returned_items() referenced a non-existent inventory_items.quantity column
-- (actual column is qty_on_hand) and omitted the NOT NULL stock_movements.party_id,
-- so marking any return_request 'completed' with restock=true items raised a DB error.
CREATE OR REPLACE FUNCTION restock_returned_items()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
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
          SET qty_on_hand = qty_on_hand + r.quantity
          WHERE id = v_inventory_id;

        INSERT INTO stock_movements (inventory_item_id, party_id, type, quantity, reference_type, reference_id, note)
          VALUES (v_inventory_id, NEW.party_id, 'return', r.quantity, 'return_request', NEW.id, 'Restocked from return ' || NEW.return_number);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
