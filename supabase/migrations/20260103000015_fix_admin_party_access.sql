-- Fix three interrelated admin access bugs introduced by 20260103000002 and 20260103000012.
--
-- CRITICAL-1: Existing admins (role=4) have zero user_party_roles entries because
--   20260103000012 deleted system-role memberships and the backfill in 20260103000014
--   was added after Supabase had already tracked that migration as applied.
--
-- CRITICAL-2: Admin cannot INSERT parties at DB level — 20260103000002 dropped the
--   "Admins can create parties" policy, leaving only is_owner(). The app (parties/new.astro)
--   still allows admin to submit the form, so DB was rejecting the insert silently.
--
-- CRITICAL-3: No trigger auto-assigns admin to a party they create, so even after
--   CRITICAL-2 is fixed the new party would be invisible to the creating admin.

-- Fix 1: Restore admin INSERT on parties to match app-level guard in parties/new.astro.
DROP POLICY IF EXISTS "Owners create parties" ON parties;
CREATE POLICY "Owners or admins create parties"
  ON parties FOR INSERT
  WITH CHECK (is_owner() OR is_admin());

-- Fix 2: Auto-assign admin to any party they create.
-- Finds the highest-permissions global role as the FK placeholder — the admin's effective
-- permissions come from profiles.role=4 → ALL_PERMISSIONS in requireAdminCtx, not from
-- this role's bitmask. Owner is skipped because is_owner() sees all parties without
-- needing a user_party_roles entry.
CREATE OR REPLACE FUNCTION assign_admin_to_new_party()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_role_id UUID;
BEGIN
  IF get_my_role() != 4 THEN RETURN NEW; END IF;
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE party_id IS NULL
  ORDER BY permissions DESC
  LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.user_party_roles (user_id, party_id, role_id)
    VALUES (auth.uid(), NEW.id, v_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_party_created_assign_admin ON parties;
CREATE TRIGGER on_party_created_assign_admin
  AFTER INSERT ON parties
  FOR EACH ROW EXECUTE FUNCTION assign_admin_to_new_party();

-- Fix 3: Backfill user_party_roles for every admin with zero memberships.
-- Uses the highest-permissions global role ("Party Admin", permissions=65535, created by
-- 20260103000014) as the FK. Only touches admins with NO entries at all.
DO $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE party_id IS NULL
  ORDER BY permissions DESC
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'No global role found — 20260103000014 must be applied first.';
  END IF;

  INSERT INTO public.user_party_roles (user_id, party_id, role_id)
  SELECT p.id, pa.id, v_role_id
  FROM public.profiles p
  CROSS JOIN public.parties pa
  WHERE p.role = 4
    AND pa.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.user_party_roles upr WHERE upr.user_id = p.id
    )
  ON CONFLICT DO NOTHING;
END;
$$;
