-- Org "Kytka z Beskyd" — product catalog (run after kytka_store_org.sql).
-- Product names/descriptions are original; sizes and indicative pricing tiers mirror the
-- public price guide (Malý 15-25cm, Střední 25-35cm, Větší 36-46cm, Nad 55cm). Images are
-- the real product photos from the source site, uploaded to the `product-images` Supabase
-- Storage bucket by scripts/upload-kytka-media.sh — run that script BEFORE this file.
--
-- Idempotent: safe to re-run. Apply with:
--   psql "$DATABASE_URL" -f supabase/seed/kytka_store_catalog.sql

\set image_base 'http://127.0.0.1:54321/storage/v1/object/public/product-images/a0000000-0000-0000-0000-000000000003'

SELECT NOT EXISTS (
  SELECT 1 FROM products WHERE party_id = 'a0000000-0000-0000-0000-000000000003' AND slug = 'podzimni-venec-bukove-listi'
) AS should_seed \gset
\if :should_seed

\echo 'Seeding catalog for "Kytka z Beskyd"...'

INSERT INTO warehouses (party_id, name, code, is_default) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'Dílna Hrádek', 'main', true);

-- Products ----------------------------------------------------------------------------------
INSERT INTO products (party_id, condition_id, title, slug, sku, description, price, tax_rate, status, is_featured, is_visible)
SELECT 'a0000000-0000-0000-0000-000000000003', pc.id, v.title, v.slug, v.sku, v.description, v.price, 0, 'active', v.is_featured, true
FROM (VALUES
  ('Podzimní věnec z bukového listí', 'podzimni-venec-bukove-listi', 'KZB-PODZ-BUK',
   'Věnec ze sušeného bukového listí a přírodních plodů, doplněný drobnými sušenými květy. Hřejivá podzimní dekorace na dveře.', 490, true, 'made_to_order'),
  ('Věnec se slaměnkami a slunečnicemi', 'venec-slamenka-slunecnice', 'KZB-PODZ-SLAM',
   'Slunečný podzimní věnec ze slaměnek a drobných sušených slunečnic na přírodní bázi.', 450, false, 'made_to_order'),
  ('Věnec z eukalyptu a sušených květů', 'venec-eukalyptus-susene-kvety', 'KZB-CELO-EUKA',
   'Celoroční věnec z voňavého sušeného eukalyptu doplněný drobnými barevnými květy — vydrží dlouhé měsíce.', 690, true, 'made_to_order'),
  ('Celoroční věnec s levandulí', 'celorocni-venec-levandule', 'KZB-CELO-LEV',
   'Jemný věnec ze sušené levandule, ideální i jako vonná dekorace do interiéru.', 420, false, 'in_stock'),
  ('Svatební kytice ze sušených růží', 'svatebni-kytice-susene-ruze', 'KZB-SVAT-RUZE',
   'Romantická svatební kytice ze sušených růží a doplňkové zeleně, vázaná ručně na míru.', 890, true, 'made_to_order'),
  ('Svatební kytice v boho stylu', 'svatebni-kytice-boho', 'KZB-SVAT-BOHO',
   'Volně vázaná kytice s trávami a sušenými květy pro přírodní boho svatbu.', 790, false, 'made_to_order'),
  ('Set korzáž a knoflíková kytička', 'korsaz-a-butonnierka-set', 'KZB-SVAT-SET',
   'Doplňkový set korzáže pro maminku a knoflíkové kytičky pro ženicha, laděný podle svatební kytice.', 290, false, 'made_to_order'),
  ('Smuteční věnec s bílými chryzantémami', 'smutecni-venec-bile-chryzantemy', 'KZB-SMUT-CHRYZ',
   'Důstojný smuteční věnec s bílými sušenými chryzantémami a tmavou zelení. Možnost expresního dodání.', 780, true, 'made_to_order'),
  ('Smuteční kytice fialová', 'smutecni-kytice-fialova', 'KZB-SMUT-FIAL',
   'Smuteční kytice v tlumených fialových tónech ze sušených květin.', 650, false, 'made_to_order'),
  ('Sušená kytice do vázy', 'susena-kytice-do-vazy', 'KZB-DEKO-VAZA',
   'Kytice sušených květin do vázy — bez zalévání vydrží krásná dlouhé měsíce.', 350, false, 'in_stock'),
  ('Mini sušená dekorace na stůl', 'mini-susena-dekorace-stul', 'KZB-DEKO-MINI',
   'Drobná stolní dekorace ze sušených květin, ideální na jídelní stůl nebo poličku.', 220, false, 'in_stock'),
  ('Dárkový mini věneček', 'darkovy-set-mini-venecek', 'KZB-DAR-MINI',
   'Malý dekorativní věneček jako originální dárek — lze doplnit přáníčkem na míru.', 260, false, 'made_to_order')
) AS v(title, slug, sku, description, price, is_featured, condition_code)
JOIN product_conditions pc ON pc.party_id = 'a0000000-0000-0000-0000-000000000003' AND pc.code = v.condition_code;

