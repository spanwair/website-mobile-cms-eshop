-- Demo organization "Repasado" — a fictional refurbished-electronics storefront used to
-- showcase every admin-configurable storefront feature end to end. All copy below is
-- original (not copied from any third-party site); product photos are locally generated
-- placeholder SVGs (see website/public/demo-media/), not scraped images.
--
-- Category icons are uploaded to Supabase Storage (store-media bucket) via
-- scripts/upload-repasado-media.sh and registered in store_media below, so they are
-- admin-editable through the CMS media library rather than a hardcoded static file path.
-- Requires migration 20260103000059 (adds image/svg+xml to store-media's allowed mime types).
--
-- Idempotent: safe to re-run. Apply with:
--   ./scripts/upload-repasado-media.sh                  # once, to populate storage
--   psql "$DATABASE_URL" -f supabase/seed/demo_store_org.sql
--   psql "$DATABASE_URL" -f supabase/seed/demo_store_catalog.sql

SELECT NOT EXISTS (SELECT 1 FROM parties WHERE slug = 'repasado') AS should_seed \gset
\if :should_seed

\echo 'Seeding demo org "Repasado"...'

INSERT INTO parties (id, name, slug, company_name, vat_number, billing_email, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001', 'Repasado', 'repasado', 'Repasado s.r.o.',
  'CZ19283746', 'podpora@repasado.cz', 'active'
);

-- A trigger (create_default_store_config) already inserted a default row on the party INSERT
-- above — update it in place rather than inserting a second one.
UPDATE store_configs SET
  brand_name = 'Repasado',
  tagline = 'Kvalitní repasovaná elektronika za skvělou cenu',
  color_primary = '#5B9A3B', color_secondary = '#2B2B2B', color_background = '#FFFFFF', color_surface = '#F6F7F5',
  color_text_primary = '#212529', color_text_secondary = '#6C757D', color_border = '#E5E7E3',
  font_heading = 'Inter', font_body = 'Inter', radius_scale = 'default', product_card_variant = 'classic',
  homepage_layout = '["hero","benefits","categories","featured_products","condition_explainer","buyback_promo","blog_preview","newsletter"]',
  enable_reviews = true, enable_wishlists = true,
  contact_phone = '+420 222 333 444', contact_email = 'podpora@repasado.cz',
  business_hours = 'Po-Pá: 9:00 - 18:00', currency_code = 'CZK'
WHERE party_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE store_configs SET
  buyback_content = '## Výkup starých zařízení' || E'\n\n' ||
    'Máte doma nepoužívaný iPhone, iPad, Mac nebo Apple Watch? Vykoupíme ho za férovou cenu. ' ||
    'Zařízení nám můžete poslat poštou, nebo přinést osobně na naši prodejnu v Praze — cenu vám ' ||
    'sdělíme předem a výkup je zcela nezávazný.',
  buyback_format = 'markdown'
WHERE party_id = 'a0000000-0000-0000-0000-000000000001';

-- Product conditions ---------------------------------------------------------------------
INSERT INTO product_conditions (party_id, code, label, color_hex, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'new',      'Nové',     '#22c55e', 1),
  ('a0000000-0000-0000-0000-000000000001', 'like_new', 'Zánovní',  '#16a34a', 2),
  ('a0000000-0000-0000-0000-000000000001', 'a',        'Stav A',   '#84cc16', 3),
  ('a0000000-0000-0000-0000-000000000001', 'b',        'Stav B',   '#f59e0b', 4),
  ('a0000000-0000-0000-0000-000000000001', 'c',        'Stav C',   '#f97316', 5);

-- Categories ------------------------------------------------------------------------------
-- show_in_nav drives the storefront mega-nav directly (see fetchStorefrontNavTree) —
-- there is no separate curated nav_items row for these; sort_order 0 keeps Příslušenství
-- first, matching the pre-existing mega-nav order.
INSERT INTO categories (party_id, name, slug, sort_order, show_in_nav) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Příslušenství', 'prislusenstvi', 0, true),
  ('a0000000-0000-0000-0000-000000000001', 'iPhone', 'iphone', 1, true),
  ('a0000000-0000-0000-0000-000000000001', 'iPad', 'ipad', 2, true),
  ('a0000000-0000-0000-0000-000000000001', 'Mac', 'mac', 3, true),
  ('a0000000-0000-0000-0000-000000000001', 'Watch', 'watch', 4, true),
  ('a0000000-0000-0000-0000-000000000001', 'Audio', 'audio', 5, true);

INSERT INTO categories (party_id, parent_id, name, slug, sort_order, show_in_nav)
SELECT 'a0000000-0000-0000-0000-000000000001', c.id, v.name, v.slug, v.sort_order, true
FROM (VALUES ('Kryty a pouzdra', 'kryty-a-pouzdra', 1), ('Ochranná skla', 'ochranna-skla', 2)) AS v(name, slug, sort_order)
JOIN categories c ON c.party_id = 'a0000000-0000-0000-0000-000000000001' AND c.slug = 'prislusenstvi';

-- Category icons are also uploaded to Storage and registered in store_media (via
-- scripts/upload-repasado-media.sh) so they show up in the admin's "choose from library"
-- picker, not just as a hardcoded website/public/demo-media file path.
INSERT INTO store_media (party_id, slug, media_type, url, alt)
SELECT 'a0000000-0000-0000-0000-000000000001', v.slug, 'image', v.url, v.alt
FROM (VALUES
  ('category-prislusenstvi', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-prislusenstvi.svg', 'Příslušenství'),
  ('category-iphone', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-iphone.svg', 'iPhone'),
  ('category-ipad', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-ipad.svg', 'iPad'),
  ('category-mac', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-mac.svg', 'Mac'),
  ('category-watch', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-watch.svg', 'Watch'),
  ('category-audio', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-audio.svg', 'Audio')
) AS v(slug, url, alt)
ON CONFLICT (party_id, slug) DO NOTHING;

UPDATE categories SET image_url = v.url
FROM (VALUES
  ('prislusenstvi', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-prislusenstvi.svg'),
  ('iphone', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-iphone.svg'),
  ('ipad', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-ipad.svg'),
  ('mac', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-mac.svg'),
  ('watch', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-watch.svg'),
  ('audio', 'http://127.0.0.1:54321/storage/v1/object/public/store-media/a0000000-0000-0000-0000-000000000001/category-audio.svg')
) AS v(slug, url)
WHERE categories.party_id = 'a0000000-0000-0000-0000-000000000001'
  AND categories.slug = v.slug;

-- Footer link columns ---------------------------------------------------------------------
INSERT INTO footer_links (party_id, column_key, label, url, sort_order)
SELECT 'a0000000-0000-0000-0000-000000000001', 'shop', v.label, v.url, v.sort_order
FROM (VALUES
  ('iPhone', '/iphone', 1), ('iPad', '/ipad', 2), ('Mac', '/mac', 3),
  ('Watch', '/watch', 4), ('Příslušenství', '/prislusenstvi', 5), ('Audio', '/audio', 6)
) AS v(label, url, sort_order);

INSERT INTO footer_links (party_id, column_key, label, url, sort_order)
SELECT 'a0000000-0000-0000-0000-000000000001', 'information', v.label, v.url, v.sort_order
FROM (VALUES
  ('Proč koupit repasovaný telefon?', '/stranka/proc-koupit-repasovany', 1),
  ('Výkup starého zařízení', '/stranka/vykup', 2),
  ('Průvodce stavy produktů', '/stranka/stavy-produktu', 3),
  ('Blog', '/blog', 4),
  ('O nás', '/stranka/o-nas', 5),
  ('Kontakt', '/stranka/kontakt', 6)
) AS v(label, url, sort_order);

INSERT INTO footer_links (party_id, column_key, label, url, sort_order)
SELECT 'a0000000-0000-0000-0000-000000000001', 'customer_service', v.label, v.url, v.sort_order
FROM (VALUES
  ('Časté dotazy', '/stranka/faq', 1),
  ('Kontakt', '/stranka/kontakt', 2)
) AS v(label, url, sort_order);

-- Hero slides -----------------------------------------------------------------------------
INSERT INTO hero_slides (party_id, headline, subheadline, cta_text, cta_link, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Repasované Apple produkty s zárukou 12 měsíců',
   'Ušetřete až 40 % oproti novému kusu — každý produkt otestován ve 100+ bodech.',
   'Prohlédnout nabídku', '/iphone', 1),
  ('a0000000-0000-0000-0000-000000000001',
   'Vyměňte starý telefon za slevu',
   'Odkupujeme vaše staré Apple zařízení a nabídneme fér cenu na nový nákup.',
   'Zjistit cenu výkupu', '/stranka/vykup', 2);

-- Benefits / trust badges -------------------------------------------------------------------
INSERT INTO benefit_items (party_id, icon, title, description, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', '✓', '12 měsíců záruka', 'Na každý repasovaný kus poskytujeme roční záruku.', 1),
  ('a0000000-0000-0000-0000-000000000001', '🔄', '14 dní na vrácení', 'Nesedí vám produkt? Vrátíte jej bez udání důvodu.', 2),
  ('a0000000-0000-0000-0000-000000000001', '🔋', 'Baterie 80–100 %', 'Každá baterie je otestována a garantovaně drží kapacitu.', 3),
  ('a0000000-0000-0000-0000-000000000001', '🧪', '100+ bodů testování', 'Každý kus prochází důkladnou technickou kontrolou.', 4),
  ('a0000000-0000-0000-0000-000000000001', '🚚', 'Doprava zdarma', 'Nad 1000 Kč posíláme zdarma po celé ČR.', 5),
  ('a0000000-0000-0000-0000-000000000001', '🏬', 'Osobní odběr v Praze', 'Vyzvedněte si objednávku osobně na naší prodejně.', 6);

-- Content pages ---------------------------------------------------------------------------
INSERT INTO content_pages (party_id, slug, title, template, body, is_visible, sort_order) VALUES
(
  'a0000000-0000-0000-0000-000000000001', 'o-nas', 'O nás', 'about',
  '## O nás' || E'\n\n' ||
  'Repasado prodává repasované a zánovní Apple produkty — iPhony, iPady, Macy, Watch i příslušenství. ' ||
  'Naším cílem je nabídnout kvalitní elektroniku za rozumnou cenu a zároveň prodloužit životnost ' ||
  'zařízení, která by jinak skončila v šuplíku nebo na skládce.' || E'\n\n' ||
  'Každý kus prochází důkladnou technickou kontrolou a rozdělujeme je do jasně popsaných stavů ' ||
  '(Nové, Zánovní, A, B, C), abyste vždy věděli přesně, co kupujete. Naše prodejna se nachází ' ||
  'v centru Prahy, kde si můžete zařízení prohlédnout osobně.',
  true, 1
),
(
  'a0000000-0000-0000-0000-000000000001', 'kontakt', 'Kontakt', 'contact',
  'Máte dotaz k objednávce, reklamaci nebo chcete poradit s výběrem? Ozvěte se nám telefonicky, ' ||
  'e-mailem, nebo se zastavte osobně na naší prodejně.',
  true, 2
),
(
  'a0000000-0000-0000-0000-000000000001', 'faq', 'Časté dotazy', 'faq',
  'Odpovědi na nejčastější otázky ohledně repasovaných produktů, záruky a vrácení zboží.',
  true, 3
),
(
  'a0000000-0000-0000-0000-000000000001', 'proc-koupit-repasovany', 'Proč koupit repasovaný telefon?', 'default',
  '## Proč koupit repasovaný telefon?' || E'\n\n' ||
  'Repasovaný telefon prošel technickou kontrolou, opravou vad a důkladným otestováním, takže funguje ' ||
  'srovnatelně s novým kusem — jen za výrazně nižší cenu. Navíc dáváte druhou šanci zařízení, které by ' ||
  'jinak skončilo jako elektroodpad, což šetří suroviny i energii potřebnou na výrobu nového telefonu.' || E'\n\n' ||
  'U nás navíc na každý repasovaný kus dostanete 12 měsíců záruky a 14 dní na vrácení bez udání důvodu, ' ||
  'takže riziko nákupu je minimální.',
  true, 4
),
(
  'a0000000-0000-0000-0000-000000000001', 'vykup', 'Výkup', 'default',
  '## Výkup starých zařízení' || E'\n\n' ||
  'Nepoužívaný iPhone, iPad, Mac nebo Apple Watch doma jen sbírá prach? Pošlete nám ho, nebo přijďte ' ||
  'osobně na prodejnu — po rychlé kontrole stavu vám nabídneme férovou cenu. Pokud se s výkupní cenou ' ||
  'nespokojíte, zařízení vám bez poplatku vrátíme zpět.',
  true, 5
),
(
  'a0000000-0000-0000-0000-000000000001', 'stavy-produktu', 'Průvodce stavy produktů', 'default',
  '## Jak rozumět stavům produktů' || E'\n\n' ||
  '**Nové** — nerozbalený kus v originálním balení, nikdy nepoužitý.' || E'\n\n' ||
  '**Zánovní** — použito jen krátce, bez viditelných známek opotřebení.' || E'\n\n' ||
  '**Stav A** — velmi dobře zachovaný kus, displej bez škrábanců.' || E'\n\n' ||
  '**Stav B** — plně funkční, s drobnými viditelnými známkami používání.' || E'\n\n' ||
  '**Stav C** — plně funkční, s výraznějším kosmetickým opotřebením.',
  true, 6
);

-- FAQ ---------------------------------------------------------------------------------------
INSERT INTO faq_items (party_id, question, answer, context, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Je repasovaný telefon bezpečný?',
   'Ano. Každé zařízení je před prodejem uvedeno do továrního nastavení a zbaveno předchozích účtů a dat.', 'general', 1),
  ('a0000000-0000-0000-0000-000000000001', 'Jak dlouhá je záruka?',
   'Na všechny repasované produkty poskytujeme 12 měsíců záruky.', 'general', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Můžu zboží vrátit?',
   'Ano, do 14 dnů od doručení bez udání důvodu.', 'general', 3),
  ('a0000000-0000-0000-0000-000000000001', 'Odkud pocházejí repasované produkty?',
   'Z výkupu, vrácených objednávek a repasovaných vzorků — vždy profesionálně otestované a opravené.', 'general', 4),
  ('a0000000-0000-0000-0000-000000000001', 'Jak probíhá výkup zařízení?',
   'Zašlete nám údaje o zařízení, my vám navrhneme cenu, a po přijetí a kontrole vám ji proplatíme. Bez závazku.', 'vykup', 5);

-- Team members --------------------------------------------------------------------------------
INSERT INTO team_members (party_id, name, position, bio, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Klára Novotná', 'Zakladatelka a CEO',
   'Repasado založila v roce 2021 s cílem zpřístupnit kvalitní Apple produkty za rozumnou cenu.', 1),
  ('a0000000-0000-0000-0000-000000000001', 'Tomáš Dvořák', 'Vedoucí technického oddělení',
   'Dohlíží na testování a repasi každého kusu, který k nám přijde.', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Petra Malá', 'Zákaznická podpora',
   'Pomáhá zákazníkům s výběrem produktu i s reklamacemi.', 3),
  ('a0000000-0000-0000-0000-000000000001', 'Jakub Novák', 'Specialista výkupu',
   'Stará se o odhad cen a výkup starých zařízení.', 4);

-- Blog posts ------------------------------------------------------------------------------------
INSERT INTO blog_posts (party_id, title, slug, excerpt, content, author_name, status, published_at) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Repasovaný vs. nový iPhone: co se opravdu liší?',
  'repasovany-vs-novy-iphone',
  'Rozdíly mezi novým a repasovaným iPhonem jsou menší, než si myslíte — hlavně v ceně.',
  '## Co znamená "repasovaný"?' || E'\n\n' ||
  'Repasovaný telefon prošel technickou kontrolou, výměnou vadných dílů a důkladným otestováním ' ||
  'funkčnosti. Vizuálně i výkonově se od nového kusu často vůbec neliší — hlavní rozdíl je v ceně, ' ||
  'která bývá o 20-40 % nižší.' || E'\n\n' ||
  '## Na co si dát pozor' || E'\n\n' ||
  'Vždy zkontrolujte, jaký stav baterie prodejce garantuje a jak dlouhá je záruka. U nás najdete ' ||
  'obě informace přímo u každého produktu.',
  'Tomáš Dvořák', 'published', NOW() - INTERVAL '14 days'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Jak prodloužit výdrž baterie vašeho iPhonu',
  'jak-prodlouzit-vydrz-baterie-iphonu',
  'Pár jednoduchých návyků dokáže znatelně prodloužit životnost baterie.',
  '## Praktické tipy' || E'\n\n' ||
  '1. Vyhněte se nabíjení na 100 % každý den — ideální rozsah je 20-80 %.' || E'\n' ||
  '2. Nenechávejte telefon na přímém slunci nebo v horkém autě.' || E'\n' ||
  '3. Používejte originální nebo certifikovanou nabíječku.' || E'\n' ||
  '4. Zapněte optimalizované nabíjení baterie v nastavení.',
  'Petra Malá', 'published', NOW() - INTERVAL '7 days'
),
(
  'a0000000-0000-0000-0000-000000000001',
  '5 důvodů, proč dává repase smysl i pro planetu',
  '5-duvodu-proc-dava-repase-smysl-pro-planetu',
  'Koupě repasovaného telefonu není jen úspora peněz — je to i menší dopad na životní prostředí.',
  '## Proč na tom záleží' || E'\n\n' ||
  'Výroba nového telefonu spotřebuje desítky kilogramů surovin a stovky litrů vody. Prodloužením ' ||
  'životnosti existujícího zařízení tuto zátěž výrazně snižujeme — a šetříte i vy sami.',
  'Klára Novotná', 'published', NOW() - INTERVAL '2 days'
);

\echo 'Demo org "Repasado" seeded. Run demo_store_catalog.sql next.'
\else
\echo 'Demo org "Repasado" already exists — skipping (org seed is idempotent, run catalog seed separately if needed).'
\endif
