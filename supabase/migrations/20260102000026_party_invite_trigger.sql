-- Extend handle_new_user to auto-join a party when the user was invited
-- via auth.admin.inviteUserByEmail with pending_party_id/pending_role_id metadata.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_party_id   UUID;
  v_role_id    UUID;
  v_invited_by UUID;
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);

  v_party_id   := (NEW.raw_user_meta_data->>'pending_party_id')::UUID;
  v_role_id    := (NEW.raw_user_meta_data->>'pending_role_id')::UUID;
  v_invited_by := (NEW.raw_user_meta_data->>'invited_by')::UUID;

  IF v_party_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO public.user_party_roles (user_id, party_id, role_id, invited_by)
    VALUES (NEW.id, v_party_id, v_role_id, v_invited_by)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
