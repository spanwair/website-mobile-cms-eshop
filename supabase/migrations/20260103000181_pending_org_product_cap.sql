-- A not-yet-live organization (status other than 'active' — i.e. pending_approval or
-- inactive) may hold at most 100 products until an owner approves it and it goes live.
-- Enforced here (SECURITY DEFINER, BEFORE INSERT) so it covers every insert path — admin
-- UI, service-role, seeds, mobile — not just the admin form. Once the owner activates the
-- org the cap no longer applies. Mirrors PENDING_ORG_PRODUCT_CAP in shared/constants/limits.ts.
CREATE OR REPLACE FUNCTION enforce_pending_org_product_cap()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_count  INT;
BEGIN
  SELECT status INTO v_status FROM public.parties WHERE id = NEW.party_id;
  IF v_status IS DISTINCT FROM 'active' THEN
    SELECT count(*) INTO v_count FROM public.products WHERE party_id = NEW.party_id;
    IF v_count >= 100 THEN
      RAISE EXCEPTION 'pending_org_product_cap: an organization awaiting approval may have at most 100 products until it is activated';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pending_org_product_cap ON public.products;
CREATE TRIGGER trg_enforce_pending_org_product_cap
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION enforce_pending_org_product_cap();
