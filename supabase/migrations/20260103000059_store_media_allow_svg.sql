-- store-media currently rejects SVG uploads, but the CMS media library (ImagePicker /
-- MediaPickerModal) is meant to be the single place admins manage every image, including
-- simple vector icons (e.g. category art). Without this, SVG-based imagery can only ever
-- live as a hardcoded file in website/public — not admin-editable, violating the
-- "everything adjustable through the admin panel" rule.
UPDATE storage.buckets
SET allowed_mime_types = allowed_mime_types || ARRAY['image/svg+xml']
WHERE id = 'store-media'
  AND NOT ('image/svg+xml' = ANY(allowed_mime_types));
