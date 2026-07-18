-- Fix: system admins (role >= 4) can create and read all parties.
-- Previously parties had no INSERT grant/policy and SELECT was limited
-- to party members only, so admins could not bootstrap the first party.

GRANT INSERT ON parties TO authenticated;

CREATE POLICY "Admins can create parties"
  ON parties FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can read all parties"
  ON parties FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can delete parties"
  ON parties FOR DELETE
  USING (is_admin());

-- Also fix roles visibility: admins can read all roles across parties
CREATE POLICY "Admins can read all roles"
  ON roles FOR SELECT
  USING (is_admin());
