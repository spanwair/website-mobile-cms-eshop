-- Remove backfill-artifact memberships introduced by migrations
-- 20260103000014, 20260103000015, and 20260103000016.
-- All three did a CROSS JOIN admins × parties, giving every Admin (role=4)
-- membership in every party. Correct behaviour: Admins only see parties they
-- are explicitly assigned to (invited or created themselves).
--
-- Backfill entries are identifiable by all three of:
--   1. user is an Admin (profiles.role = 4)
--   2. role is a global placeholder (roles.party_id IS NULL)
--   3. invited_by IS NULL — not set by a real user action
--
-- After this migration Admins see only parties they are explicitly invited to.
-- The assign_admin_to_new_party trigger is updated below to set
-- invited_by = auth.uid() so future trigger entries are distinguishable.

DELETE FROM public.user_party_roles upr
USING public.profiles p, public.roles r
WHERE upr.user_id = p.id
  AND upr.role_id = r.id
  AND p.role = 4
  AND r.party_id IS NULL
  AND upr.invited_by IS NULL;

-- Update trigger: set invited_by so future auto-assignments on party creation
-- are not confused with backfill artifacts by any future cleanup migration.
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
    INSERT INTO public.user_party_roles (user_id, party_id, role_id, invited_by)
    VALUES (auth.uid(), NEW.id, v_role_id, auth.uid())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
