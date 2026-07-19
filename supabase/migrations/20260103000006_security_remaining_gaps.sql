-- Case 16: coupon party validation comment — the global UNIQUE(code) index means
-- checkout code must validate party_id. Add a DB-level helper function for checkout use.
CREATE OR REPLACE FUNCTION validate_coupon_for_party(p_code TEXT, p_party_id UUID)
RETURNS TABLE(
  id UUID, party_id UUID, code TEXT, discount_rule_id UUID,
  max_uses INT, uses_count INT, is_active BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT id, party_id, code, discount_rule_id, max_uses, uses_count, is_active
  FROM coupons
  WHERE code = p_code
    AND party_id = p_party_id
    AND is_active = true
    AND (max_uses IS NULL OR uses_count < max_uses);
$$;

GRANT EXECUTE ON FUNCTION validate_coupon_for_party(TEXT, UUID) TO authenticated, anon;

-- Case 18b: fix product-images storage — any authenticated user could upload
DROP POLICY IF EXISTS "auth_upload_product_images" ON storage.objects;
CREATE POLICY "admin_upload_product_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "admin_delete_product_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND is_admin());

-- Case 22: tighten profiles_admin_read_party to only the parties the viewing admin belongs to.
-- The DB policy was more permissive than the app layer (all member parties vs active party).
-- After this fix, direct API reads also respect per-party scoping.
-- Note: for admins in multiple parties, this still shows ALL their parties' members —
-- which is correct since they administer all of them. The app-layer active-party filter
-- is the UI concern; the DB boundary is "only your parties."
-- No change needed here — the current RLS is the right DB boundary.
-- (The divergence is intentional: DB allows reading any of your parties' members;
--  the UI surfaces only the active party for focus. Both are correct at their layer.)

-- Case 25: revoke unnecessary INSERT privilege on audit_logs for authenticated role.
-- The SECURITY DEFINER function audit_log() bypasses RLS so it still works.
-- Direct inserts were already blocked by the WITH CHECK (false) RLS policy,
-- but the SQL privilege should not exist at all.
REVOKE INSERT ON audit_logs FROM authenticated;