-- Category assignment -------------------------------------------------------------------------
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p
JOIN (VALUES
  ('podzimni-venec-bukove-listi', 'podzimni-vence'), ('venec-slamenka-slunecnice', 'podzimni-vence'),
  ('venec-eukalyptus-susene-kvety', 'celorocni-vence'), ('celorocni-venec-levandule', 'celorocni-vence'),
  ('svatebni-kytice-susene-ruze', 'svatebni-kytice'), ('svatebni-kytice-boho', 'svatebni-kytice'),
  ('korsaz-a-butonnierka-set', 'svatebni-kytice'),
  ('smutecni-venec-bile-chryzantemy', 'smutecni-vence'), ('smutecni-kytice-fialova', 'smutecni-vence'),
  ('susena-kytice-do-vazy', 'susene-kvetiny'), ('mini-susena-dekorace-stul', 'susene-kvetiny'),
  ('darkovy-set-mini-venecek', 'darkove-sety')
) AS v(product_slug, category_slug) ON v.product_slug = p.slug
JOIN categories c ON c.party_id = 'a0000000-0000-0000-0000-000000000003' AND c.slug = v.category_slug
WHERE p.party_id = 'a0000000-0000-0000-0000-000000000003';

-- Images (one primary real photo per product, uploaded by scripts/upload-kytka-media.sh) -------
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, :'image_base' || '/' || v.filename, p.title, true, 0
FROM products p
JOIN (VALUES
  ('podzimni-venec-bukove-listi', 'podzimni-venec-bukove-listi.jpeg'),
  ('venec-slamenka-slunecnice', 'venec-slamenka-slunecnice.jpg'),
  ('venec-eukalyptus-susene-kvety', 'venec-eukalyptus-susene-kvety.jpg'),
  ('celorocni-venec-levandule', 'celorocni-venec-levandule.jpeg'),
  ('svatebni-kytice-susene-ruze', 'svatebni-kytice-susene-ruze.jpeg'),
  ('svatebni-kytice-boho', 'svatebni-kytice-boho.jpeg'),
  ('korsaz-a-butonnierka-set', 'korsaz-a-butonnierka-set.jpg'),
  ('smutecni-venec-bile-chryzantemy', 'smutecni-venec-bile-chryzantemy.jpg'),
  ('smutecni-kytice-fialova', 'smutecni-kytice-fialova.jpeg'),
  ('susena-kytice-do-vazy', 'susena-kytice-do-vazy.jpeg'),
  ('mini-susena-dekorace-stul', 'mini-susena-dekorace-stul.jpg'),
  ('darkovy-set-mini-venecek', 'darkovy-set-mini-venecek.jpeg')
) AS v(product_slug, filename) ON v.product_slug = p.slug
WHERE p.party_id = 'a0000000-0000-0000-0000-000000000003';

-- Variants: size tiers, priced per the public size guide -------------------------------------
INSERT INTO product_variants (product_id, name, sku, price, attributes, condition_id, is_active)
SELECT p.id, v.name, p.sku || '-' || v.sku_suffix, v.price,
       jsonb_build_object('velikost', v.size_label), pc.id, true
