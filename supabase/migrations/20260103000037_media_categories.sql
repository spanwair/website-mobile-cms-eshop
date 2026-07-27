-- Custom, per-org tags for organizing the store's media library — independent of the
-- storefront's product `categories` table, optional, and only ever used inside the admin
-- media picker (never rendered on the storefront).

CREATE TABLE IF NOT EXISTS media_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, name)
);

CREATE INDEX IF NOT EXISTS idx_media_categories_party_id ON media_categories(party_id);

CREATE TABLE IF NOT EXISTS media_category_assignments (
  media_id    UUID NOT NULL REFERENCES store_media(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES media_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_media_category_assignments_category_id ON media_category_assignments(category_id);

ALTER TABLE media_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_category_assignments ENABLE ROW LEVEL SECURITY;

-- Same gate as store_media itself (MANAGE_SETTINGS bit / owner) — no anon policy, these tags
-- never need to be visible outside the admin panel.
CREATE POLICY "Settings managers manage media_categories"
  ON media_categories FOR ALL
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

-- Joins through both media_categories and store_media so a category can never be attached to
-- another org's media item, even by guessing a UUID — the two must share the same party_id.
CREATE POLICY "Settings managers manage media_category_assignments"
  ON media_category_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media_categories mc
      JOIN store_media sm ON sm.id = media_id AND sm.party_id = mc.party_id
      WHERE mc.id = category_id
        AND (is_owner() OR user_has_permission(auth.uid(), mc.party_id, 1024))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM media_categories mc
      JOIN store_media sm ON sm.id = media_id AND sm.party_id = mc.party_id
      WHERE mc.id = category_id
        AND (is_owner() OR user_has_permission(auth.uid(), mc.party_id, 1024))
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON media_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON media_category_assignments TO authenticated;
