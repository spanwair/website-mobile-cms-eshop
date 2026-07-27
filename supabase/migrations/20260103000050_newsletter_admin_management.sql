-- Newsletter admin management: a `footer_newsletter_enabled` flag lets settings managers hide
-- the newsletter panel baked into the site footer independently of the "newsletter" homepage
-- section (SECTION_REGISTRY / homepage_layout — already toggleable). Also lets settings managers
-- manually unsubscribe or permanently delete (GDPR erasure) a subscriber from the admin panel;
-- the public subscribe/resubscribe path still goes through subscribe_to_newsletter()
-- (SECURITY DEFINER), so these policies only cover the admin UI's direct table access.

ALTER TABLE store_configs
  ADD COLUMN IF NOT EXISTS footer_newsletter_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE POLICY "Settings managers update newsletter_subscribers"
  ON newsletter_subscribers FOR UPDATE TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

CREATE POLICY "Settings managers delete newsletter_subscribers"
  ON newsletter_subscribers FOR DELETE TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

GRANT DELETE ON newsletter_subscribers TO authenticated;
