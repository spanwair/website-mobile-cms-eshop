-- Fix catalog: is_admin() → is_owner() OR is_admin_of(party_id)
DROP POLICY IF EXISTS "Admins manage all products" ON products;
DROP POLICY IF EXISTS "Admins manage all categories" ON categories;
DROP POLICY IF EXISTS "Admins manage all brands" ON brands;
DROP POLICY IF EXISTS "Admins manage all product_categories" ON product_categories;
DROP POLICY IF EXISTS "Admins manage all product_images" ON product_images;
DROP POLICY IF EXISTS "Admins manage all product_tags" ON product_tags;
DROP POLICY IF EXISTS "Admins manage all product_variants" ON product_variants;

CREATE POLICY "Owners or party admins manage products"
  ON products FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage categories"
  ON categories FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage brands"
  ON brands FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage product_categories"
  ON product_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND (is_owner() OR is_admin_of(p.party_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND (is_owner() OR is_admin_of(p.party_id))));

CREATE POLICY "Owners or party admins manage product_images"
  ON product_images FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND (is_owner() OR is_admin_of(p.party_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND (is_owner() OR is_admin_of(p.party_id))));

CREATE POLICY "Owners or party admins manage product_tags"
  ON product_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND (is_owner() OR is_admin_of(p.party_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND (is_owner() OR is_admin_of(p.party_id))));

CREATE POLICY "Owners or party admins manage product_variants"
  ON product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND (is_owner() OR is_admin_of(p.party_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND (is_owner() OR is_admin_of(p.party_id))));

-- Add missing admin bypasses: orders, customers, addresses, inventory, pricing, returns, loyalty
CREATE POLICY "Owners or party admins manage orders"
  ON orders FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage customers"
  ON customers FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage addresses"
  ON addresses FOR ALL
  USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND (is_owner() OR is_admin_of(c.party_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND (is_owner() OR is_admin_of(c.party_id))));

CREATE POLICY "Owners or party admins manage warehouses"
  ON warehouses FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage inventory"
  ON inventory_items FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage stock_movements"
  ON stock_movements FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage price_lists"
  ON price_lists FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage price_list_items"
  ON price_list_items FOR ALL
  USING (EXISTS (SELECT 1 FROM price_lists pl WHERE pl.id = price_list_id AND (is_owner() OR is_admin_of(pl.party_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM price_lists pl WHERE pl.id = price_list_id AND (is_owner() OR is_admin_of(pl.party_id))));

CREATE POLICY "Owners or party admins manage discount_rules"
  ON discount_rules FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage coupons"
  ON coupons FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage promotions"
  ON promotions FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage return_requests"
  ON return_requests FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Owners or party admins manage return_items"
  ON return_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM return_requests r
      WHERE r.id = return_request_id AND (is_owner() OR is_admin_of(r.party_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM return_requests r
      WHERE r.id = return_request_id AND (is_owner() OR is_admin_of(r.party_id))
    )
  );

CREATE POLICY "Owners or party admins manage loyalty"
  ON loyalty_transactions FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

-- Add is_owner() bypass for audit logs
DROP POLICY IF EXISTS "Party settings admins can read audit logs" ON audit_logs;
CREATE POLICY "Party settings admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    is_owner()
    OR (party_id IS NOT NULL AND user_has_permission(auth.uid(), party_id, 4096))
  );

-- Fix order_status_history and order_items admin access
CREATE POLICY "Owners or party admins manage order_items"
  ON order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (is_owner() OR is_admin_of(o.party_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (is_owner() OR is_admin_of(o.party_id))));

CREATE POLICY "Owners or party admins manage order_status_history"
  ON order_status_history FOR ALL
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (is_owner() OR is_admin_of(o.party_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (is_owner() OR is_admin_of(o.party_id))));

-- Fix reviews: admins access via is_owner() OR is_admin_of()
DROP POLICY IF EXISTS "Admins manage reviews" ON product_reviews;
DROP POLICY IF EXISTS "Admins read all party reviews" ON product_reviews;
CREATE POLICY "Owners or party admins manage reviews"
  ON product_reviews FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

-- Fix wishlists admin read
DROP POLICY IF EXISTS "Admins read party wishlists" ON wishlists;
CREATE POLICY "Owners or party admins read wishlists"
  ON wishlists FOR SELECT
  USING (is_owner() OR is_admin_of(party_id));
