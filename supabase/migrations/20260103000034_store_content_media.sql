-- Per-org custom Hero/Subhero/Footer content (markdown or raw HTML, sanitized at render time
-- in website/src/lib/contentRenderer.ts) plus a small per-party media library so admins can
-- reference uploaded images/videos from those content fields via a {{media:slug}} token.

ALTER TABLE store_configs
  ADD COLUMN IF NOT EXISTS hero_content    TEXT,
  ADD COLUMN IF NOT EXISTS hero_format     TEXT NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS subhero_content TEXT,
  ADD COLUMN IF NOT EXISTS subhero_format  TEXT NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS footer_content  TEXT,
  ADD COLUMN IF NOT EXISTS footer_format   TEXT NOT NULL DEFAULT 'markdown';

ALTER TABLE store_configs
  ADD CONSTRAINT store_configs_hero_format_check    CHECK (hero_format IN ('markdown', 'html')),
  ADD CONSTRAINT store_configs_subhero_format_check CHECK (subhero_format IN ('markdown', 'html')),
  ADD CONSTRAINT store_configs_footer_format_check  CHECK (footer_format IN ('markdown', 'html'));

CREATE TABLE IF NOT EXISTS store_media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  slug        TEXT        NOT NULL,
  media_type  TEXT        NOT NULL CHECK (media_type IN ('image', 'video')),
  url         TEXT        NOT NULL,
  alt         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_store_media_party_id ON store_media(party_id);

ALTER TABLE store_media ENABLE ROW LEVEL SECURITY;

-- Public read so the storefront can resolve {{media:slug}} tokens without auth, mirroring the
-- existing "Public read store_configs of active parties" policy.
CREATE POLICY "Public read store_media of active parties"
  ON store_media FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM parties WHERE id = store_media.party_id AND status = 'active')
  );

CREATE POLICY "Settings managers manage store_media"
  ON store_media FOR ALL
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

GRANT SELECT ON store_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON store_media TO authenticated;

-- Storage bucket for hero/subhero/footer media (100 MB max, mirrors product-videos limit).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-media',
  'store-media',
  true,
  104857600,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/ogg','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload_store_media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-media');

CREATE POLICY "auth_delete_store_media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-media');

CREATE POLICY "public_read_store_media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'store-media');
