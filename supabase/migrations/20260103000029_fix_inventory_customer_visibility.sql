-- Fix: shop-facing stock visibility on inventory_items was broken for BOTH anon and
-- authenticated non-staff customers, found while E2E-testing out-of-stock behavior.
--
-- 1) ANON: "Anon read tracked inventory" (TO anon) was correctly added by
--    20260103000020, but the pre-existing "Managers manage inventory_items" and
--    "Members read inventory_items" policies have no `TO` clause (defaults to `TO public`,
--    i.e. every role including anon). RLS OR's all applicable policies together, so
--    evaluating "Members read..." for an anon request still runs its EXISTS(...
--    user_party_roles ...) subquery — and anon has no SELECT grant on user_party_roles —
--    producing a hard "permission denied for table user_party_roles" instead of just not
--    matching. Same bug class as 20260103000022_fix_anon_shop_policies.sql, which fixed it
--    for product_categories/product_variants/categories/brands but missed inventory_items.
--
-- 2) AUTHENTICATED non-staff customers (logged-in shoppers, not party members): no policy
--    matches them at all — "Managers..." requires MANAGE_INVENTORY, "Members..." requires
--    user_party_roles membership, and the anon policy is scoped `TO anon` only. Result: the
--    query silently returns zero rows (not an error), so fetchInventoryByProduct() always
--    returns null for a logged-in customer, and the out-of-stock badge / low-stock hint
--    never render once a shopper is signed in — the exact opposite of anonymous visitors,
--    who saw it correctly (once fix #1 above applies).

DROP POLICY IF EXISTS "Managers manage inventory_items" ON inventory_items;
CREATE POLICY "Managers manage inventory_items"
  ON inventory_items FOR ALL
  TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 64));

DROP POLICY IF EXISTS "Members read inventory_items" ON inventory_items;
CREATE POLICY "Members read inventory_items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = inventory_items.party_id)
  );

CREATE POLICY "Authenticated customers read tracked inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (track_inventory = true);

GRANT SELECT ON inventory_items TO authenticated;
