-- Wishlist: logged-in customers can save products for later.
-- One wishlist per user per party. Price-drop notifications triggered via Edge Function.

CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (party_id, user_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id  UUID        NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id   UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id   UUID        REFERENCES product_variants(id) ON DELETE SET NULL,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_at  TIMESTAMPTZ,
  UNIQUE (wishlist_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user    ON wishlists(user_id, party_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items   ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist_items(product_id);

ALTER TABLE wishlists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User owns wishlist" ON wishlists;
CREATE POLICY "User owns wishlist"
  ON wishlists FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User owns wishlist items" ON wishlist_items;
CREATE POLICY "User owns wishlist items"
  ON wishlist_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_items.wishlist_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_items.wishlist_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins read party wishlists" ON wishlists;
CREATE POLICY "Admins read party wishlists"
  ON wishlists FOR SELECT
  USING (user_has_permission(auth.uid(), party_id, 256));

GRANT SELECT, INSERT, UPDATE, DELETE ON wishlists      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wishlist_items TO authenticated;
