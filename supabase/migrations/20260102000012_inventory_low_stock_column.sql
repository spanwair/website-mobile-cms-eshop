-- Add generated column so we can filter low-stock items via PostgREST
-- (PostgREST REST filters can't compare two columns directly)
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS is_low_stock BOOLEAN
    GENERATED ALWAYS AS (qty_on_hand <= low_stock_threshold) STORED;

CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock
  ON inventory_items (party_id, is_low_stock)
  WHERE is_low_stock = TRUE;
