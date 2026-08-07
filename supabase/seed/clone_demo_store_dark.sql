-- Clones the "Repasado" demo storefront (party a0000000-...-0001, see demo_store_org.sql /
-- demo_store_catalog.sql / demo_store_footer_content_enriched.sql / demo_store_legal_content_v2.sql /
-- demo_store_legal_footer.sql) into a second demo tenant "Repasado Dark"
-- (party a0000000-...-0002) with identical content but a dark theme, so /templates can show
-- two live demo eshops that differ only in styling.
--
-- Clones straight from the LIVE rows (not by replaying the seed files above) because several of
-- those files UPDATE rows the earlier ones inserted — only the live table state reflects the
-- fully-enriched content.
--
-- Deliberately excluded (not "eshop content"): customers/orders/carts/cart_items/wishlists/
-- wishlist_items/notifications/product_reviews/stock_movements (real transactional/test data
-- tied to one manual test customer+order) and nav_items/media_categories (contain literal QA
-- test debris — a nav item labeled "custom-helloasd" and a media folder named "hoj"). store_media
-- itself IS cloned (see below) — hero_slides reference it via {{media:slug}} tokens.
--
-- Idempotent: safe to re-run. Apply with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed/clone_demo_store_dark.sql

\set old_party 'a0000000-0000-0000-0000-000000000001'
\set new_party 'a0000000-0000-0000-0000-000000000002'

SELECT NOT EXISTS (SELECT 1 FROM parties WHERE slug = 'repasado-dark') AS should_seed \gset
\if :should_seed

\echo 'Cloning "Repasado" into "Repasado Dark"...'

BEGIN;

-- Party -------------------------------------------------------------------------------------
INSERT INTO parties (id, name, slug, company_name, vat_number, billing_email, status)
SELECT :'new_party', 'Repasado Dark', 'repasado-dark', company_name, vat_number, billing_email, status
FROM parties WHERE id = :'old_party';

-- store_configs row already auto-inserted by the create_default_store_config trigger above —
-- copy every field from the source config, then override brand_name + palette for dark mode.
UPDATE store_configs dst SET
  brand_name = src.brand_name, tagline = src.tagline, logo_url = src.logo_url, favicon_url = src.favicon_url,
  font_heading = src.font_heading, font_body = src.font_body, radius_scale = src.radius_scale,
  product_card_variant = src.product_card_variant, homepage_layout = src.homepage_layout,
  enable_reviews = src.enable_reviews, enable_wishlists = src.enable_wishlists,
  hero_content = src.hero_content, hero_format = src.hero_format,
  subhero_content = src.subhero_content, subhero_format = src.subhero_format,
  footer_content = src.footer_content, footer_format = src.footer_format,
  contact_phone = src.contact_phone, contact_email = src.contact_email,
  business_hours = src.business_hours, currency_code = src.currency_code,
  buyback_content = src.buyback_content, buyback_format = src.buyback_format,
  store_address = src.store_address, store_map_url = src.store_map_url, store_photo_url = src.store_photo_url,
  footer_newsletter_enabled = src.footer_newsletter_enabled
FROM store_configs src
WHERE src.party_id = :'old_party' AND dst.party_id = :'new_party';

-- Dark-mode transform of Repasado's ACTUAL live accent colors (indigo/magenta — the storefront
-- was re-branded via /admin/settings/branding at some point after the original green seed in
-- demo_store_org.sql, so the source of truth here is the live store_configs row, not that file).
UPDATE store_configs SET
  brand_name = 'Repasado Dark',
  color_primary = '#818CF8', color_secondary = '#E19FE8', color_background = '#121212',
  color_surface = '#1E1E1E', color_text_primary = '#F4F4F5', color_text_secondary = '#A1A1AA',
  color_border = '#2E2E30', footer_theme = 'dark'
WHERE party_id = :'new_party';

-- Product conditions --------------------------------------------------------------------------
CREATE TEMP TABLE map_conditions (old_id uuid PRIMARY KEY, new_id uuid) ON COMMIT DROP;
WITH src AS (SELECT * FROM product_conditions WHERE party_id = :'old_party'),
     ins AS (
       INSERT INTO product_conditions (party_id, code, label, color_hex, sort_order, is_active)
       SELECT :'new_party', code, label, color_hex, sort_order, is_active FROM src
       RETURNING id, code
     )
INSERT INTO map_conditions SELECT src.id, ins.id FROM src JOIN ins ON ins.code = src.code;

-- Brands ----------------------------------------------------------------------------------------
CREATE TEMP TABLE map_brands (old_id uuid PRIMARY KEY, new_id uuid) ON COMMIT DROP;
WITH src AS (SELECT * FROM brands WHERE party_id = :'old_party'),
     ins AS (
       INSERT INTO brands (party_id, name, slug, logo_url, description, is_active)
       SELECT :'new_party', name, slug, logo_url, description, is_active FROM src
       RETURNING id, slug
     )
