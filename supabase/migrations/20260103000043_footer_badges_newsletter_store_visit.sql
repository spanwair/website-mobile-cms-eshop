-- Footer badges (shipping carriers, payment methods, social links, "visit our store" feature
-- bullets) — structurally identical (icon/label/url/sort/visible), differing only in where the
-- storefront renders them, so one table with a `kind` discriminator instead of four near-
-- duplicate tables. Also: newsletter_subscribers (the signup form already existed but its API
-- was a stub — wiring it up here) and store visit fields on store_configs.

CREATE TABLE IF NOT EXISTS footer_badges (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  kind       TEXT        NOT NULL CHECK (kind IN ('shipping', 'payment', 'social', 'store_feature')),
  label      TEXT        NOT NULL,
  icon       TEXT,
  url        TEXT,
  sort_order INT         NOT NULL DEFAULT 0,
  is_visible BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER footer_badges_updated_at
  BEFORE UPDATE ON footer_badges FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_footer_badges_party_kind ON footer_badges(party_id, kind, sort_order);

ALTER TABLE footer_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visible footer_badges"
  ON footer_badges FOR SELECT TO anon, authenticated
  USING (is_visible AND party_is_active(party_id));

-- MANAGE_SETTINGS = 1024 — same area as footer_links/hero_slides/benefit_items.
CREATE POLICY "Settings managers manage footer_badges"
  ON footer_badges FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

GRANT SELECT ON footer_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON footer_badges TO authenticated;

-- Newsletter subscribers ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id        UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL,
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(party_id, email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_party ON newsletter_subscribers(party_id);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anon can subscribe (INSERT/UPDATE their own email) but never read the list — that's a
-- MANAGE_SETTINGS-only export/report concern, not something the public signup form needs.
CREATE POLICY "Anon can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (party_is_active(party_id));

CREATE POLICY "Anon can resubscribe"
  ON newsletter_subscribers FOR UPDATE TO anon, authenticated
  USING (party_is_active(party_id))
  WITH CHECK (party_is_active(party_id));

CREATE POLICY "Settings managers read newsletter_subscribers"
  ON newsletter_subscribers FOR SELECT TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

GRANT INSERT, UPDATE ON newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE ON newsletter_subscribers TO authenticated;

-- Store visit fields on store_configs -----------------------------------------------------------
ALTER TABLE store_configs
  ADD COLUMN IF NOT EXISTS store_address  TEXT,
  ADD COLUMN IF NOT EXISTS store_map_url  TEXT,
  ADD COLUMN IF NOT EXISTS store_photo_url TEXT;
