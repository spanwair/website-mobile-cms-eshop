-- Add max_threshold column to inventory_items table
-- This is optional (NULL = no max threshold set)
-- Validation: min_threshold <= max_threshold when both are set, and both must be >= 0 when set

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS max_threshold INT NULL;

-- Add constraint: when both min and max are set, min <= max
ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_threshold_check
  CHECK (
    (low_stock_threshold IS NULL OR low_stock_threshold >= 0)
    AND (max_threshold IS NULL OR max_threshold >= 0)
    AND (low_stock_threshold IS NULL OR max_threshold IS NULL OR low_stock_threshold <= max_threshold)
  );

-- Add generated column for overstock detection (when qty_on_hand >= max_threshold)
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS is_overstock BOOLEAN
    GENERATED ALWAYS AS (
      max_threshold IS NOT NULL AND qty_on_hand >= max_threshold
    ) STORED;

-- Index for filtering overstock items
CREATE INDEX IF NOT EXISTS idx_inventory_items_overstock
  ON inventory_items (party_id, is_overstock)
  WHERE is_overstock = TRUE;