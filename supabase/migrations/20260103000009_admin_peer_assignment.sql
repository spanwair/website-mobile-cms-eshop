-- Track who promoted a user to role=4 (admin).
-- Enables: admin can promote peers (within shared party) and demote only those they promoted.
ALTER TABLE profiles ADD COLUMN admin_assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION enforce_role_hierarchy()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  my_role SMALLINT;
  shares_party BOOLEAN;
BEGIN
  IF NEW.role = OLD.role THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  my_role := get_my_role();

  -- Owner: assign any role below owner
  IF my_role >= 8 THEN
    IF NEW.role >= 8 THEN
      RAISE EXCEPTION 'Cannot assign the owner role';
    END IF;
    NEW.admin_assigned_by := CASE WHEN NEW.role = 4 THEN auth.uid() ELSE NULL END;
    RETURN NEW;
  END IF;

  -- Admin promoting a non-admin to admin: must share at least one party
  IF my_role = 4 AND OLD.role < 4 AND NEW.role = 4 THEN
    SELECT EXISTS (
      SELECT 1 FROM user_party_roles a
      JOIN user_party_roles b ON b.party_id = a.party_id
      WHERE a.user_id = auth.uid() AND b.user_id = NEW.id
    ) INTO shares_party;
    IF NOT shares_party THEN
      RAISE EXCEPTION 'Admin can only promote users within their own organization';
    END IF;
    NEW.admin_assigned_by := auth.uid();
    RETURN NEW;
  END IF;

  -- Admin demoting another admin: only allowed if they were the assigner
  IF my_role = 4 AND OLD.role = 4 AND NEW.role < 4 THEN
    IF OLD.admin_assigned_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Can only demote an admin you promoted';
    END IF;
    NEW.admin_assigned_by := NULL;
    RETURN NEW;
  END IF;

  -- Party-invite bump: eshop_admin+ may promote user (1) to eshop_admin (2)
  IF OLD.role = 1 AND NEW.role = 2 AND my_role >= 2 THEN RETURN NEW; END IF;

  -- Default hierarchy: must be strictly above both current and target role
  IF my_role <= OLD.role THEN
    RAISE EXCEPTION 'Insufficient privilege: target user has equal or higher role';
  END IF;
  IF my_role <= NEW.role THEN
    RAISE EXCEPTION 'Insufficient privilege: cannot assign a role equal to or above your own';
  END IF;

  RETURN NEW;
END;
$$;

-- Allow admin to touch peer-admin rows they own, and to set role=4 (trigger validates party)
DROP POLICY IF EXISTS "Higher roles can update lower role profiles" ON profiles;
CREATE POLICY "Higher roles can update lower role profiles"
  ON profiles FOR UPDATE
  USING (
    get_my_role() > role
    OR (role = 1 AND get_my_role() >= 2)
    OR (role = 4 AND get_my_role() = 4 AND admin_assigned_by = auth.uid())
  )
  WITH CHECK (
    get_my_role() > role
    OR (role = 2 AND get_my_role() >= 2)
    OR (role = 4 AND get_my_role() = 4)
  );
