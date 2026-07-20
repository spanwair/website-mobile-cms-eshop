-- Convert roles from party-specific to global (party_id = NULL).
-- All parties share the same custom roles; "Super Admin" system roles are removed.

-- 1. Remove memberships that reference system roles before deleting them
DELETE FROM public.user_party_roles
WHERE role_id IN (SELECT id FROM public.roles WHERE is_system = true);

-- 2. Remove system roles
DELETE FROM public.roles WHERE is_system = true;

-- 3. Deduplicate: many parties had identical role names (Editor, Manager, Viewer, ...).
--    For each unique name keep the row with the minimum id and redirect any
--    user_party_roles that pointed at a duplicate.
DO $$
DECLARE
  r RECORD;
  keep_id UUID;
BEGIN
  FOR r IN
    SELECT lower(name) AS lname
    FROM public.roles
    GROUP BY lower(name)
    HAVING count(*) > 1
  LOOP
    -- canonical = minimum id among all roles with this name
    SELECT id INTO keep_id
    FROM public.roles
    WHERE lower(name) = r.lname
    ORDER BY id
    LIMIT 1;

    -- redirect memberships
    UPDATE public.user_party_roles
    SET role_id = keep_id
    WHERE role_id IN (
      SELECT id FROM public.roles WHERE lower(name) = r.lname AND id <> keep_id
    );

    -- drop duplicates
    DELETE FROM public.roles
    WHERE lower(name) = r.lname AND id <> keep_id;
  END LOOP;
END;
$$;

-- 4. Drop party-specific constraints so party_id can be NULL
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_party_id_name_key;
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_party_id_fkey;

-- 5. Make party_id nullable and set all remaining roles to global
ALTER TABLE public.roles ALTER COLUMN party_id DROP NOT NULL;
UPDATE public.roles SET party_id = NULL;

-- 6. Re-add FK as nullable (cascade keeps clean-up if a party is deleted)
ALTER TABLE public.roles
  ADD CONSTRAINT roles_party_id_fkey
  FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;

-- 7. Enforce unique names among global roles
CREATE UNIQUE INDEX roles_global_name_unique ON public.roles (lower(name)) WHERE party_id IS NULL;

-- 8. Stop auto-creating per-party roles on new party INSERT
CREATE OR REPLACE FUNCTION create_party_super_admin_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- 9. Update RLS: all eshop_admin+ users can read global roles; only owners manage them
DROP POLICY IF EXISTS "Party members can read roles" ON public.roles;
DROP POLICY IF EXISTS "Owners read all roles" ON public.roles;
DROP POLICY IF EXISTS "Owners or party admins manage roles" ON public.roles;

CREATE POLICY "Admins read global roles" ON public.roles
  FOR SELECT USING (get_my_role() >= 2);

CREATE POLICY "Owners manage global roles" ON public.roles
  FOR ALL USING (is_owner());
