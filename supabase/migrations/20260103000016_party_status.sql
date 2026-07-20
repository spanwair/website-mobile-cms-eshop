-- Replace parties.is_active (boolean) with parties.status (3-state enum).
-- States: 'active' (normal), 'inactive' (Admin can reactivate), 'closed' (Owner-only access).
--
-- Access rules after this migration:
--   active   — Owner + Admin (and members with user_party_roles entry) can access
--   inactive — Owner + Admin can access (Admin can set back to active)
--   closed   — Owner only; Admin is blocked at both DB (RLS) and app layers

-- 1. Add status column alongside is_active so we can populate before dropping
ALTER TABLE public.parties
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CONSTRAINT parties_status_check CHECK (status IN ('active', 'inactive', 'closed'));

-- 2. Migrate existing data
UPDATE public.parties SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END;

-- 3. Drop is_active
ALTER TABLE public.parties DROP COLUMN is_active;

-- 4. Recreate SELECT policy: Owner sees all; others only see non-closed parties they belong to
DROP POLICY IF EXISTS "Members read own parties" ON parties;
CREATE POLICY "Members read own non-closed parties"
  ON parties FOR SELECT
  USING (
    is_owner()
    OR (status != 'closed' AND EXISTS (
      SELECT 1 FROM user_party_roles
      WHERE user_id = auth.uid() AND party_id = parties.id
    ))
  );

-- 5. Recreate UPDATE policy: Owner can update any party (including setting it to closed).
--    Admin can only update non-closed parties and cannot set status to closed.
DROP POLICY IF EXISTS "Owners or party admins update party" ON parties;
CREATE POLICY "Owners or party admins update non-closed party"
  ON parties FOR UPDATE
  USING (is_owner() OR (status != 'closed' AND is_admin_of(id)))
  WITH CHECK (is_owner() OR (status != 'closed' AND is_admin_of(id)));

-- 6. Backfill user_party_roles for admins who lack entries for inactive parties.
--    Previous backfills (20260103000014/15) only covered is_active=true parties.
--    Now we give admins membership in all non-closed parties they are missing from.
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
  WHERE p.role = 4  -- ROLE.ADMIN
    AND pa.status != 'closed'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_party_roles upr
      WHERE upr.user_id = p.id AND upr.party_id = pa.id
    )
  ON CONFLICT DO NOTHING;
END;
$$;
