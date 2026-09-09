-- Adds indexes for storefront/customer-facing query paths so one e-shop's traffic never
-- degrades another's. All new indexes lead with party_id (or a column that already implies a
-- single party, e.g. customer_id/product_id) matching the actual WHERE/ORDER BY shapes used in
-- shared/services/*.ts and website/src/lib/shopQueries.ts. Nothing here touches roles, RLS, or
-- admin/cross-party query logic (see review doc for the audit trail).
--
-- CREATE INDEX CONCURRENTLY is intentionally NOT used: Supabase CLI applies each migration file
-- as a single implicit transaction, and CONCURRENTLY cannot run inside a transaction block
-- (verified locally: an explicit BEGIN/CREATE INDEX CONCURRENTLY/ROLLBACK fails with
-- "CREATE INDEX CONCURRENTLY cannot run inside a transaction block"). Table sizes in this
-- template are small pre-production seed data, so a brief write-lock during plain CREATE INDEX
-- is an acceptable, well-understood tradeoff — see review doc "Rizika" for the production
-- follow-up if a table ever grows large enough for this to matter.

-- products: storefront listing/browsing (shopQueries.fetchShopData, /eshop-[partySlug]) always
-- filters party_id + status='active' + is_visible=true, then sorts by created_at (default),
-- price, or rating_avg. Partial indexes keep each one small and skip draft/hidden rows entirely.
CREATE INDEX IF NOT EXISTS idx_products_party_created_active
  ON products (party_id, created_at DESC)
  WHERE status = 'active' AND is_visible = true;

CREATE INDEX IF NOT EXISTS idx_products_party_price_active
  ON products (party_id, price)
  WHERE status = 'active' AND is_visible = true;

CREATE INDEX IF NOT EXISTS idx_products_party_rating_active
  ON products (party_id, rating_avg DESC)
  WHERE status = 'active' AND is_visible = true;

-- Homepage "featured products" widget (isHomepageView branch) — same predicate plus
-- is_featured=true, requested on effectively every eshop landing page view.
CREATE INDEX IF NOT EXISTS idx_products_party_featured_active
  ON products (party_id, created_at DESC)
  WHERE status = 'active' AND is_visible = true AND is_featured = true;

-- product_categories: category-filtered browsing does
-- .eq("product_categories.category_id", id) via an inner join, but the table's only index is
-- the PK (product_id, category_id) — category_id isn't a usable leading column there. This is
-- a pure reverse-lookup index for "products in category X".
CREATE INDEX IF NOT EXISTS idx_product_categories_category
  ON product_categories (category_id, product_id);

-- inventory_items: fetchOutOfStockMap / fetchInventoryTrackingMap / fetchInventoryByProduct /
-- fetchInventoryRowsByProduct all filter by product_id (or an IN-list of product_ids) without
-- party_id in scope at that call site. The existing idx_inventory_party_product can't serve a
-- product_id-only predicate efficiently (party_id is the leading column). These run on every
-- storefront product card and product detail page.
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_variant
  ON inventory_items (product_id, variant_id);

-- orders: customer self-service ("Customers read own orders" RLS + fetchOrders customer_id
-- filter + customerService.fetchCustomer order_count) filters by customer_id alone. A customer
-- belongs to exactly one party, so this stays fully e-shop-scoped without needing party_id in
-- the index.
CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

-- Mirrors idx_orders_party_status for the payment_status filter branch of fetchOrders — same
-- table, same access pattern, one extra predicate.
CREATE INDEX IF NOT EXISTS idx_orders_party_payment_status
  ON orders (party_id, payment_status);

-- customers: "Customers read own record" / "Customers read own orders" RLS policies and any
-- profile self-service lookup resolve a customer row by auth user_id. No index existed on this
-- FK-like column at all.
CREATE INDEX IF NOT EXISTS idx_customers_user
  ON customers (user_id)
  WHERE user_id IS NOT NULL;

-- addresses: FK to customers had no supporting index (checkout address selection, account
-- address book, cascade deletes).
CREATE INDEX IF NOT EXISTS idx_addresses_customer
  ON addresses (customer_id);

-- carts: getOrCreateCart filters party_id together with user_id OR session_id in one query.
-- Existing idx_carts_user / idx_carts_session are single-column; these composite partial
-- indexes serve the exact two-predicate WHERE clause directly, on a path hit by nearly every
-- storefront page view (cart badge) and every add-to-cart action.
CREATE INDEX IF NOT EXISTS idx_carts_party_user
  ON carts (party_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_carts_party_session
  ON carts (party_id, session_id)
  WHERE session_id IS NOT NULL;

ANALYZE products;
ANALYZE product_categories;
ANALYZE inventory_items;
ANALYZE orders;
ANALYZE customers;
ANALYZE addresses;
ANALYZE carts;
