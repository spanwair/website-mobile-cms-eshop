-- Throwaway PRODUCTION test product for the real PPL on-address delivery E2E.
-- Org: "Kytka z Beskyd" (party a0000000-0000-0000-0000-000000000003).
-- Price is 1 Kč on purpose — the PPL shipping fee carries the real charge (and clears the
-- Stripe minimum). Weight 1 kg feeds the PPL label; change it if the real parcel differs.
--
-- Idempotent: safe to re-run. Remove it afterwards with supabase/seed/test_ppl_product_remove.sql.
-- Apply (via the OCI session pooler over the SSH tunnel):
--   PGPASSWORD=... psql -h 127.0.0.1 -p 5433 -U 'supabase_admin.mamtodoma' -d postgres \
--     -f supabase/seed/test_ppl_product.sql

\set party 'a0000000-0000-0000-0000-000000000003'

SELECT NOT EXISTS (
  SELECT 1 FROM products WHERE party_id = :'party' AND slug = 'test-ppl-doprava-1kc'
) AS should_seed \gset
\if :should_seed

\echo 'Seeding TEST PPL product for "Kytka z Beskyd"...'

-- Product (in-stock → condition_id NULL, no "Na zakázku" label) ------------------------------
INSERT INTO products (party_id, condition_id, title, slug, sku, description, price, tax_rate, weight, status, is_featured, is_visible)
VALUES (:'party', NULL,
  'Test PPL doprava', 'test-ppl-doprava-1kc', 'KZB-TEST-PPL',
  'Testovací produkt pro ověření doručení PPL na adresu. Cena 1 Kč, poštovné hradí doručení.',
  1, 0, 1, 'active', false, true);

-- Category (attach to an existing one so it is listable too) ---------------------------------
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
JOIN categories c ON c.party_id = :'party' AND c.slug = 'darkove-sety'
WHERE p.party_id = :'party' AND p.slug = 'test-ppl-doprava-1kc';

-- Image (reuse an existing primary photo already in prod Storage) ----------------------------
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id,
  'https://api-oci.mamtodoma.cz/storage/v1/object/public/product-images/a0000000-0000-0000-0000-000000000003/mini-susena-dekorace-stul.jpg',
  p.title, true, 0
FROM products p
WHERE p.party_id = :'party' AND p.slug = 'test-ppl-doprava-1kc';

-- Single in-stock variant at 1 Kč ------------------------------------------------------------
INSERT INTO product_variants (product_id, name, sku, price, attributes, condition_id, is_active)
SELECT p.id, 'Standard', p.sku || '-STD', 1, '{}'::jsonb, NULL, true
FROM products p
WHERE p.party_id = :'party' AND p.slug = 'test-ppl-doprava-1kc';

-- Inventory: real stock on the variant row the trigger auto-created (qty 0) ------------------
INSERT INTO inventory_items (party_id, product_id, variant_id, warehouse_id, qty_on_hand, low_stock_threshold, track_inventory)
SELECT :'party', pv.product_id, pv.id, w.id, 10, 2, true
FROM product_variants pv
JOIN products p ON p.id = pv.product_id AND p.party_id = :'party' AND p.slug = 'test-ppl-doprava-1kc'
JOIN warehouses w ON w.party_id = :'party' AND w.code = 'main'
ON CONFLICT (product_id, variant_id, warehouse_id) DO UPDATE
  SET qty_on_hand = EXCLUDED.qty_on_hand, low_stock_threshold = EXCLUDED.low_stock_threshold, track_inventory = EXCLUDED.track_inventory;

\echo 'Test PPL product seeded: /eshop-kytka-z-beskyd/test-ppl-doprava-1kc (1 Kč, qty 10).'
\else
\echo 'Test PPL product already exists — skipping.'
\endif
