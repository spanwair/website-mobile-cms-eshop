-- Fix shop-facing RLS policies that reference user_party_roles with TO public.
-- Anon users cannot SELECT from user_party_roles, causing "permission denied"
-- even when a companion "Public read ..." policy (TO anon) would allow access.
-- Restricting these policies to TO authenticated resolves the conflict.

DROP POLICY IF EXISTS "Members read product_categories" ON public.product_categories;
CREATE POLICY "Members read product_categories"
  ON public.product_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM products p
      JOIN user_party_roles upr ON upr.party_id = p.party_id
      WHERE p.id = product_categories.product_id
        AND upr.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members read product_variants" ON public.product_variants;
CREATE POLICY "Members read product_variants"
  ON public.product_variants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM products p
      JOIN user_party_roles upr ON upr.party_id = p.party_id
      WHERE p.id = product_variants.product_id
        AND upr.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members read visible categories" ON public.categories;
CREATE POLICY "Members read visible categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (
    is_visible AND EXISTS (
      SELECT 1
      FROM user_party_roles
      WHERE user_id = auth.uid()
        AND party_id = categories.party_id
    )
  );

DROP POLICY IF EXISTS "Members read active brands" ON public.brands;
CREATE POLICY "Members read active brands"
  ON public.brands FOR SELECT
  TO authenticated
  USING (
    is_active AND EXISTS (
      SELECT 1
      FROM user_party_roles
      WHERE user_id = auth.uid()
        AND party_id = brands.party_id
    )
  );
