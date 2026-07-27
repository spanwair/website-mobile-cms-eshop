-- MANAGE_CMS (2048): blog posts and team member profiles.

CREATE TABLE IF NOT EXISTS blog_posts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id          UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  slug              TEXT        NOT NULL,
  excerpt           TEXT,
  content           TEXT,
  content_format    TEXT        NOT NULL DEFAULT 'markdown' CHECK (content_format IN ('markdown','html')),
  featured_image_url TEXT,
  author_name       TEXT,
  status            TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at      TIMESTAMPTZ,
  seo_title         TEXT,
  seo_description   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, slug)
);

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_blog_posts_party_status ON blog_posts(party_id, status, published_at DESC);

CREATE TABLE IF NOT EXISTS team_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  position   TEXT,
  bio        TEXT,
  photo_url  TEXT,
  sort_order INT         NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE blog_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published blog_posts"
  ON blog_posts FOR SELECT TO anon, authenticated
  USING (status = 'published' AND EXISTS (SELECT 1 FROM parties WHERE id = blog_posts.party_id AND status = 'active'));

CREATE POLICY "CMS managers manage blog_posts"
  ON blog_posts FOR ALL TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 2048));

CREATE POLICY "Public read active team_members"
  ON team_members FOR SELECT TO anon, authenticated
  USING (is_active AND EXISTS (SELECT 1 FROM parties WHERE id = team_members.party_id AND status = 'active'));

CREATE POLICY "CMS managers manage team_members"
  ON team_members FOR ALL TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 2048))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 2048));

GRANT SELECT ON blog_posts, team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_posts, team_members TO authenticated;
