-- The enforce_role_hierarchy trigger blocks any UPDATE of profiles.role when
-- the caller's effective role (get_my_role()) <= the new role value.
-- This prevents eshop_admins (role=2) from bumping users to role=2, and also
-- blocks the service-role path (auth.uid()=NULL → get_my_role()=1).
-- Fix: allow 1→2 promotions when the caller is eshop_admin+ OR the service role.

CREATE OR REPLACE FUNCTION enforce_role_hierarchy()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  my_role SMALLINT;
BEGIN
  IF NEW.role = OLD.role THEN RETURN NEW; END IF;

  -- Service-role operations (migrations, edge functions) bypass the hierarchy check.
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  IF NEW.id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  my_role := get_my_role();

  -- Party invite flow: any eshop_admin+ can promote a plain user (role=1) to eshop_admin (role=2).
  -- This is the minimum needed to grant admin panel access after a party invite.
  IF OLD.role = 1 AND NEW.role = 2 AND my_role >= 2 THEN RETURN NEW; END IF;

  IF my_role <= OLD.role THEN
    RAISE EXCEPTION 'Insufficient privilege: target user has equal or higher role';
  END IF;
  IF my_role <= NEW.role THEN
    RAISE EXCEPTION 'Insufficient privilege: cannot assign a role equal to or above your own';
  END IF;

  RETURN NEW;
END;
$$;

-- Also relax the profiles UPDATE RLS so an eshop_admin can set a user's role to 2.
-- The trigger above provides the fine-grained check (only 1→2 allowed, not 1→4).
DROP POLICY IF EXISTS "Higher roles can update lower role profiles" ON profiles;
CREATE POLICY "Higher roles can update lower role profiles"
  ON profiles FOR UPDATE
  USING (get_my_role() > role OR (role = 1 AND get_my_role() >= 2))
  WITH CHECK (get_my_role() > role OR (role = 2 AND get_my_role() >= 2));

-- Atomically bump role to eshop_admin when a user is added to any party.
-- SECURITY DEFINER so it runs as the function owner and bypasses per-row RLS.
CREATE OR REPLACE FUNCTION on_user_party_role_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE profiles SET role = 2 WHERE id = NEW.user_id AND role < 2;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_eshop_admin_on_party_add ON user_party_roles;
CREATE TRIGGER trg_ensure_eshop_admin_on_party_add
  AFTER INSERT ON user_party_roles
  FOR EACH ROW EXECUTE FUNCTION on_user_party_role_insert();

-- Backfill: existing party members who still have role=1 get bumped to role=2.
-- This runs AFTER enforce_role_hierarchy is patched above, so auth.uid()=NULL
-- (migration context) hits the early-return bypass and the UPDATE succeeds.
UPDATE profiles
SET role = 2
WHERE role = 1
  AND id IN (SELECT DISTINCT user_id FROM user_party_roles);
