-- Replace app_role ENUM with SMALLINT bit values.
-- Hierarchy (higher value = higher privilege):
--   owner=8  admin=4  eshop_admin=2  user=1
-- A user can only assign roles with a strictly lower value than their own.

BEGIN;

-- 1. Add integer column alongside the enum column
ALTER TABLE profiles ADD COLUMN role_int SMALLINT NOT NULL DEFAULT 1;

-- 2. Migrate existing enum values
UPDATE profiles SET role_int = CASE role::text
  WHEN 'owner'       THEN 8
  WHEN 'admin'       THEN 4
  WHEN 'eshop_admin' THEN 2
  ELSE                    1
END;

-- 3. Swap out the old column
ALTER TABLE profiles DROP COLUMN role;
ALTER TABLE profiles RENAME COLUMN role_int TO role;

-- 4. Remove the enum type (no longer needed)
DROP TYPE IF EXISTS app_role;

-- 5. Security-definer helpers (bypass RLS to avoid recursion)

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS SMALLINT LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE((SELECT role FROM profiles WHERE id = auth.uid()), 1);
$$;

-- can_access_admin: eshop_admin (2) and above
CREATE OR REPLACE FUNCTION can_access_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT get_my_role() >= 2;
$$;

-- is_admin: admin (4) and above — used by existing items RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT get_my_role() >= 4;
$$;

-- 6. Trigger: enforce role-assignment hierarchy on every role change
CREATE OR REPLACE FUNCTION enforce_role_hierarchy()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  my_role SMALLINT;
BEGIN
  -- No role change — nothing to validate
  IF NEW.role = OLD.role THEN RETURN NEW; END IF;

  -- Changing your own role is never allowed
  IF NEW.id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  my_role := get_my_role();

  -- Must be strictly above both the current role and the new role
  IF my_role <= OLD.role THEN
    RAISE EXCEPTION 'Insufficient privilege: target user has equal or higher role';
  END IF;
  IF my_role <= NEW.role THEN
    RAISE EXCEPTION 'Insufficient privilege: cannot assign a role equal to or above your own';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_role_hierarchy ON profiles;
CREATE TRIGGER trg_enforce_role_hierarchy
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_role_hierarchy();

-- 7. Update profiles RLS — replace flat admin-only policy with hierarchy policy

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- RLS double-checks hierarchy at the row level:
--   USING:      updater's role > OLD.role  (can touch this row)
--   WITH CHECK: updater's role > NEW.role  (can assign this new role)
-- The trigger above provides a belt-and-suspenders enforcement inside the transaction.
CREATE POLICY "Higher roles can update lower role profiles"
  ON profiles FOR UPDATE
  USING     (get_my_role() > role)
  WITH CHECK (get_my_role() > role);

COMMIT;
