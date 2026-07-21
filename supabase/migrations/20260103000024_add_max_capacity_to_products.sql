-- Add max_capacity column to products table
-- 0 = Out of stock (default), positive integer = maximum capacity
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_capacity INTEGER NOT NULL DEFAULT 0 CHECK (max_capacity >= 0);

-- Add index for filtering/sorting by capacity
CREATE INDEX IF NOT EXISTS idx_products_max_capacity ON products(party_id, max_capacity);

COMMENT ON COLUMN products.max_capacity IS 'Maximum capacity for the product. 0 = Out of stock.';