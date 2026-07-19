-- inventory_items: product must belong to the same party
CREATE OR REPLACE FUNCTION check_inventory_party()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM products WHERE id = NEW.product_id AND party_id = NEW.party_id
  ) THEN
    RAISE EXCEPTION 'inventory_items: product_id % does not belong to party %', NEW.product_id, NEW.party_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_party_check ON inventory_items;
CREATE TRIGGER trg_inventory_party_check
  BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION check_inventory_party();

-- stock_movements: inventory_item must belong to same party
CREATE OR REPLACE FUNCTION check_stock_movement_party()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM inventory_items WHERE id = NEW.inventory_item_id AND party_id = NEW.party_id
  ) THEN
    RAISE EXCEPTION 'stock_movements: inventory_item_id % does not belong to party %', NEW.inventory_item_id, NEW.party_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_movement_party_check ON stock_movements;
CREATE TRIGGER trg_stock_movement_party_check
  BEFORE INSERT OR UPDATE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION check_stock_movement_party();

-- order_items: product must belong to the same party as the order
CREATE OR REPLACE FUNCTION check_order_item_party()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_order_party UUID;
BEGIN
  SELECT party_id INTO v_order_party FROM orders WHERE id = NEW.order_id;
  IF NOT EXISTS (
    SELECT 1 FROM products WHERE id = NEW.product_id AND party_id = v_order_party
  ) THEN
    RAISE EXCEPTION 'order_items: product_id % does not belong to the order party %', NEW.product_id, v_order_party;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_item_party_check ON order_items;
CREATE TRIGGER trg_order_item_party_check
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION check_order_item_party();

-- return_requests: party_id must match the order's party_id
CREATE OR REPLACE FUNCTION check_return_party()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_order_party UUID;
BEGIN
  SELECT party_id INTO v_order_party FROM orders WHERE id = NEW.order_id;
  IF v_order_party <> NEW.party_id THEN
    RAISE EXCEPTION 'return_requests: party_id % does not match order party %', NEW.party_id, v_order_party;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_return_party_check ON return_requests;
CREATE TRIGGER trg_return_party_check
  BEFORE INSERT OR UPDATE ON return_requests
  FOR EACH ROW EXECUTE FUNCTION check_return_party();

-- loyalty_transactions: customer must belong to same party
CREATE OR REPLACE FUNCTION check_loyalty_party()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM customers WHERE id = NEW.customer_id AND party_id = NEW.party_id
  ) THEN
    RAISE EXCEPTION 'loyalty_transactions: customer_id % does not belong to party %', NEW.customer_id, NEW.party_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loyalty_party_check ON loyalty_transactions;
CREATE TRIGGER trg_loyalty_party_check
  BEFORE INSERT OR UPDATE ON loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION check_loyalty_party();

-- price_list_items: product must belong to the same party as the price list
CREATE OR REPLACE FUNCTION check_price_list_item_party()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_pl_party UUID;
BEGIN
  SELECT party_id INTO v_pl_party FROM price_lists WHERE id = NEW.price_list_id;
  IF NOT EXISTS (
    SELECT 1 FROM products WHERE id = NEW.product_id AND party_id = v_pl_party
  ) THEN
    RAISE EXCEPTION 'price_list_items: product_id % does not belong to price_list party %', NEW.product_id, v_pl_party;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_price_list_item_party_check ON price_list_items;
CREATE TRIGGER trg_price_list_item_party_check
  BEFORE INSERT OR UPDATE ON price_list_items
  FOR EACH ROW EXECUTE FUNCTION check_price_list_item_party();
