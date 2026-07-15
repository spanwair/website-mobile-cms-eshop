-- Security-definer function bypasses RLS when checking admin role,
-- preventing infinite recursion in policies that query profiles.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Fix profiles admin policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Fix items admin policy
DROP POLICY IF EXISTS "Admins full access items" ON items;
CREATE POLICY "Admins full access items"
  ON items FOR ALL
  USING (is_admin());
