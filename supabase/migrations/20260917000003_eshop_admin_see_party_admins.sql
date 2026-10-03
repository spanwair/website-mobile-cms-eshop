-- Eshop_admins (role=2) could not see the admins of their own party in /admin/users,
-- including the admin who invited them. The read policy (last set by 20260102000015)
-- capped their profile visibility at role <= 2, hiding every admin (role=4).
--
-- Widen it to role < 8: an eshop_admin now sees every member of their party except owners,
-- matching profiles_admin_read_party. They still cannot modify admins - the profiles UPDATE
-- policy (is_admin()) blocks eshop_admin writes, and the /admin/users form is gated by
-- canChangeUser. This is read-only transparency about who manages the org.
--
-- Uses get_my_role() (SECURITY DEFINER), never EXISTS(SELECT ... FROM profiles ...), to avoid
-- the infinite-recursion trap fixed in 20260102000015.

DROP POLICY IF EXISTS "profiles_eshop_admin_read_party" ON public.profiles;

CREATE POLICY "profiles_eshop_admin_read_party" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    role < 8 AND
    get_my_role() = 2 AND
    id IN (
      SELECT upr.user_id FROM public.user_party_roles upr
      WHERE upr.party_id IN (
        SELECT party_id FROM public.user_party_roles WHERE user_id = auth.uid()
      )
    )
  );

-- Second blocker: user_party_roles read policy only let actual admins (is_admin_of, role=4)
-- read other members' memberships. An eshop_admin therefore saw only their own row, so
-- fetchUsersForAdmin never even collected the admin's user_id into memberIds. Grant read to
-- any member holding MANAGE_USERS (bit 2) via user_has_permission - the same bit that lets
-- them reach /admin/users. is_admin_of is kept as a separate OR term so admins never regress
-- even if their effective permission mask ever lacks bit 2. All three helpers are
-- SECURITY DEFINER, so no recursion against user_party_roles.
DROP POLICY IF EXISTS "Owners or party admins read memberships" ON public.user_party_roles;

CREATE POLICY "Owners or party admins read memberships" ON public.user_party_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_owner()
    OR is_admin_of(party_id)
    OR user_has_permission(auth.uid(), party_id, (2)::bigint)
  );
