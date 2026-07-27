-- Org-scoped custom color templates. Any settings manager can save the current color
-- picker values as a reusable preset; it then shows up alongside the built-in
-- DESIGN_PRESETS for everyone in that org, never across orgs.

CREATE TABLE IF NOT EXISTS party_color_presets (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id              UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name                  TEXT        NOT NULL,
  color_primary         TEXT        NOT NULL,
  color_secondary       TEXT        NOT NULL,
  color_background      TEXT        NOT NULL,
  color_surface         TEXT        NOT NULL,
  color_text_primary    TEXT        NOT NULL,
  color_text_secondary  TEXT        NOT NULL,
  color_border          TEXT        NOT NULL,
  created_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(party_id, name),
  CONSTRAINT party_color_presets_name_check              CHECK (char_length(trim(name)) BETWEEN 1 AND 60),
  CONSTRAINT party_color_presets_color_primary_check        CHECK (color_primary        ~ '^#[0-9a-fA-F]{3,8}$'),
  CONSTRAINT party_color_presets_color_secondary_check       CHECK (color_secondary       ~ '^#[0-9a-fA-F]{3,8}$'),
  CONSTRAINT party_color_presets_color_background_check      CHECK (color_background      ~ '^#[0-9a-fA-F]{3,8}$'),
  CONSTRAINT party_color_presets_color_surface_check         CHECK (color_surface         ~ '^#[0-9a-fA-F]{3,8}$'),
  CONSTRAINT party_color_presets_color_text_primary_check    CHECK (color_text_primary    ~ '^#[0-9a-fA-F]{3,8}$'),
  CONSTRAINT party_color_presets_color_text_secondary_check  CHECK (color_text_secondary  ~ '^#[0-9a-fA-F]{3,8}$'),
  CONSTRAINT party_color_presets_color_border_check          CHECK (color_border          ~ '^#[0-9a-fA-F]{3,8}$')
);

CREATE INDEX IF NOT EXISTS idx_party_color_presets_party_id ON party_color_presets(party_id);

ALTER TABLE party_color_presets ENABLE ROW LEVEL SECURITY;

-- Same gate as store_configs itself (MANAGE_SETTINGS bit / owner) — presets are only ever
-- read or written from the branding settings page, so no anon/public policy is needed.
CREATE POLICY "Settings managers manage party_color_presets"
  ON party_color_presets FOR ALL
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

GRANT SELECT, INSERT, UPDATE, DELETE ON party_color_presets TO authenticated;
