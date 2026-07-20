-- Add email to profiles INSERT in handle_new_user so findUserByEmail works
-- for users created via admin API (invite/confirm flows).
-- Also backfills existing profiles that have NULL email.

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

  v_init_role := CASE
    WHEN v_system_role IS NOT NULL AND v_system_role BETWEEN 2 AND 7 THEN v_system_role
    WHEN v_party_id IS NOT NULL AND v_role_id IS NOT NULL            THEN 2
    ELSE                                                                  1
  END;

  INSERT INTO public.profiles (id, role, email) VALUES (NEW.id, v_init_role, NEW.email);

  IF v_party_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO public.user_party_roles (user_id, party_id, role_id, invited_by)
    VALUES (NEW.id, v_party_id, v_role_id, v_invited_by)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill profiles where email is null but auth.users has an email.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL
  AND u.email IS NOT NULL;
