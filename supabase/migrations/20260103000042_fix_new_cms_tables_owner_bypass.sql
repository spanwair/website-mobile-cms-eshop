-- Every "manage" policy added for this feature batch (product_conditions, hero_slides,
-- benefit_items, footer_links, nav_items, content_pages, faq_items, blog_posts, team_members)
-- used bare `user_has_permission(auth.uid(), party_id, BIT)`, which is computed purely from
-- `user_party_roles` (see get_user_permissions). An OWNER (or an ADMIN not yet assigned to
-- this specific party) has no row there for a party they didn't create through the normal
-- admin flow — e.g. this feature's own seeded demo org — so the write silently affected 0
-- rows: no Postgres error, no result.error in the app, just "nothing happened" on save. The
-- established pattern for every other manager policy in this codebase (store_configs,
-- store_domains, store_media, products, categories, ...) is `is_owner() OR
-- user_has_permission(...)` — re-point these 9 to match.

-- product_conditions doesn't exist yet at this point in migration order (created in
-- 20260103000049) — its policy fix lives in 20260103000067_fix_product_conditions_rls_ordering.sql.

DROP POLICY IF EXISTS "Settings managers manage hero_slides" ON hero_slides;
CREATE POLICY "Settings managers manage hero_slides"
  ON hero_slides FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

DROP POLICY IF EXISTS "Settings managers manage benefit_items" ON benefit_items;
CREATE POLICY "Settings managers manage benefit_items"
  ON benefit_items FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

DROP POLICY IF EXISTS "Settings managers manage footer_links" ON footer_links;
CREATE POLICY "Settings managers manage footer_links"
  ON footer_links FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

DROP POLICY IF EXISTS "CMS managers manage nav_items" ON nav_items;
CREATE POLICY "CMS managers manage nav_items"
  ON nav_items FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 2048));

DROP POLICY IF EXISTS "CMS managers manage content_pages" ON content_pages;
CREATE POLICY "CMS managers manage content_pages"
  ON content_pages FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 2048));

DROP POLICY IF EXISTS "CMS managers manage faq_items" ON faq_items;
CREATE POLICY "CMS managers manage faq_items"
  ON faq_items FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 2048));

DROP POLICY IF EXISTS "CMS managers manage blog_posts" ON blog_posts;
CREATE POLICY "CMS managers manage blog_posts"
  ON blog_posts FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 2048));

DROP POLICY IF EXISTS "CMS managers manage team_members" ON team_members;
CREATE POLICY "CMS managers manage team_members"
  ON team_members FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 2048));
