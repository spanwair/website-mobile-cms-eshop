-- Invited Admins must land in the inviting org, not on onboarding.
--
-- Admin invites carry no selectable party role (an ADMIN's permissions come from the
-- system role → ALL_PERMISSIONS, so the custom role is only a membership FK). The invite
-- pages now always embed pending_party_id plus a fallback pending_role_id for Admins,
-- but two older shapes still reach this trigger and must also yield a membership row —
-- otherwise the new Admin sees zero parties and is routed to /admin/onboarding:
--
--   1. pending_party_id present, pending_role_id missing → highest-permission role as FK.
--   2. neither present (legacy Admin invite), invited_by administers exactly one party →
--      that party + fallback role. With zero or several parties we cannot guess.
--
-- Invite routing rules (authoritative copy in _project_specs/session/... — see
-- invite-onboarding-routing-rules.md):
--   - organic signup (no invite metadata)        → /admin/onboarding (only case)
--   - invite with a determinable party           → membership + /admin of that party
--   - invited Admin of an empty catalog          → dashboard + banner, never forced tutorial

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_party_id       UUID;
  v_role_id        UUID;
  v_invited_by     UUID;
  v_system_role    SMALLINT;
  v_signup_party   UUID;
  v_init_role      SMALLINT;
  v_fallback_role  UUID;
  v_inviter_party  UUID;
  v_inviter_count  INTEGER;
BEGIN
  v_party_id     := (NEW.raw_user_meta_data->>'pending_party_id')::UUID;
  v_role_id      := (NEW.raw_user_meta_data->>'pending_role_id')::UUID;
  v_invited_by   := (NEW.raw_user_meta_data->>'invited_by')::UUID;
  v_system_role  := (NEW.raw_user_meta_data->>'pending_system_role')::SMALLINT;
  v_signup_party := (NEW.raw_user_meta_data->>'signup_party_id')::UUID;

  v_init_role := CASE
    WHEN v_system_role IS NOT NULL AND v_system_role BETWEEN 2 AND 7 THEN v_system_role
    WHEN v_party_id IS NOT NULL AND v_role_id IS NOT NULL            THEN 2
    WHEN v_signup_party IS NOT NULL                                  THEN 1
    ELSE                                                                  4
  END;

  INSERT INTO public.profiles (id, role, email, signup_party_id)
  VALUES (NEW.id, v_init_role, NEW.email, v_signup_party);

  -- Shape 2: legacy Admin invite with no party metadata — recover the inviting org from
  -- the inviter, but only when it is unambiguous (exactly one administered party).
  IF v_party_id IS NULL AND v_invited_by IS NOT NULL THEN
    SELECT COUNT(DISTINCT party_id)
      INTO v_inviter_count
      FROM public.user_party_roles
     WHERE user_id = v_invited_by;
    IF v_inviter_count = 1 THEN
      SELECT party_id
        INTO v_inviter_party
        FROM public.user_party_roles
       WHERE user_id = v_invited_by
       LIMIT 1;
      v_party_id := v_inviter_party;
    END IF;
  END IF;

  -- Shape 1 (+ recovered shape 2): party known, role missing — an Admin's permissions
  -- come from the system role, so any valid role FK works; use the highest-permission one.
  IF v_party_id IS NOT NULL AND v_role_id IS NULL THEN
    SELECT id INTO v_fallback_role
      FROM public.roles
     ORDER BY permissions DESC
     LIMIT 1;
    v_role_id := v_fallback_role;
  END IF;

  IF v_party_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO public.user_party_roles (user_id, party_id, role_id, invited_by)
    VALUES (NEW.id, v_party_id, v_role_id, v_invited_by)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
