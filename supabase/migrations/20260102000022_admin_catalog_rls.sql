-- Admins (role >= 4) can manage all catalog data regardless of user_party_roles.
-- Mirrors the pattern from migration 11 which fixed the same gap for parties.

DROP POLICY IF EXISTS "Admins manage all brands" ON brands;
CREATE POLICY "Admins manage all brands"
  ON brands FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage all categories" ON categories;
CREATE POLICY "Admins manage all categories"
  ON categories FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage all products" ON products;
CREATE POLICY "Admins manage all products"
  ON products FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage all product_categories" ON product_categories;
CREATE POLICY "Admins manage all product_categories"
  ON product_categories FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage all product_tags" ON product_tags;
CREATE POLICY "Admins manage all product_tags"
  ON product_tags FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage all product_images" ON product_images;
CREATE POLICY "Admins manage all product_images"
  ON product_images FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage all product_variants" ON product_variants;
CREATE POLICY "Admins manage all product_variants"
  ON product_variants FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all parties" ON parties;
CREATE POLICY "Admins can update all parties"
  ON parties FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
