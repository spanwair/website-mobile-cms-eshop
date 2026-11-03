-- Removes the throwaway PPL test product (supabase/seed/test_ppl_product.sql).
-- Idempotent. Does NOT touch any order already placed against it — only the catalog rows.
-- Apply (via the OCI session pooler over the SSH tunnel):
--   PGPASSWORD=... psql -h 127.0.0.1 -p 5433 -U 'supabase_admin.mamtodoma' -d postgres \
--     -f supabase/seed/test_ppl_product_remove.sql

\set party 'a0000000-0000-0000-0000-000000000003'

DELETE FROM inventory_items ii USING products p
  WHERE ii.product_id = p.id AND p.party_id = :'party' AND p.slug = 'test-ppl-doprava-1kc';
DELETE FROM product_images pi USING products p
  WHERE pi.product_id = p.id AND p.party_id = :'party' AND p.slug = 'test-ppl-doprava-1kc';
DELETE FROM product_categories pc USING products p
  WHERE pc.product_id = p.id AND p.party_id = :'party' AND p.slug = 'test-ppl-doprava-1kc';
DELETE FROM product_variants pv USING products p
  WHERE pv.product_id = p.id AND p.party_id = :'party' AND p.slug = 'test-ppl-doprava-1kc';
DELETE FROM products WHERE party_id = :'party' AND slug = 'test-ppl-doprava-1kc';

\echo 'Test PPL product removed (orders, if any, are preserved).'