FROM (VALUES
  ('podzimni-venec-bukove-listi', 'Malý (15–25 cm)', 'S', 'Malý', 'made_to_order', 290),
  ('podzimni-venec-bukove-listi', 'Střední (25–35 cm)', 'M', 'Střední', 'made_to_order', 490),
  ('podzimni-venec-bukove-listi', 'Větší (36–46 cm)', 'L', 'Větší', 'made_to_order', 690),
  ('venec-slamenka-slunecnice', 'Malý (15–25 cm)', 'S', 'Malý', 'made_to_order', 260),
  ('venec-slamenka-slunecnice', 'Střední (25–35 cm)', 'M', 'Střední', 'made_to_order', 450),
  ('venec-eukalyptus-susene-kvety', 'Střední (25–35 cm)', 'M', 'Střední', 'made_to_order', 490),
  ('venec-eukalyptus-susene-kvety', 'Větší (36–46 cm)', 'L', 'Větší', 'made_to_order', 690),
  ('venec-eukalyptus-susene-kvety', 'Nad 55 cm', 'XL', 'Nad 55 cm', 'made_to_order', 1150),
  ('celorocni-venec-levandule', 'Malý (15–25 cm)', 'S', 'Malý', 'in_stock', 260),
  ('celorocni-venec-levandule', 'Střední (25–35 cm)', 'M', 'Střední', 'in_stock', 420),
  ('svatebni-kytice-susene-ruze', 'Střední', 'M', 'Střední', 'made_to_order', 890),
  ('svatebni-kytice-susene-ruze', 'Větší', 'L', 'Větší', 'made_to_order', 1190),
  ('svatebni-kytice-boho', 'Střední', 'M', 'Střední', 'made_to_order', 790),
  ('korsaz-a-butonnierka-set', 'Standard set (2 ks)', 'STD', 'Standard', 'made_to_order', 290),
  ('smutecni-venec-bile-chryzantemy', 'Větší (36–46 cm)', 'L', 'Větší', 'made_to_order', 780),
  ('smutecni-venec-bile-chryzantemy', 'Nad 55 cm', 'XL', 'Nad 55 cm', 'made_to_order', 1290),
  ('smutecni-kytice-fialova', 'Střední', 'M', 'Střední', 'made_to_order', 650),
  ('susena-kytice-do-vazy', 'Malý', 'S', 'Malý', 'in_stock', 350),
  ('mini-susena-dekorace-stul', 'Mini', 'XS', 'Mini', 'in_stock', 220),
  ('darkovy-set-mini-venecek', 'Mini', 'XS', 'Mini', 'made_to_order', 260)
) AS v(product_slug, name, sku_suffix, size_label, condition_code, price)
JOIN products p ON p.party_id = 'a0000000-0000-0000-0000-000000000003' AND p.slug = v.product_slug
JOIN product_conditions pc ON pc.party_id = 'a0000000-0000-0000-0000-000000000003' AND pc.code = v.condition_code;

-- Inventory: only 'in_stock' variants carry a real countable quantity. 'made_to_order'
-- variants get track_inventory=false — a craft business can always take the order, so a
-- random/depleting quantity would eventually (and wrongly) show them as sold out.
INSERT INTO inventory_items (party_id, product_id, variant_id, warehouse_id, qty_on_hand, low_stock_threshold, track_inventory)
SELECT 'a0000000-0000-0000-0000-000000000003', pv.product_id, pv.id, w.id,
       CASE WHEN pc.code = 'in_stock' THEN 2 + (('x' || substr(md5(pv.id::text), 1, 6))::bit(24)::int % 8) ELSE 0 END,
       2, (pc.code = 'in_stock')
FROM product_variants pv
JOIN products p ON p.id = pv.product_id AND p.party_id = 'a0000000-0000-0000-0000-000000000003'
JOIN product_conditions pc ON pc.id = pv.condition_id
CROSS JOIN warehouses w
WHERE w.party_id = 'a0000000-0000-0000-0000-000000000003' AND w.code = 'main';

-- The create_default_inventory_item() trigger already added a product-level (variant_id IS
-- NULL) rollup row at track_inventory=true/qty=0 when each product was INSERTed above — turn
-- that off for products with zero 'in_stock' variants, so a purely made-to-order product is
-- never stock-gated by that leftover default row either.
UPDATE inventory_items ii SET track_inventory = false
FROM products p
WHERE ii.product_id = p.id AND ii.variant_id IS NULL AND p.party_id = 'a0000000-0000-0000-0000-000000000003'
  AND NOT EXISTS (
    SELECT 1 FROM product_variants pv JOIN product_conditions pc ON pc.id = pv.condition_id
    WHERE pv.product_id = p.id AND pc.code = 'in_stock'
  );

\echo 'Catalog seeded: 12 products, size variants, images, inventory.'
\else
\echo 'Catalog already exists — skipping.'
\endif
