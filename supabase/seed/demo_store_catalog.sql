-- Demo org "Repasado" — product catalog (run after demo_store_org.sql).
-- All descriptions are original; images are locally generated placeholder SVGs
-- under website/public/demo-media/ (see scripts/gen-demo-media.mjs), not scraped photos.
--
-- Idempotent: safe to re-run. Apply with:
--   psql "$DATABASE_URL" -f supabase/seed/demo_store_catalog.sql

SELECT NOT EXISTS (
  SELECT 1 FROM products WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND slug = 'iphone-13'
) AS should_seed \gset
\if :should_seed

\echo 'Seeding demo catalog for "Repasado"...'

INSERT INTO warehouses (party_id, name, code, is_default) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Hlavní sklad Praha', 'main', true);

INSERT INTO brands (party_id, name, slug) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Apple', 'apple');

-- Products ----------------------------------------------------------------------------------
INSERT INTO products (party_id, brand_id, title, slug, sku, description, price, tax_rate, status, is_featured, is_visible)
SELECT 'a0000000-0000-0000-0000-000000000001', b.id, v.title, v.slug, v.sku, v.description, v.price, 21, 'active', v.is_featured, true
FROM (VALUES
  ('iPhone 13', 'iphone-13', 'RPS-IP13', 'Repasovaný iPhone 13 s Face ID, čipem A15 Bionic a vylepšeným fotoaparátem se stabilizací. Ideální volba pro každodenní použití za příznivou cenu.', 9490, false),
  ('iPhone 14', 'iphone-14', 'RPS-IP14', 'iPhone 14 nabízí spolehlivý výkon, dobrou výdrž baterie a vylepšený noční režim fotoaparátu. Repasovaný kus prošel kompletní technickou kontrolou.', 13990, false),
  ('iPhone 15', 'iphone-15', 'RPS-IP15', 'iPhone 15 s USB-C konektorem, čipem A16 Bionic a dynamickým ostrůvkem. Repasovaný kus s otestovanou baterií a 12měsíční zárukou.', 17990, true),
  ('iPhone 15 Pro', 'iphone-15-pro', 'RPS-IP15P', 'iPhone 15 Pro s titanovým tělem, čipem A17 Pro a profesionálním fotoaparátem. Nejvýkonnější model v naší nabídce.', 23990, true),
  ('iPad 10. generace', 'ipad-10-gen', 'RPS-IPAD10', 'iPad 10. generace s velkým displejem a USB-C konektorem — skvělý pomocník na práci i zábavu.', 8990, false),
  ('iPad Air M1', 'ipad-air-m1', 'RPS-IPADAIR-M1', 'iPad Air s čipem M1 nabízí výkon srovnatelný s notebookem v tenkém tabletovém těle.', 11490, false),
  ('iPad Pro 11" M2', 'ipad-pro-11-m2', 'RPS-IPADPRO11-M2', 'iPad Pro 11" s čipem M2 a ProMotion displejem pro profesionální práci i kreativní projekty.', 19990, true),
  ('MacBook Air M1', 'macbook-air-m1', 'RPS-MBA-M1', 'MacBook Air s čipem M1 nabízí tichý bezventilátorový chod a dlouhou výdrž baterie.', 15490, false),
  ('MacBook Air M2', 'macbook-air-m2', 'RPS-MBA-M2', 'MacBook Air M2 v novém tenčím designu s Liquid Retina displejem a vynikajícím výkonem na baterii.', 21990, true),
  ('MacBook Pro 14" M2 Pro', 'macbook-pro-14-m2pro', 'RPS-MBP14-M2P', 'MacBook Pro 14" s čipem M2 Pro pro náročné pracovní úlohy, střih videa a vývoj software.', 34990, false),
  ('Apple Watch SE', 'apple-watch-se', 'RPS-AWSE', 'Apple Watch SE sleduje aktivitu, tep i spánek za dostupnou cenu.', 4490, false),
  ('Apple Watch Series 8', 'apple-watch-series-8', 'RPS-AWS8', 'Apple Watch Series 8 s pokročilými zdravotními funkcemi a vždy zapnutým displejem.', 7990, true),
  ('AirPods Pro 2. generace', 'airpods-pro-2', 'RPS-APP2', 'AirPods Pro 2. generace s aktivním potlačením hluku a prostorovým zvukem.', 3990, true),
  ('AirPods 3. generace', 'airpods-3', 'RPS-AP3', 'AirPods 3. generace s prostorovým zvukem a odolností proti potu a vodě.', 2490, false),
  ('Silikonový kryt na iPhone 15', 'kryt-iphone-15-silikon', 'RPS-CASE-IP15', 'Měkký silikonový kryt s mikrovlákennou vnitřní vrstvou, chrání telefon před poškrábáním a pády.', 390, false),
  ('Kryt na iPad Pro 11"', 'kryt-ipad-pro-11', 'RPS-CASE-IPADPRO11', 'Odolné pouzdro se stojánkem pro iPad Pro 11", chrání zadní stranu i displej.', 590, false),
  ('Ochranné sklo na iPhone 15', 'sklo-iphone-15', 'RPS-GLASS-IP15', 'Tvrzené ochranné sklo s tvrdostí 9H, prakticky neviditelné na displeji.', 290, false),
  ('Bezdrátová nabíječka MagSafe 15W', 'nabijecka-magsafe', 'RPS-CHARGER-MAGSAFE', 'Bezdrátová nabíječka s magnetickým uchycením a výkonem až 15 W.', 690, false)
) AS v(title, slug, sku, description, price, is_featured)
CROSS JOIN brands b WHERE b.party_id = 'a0000000-0000-0000-0000-000000000001' AND b.slug = 'apple';

