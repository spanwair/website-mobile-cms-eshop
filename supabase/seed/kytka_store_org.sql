-- Org "Kytka z Beskyd" — a handmade-wreaths & dried-flowers storefront, styled after the
-- real kytkazbeskyd.cz (florist Natálie Ruszová, Hrádek u Frýdku-Místku, Beskydy region).
-- Brand name, tagline, and factual business details (phone, village, product lines,
-- indicative size-based pricing) mirror the public site; all longer marketing/CMS copy
-- below is freshly written, not copy-pasted. Product/logo photos are the real photos from
-- the source site, uploaded to Supabase Storage (product-images / store-media buckets) via
-- scripts/upload-kytka-media.sh — run that script (and update :image_base below if the
-- storage host differs, e.g. for a non-local environment) BEFORE applying this file, so the
-- image URLs referenced here already resolve. The org starts in 'own_company' seller_mode;
-- switch it to 'smalljobs_commission' via the party's Seller Mode card in
-- /admin/parties/[id] once the real owner accepts the commissionaire agreement (requires a
-- real authenticated user + bank details, so it is intentionally not seeded here).
--
-- Idempotent: safe to re-run. Apply with:
--   ./scripts/upload-kytka-media.sh <source-image-dir>   # once, to populate storage
--   psql "$DATABASE_URL" -f supabase/seed/kytka_store_org.sql
--   psql "$DATABASE_URL" -f supabase/seed/kytka_store_catalog.sql
--   psql "$DATABASE_URL" -f supabase/seed/kytka_store_legal.sql

\set image_base 'http://127.0.0.1:54321/storage/v1/object/public/product-images/a0000000-0000-0000-0000-000000000003'
\set media_base 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000003'

SELECT NOT EXISTS (SELECT 1 FROM parties WHERE slug = 'kytka-z-beskyd') AS should_seed \gset
\if :should_seed

\echo 'Seeding org "Kytka z Beskyd"...'

INSERT INTO parties (id, name, slug, company_name, vat_number, billing_email, status)
VALUES (
  'a0000000-0000-0000-0000-000000000003', 'Kytka z Beskyd', 'kytka-z-beskyd', NULL, NULL, NULL, 'active'
);

-- A trigger (create_default_store_config) already inserted a default row on the party INSERT
-- above — update it in place rather than inserting a second one.
UPDATE store_configs SET
  brand_name = 'Kytka z Beskyd',
  tagline = 'Krása, která nikdy neuvadne',
  logo_url = :'media_base' || '/logo.jpg',
  color_primary = '#7C4F93', color_secondary = '#C97B4A', color_background = '#FDFBF7', color_surface = '#F7F1E8',
  color_text_primary = '#2E2A26', color_text_secondary = '#7A6F63', color_border = '#E8DFD0',
  font_heading = 'Playfair Display', font_body = 'Lora', radius_scale = 'soft', product_card_variant = 'luxury',
  homepage_layout = '["hero","subhero","benefits","categories","featured_products","condition_explainer","blog_preview","newsletter"]',
  enable_reviews = true, enable_wishlists = true,
  contact_phone = '+420 605 157 739',
  business_hours = 'Objednávky telefonicky nebo přes formulář — domluvíme termín i mimo běžnou dobu.',
  currency_code = 'CZK',
  store_address = 'Hrádek, okres Frýdek-Místek, Beskydy',
  footer_theme = 'dark'
WHERE party_id = 'a0000000-0000-0000-0000-000000000003';

-- Subhero: short "about" teaser shown under the hero on the homepage.
UPDATE store_configs SET
  subhero_content = 'Každý věnec a kytice vzniká ručně z přírodních a sušených materiálů — ' ||
    'žádné dva kusy nejsou úplně stejné. Tvorbu najdete i s termínem dodání do druhého dne, ' ||
    'nebo si nechte vyrobit dekoraci přesně na míru.',
  subhero_format = 'markdown'
WHERE party_id = 'a0000000-0000-0000-0000-000000000003';

-- Fulfilment label repurposes the "condition" concept for a made-to-order handmade shop —
-- there is no refurbishment grading here, just a custom-order timing note. Being in stock is
-- never a manual label — it's derived entirely from inventory, so it has no row here.
INSERT INTO product_conditions (party_id, code, label, color_hex, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'made_to_order', 'Na zakázku',  '#C97B4A', 1);

