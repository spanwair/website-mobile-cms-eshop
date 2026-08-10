-- Same bug class as 20260103000022/20260103000028: every "Public read ... of active parties"
-- policy added in this feature batch (product_conditions, hero_slides, benefit_items,
-- footer_links, nav_items, content_pages, faq_items, blog_posts, team_members) queried
-- `parties` directly inside USING(), which re-triggers parties' own RLS and hard-fails with
-- "permission denied for table parties" for anon (which has no base grant on parties) instead
-- of just returning zero rows. Re-point them all at the existing party_is_active() SECURITY
-- DEFINER helper (20260103000028), which bypasses that RLS re-entry. store_media had the same
-- latent bug from 20260103000034 and is fixed here too, since it's public-rendered on every page.

DROP POLICY IF EXISTS "Public read store_media of active parties" ON store_media;
CREATE POLICY "Public read store_media of active parties"
  ON store_media FOR SELECT TO anon, authenticated
  USING (party_is_active(party_id));

-- product_conditions doesn't exist yet at this point in migration order (created in
-- 20260103000049) — its policy fix lives in 20260103000067_fix_product_conditions_rls_ordering.sql.

DROP POLICY IF EXISTS "Public read visible hero_slides" ON hero_slides;
CREATE POLICY "Public read visible hero_slides"
  ON hero_slides FOR SELECT TO anon, authenticated
  USING (is_visible AND party_is_active(party_id));

DROP POLICY IF EXISTS "Public read visible benefit_items" ON benefit_items;
CREATE POLICY "Public read visible benefit_items"
  ON benefit_items FOR SELECT TO anon, authenticated
  USING (is_visible AND party_is_active(party_id));

DROP POLICY IF EXISTS "Public read visible footer_links" ON footer_links;
CREATE POLICY "Public read visible footer_links"
  ON footer_links FOR SELECT TO anon, authenticated
  USING (is_visible AND party_is_active(party_id));

DROP POLICY IF EXISTS "Public read visible nav_items" ON nav_items;
CREATE POLICY "Public read visible nav_items"
  ON nav_items FOR SELECT TO anon, authenticated
  USING (is_visible AND party_is_active(party_id));

DROP POLICY IF EXISTS "Public read visible content_pages" ON content_pages;
CREATE POLICY "Public read visible content_pages"
  ON content_pages FOR SELECT TO anon, authenticated
  USING (is_visible AND party_is_active(party_id));

DROP POLICY IF EXISTS "Public read visible faq_items" ON faq_items;
CREATE POLICY "Public read visible faq_items"
  ON faq_items FOR SELECT TO anon, authenticated
  USING (is_visible AND party_is_active(party_id));

DROP POLICY IF EXISTS "Public read published blog_posts" ON blog_posts;
CREATE POLICY "Public read published blog_posts"
  ON blog_posts FOR SELECT TO anon, authenticated
  USING (status = 'published' AND party_is_active(party_id));

DROP POLICY IF EXISTS "Public read active team_members" ON team_members;
CREATE POLICY "Public read active team_members"
  ON team_members FOR SELECT TO anon, authenticated
  USING (is_active AND party_is_active(party_id));
