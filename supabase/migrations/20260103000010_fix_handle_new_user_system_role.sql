-- Fix handle_new_user so admin-only invites (pending_system_role without pending_party_id)
-- get the correct profile role at INSERT time, bypassing the enforce_role_hierarchy UPDATE trigger.
-- Also backfill existing users whose role was left at 1 due to this bug.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_party_id    UUID;
  v_role_id     UUID;
  v_invited_by  UUID;
  v_system_role SMALLINT;
  v_init_role   SMALLINT;
BEGIN
  v_party_id    := (NEW.raw_user_meta_data->>'pending_party_id')::UUID;
  v_role_id     := (NEW.raw_user_meta_data->>'pending_role_id')::UUID;
  v_invited_by  := (NEW.raw_user_meta_data->>'invited_by')::UUID;
  v_system_role := (NEW.raw_user_meta_data->>'pending_system_role')::SMALLINT;

  -- Explicit system role wins (capped at 7 — owner=8 is never set via invite).
  -- Fallback to eshop_admin (2) when invited to a party.
  -- Default user (1).
  v_init_role := CASE
    WHEN v_system_role IS NOT NULL AND v_system_role BETWEEN 2 AND 7 THEN v_system_role
    WHEN v_party_id IS NOT NULL AND v_role_id IS NOT NULL            THEN 2
    ELSE                                                                  1
  END;

  INSERT INTO public.profiles (id, role) VALUES (NEW.id, v_init_role);

  IF v_party_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO public.user_party_roles (user_id, party_id, role_id, invited_by)
    VALUES (NEW.id, v_party_id, v_role_id, v_invited_by)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill existing users whose profile role was left at 1 due to the bug above.
-- Temporarily disable the hierarchy trigger to allow the superuser-level fix.
ALTER TABLE public.profiles DISABLE TRIGGER trg_enforce_role_hierarchy;

DO $$
DECLARE
  r             RECORD;
  v_system_role SMALLINT;
BEGIN
  FOR r IN
    SELECT u.id, (u.raw_user_meta_data->>'pending_system_role') AS pending_role
    FROM   auth.users u
    JOIN   public.profiles p ON p.id = u.id
    WHERE  u.raw_user_meta_data->>'pending_system_role' IS NOT NULL
      AND  p.role = 1
  LOOP
    v_system_role := r.pending_role::SMALLINT;
    IF v_system_role BETWEEN 2 AND 7 THEN
      UPDATE public.profiles SET role = v_system_role WHERE id = r.id;
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.profiles ENABLE TRIGGER trg_enforce_role_hierarchy;