-- Categories ------------------------------------------------------------------------------
INSERT INTO categories (party_id, name, slug, sort_order, show_in_nav) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'Podzimní věnce', 'podzimni-vence', 1, true),
  ('a0000000-0000-0000-0000-000000000003', 'Celoroční věnce', 'celorocni-vence', 2, true),
  ('a0000000-0000-0000-0000-000000000003', 'Svatební kytice a dekorace', 'svatebni-kytice', 3, true),
  ('a0000000-0000-0000-0000-000000000003', 'Smuteční věnce a kytice', 'smutecni-vence', 4, true),
  ('a0000000-0000-0000-0000-000000000003', 'Sušené květiny do vázy', 'susene-kvetiny', 5, true),
  ('a0000000-0000-0000-0000-000000000003', 'Dárkové sety', 'darkove-sety', 6, true);

UPDATE categories SET image_url = :'image_base' || '/' || v.image
FROM (VALUES
  ('podzimni-vence', 'podzimni-venec-bukove-listi.jpeg'),
  ('celorocni-vence', 'venec-eukalyptus-susene-kvety.jpg'),
  ('svatebni-kytice', 'svatebni-kytice-susene-ruze.jpeg'),
  ('smutecni-vence', 'smutecni-venec-bile-chryzantemy.jpg'),
  ('susene-kvetiny', 'susena-kytice-do-vazy.jpeg'),
  ('darkove-sety', 'darkovy-set-mini-venecek.jpeg')
) AS v(slug, image)
WHERE categories.party_id = 'a0000000-0000-0000-0000-000000000003' AND categories.slug = v.slug;

-- Also register the category images in store_media so they show up in the admin's
-- "choose from library" picker, not just as a bare image_url string.
INSERT INTO store_media (party_id, slug, media_type, url, alt)
SELECT c.party_id, c.slug, 'image', c.image_url, c.name
FROM categories c
WHERE c.party_id = 'a0000000-0000-0000-0000-000000000003' AND c.image_url IS NOT NULL
ON CONFLICT (party_id, slug) DO NOTHING;

-- Footer link columns ---------------------------------------------------------------------
INSERT INTO footer_links (party_id, column_key, label, url, sort_order)
SELECT 'a0000000-0000-0000-0000-000000000003', 'shop', v.label, '?category=' || v.slug, v.sort_order
FROM (VALUES
  ('Podzimní věnce', 'podzimni-vence', 1), ('Celoroční věnce', 'celorocni-vence', 2),
  ('Svatební kytice', 'svatebni-kytice', 3), ('Smuteční věnce', 'smutecni-vence', 4),
  ('Sušené květiny', 'susene-kvetiny', 5), ('Dárkové sety', 'darkove-sety', 6)
) AS v(label, slug, sort_order);

INSERT INTO footer_links (party_id, column_key, label, url, sort_order)
SELECT 'a0000000-0000-0000-0000-000000000003', 'information', v.label, v.url, v.sort_order
FROM (VALUES
  ('O mě', '/stranka/o-me', 1),
  ('Náš tým', '/stranka/nas-tym', 2),
  ('Jak probíhá výroba na zakázku', '/stranka/vyroba-na-zakazku', 3),
  ('Průvodce velikostmi věnců', '/stranka/velikosti-vencu', 4),
  ('Blog', '/blog', 5),
  ('Kontakt', '/stranka/kontakt', 6)
) AS v(label, url, sort_order);

INSERT INTO footer_links (party_id, column_key, label, url, sort_order)
SELECT 'a0000000-0000-0000-0000-000000000003', 'customer_service', v.label, v.url, v.sort_order
FROM (VALUES
  ('Časté dotazy', '/stranka/faq', 1),
  ('Kontakt', '/stranka/kontakt', 2)
) AS v(label, url, sort_order);

-- Hero slides -----------------------------------------------------------------------------
INSERT INTO hero_slides (party_id, headline, subheadline, image_url, cta_text, cta_link, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003',
   'Ručně vázané věnce a sušené květiny',
   'Každý kousek vzniká z přírodních materiálů s péčí o detail — pro váš domov i výjimečné chvíle.',
   :'image_base' || '/venec-eukalyptus-susene-kvety.jpg',
   'Prohlédnout tvorbu', '?category=celorocni-vence', 1),
  ('a0000000-0000-0000-0000-000000000003',
   'Svatba nebo poslední rozloučení? Vytvoříme dekoraci na míru',
   'Svatební kytice i smuteční věnce podle vašich představ — stačí zavolat a domluvit termín.',
   :'image_base' || '/svatebni-kytice-susene-ruze.jpeg',
   'Domluvit zakázku', '/stranka/kontakt', 2);

