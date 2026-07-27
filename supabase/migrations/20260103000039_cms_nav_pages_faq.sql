-- New MANAGE_CMS (2048) content types: header navigation / mega-menu items,
-- generic content pages (About/Contact/FAQ/etc.), and site FAQ entries.

CREATE TABLE IF NOT EXISTS nav_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id     UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  parent_id    UUID        REFERENCES nav_items(id) ON DELETE CASCADE,
  label        TEXT        NOT NULL,
  url          TEXT,
  category_id  UUID        REFERENCES categories(id) ON DELETE SET NULL,
  column_label TEXT,
  is_mega      BOOLEAN     NOT NULL DEFAULT false,
  sort_order   INT         NOT NULL DEFAULT 0,
  is_visible   BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER nav_items_updated_at
  BEFORE UPDATE ON nav_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_nav_items_party_parent ON nav_items(party_id, parent_id, sort_order);

CREATE TABLE IF NOT EXISTS content_pages (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id              UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  slug                  TEXT        NOT NULL,
  title                 TEXT        NOT NULL,
  template              TEXT        NOT NULL DEFAULT 'default' CHECK (template IN ('default','about','contact','faq')),
  body                  TEXT,
  body_format           TEXT        NOT NULL DEFAULT 'markdown' CHECK (body_format IN ('markdown','html')),
  seo_title             TEXT,
  seo_description       TEXT,
  show_in_footer_column TEXT,
  is_visible            BOOLEAN     NOT NULL DEFAULT true,
  sort_order            INT         NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, slug)
);

CREATE TRIGGER content_pages_updated_at
  BEFORE UPDATE ON content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS faq_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  question   TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  context    TEXT        NOT NULL DEFAULT 'general',
  sort_order INT         NOT NULL DEFAULT 0,
  is_visible BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER faq_items_updated_at
  BEFORE UPDATE ON faq_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_faq_items_party_context ON faq_items(party_id, context, sort_order);

ALTER TABLE nav_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visible nav_items"
  ON nav_items FOR SELECT TO anon, authenticated
  USING (is_visible AND EXISTS (SELECT 1 FROM parties WHERE id = nav_items.party_id AND status = 'active'));

-- MANAGE_CMS = 2048
CREATE POLICY "CMS managers manage nav_items"
  ON nav_items FOR ALL TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 2048));

CREATE POLICY "Public read visible content_pages"
  ON content_pages FOR SELECT TO anon, authenticated
  USING (is_visible AND EXISTS (SELECT 1 FROM parties WHERE id = content_pages.party_id AND status = 'active'));

CREATE POLICY "CMS managers manage content_pages"
  ON content_pages FOR ALL TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 2048));

CREATE POLICY "Public read visible faq_items"
  ON faq_items FOR SELECT TO anon, authenticated
  USING (is_visible AND EXISTS (SELECT 1 FROM parties WHERE id = faq_items.party_id AND status = 'active'));

CREATE POLICY "CMS managers manage faq_items"
  ON faq_items FOR ALL TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 2048));

GRANT SELECT ON nav_items, content_pages, faq_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON nav_items, content_pages, faq_items TO authenticated;