-- Category assignment -------------------------------------------------------------------------
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p
JOIN (VALUES
  ('iphone-13', 'iphone'), ('iphone-14', 'iphone'), ('iphone-15', 'iphone'), ('iphone-15-pro', 'iphone'),
  ('ipad-10-gen', 'ipad'), ('ipad-air-m1', 'ipad'), ('ipad-pro-11-m2', 'ipad'),
  ('macbook-air-m1', 'mac'), ('macbook-air-m2', 'mac'), ('macbook-pro-14-m2pro', 'mac'),
  ('apple-watch-se', 'watch'), ('apple-watch-series-8', 'watch'),
  ('airpods-pro-2', 'audio'), ('airpods-3', 'audio'),
  ('kryt-iphone-15-silikon', 'kryty-a-pouzdra'), ('kryt-ipad-pro-11', 'kryty-a-pouzdra'),
  ('sklo-iphone-15', 'ochranna-skla'), ('nabijecka-magsafe', 'prislusenstvi')
) AS v(product_slug, category_slug) ON v.product_slug = p.slug
JOIN categories c ON c.party_id = 'a0000000-0000-0000-0000-000000000001' AND c.slug = v.category_slug
WHERE p.party_id = 'a0000000-0000-0000-0000-000000000001';

-- Images (one primary placeholder per product) ------------------------------------------------
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, '/demo-media/' || p.slug || '.svg', p.title, true, 0
FROM products p WHERE p.party_id = 'a0000000-0000-0000-0000-000000000001';

-- Variants (storage/color combos with a condition grade) ---------------------------------------
INSERT INTO product_variants (product_id, name, sku, price, attributes, condition_id, is_active)
SELECT p.id, v.name, p.sku || '-' || v.sku_suffix, v.price,
       jsonb_strip_nulls(jsonb_build_object('storage', v.storage, 'color', v.color)),
       pc.id, true
