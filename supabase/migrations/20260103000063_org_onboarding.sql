-- Self-serve organization onboarding: a self-registered user (no invite) now becomes an
-- ADMIN immediately and can create their own org through the same /admin/parties/new form
-- used by staff. Whether they can start selling right away depends on legal status:
--   - IČO supplied (has a registered company)      -> seller_mode=own_company, status=active
--   - No IČO (home-made/no company, per [[project_smalljobs_commission_mode]])
--                                                    -> seller_mode=smalljobs_commission,
--                                                       status=pending_approval until an
--                                                       owner reviews and activates it
-- Invited users are unaffected: handle_new_user() already assigns their role from
-- pending_system_role/pending_party_id metadata baked into the invite, which still wins
-- below (this only changes the ELSE/organic-signup branch).

ALTER TABLE public.parties ADD COLUMN company_ico TEXT;
ALTER TABLE public.parties ADD COLUMN terms_accepted_at TIMESTAMPTZ;
ALTER TABLE public.parties ADD COLUMN terms_version TEXT;

ALTER TABLE public.parties DROP CONSTRAINT parties_status_check;
ALTER TABLE public.parties ADD CONSTRAINT parties_status_check
  CHECK (status IN ('active', 'inactive', 'closed', 'pending_approval'));

-- Organic signup (no invite metadata at all) now becomes ADMIN(4) instead of USER(1), so they
-- can immediately create their own org via /admin/parties/new. Invite-driven paths (system
-- role or party+role metadata) are untouched — they still take precedence.
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
    ELSE                                                                  4
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

-- A party admin gets ALL_PERMISSIONS (including MANAGE_AUDIT) on their own party, so the
-- ordinary update_party permission check alone can't stop them approving themselves out of
-- pending_approval. Mirrors the existing "only owner sets/reverts closed" rule.
CREATE OR REPLACE FUNCTION enforce_party_approval_transition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pending_approval' AND NEW.status = 'active' AND NOT is_owner() THEN
    RAISE EXCEPTION 'Only an owner can approve a pending organization';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_party_approval_transition
  BEFORE UPDATE ON public.parties
  FOR EACH ROW EXECUTE FUNCTION enforce_party_approval_transition();
