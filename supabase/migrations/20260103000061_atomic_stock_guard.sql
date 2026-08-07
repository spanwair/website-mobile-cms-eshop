-- Oversell guard: outbound movements ('sale', 'damage') now use a single UPDATE with a
-- WHERE-clause quantity check instead of a blind decrement. Postgres serializes concurrent
-- UPDATEs to the same row (the second waits for the first's lock, then re-evaluates WHERE
-- against the committed result) — this is the standard atomic conditional-decrement pattern,
-- so two buyers can never both take the last unit. track_inventory=false items are exempt
-- (on-demand, always sellable). Applies uniformly to checkout sales and manual admin
-- adjustments, since both funnel through this same trigger on stock_movements.
CREATE OR REPLACE FUNCTION apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_track BOOLEAN;
  v_rows  INT;
BEGIN
  IF NEW.type IN ('purchase', 'return') THEN
    UPDATE inventory_items SET qty_on_hand = qty_on_hand + NEW.quantity WHERE id = NEW.inventory_item_id;
  ELSIF NEW.type IN ('sale', 'damage') THEN
    SELECT track_inventory INTO v_track FROM inventory_items WHERE id = NEW.inventory_item_id;

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
