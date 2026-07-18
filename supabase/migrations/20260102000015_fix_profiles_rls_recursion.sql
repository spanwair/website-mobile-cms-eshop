-- Fix infinite recursion in profiles RLS policies.
-- The previous migration used EXISTS (SELECT 1 FROM profiles ...) inside profiles policies,
-- which causes infinite recursion in PostgreSQL. Replace with get_my_role() SECURITY DEFINER.

DROP POLICY IF EXISTS "profiles_owner_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read_party" ON public.profiles;
DROP POLICY IF EXISTS "profiles_eshop_admin_read_party" ON public.profiles;

-- Owners (role=8) see all profiles
CREATE POLICY "profiles_owner_read_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (get_my_role() >= 8);

-- Admins (role=4) see party members with role < 8
CREATE POLICY "profiles_admin_read_party" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    role < 8 AND
    get_my_role() = 4 AND
    id IN (
      SELECT upr.user_id FROM public.user_party_roles upr
      WHERE upr.party_id IN (
        SELECT party_id FROM public.user_party_roles WHERE user_id = auth.uid()
      )
    )
  );

-- Eshop Admins (role=2) see party members with role <= 2
CREATE POLICY "profiles_eshop_admin_read_party" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    role <= 2 AND
    get_my_role() = 2 AND
    id IN (
      SELECT upr.user_id FROM public.user_party_roles upr
      WHERE upr.party_id IN (
        SELECT party_id FROM public.user_party_roles WHERE user_id = auth.uid()
      )
    )
  );
