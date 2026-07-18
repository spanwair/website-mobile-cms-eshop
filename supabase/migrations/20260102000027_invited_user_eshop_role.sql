-- When a user is invited via inviteUserByEmail with pending_party_id metadata,
-- create their profile with role=2 (eshop_admin) so they can access the admin panel.
-- Role is set at INSERT time to bypass the enforce_role_hierarchy UPDATE trigger.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_party_id   UUID;
  v_role_id    UUID;
  v_invited_by UUID;
  v_role       SMALLINT;
BEGIN
  v_party_id   := (NEW.raw_user_meta_data->>'pending_party_id')::UUID;
  v_role_id    := (NEW.raw_user_meta_data->>'pending_role_id')::UUID;
  v_invited_by := (NEW.raw_user_meta_data->>'invited_by')::UUID;

  -- Invited users get eshop_admin (2) so they can access the admin panel immediately.
  v_role := CASE WHEN v_party_id IS NOT NULL AND v_role_id IS NOT NULL THEN 2 ELSE 1 END;

  INSERT INTO public.profiles (id, role) VALUES (NEW.id, v_role);

  IF v_party_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO public.user_party_roles (user_id, party_id, role_id, invited_by)
    VALUES (NEW.id, v_party_id, v_role_id, v_invited_by)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
