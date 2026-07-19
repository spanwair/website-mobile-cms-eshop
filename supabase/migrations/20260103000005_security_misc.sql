-- Fix reviews INSERT: party_id must match product's party and submitter must be a member
DROP POLICY IF EXISTS "Authenticated users submit reviews" ON product_reviews;
CREATE POLICY "Party members submit reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    party_id = (SELECT p.party_id FROM products p WHERE p.id = product_id)
    AND EXISTS (
      SELECT 1 FROM user_party_roles
      WHERE user_id = auth.uid() AND party_id = product_reviews.party_id
    )
  );

-- Fix notifications: fan-out target user must be member of the notification's party
DROP POLICY IF EXISTS "Party admins insert user_notifications" ON user_notifications;
CREATE POLICY "Party admins fan out to party members"
  ON user_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = notification_id
        AND user_has_permission(auth.uid(), n.party_id, 2)
    )
    AND EXISTS (
      SELECT 1 FROM user_party_roles upr
      JOIN notifications n ON n.id = user_notifications.notification_id
      WHERE upr.user_id = user_notifications.user_id
        AND upr.party_id = n.party_id
    )
  );

-- Fix profiles.role: restrict to valid role values only
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_valid;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_valid
  CHECK (role IN (1, 2, 4, 8));

-- Add party-scoped coupon lookup index for checkout validation
CREATE INDEX IF NOT EXISTS idx_coupons_party_code ON coupons(party_id, code);

-- Fix storage: restrict product-videos uploads to admin-level users
DROP POLICY IF EXISTS "auth_upload_product_videos" ON storage.objects;
CREATE POLICY "admin_upload_product_videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-videos' AND is_admin());

DROP POLICY IF EXISTS "auth_delete_product_videos" ON storage.objects;
CREATE POLICY "admin_delete_product_videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-videos' AND is_admin());
