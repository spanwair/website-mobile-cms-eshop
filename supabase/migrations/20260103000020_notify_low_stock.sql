-- Notify party admins when a product's stock crosses below low_stock_threshold
-- or hits zero. Fires at most once per crossing (not on every decrement while low).
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_product_title   TEXT;
  v_notification_id UUID;
  v_title           TEXT;
  v_body            TEXT;
  v_is_out_of_stock BOOLEAN;
  v_is_newly_low    BOOLEAN;
BEGIN
  IF NEW.qty_on_hand >= OLD.qty_on_hand THEN
    RETURN NEW;
  END IF;

  v_is_out_of_stock := OLD.qty_on_hand > 0 AND NEW.qty_on_hand <= 0;
  v_is_newly_low    := NEW.qty_on_hand <= NEW.low_stock_threshold
                       AND OLD.qty_on_hand > NEW.low_stock_threshold
                       AND NOT v_is_out_of_stock;

  IF NOT v_is_out_of_stock AND NOT v_is_newly_low THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_product_title FROM products WHERE id = NEW.product_id;

  IF v_is_out_of_stock THEN
    v_title := 'Out of stock: ' || COALESCE(v_product_title, 'Unknown product');
    v_body  := 'This product has run out of stock and is no longer available for purchase.';
  ELSE
    v_title := 'Low stock: ' || COALESCE(v_product_title, 'Unknown product');
    v_body  := 'Only ' || NEW.qty_on_hand || ' unit(s) remaining in stock.';
  END IF;

  INSERT INTO notifications (party_id, type, title, body, metadata)
  VALUES (
    NEW.party_id,
    'low_inventory',
    v_title,
    v_body,
    jsonb_build_object(
      'product_id',      NEW.product_id,
      'qty_on_hand',     NEW.qty_on_hand,
      'is_out_of_stock', v_is_out_of_stock
    )
  )
  RETURNING id INTO v_notification_id;

  -- Fan out to global owners and all party members with system role >= 2
  INSERT INTO user_notifications (user_id, notification_id)
  SELECT DISTINCT p.id, v_notification_id
  FROM profiles p
  WHERE p.role = 8
  UNION
  SELECT DISTINCT upr.user_id, v_notification_id
  FROM user_party_roles upr
  JOIN profiles p ON p.id = upr.user_id
  WHERE upr.party_id = NEW.party_id
    AND p.role >= 2
  ON CONFLICT (user_id, notification_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_low_stock
  AFTER UPDATE OF qty_on_hand ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- Allow anonymous (public shop) users to read stock levels
CREATE POLICY "Anon read tracked inventory"
  ON inventory_items FOR SELECT
  TO anon
  USING (track_inventory = true);

GRANT SELECT ON inventory_items TO anon;
