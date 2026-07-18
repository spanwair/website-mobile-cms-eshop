-- Create storage bucket for product images (free Supabase storage, public reads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth_upload_product_images" ON storage.objects;
CREATE POLICY "auth_upload_product_images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "auth_delete_product_images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');