INSERT INTO map_brands SELECT src.id, ins.id FROM src JOIN ins ON ins.slug = src.slug;

-- Warehouses (must exist before products — create_default_inventory_item trigger requires one) ---
CREATE TEMP TABLE map_warehouses (old_id uuid PRIMARY KEY, new_id uuid) ON COMMIT DROP;
WITH src AS (SELECT * FROM warehouses WHERE party_id = :'old_party'),
     ins AS (
       INSERT INTO warehouses (party_id, name, code, address, is_active, is_default)
       SELECT :'new_party', name, code, address, is_active, is_default FROM src
       RETURNING id, code
     )
INSERT INTO map_warehouses SELECT src.id, ins.id FROM src JOIN ins ON ins.code = src.code;

-- Categories (roots, then their one level of children) -------------------------------------------
CREATE TEMP TABLE map_categories (old_id uuid PRIMARY KEY, new_id uuid) ON COMMIT DROP;
WITH src AS (SELECT * FROM categories WHERE party_id = :'old_party' AND parent_id IS NULL),
     ins AS (
       INSERT INTO categories (party_id, name, slug, icon, image_url, seo_title, seo_description, sort_order, is_visible, show_in_nav)
       SELECT :'new_party', name, slug, icon, image_url, seo_title, seo_description, sort_order, is_visible, show_in_nav FROM src
       RETURNING id, slug
     )
INSERT INTO map_categories SELECT src.id, ins.id FROM src JOIN ins ON ins.slug = src.slug;

WITH src AS (SELECT * FROM categories WHERE party_id = :'old_party' AND parent_id IS NOT NULL),
     ins AS (
       INSERT INTO categories (party_id, parent_id, name, slug, icon, image_url, seo_title, seo_description, sort_order, is_visible, show_in_nav)
       SELECT :'new_party', m.new_id, src.name, src.slug, src.icon, src.image_url, src.seo_title, src.seo_description, src.sort_order, src.is_visible, src.show_in_nav
       FROM src JOIN map_categories m ON m.old_id = src.parent_id
       RETURNING id, slug
     )
INSERT INTO map_categories SELECT src.id, ins.id FROM src JOIN ins ON ins.slug = src.slug;

-- Products ----------------------------------------------------------------------------------------
CREATE TEMP TABLE map_products (old_id uuid PRIMARY KEY, new_id uuid) ON COMMIT DROP;
WITH src AS (SELECT * FROM products WHERE party_id = :'old_party'),
     ins AS (
       INSERT INTO products (party_id, brand_id, title, slug, sku, barcode, description, description_rich,
         seo_title, seo_description, price, discount_price, tax_rate, weight, status, is_featured, is_visible,
         condition_id, cost_price)
       SELECT :'new_party', mb.new_id, src.title, src.slug, src.sku, src.barcode, src.description, src.description_rich,
         src.seo_title, src.seo_description, src.price, src.discount_price, src.tax_rate, src.weight, src.status,
         src.is_featured, src.is_visible, NULL, src.cost_price
       FROM src LEFT JOIN map_brands mb ON mb.old_id = src.brand_id
       RETURNING id, slug
     )
INSERT INTO map_products SELECT src.id, ins.id FROM src JOIN ins ON ins.slug = src.slug;

-- The create_default_inventory_item trigger just auto-created one placeholder (qty=0) row per
-- product above — clear those so the exact clone below (with real qty values) doesn't collide
-- with them on the (product_id, variant_id, warehouse_id) unique constraint.
DELETE FROM inventory_items WHERE party_id = :'new_party';

-- product_categories junction ----------------------------------------------------------------
INSERT INTO product_categories (product_id, category_id)
SELECT mp.new_id, mc.new_id
FROM product_categories pc
JOIN map_products mp ON mp.old_id = pc.product_id
JOIN map_categories mc ON mc.old_id = pc.category_id;

-- Product images --------------------------------------------------------------------------------
INSERT INTO product_images (product_id, url, alt, sort_order, is_primary, media_type)
SELECT mp.new_id, pi.url, pi.alt, pi.sort_order, pi.is_primary, pi.media_type
FROM product_images pi
JOIN map_products mp ON mp.old_id = pi.product_id;

