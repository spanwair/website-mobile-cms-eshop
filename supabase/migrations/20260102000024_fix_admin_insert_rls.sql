-- Recreate admin catalog policies with explicit WITH CHECK so INSERT works for role >= 4.
-- Mirrors the USING expression, making it unambiguous for all command types.

DROP POLICY IF EXISTS "Admins manage all categories" ON categories;
CREATE POLICY "Admins manage all categories"
  ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage all products" ON products;
CREATE POLICY "Admins manage all products"
  ON products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage all brands" ON brands;
CREATE POLICY "Admins manage all brands"
  ON brands FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage all product_categories" ON product_categories;
CREATE POLICY "Admins manage all product_categories"
  ON product_categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage all product_images" ON product_images;
CREATE POLICY "Admins manage all product_images"
  ON product_images FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage all product_tags" ON product_tags;
CREATE POLICY "Admins manage all product_tags"
  ON product_tags FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage all product_variants" ON product_variants;
CREATE POLICY "Admins manage all product_variants"
  ON product_variants FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
