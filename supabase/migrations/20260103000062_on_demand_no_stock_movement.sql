-- On-demand items (track_inventory=false) must never have qty_on_hand changed by
-- order-driven movements — the atomic guard in apply_stock_movement() already exempts
-- them from the availability check, but the decrement itself still ran, drifting
-- qty_on_hand negative on every sale. Manual admin movements (purchase/return/
-- adjustment/damage, reference_type IS NULL) are unaffected — an admin can still
-- record real stock for an on-demand product if they choose to.
CREATE OR REPLACE FUNCTION apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_track BOOLEAN;
  v_rows  INT;
BEGIN
  SELECT track_inventory INTO v_track FROM inventory_items WHERE id = NEW.inventory_item_id;

  IF v_track = false AND NEW.reference_type = 'order_item' AND NEW.type IN ('sale', 'return') THEN
    RETURN NEW;
  END IF;

  IF NEW.type IN ('purchase', 'return') THEN
    UPDATE inventory_items SET qty_on_hand = qty_on_hand + NEW.quantity WHERE id = NEW.inventory_item_id;
  ELSIF NEW.type IN ('sale', 'damage') THEN
    UPDATE inventory_items
      SET qty_on_hand = qty_on_hand - NEW.quantity
      WHERE id = NEW.inventory_item_id
        AND (v_track = false OR qty_on_hand - qty_reserved >= NEW.quantity);
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK';
    END IF;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE inventory_items SET qty_on_hand = qty_on_hand + NEW.quantity WHERE id = NEW.inventory_item_id;
  END IF;
  RETURN NEW;
END;
$$;
