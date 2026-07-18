-- Public shop RLS: anonymous users (anon role) can read published products,
-- categories, and reviews. No auth required for browsing.

-- Products: anon can read active+visible products
DROP POLICY IF EXISTS "Members read active products" ON public.products;
DROP POLICY IF EXISTS "Public read active products" ON public.products;

CREATE POLICY "Public read active products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND is_visible = true);

-- Managers still have full access (already covered by existing policy)

-- Categories: anon can read visible categories
DROP POLICY IF EXISTS "Members read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read visible categories" ON public.categories;

CREATE POLICY "Public read visible categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

-- product_categories junction: anon read
DROP POLICY IF EXISTS "Public read product_categories" ON public.product_categories;
CREATE POLICY "Public read product_categories"
  ON public.product_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- product_images: anon read
DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
CREATE POLICY "Public read product_images"
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- product_tags: anon read
DROP POLICY IF EXISTS "Public read product_tags anon" ON public.product_tags;
CREATE POLICY "Public read product_tags anon"
  ON public.product_tags FOR SELECT
  TO anon
  USING (true);

-- product_variants: anon read active variants
DROP POLICY IF EXISTS "Public read product_variants" ON public.product_variants;
CREATE POLICY "Public read product_variants"
  ON public.product_variants FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- brands: anon read active brands
DROP POLICY IF EXISTS "Public read brands" ON public.brands;
CREATE POLICY "Public read brands"
  ON public.brands FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Grant SELECT to anon role
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.product_tags TO anon;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT ON public.brands TO anon;
