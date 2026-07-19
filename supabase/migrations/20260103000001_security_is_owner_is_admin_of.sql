-- is_owner(): only global role=8 crosses party boundaries
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT get_my_role() >= 8;
$$;

-- is_admin_of(party_id): admin who is actually a member of this specific party
CREATE OR REPLACE FUNCTION is_admin_of(p_party_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT is_admin() AND EXISTS (
    SELECT 1 FROM user_party_roles
    WHERE user_id = auth.uid() AND party_id = p_party_id
  );
$$;
