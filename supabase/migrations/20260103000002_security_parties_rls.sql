-- parties table: scope admin access to their own parties only
DROP POLICY IF EXISTS "Admins can read all parties" ON parties;
DROP POLICY IF EXISTS "Admins can create parties" ON parties;
DROP POLICY IF EXISTS "Admins can update all parties" ON parties;
DROP POLICY IF EXISTS "Admins can delete parties" ON parties;
DROP POLICY IF EXISTS "Party admins can update their party" ON parties;

CREATE POLICY "Members read own parties"
  ON parties FOR SELECT
  USING (
    is_owner()
    OR EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = parties.id)
  );

CREATE POLICY "Owners create parties"
  ON parties FOR INSERT
  WITH CHECK (is_owner());

CREATE POLICY "Owners or party admins update party"
  ON parties FOR UPDATE
  USING (is_owner() OR is_admin_of(id))
  WITH CHECK (is_owner() OR is_admin_of(id));

CREATE POLICY "Owners delete parties"
  ON parties FOR DELETE
  USING (is_owner());

-- roles table
DROP POLICY IF EXISTS "Admins can read all roles" ON roles;
DROP POLICY IF EXISTS "Party admins can manage roles" ON roles;

CREATE POLICY "Owners read all roles"
  ON roles FOR SELECT
  USING (is_owner());

CREATE POLICY "Owners or party admins manage roles"
  ON roles FOR ALL
  USING (is_owner() OR (is_admin_of(party_id) AND user_has_permission(auth.uid(), party_id, 4)))
  WITH CHECK (is_owner() OR (is_admin_of(party_id) AND user_has_permission(auth.uid(), party_id, 4)));

-- user_party_roles table
DROP POLICY IF EXISTS "Party admins manage memberships" ON user_party_roles;
DROP POLICY IF EXISTS "Party admins read party memberships" ON user_party_roles;

CREATE POLICY "Owners or party admins read memberships"
  ON user_party_roles FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_owner()
    OR (is_admin_of(party_id) AND user_has_permission(auth.uid(), party_id, 2))
  );

CREATE POLICY "Owners or party admins manage memberships"
  ON user_party_roles FOR INSERT
  WITH CHECK (
    is_owner()
    OR (is_admin_of(party_id) AND user_has_permission(auth.uid(), party_id, 2))
  );

CREATE POLICY "Owners or party admins delete memberships"
  ON user_party_roles FOR DELETE
  USING (
    is_owner()
    OR (is_admin_of(party_id) AND user_has_permission(auth.uid(), party_id, 2))
  );
