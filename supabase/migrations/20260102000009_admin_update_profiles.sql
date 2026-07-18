-- Admins can update any profile row (e.g. to change roles).
-- is_admin() is a SECURITY DEFINER function that checks role = 'admin',
-- so only top-level admins can update other users — eshop_admin cannot.
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin());
