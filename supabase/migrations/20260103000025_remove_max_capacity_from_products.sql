-- Remove max_capacity column from products table
-- Stock is now tracked in inventory_items table only

ALTER TABLE products DROP COLUMN IF EXISTS max_capacity;

-- Drop the index that was created for max_capacity
DROP INDEX IF EXISTS idx_products_max_capacity;