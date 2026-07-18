-- Replace overly-permissive profile read policies with role-hierarchy-aware ones.
-- The website uses the anon key + user JWT, so these RLS policies apply.
-- Application-level filtering in fetchUsersForAdmin is the primary enforcement;
-- these policies add defence-in-depth.

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read_party" ON public.profiles;
DROP POLICY IF EXISTS "profiles_eshop_admin_read_party" ON public.profiles;

-- Owners (role=8) can read all profiles
CREATE POLICY "profiles_owner_read_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role >= 8
    )
  );

-- Admins (role=4) can read profiles in their party where role < 8
CREATE POLICY "profiles_admin_read_party" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    role < 8 AND
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 4) AND
    id IN (
      SELECT upr.user_id FROM public.user_party_roles upr
      WHERE upr.party_id IN (
        SELECT party_id FROM public.user_party_roles WHERE user_id = auth.uid()
      )
    )
  );

-- Eshop Admins (role=2) can read profiles with role ≤ 2 in their party
CREATE POLICY "profiles_eshop_admin_read_party" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    role <= 2 AND
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 2) AND
    id IN (
      SELECT upr.user_id FROM public.user_party_roles upr
      WHERE upr.party_id IN (
        SELECT party_id FROM public.user_party_roles WHERE user_id = auth.uid()
      )
    )
  );
