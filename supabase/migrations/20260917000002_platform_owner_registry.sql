-- Platform owner registry — declarative, reset-proof source of truth for who is a platform OWNER (role 8).
--
-- Why this exists:
--   OWNER (role 8) is the global platform superadmin. Until now nothing in the schema declared
--   who that is. handle_new_user() defaults every organic signup to ADMIN(4) (see
--   20260103000063_org_onboarding), and supabase/seed.sql re-creates local accounts as role 4 on
--   every `db reset`. So owner status only ever lived as a manual `UPDATE profiles SET role=8`,
--   which every reset silently erased — repeatedly dumping a "known owner" back into the ADMIN
--   self-serve onboarding wizard.
--
-- The fix: a registry table (platform_owners) + a BEFORE INSERT OR UPDATE trigger on profiles that
--   forces role=8 for any profile whose email is registered. This makes owner status DECLARATIVE:
--   to grant owner, add the email to platform_owners; to revoke, delete it. No hardcoded role
--   UPDATE is ever needed again, and the guarantee holds through resets, seeds, handle_new_user,
--   and stray SQL alike — because the trigger runs regardless of auth context (unlike
--   enforce_role_hierarchy, which bypasses itself when auth.uid() is null).
--
-- Prod usage: this migration ships the table + trigger only (mechanism). Owner emails are policy,
--   not schema — register them per environment. Local dev owners are seeded in supabase/seed.sql.
--   For production, run once (as a privileged role):
--     INSERT INTO public.platform_owners (email, note) VALUES ('you@yourdomain.com', 'founder');

CREATE TABLE IF NOT EXISTS public.platform_owners (
  email      TEXT PRIMARY KEY,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;

-- Only an existing owner may view or modify the registry through the API. service_role and
-- superuser (migrations, seeds, CLI) bypass RLS as usual.
DROP POLICY IF EXISTS platform_owners_owner_all ON public.platform_owners;
CREATE POLICY platform_owners_owner_all ON public.platform_owners
  FOR ALL USING (is_owner()) WITH CHECK (is_owner());

CREATE OR REPLACE FUNCTION public.enforce_platform_owner_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_listed BOOLEAN := FALSE;
BEGIN
  IF NEW.email IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.platform_owners WHERE lower(email) = lower(NEW.email)
    ) INTO is_listed;
  END IF;

  -- A registered platform owner is ALWAYS role 8. This is the whole guard: it overrides the
  -- ADMIN(4) default from handle_new_user, any seed value, and any manual demotion. Remove the
  -- email from platform_owners to actually demote them.
  IF is_listed THEN
    NEW.role := 8;
  END IF;

  RETURN NEW;
END;
$$;

-- Runs on INSERT (signup / seed) and UPDATE. Named to sort before trg_enforce_role_hierarchy so
-- the role is pinned to 8 first; the hierarchy trigger then sees NEW.role = OLD.role and no-ops.
DROP TRIGGER IF EXISTS trg_enforce_platform_owner_role ON public.profiles;
CREATE TRIGGER trg_enforce_platform_owner_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_platform_owner_role();

-- Re-pin any profiles already matching a registry entry (no-op until the registry is populated).
UPDATE public.profiles p
SET role = 8
FROM public.platform_owners o
WHERE lower(p.email) = lower(o.email) AND p.role <> 8;