-- Product variants --------------------------------------------------------------------------------
CREATE TEMP TABLE map_variants (old_id uuid PRIMARY KEY, new_id uuid) ON COMMIT DROP;
WITH src AS (
  SELECT pv.*, mp.new_id AS new_product_id FROM product_variants pv
  JOIN map_products mp ON mp.old_id = pv.product_id
),
ins AS (
  INSERT INTO product_variants (product_id, name, sku, barcode, price, attributes, is_active, condition_id)
  SELECT src.new_product_id, src.name, src.sku, src.barcode, src.price, src.attributes, src.is_active, mc.new_id
  FROM src LEFT JOIN map_conditions mc ON mc.old_id = src.condition_id
  RETURNING id, product_id, sku
)
INSERT INTO map_variants SELECT src.id, ins.id
FROM src JOIN ins ON ins.product_id = src.new_product_id AND ins.sku IS NOT DISTINCT FROM src.sku;

-- Inventory — exact quantities cloned, not re-derived. ON CONFLICT DO UPDATE, not a plain
-- INSERT: cloning a variant above already auto-creates its own zero-qty row
-- (ensure_variant_inventory_item trigger), so this just sets the cloned real quantities on it.
INSERT INTO inventory_items (party_id, product_id, variant_id, warehouse_id, qty_on_hand, qty_reserved, qty_incoming, low_stock_threshold, track_inventory, max_threshold)
SELECT :'new_party', mp.new_id, mv.new_id, mw.new_id, ii.qty_on_hand, ii.qty_reserved, ii.qty_incoming, ii.low_stock_threshold, ii.track_inventory, ii.max_threshold
FROM inventory_items ii
JOIN map_products mp ON mp.old_id = ii.product_id
LEFT JOIN map_variants mv ON mv.old_id = ii.variant_id
JOIN map_warehouses mw ON mw.old_id = ii.warehouse_id
WHERE ii.party_id = :'old_party'
ON CONFLICT (product_id, variant_id, warehouse_id) DO UPDATE
  SET qty_on_hand = EXCLUDED.qty_on_hand, qty_reserved = EXCLUDED.qty_reserved, qty_incoming = EXCLUDED.qty_incoming,
      low_stock_threshold = EXCLUDED.low_stock_threshold, track_inventory = EXCLUDED.track_inventory, max_threshold = EXCLUDED.max_threshold;

-- Store media — hero_slides.image_url stores a {{media:slug}} token, resolved at render time by
-- looking up store_media for the current party by slug, so the token only works once a same-slug
-- row exists for the new party too. Reuses the same public storage URLs (no file duplication).
INSERT INTO store_media (party_id, slug, media_type, url, alt)
SELECT :'new_party', slug, media_type, url, alt FROM store_media WHERE party_id = :'old_party';

-- Remaining content tables — no downstream FK depends on their ids, plain party_id-swap clones ----
INSERT INTO footer_links (party_id, column_key, label, url, sort_order, is_visible)
SELECT :'new_party', column_key, label, url, sort_order, is_visible FROM footer_links WHERE party_id = :'old_party';

INSERT INTO footer_badges (party_id, kind, label, icon, url, sort_order, is_visible)
SELECT :'new_party', kind, label, icon, url, sort_order, is_visible FROM footer_badges WHERE party_id = :'old_party';

INSERT INTO faq_items (party_id, question, answer, context, sort_order, is_visible)
SELECT :'new_party', question, answer, context, sort_order, is_visible FROM faq_items WHERE party_id = :'old_party';

INSERT INTO benefit_items (party_id, icon, title, description, sort_order, is_visible)
SELECT :'new_party', icon, title, description, sort_order, is_visible FROM benefit_items WHERE party_id = :'old_party';

INSERT INTO hero_slides (party_id, image_url, headline, subheadline, cta_text, cta_link, overlay_opacity, sort_order, is_visible)
SELECT :'new_party', image_url, headline, subheadline, cta_text, cta_link, overlay_opacity, sort_order, is_visible FROM hero_slides WHERE party_id = :'old_party';

INSERT INTO team_members (party_id, name, position, bio, photo_url, sort_order, is_active)
SELECT :'new_party', name, position, bio, photo_url, sort_order, is_active FROM team_members WHERE party_id = :'old_party';

INSERT INTO blog_posts (party_id, title, slug, excerpt, content, content_format, featured_image_url, author_name, status, published_at, seo_title, seo_description)
SELECT :'new_party', title, slug, excerpt, content, content_format, featured_image_url, author_name, status, published_at, seo_title, seo_description FROM blog_posts WHERE party_id = :'old_party';

INSERT INTO content_pages (party_id, slug, title, template, body, body_format, seo_title, seo_description, show_in_footer_column, is_visible, sort_order)
SELECT :'new_party', slug, title, template, body, body_format, seo_title, seo_description, show_in_footer_column, is_visible, sort_order FROM content_pages WHERE party_id = :'old_party';

COMMIT;

\echo 'Demo org "Repasado Dark" seeded — reachable at /eshop-repasado-dark.'
\else
\echo 'Demo org "Repasado Dark" already exists — skipping (idempotent).'
\endif
