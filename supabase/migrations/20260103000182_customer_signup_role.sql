-- Storefront customer signups must NOT become sellers.
--
-- 20260103000063_org_onboarding made every organic signup an ADMIN(4) so a self-registered
-- seller can create their own org. But a person who registers *inside* a storefront (the
-- /login?redirect=/eshop-<slug> form) is a customer of that shop, not an aspiring seller.
-- The storefront signup now carries a `signup_party_id` in raw_user_meta_data; when present we
-- keep the account a plain USER(1) and remember which eshop they registered at, so their
-- customer dashboard (/dashboard) can scope to that shop.
--
-- Invite-driven paths (pending_system_role / pending_party_id+pending_role_id) still win, and
-- the organic seller path (no metadata at all) is unchanged -> ELSE 4.

ALTER TABLE public.profiles ADD COLUMN signup_party_id UUID REFERENCES public.parties(id);

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

  IF v_party_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO public.user_party_roles (user_id, party_id, role_id, invited_by)
    VALUES (NEW.id, v_party_id, v_role_id, v_invited_by)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