FROM (VALUES
  ('iphone-13', '128GB Půlnoc', '128-MID-A', '128 GB', 'Půlnoc', 'a', 10990),
  ('iphone-13', '128GB Půlnoc', '128-MID-B', '128 GB', 'Půlnoc', 'b', 9490),
  ('iphone-13', '256GB Hvězdně bílá', '256-WHT-LN', '256 GB', 'Hvězdně bílá', 'like_new', 12990),
  ('iphone-14', '128GB Půlnoc', '128-MID-A', '128 GB', 'Půlnoc', 'a', 13990),
  ('iphone-14', '256GB Modrá', '256-BLU-LN', '256 GB', 'Modrá', 'like_new', 16990),
  ('iphone-15', '128GB Černá', '128-BLK-A', '128 GB', 'Černá', 'a', 17990),
  ('iphone-15', '256GB Růžová', '256-PNK-NEW', '256 GB', 'Růžová', 'new', 21990),
  ('iphone-15-pro', '128GB Titanová přírodní', '128-NATTI-A', '128 GB', 'Titanová přírodní', 'a', 23990),
  ('iphone-15-pro', '256GB Titanová modrá', '256-BLUTI-LN', '256 GB', 'Titanová modrá', 'like_new', 27990),
  ('ipad-10-gen', '64GB Modrá', '64-BLU-A', '64 GB', 'Modrá', 'a', 8990),
  ('ipad-10-gen', '256GB Stříbrná', '256-SLV-LN', '256 GB', 'Stříbrná', 'like_new', 11990),
  ('ipad-air-m1', '64GB Vesmírně šedá', '64-GRY-A', '64 GB', 'Vesmírně šedá', 'a', 12990),
  ('ipad-air-m1', '256GB Modrá', '256-BLU-B', '256 GB', 'Modrá', 'b', 11490),
  ('ipad-pro-11-m2', '128GB Stříbrná', '128-SLV-A', '128 GB', 'Stříbrná', 'a', 19990),
  ('ipad-pro-11-m2', '256GB Vesmírně šedá', '256-GRY-LN', '256 GB', 'Vesmírně šedá', 'like_new', 23990),
  ('macbook-air-m1', '256GB Zlatá', '256-GLD-A', '256 GB', 'Zlatá', 'a', 16990),
  ('macbook-air-m1', '512GB Stříbrná', '512-SLV-B', '512 GB', 'Stříbrná', 'b', 15490),
  ('macbook-air-m2', '256GB Půlnoc', '256-MID-A', '256 GB', 'Půlnoc', 'a', 21990),
  ('macbook-air-m2', '512GB Hvězdně bílá', '512-WHT-LN', '512 GB', 'Hvězdně bílá', 'like_new', 25990),
  ('macbook-pro-14-m2pro', '512GB Vesmírně šedá', '512-GRY-A', '512 GB', 'Vesmírně šedá', 'a', 34990),
  ('macbook-pro-14-m2pro', '1TB Stříbrná', '1TB-SLV-LN', '1 TB', 'Stříbrná', 'like_new', 39990),
  ('apple-watch-se', '40mm Půlnoc', '40-MID-A', '40 mm', 'Půlnoc', 'a', 4990),
  ('apple-watch-se', '44mm Hvězdně bílá', '44-WHT-B', '44 mm', 'Hvězdně bílá', 'b', 4490),
  ('apple-watch-series-8', '41mm Grafitová', '41-GRF-A', '41 mm', 'Grafitová', 'a', 7990),
  ('apple-watch-series-8', '45mm Stříbrná', '45-SLV-LN', '45 mm', 'Stříbrná', 'like_new', 9490),
  ('airpods-pro-2', 'Bílá', 'WHT-NEW', NULL, 'Bílá', 'new', 3990),
  ('airpods-3', 'Bílá', 'WHT-NEW', NULL, 'Bílá', 'new', 2490),
  ('kryt-iphone-15-silikon', 'Černá', 'BLK-NEW', NULL, 'Černá', 'new', 390),
  ('kryt-iphone-15-silikon', 'Modrá', 'BLU-NEW', NULL, 'Modrá', 'new', 390),
  ('kryt-ipad-pro-11', 'Černá', 'BLK-NEW', NULL, 'Černá', 'new', 590),
  ('sklo-iphone-15', 'Čiré', 'CLR-NEW', NULL, 'Čiré', 'new', 290),
  ('nabijecka-magsafe', 'Bílá', 'WHT-NEW', NULL, 'Bílá', 'new', 690)
) AS v(product_slug, name, sku_suffix, storage, color, condition_code, price)
JOIN products p ON p.party_id = 'a0000000-0000-0000-0000-000000000001' AND p.slug = v.product_slug
JOIN product_conditions pc ON pc.party_id = 'a0000000-0000-0000-0000-000000000001' AND pc.code = v.condition_code;

-- Inventory: stock every variant just created in the main warehouse -----------------------------
-- ON CONFLICT DO UPDATE, not a plain INSERT: a variant insert above already auto-creates its
-- own zero-qty row (ensure_variant_inventory_item trigger), so this just sets real stock on it.
INSERT INTO inventory_items (party_id, product_id, variant_id, warehouse_id, qty_on_hand, low_stock_threshold, track_inventory)
SELECT 'a0000000-0000-0000-0000-000000000001', pv.product_id, pv.id, w.id,
       5 + (('x' || substr(md5(pv.id::text), 1, 6))::bit(24)::int % 30), 5, true
FROM product_variants pv
JOIN products p ON p.id = pv.product_id AND p.party_id = 'a0000000-0000-0000-0000-000000000001'
CROSS JOIN warehouses w
WHERE w.party_id = 'a0000000-0000-0000-0000-000000000001' AND w.code = 'main'
ON CONFLICT (product_id, variant_id, warehouse_id) DO UPDATE
  SET qty_on_hand = EXCLUDED.qty_on_hand, low_stock_threshold = EXCLUDED.low_stock_threshold, track_inventory = EXCLUDED.track_inventory;

\echo 'Demo catalog seeded: 18 products, variants, images, inventory.'
\else
\echo 'Demo catalog already exists — skipping.'
\endif
