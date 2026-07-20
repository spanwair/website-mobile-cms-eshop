-- Track who created each role for ownership-based visibility.
-- Owners see all global roles; eshop_admin+ see only roles created by members
-- of their own organisations (or roles with no creator, e.g. seeded by migrations).

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS created_by UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.roles ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Drop previous blanket policies
DROP POLICY IF EXISTS "Admins read global roles" ON public.roles;
DROP POLICY IF EXISTS "Owners manage global roles" ON public.roles;
DROP POLICY IF EXISTS "Create global roles" ON public.roles;
DROP POLICY IF EXISTS "Update global roles" ON public.roles;
DROP POLICY IF EXISTS "Delete global roles" ON public.roles;

-- SELECT: owners see all; eshop_admin+ sees roles whose creator shares an org
--         with them, or roles with no creator (seeded/migration roles).
CREATE POLICY "Read global roles" ON public.roles
  FOR SELECT USING (
    party_id IS NULL AND (
      get_my_role() >= 8
      OR (
        get_my_role() >= 2 AND (
          created_by IS NULL
          OR created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.user_party_roles upr_creator
            JOIN public.user_party_roles upr_me
              ON upr_creator.party_id = upr_me.party_id
            WHERE upr_creator.user_id = roles.created_by
              AND upr_me.user_id = auth.uid()
          )
        )
      )
    )
  );

-- INSERT: eshop_admin+ can create global roles (created_by auto-set to auth.uid())
CREATE POLICY "Create global roles" ON public.roles
  FOR INSERT WITH CHECK (party_id IS NULL AND get_my_role() >= 2);

-- UPDATE: owner or original creator
CREATE POLICY "Update global roles" ON public.roles
  FOR UPDATE
  USING (is_owner() OR (created_by = auth.uid() AND get_my_role() >= 2))
  WITH CHECK (is_owner() OR (created_by = auth.uid() AND get_my_role() >= 2));

-- DELETE: owner or original creator
CREATE POLICY "Delete global roles" ON public.roles
  FOR DELETE USING (is_owner() OR (created_by = auth.uid() AND get_my_role() >= 2));