-- Benefits / trust badges -------------------------------------------------------------------
INSERT INTO benefit_items (party_id, icon, title, description, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', '🌿', 'Ruční práce', 'Každý věnec i kytice je vázaná ručně, kus po kuse.', 1),
  ('a0000000-0000-0000-0000-000000000003', '🍂', 'Přírodní materiály', 'Sušené květiny a sezónní rostliny z Beskyd.', 2),
  ('a0000000-0000-0000-0000-000000000003', '🚚', 'Dodání do druhého dne', 'Expresní varianta u vybraných produktů, běžně 7–14 dní.', 3),
  ('a0000000-0000-0000-0000-000000000003', '✂️', 'Výroba na zakázku', 'Barvy i velikost přizpůsobíme přesně vašemu přání.', 4),
  ('a0000000-0000-0000-0000-000000000003', '🎁', 'Originální dárek', 'Každý kus je jedinečný — žádné dva věnce nejsou stejné.', 5),
  ('a0000000-0000-0000-0000-000000000003', '📞', 'Osobní přístup', 'Domluva telefonicky, poradíme s výběrem i velikostí.', 6);

-- Content pages ---------------------------------------------------------------------------
INSERT INTO content_pages (party_id, slug, title, template, body, is_visible, sort_order) VALUES
(
  'a0000000-0000-0000-0000-000000000003', 'o-me', 'O mě', 'about',
  '## O mě' || E'\n\n' ||
  'Jmenuji se Natálie Ruszová a jsem z Hrádku — malebné vesničky v srdci Beskyd. Květiny mě ' ||
  'provázejí odmalička, ať už čerstvé nebo sušené, a jejich vázání do věnců a kytic je pro mě ' ||
  'víc než koníček — je to vášeň.' || E'\n\n' ||
  '## Můj příběh' || E'\n\n' ||
  'Tvorbu jsem začala z touhy přinést lidem kousek přírody domů. Každý věnec vychází z toho, ' ||
  'co Beskydy zrovna nabízejí — od podzimního listí po letní sušené květy — a v každém kuse je ' ||
  'kousek osobního přístupu.' || E'\n\n' ||
  '## Co děláme jinak' || E'\n\n' ||
  '**Ruční práce** — žádný díl není strojově vyráběný.' || E'\n\n' ||
  '**Přírodní materiály** — sušené květiny a sezónní dekorace, ne umělé náhražky.' || E'\n\n' ||
  '**Osobní přístup** — dekoraci vám ráda přizpůsobím na míru, stačí zavolat.',
  true, 1
),
(
  'a0000000-0000-0000-0000-000000000003', 'nas-tym', 'Náš tým', 'about',
  'Poznejte lidi, kteří stojí za každým ručně vázaným věncem a kyticí.',
  true, 2
),
(
  'a0000000-0000-0000-0000-000000000003', 'kontakt', 'Kontakt', 'contact',
  'Máte zájem o věnec, kytici nebo dekoraci na míru? Nejrychlejší je zavolat — ráda s vámi ' ||
  'proberu velikost, barvy i termín dodání.' || E'\n\n' ||
  '**Telefon:** [605 157 739](tel:+420605157739)' || E'\n\n' ||
  '**Sídlo tvorby:** Hrádek, okres Frýdek-Místek, Beskydy',
  true, 3
),
(
  'a0000000-0000-0000-0000-000000000003', 'faq', 'Časté dotazy', 'faq',
  'Odpovědi na nejčastější otázky ohledně objednávek, výroby na zakázku a dodání.',
  true, 4
),
(
  'a0000000-0000-0000-0000-000000000003', 'vyroba-na-zakazku', 'Jak probíhá výroba na zakázku', 'default',
  '## Jak probíhá výroba na zakázku' || E'\n\n' ||
  'Napište nebo zavolejte s představou — velikost, barevné ladění a účel (domov, svatba, ' ||
  'smuteční obřad). Domluvíme si termín a orientační cenu podle velikosti. Většina zakázek ' ||
  'trvá 7–14 dní, u vybraných věnců je možné i dodání do druhého dne.' || E'\n\n' ||
  'Protože každý kus je ruční práce ze skutečných sušených květin, může se konečný odstín ' ||
  'nebo skladba mírně lišit od fotografie v galerii — to je součástí originality přírodních ' ||
  'materiálů, ne chyba.',
  true, 5
),
(
  'a0000000-0000-0000-0000-000000000003', 'velikosti-vencu', 'Průvodce velikostmi věnců', 'default',
  '## Orientační ceny podle velikosti' || E'\n\n' ||
  '**Malý (15–25 cm)** — 190–320 Kč' || E'\n\n' ||
  '**Střední (25–35 cm)** — 380–680 Kč' || E'\n\n' ||
  '**Větší (36–46 cm)** — 580–880 Kč' || E'\n\n' ||
  '**Nad 55 cm** — od 1 100 Kč' || E'\n\n' ||
  'Přesná cena se odvíjí od zvolených materiálů a náročnosti vazby — u objednávky na míru ji ' ||
  'vždy potvrdíme předem.',
  true, 6
);

-- FAQ ---------------------------------------------------------------------------------------
INSERT INTO faq_items (party_id, question, answer, context, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'Jak dlouho trvá výroba věnce nebo kytice?',
   'Běžně 7–14 dní od domluvy. U vybraných věnců je možné i dodání do druhého dne — napište nebo zavolejte a ověříme termín.', 'general', 1),
  ('a0000000-0000-0000-0000-000000000003', 'Můžu si vybrat barvy a velikost?',
   'Ano, většina věnců a kytic se dá přizpůsobit na míru — barevné ladění, velikost i použité sušené květiny.', 'general', 2),
  ('a0000000-0000-0000-0000-000000000003', 'Vyrábíte i smuteční věnce?',
   'Ano, smuteční věnce a kytice vážu i s krátkým termínem — v takovém případě prosím rovnou zavolejte.', 'general', 3),
  ('a0000000-0000-0000-0000-000000000003', 'Jak se objednávka platí?',
   'Objednávku potvrdíme telefonicky nebo přes formulář, platba a doprava se domluví individuálně podle velikosti zakázky.', 'general', 4),
  ('a0000000-0000-0000-0000-000000000003', 'Vydrží sušené květiny dlouho?',
   'Ano, správně sušené květiny při běžné péči (mimo přímé slunce a vlhko) vydrží dlouhé měsíce až roky.', 'general', 5);

-- Team members --------------------------------------------------------------------------------
INSERT INTO team_members (party_id, name, position, bio, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'Natálie Ruszová', 'Zakladatelka a kytkářka',
   'Z Hrádku v Beskydech. Ručně váže věnce a kytice ze sušených i čerstvých květin — tvorba je pro ni vášeň, ne jen práce.', 1);

-- Blog posts ------------------------------------------------------------------------------------
INSERT INTO blog_posts (party_id, title, slug, excerpt, content, featured_image_url, author_name, status, published_at) VALUES
(
  'a0000000-0000-0000-0000-000000000003',
  'Jak vybrat velikost věnce na dveře',
  'jak-vybrat-velikost-vence-na-dvere',
  'Malý, střední, nebo raději výraznější kus? Pár tipů, jak zvolit velikost podle dveří i příležitosti.',
  '## Na co se dívat při výběru' || E'\n\n' ||
  'Menší věnce (15–25 cm) sluší prosklením a užším dveřím, střední velikost (25–35 cm) je ' ||
  'univerzální volba na běžné vchodové dveře. Pro výraznější vstup nebo svatební výzdobu se ' ||
  'hodí věnce nad 36 cm.' || E'\n\n' ||
  '## Tip na závěr' || E'\n\n' ||
  'Nejste si jistí? Napište rozměr dveří nebo pošlete fotku — poradím s výběrem podle prostoru.',
  :'image_base' || '/podzimni-venec-bukove-listi.jpeg',
  'Natálie Ruszová', 'published', NOW() - INTERVAL '10 days'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Péče o sušené květiny — ať vydrží co nejdéle',
  'pece-o-susene-kvetiny',
  'Sušené květiny nepotřebují vodu, ale pár zásad prodlouží jejich životnost na roky.',
  '## Tři základní pravidla' || E'\n\n' ||
  '1. Vyhněte se přímému slunci — barvy časem vyblednou rychleji.' || E'\n' ||
  '2. Udržujte věnec v suchu, vlhkost okvětním lístkům nesvědčí.' || E'\n' ||
  '3. Prach jemně odstraňte studeným vzduchem z fénu, ne kartáčem.',
  :'image_base' || '/susena-kytice-do-vazy.jpeg',
  'Natálie Ruszová', 'published', NOW() - INTERVAL '4 days'
);

\echo 'Org "Kytka z Beskyd" seeded. Run kytka_store_catalog.sql next.'
\else
\echo 'Org "Kytka z Beskyd" already exists — skipping (org seed is idempotent, run catalog/legal seeds separately if needed).'
\endif
