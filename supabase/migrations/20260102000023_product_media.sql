-- Add media_type to product_images so videos can be stored alongside images.
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

-- Storage bucket for product videos (100 MB max per file).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  104857600,
  ARRAY['video/mp4','video/webm','video/ogg','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth_upload_product_videos" ON storage.objects;
CREATE POLICY "auth_upload_product_videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "auth_delete_product_videos" ON storage.objects;
CREATE POLICY "auth_delete_product_videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "public_read_product_videos" ON storage.objects;
CREATE POLICY "public_read_product_videos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-videos');
