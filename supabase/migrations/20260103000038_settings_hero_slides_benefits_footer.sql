-- Extends the Settings area (MANAGE_SETTINGS = 1024) with: multi-slide hero banners,
-- a benefits/trust-badges list, structured footer link columns, and a buyback/trade-in
-- promo content block (same markdown|html pattern as the existing hero/subhero/footer blobs).

CREATE TABLE IF NOT EXISTS hero_slides (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id         UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  image_url        TEXT,
  headline         TEXT        NOT NULL,
  subheadline      TEXT,
  cta_text         TEXT,
  cta_link         TEXT,
  overlay_opacity  NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  sort_order       INT         NOT NULL DEFAULT 0,
  is_visible       BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON hero_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS benefit_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  icon        TEXT        NOT NULL DEFAULT '✓',
  title       TEXT        NOT NULL,
  description TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  is_visible  BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER benefit_items_updated_at
  BEFORE UPDATE ON benefit_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS footer_links (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  column_key TEXT        NOT NULL CHECK (column_key IN ('shop','information','customer_service','custom')),
  label      TEXT        NOT NULL,
  url        TEXT        NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  is_visible BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER footer_links_updated_at
  BEFORE UPDATE ON footer_links FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE store_configs
  ADD COLUMN IF NOT EXISTS buyback_content TEXT,
  ADD COLUMN IF NOT EXISTS buyback_format  TEXT NOT NULL DEFAULT 'markdown';

ALTER TABLE store_configs
  ADD CONSTRAINT store_configs_buyback_format_check CHECK (buyback_format IN ('markdown', 'html'));

CREATE INDEX IF NOT EXISTS idx_hero_slides_party    ON hero_slides(party_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_benefit_items_party  ON benefit_items(party_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_footer_links_party   ON footer_links(party_id, column_key, sort_order);

ALTER TABLE hero_slides   ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_links  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visible hero_slides"
  ON hero_slides FOR SELECT TO anon, authenticated
  USING (is_visible AND EXISTS (SELECT 1 FROM parties WHERE id = hero_slides.party_id AND status = 'active'));

CREATE POLICY "Settings managers manage hero_slides"
  ON hero_slides FOR ALL TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 1024));

CREATE POLICY "Public read visible benefit_items"
  ON benefit_items FOR SELECT TO anon, authenticated
  USING (is_visible AND EXISTS (SELECT 1 FROM parties WHERE id = benefit_items.party_id AND status = 'active'));

CREATE POLICY "Settings managers manage benefit_items"
  ON benefit_items FOR ALL TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 1024));

CREATE POLICY "Public read visible footer_links"
  ON footer_links FOR SELECT TO anon, authenticated
  USING (is_visible AND EXISTS (SELECT 1 FROM parties WHERE id = footer_links.party_id AND status = 'active'));

CREATE POLICY "Settings managers manage footer_links"
  ON footer_links FOR ALL TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 1024));

GRANT SELECT ON hero_slides, benefit_items, footer_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON hero_slides, benefit_items, footer_links TO authenticated;
