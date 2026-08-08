-- A product is a group of variants (memory: feedback_variant_group_model). Two gaps this
-- closes: (1) variants had no explicit order, so "the first variant" was just insertion
-- order and couldn't be changed from admin; (2) images were product-level only, so every
-- variant of a product shared the exact same gallery even when they're visually distinct.

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Backfill: existing variants get their current insertion order per product.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY created_at) - 1 AS rn
  FROM product_variants
)
UPDATE product_variants pv SET sort_order = ranked.rn
FROM ranked WHERE ranked.id = pv.id;

CREATE INDEX IF NOT EXISTS idx_product_variants_sort ON product_variants(product_id, sort_order);

-- variant_id IS NULL means "shared" — a product-level image every variant falls back to when
-- it has none of its own. Simple products (no variants) keep using shared images exactly as
-- before this column existed.
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS variant_id UUID
  REFERENCES product_variants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_product_images_variant ON product_images(variant_id);

-- Being in stock is derived from inventory, not a manually assignable label — drop the
-- 'in_stock' condition some parties (e.g. Kytka z Beskyd) seeded before this rule was set.
-- ON DELETE SET NULL already handles the FK; the UPDATE just makes the intent explicit and
-- keeps this migration correct even if that default ever changes.
UPDATE products SET condition_id = NULL
  WHERE condition_id IN (SELECT id FROM product_conditions WHERE code = 'in_stock');
UPDATE product_variants SET condition_id = NULL
  WHERE condition_id IN (SELECT id FROM product_conditions WHERE code = 'in_stock');
DELETE FROM product_conditions WHERE code = 'in_stock';
