-- Storefront pages need to tell "on-demand" (track_inventory=false) apart from a genuinely
-- tracked, in-stock/out-of-stock row so a "made to order" badge can be trusted instead of a
-- separately-editable product condition label drifting out of sync with real inventory state.
-- But the existing customer-facing SELECT policies only expose rows WHERE track_inventory =
-- true, so anon/authenticated shoppers can never see the row that would prove a product is
-- on-demand — it's invisible, not merely zero. qty_on_hand on an untracked row is always 0 by
-- convention (see kytka_store_catalog.sql), so exposing it carries no extra business signal
-- beyond what's already public for tracked rows.

DROP POLICY IF EXISTS "Anon read tracked inventory" ON inventory_items;
CREATE POLICY "Anon read tracked inventory"
  ON inventory_items FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated customers read tracked inventory" ON inventory_items;
CREATE POLICY "Authenticated customers read tracked inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);
