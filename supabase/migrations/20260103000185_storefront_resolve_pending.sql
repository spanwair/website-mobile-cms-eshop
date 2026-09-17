-- A newly onboarded org sits in status 'pending_approval' until the platform owner approves
-- it. Its storefront is fully built (theme + placeholder catalog) and the seller must be able
-- to open it from the admin "View store" button the moment onboarding finishes — even while
-- approval is pending. The old resolver (resolve_active_party_id_by_slug) matched status
-- 'active' only, so /eshop-[slug] resolved to nothing and the middleware bounced the seller to
-- the generic /shop. This replaces it with a resolver that also matches 'pending_approval' and
-- returns the status alongside the id, so the storefront can render a "pending approval" banner
-- for pending stores. Same SECURITY DEFINER guarantee: only id + status leave the function,
-- never vat_number / billing_email.
DROP FUNCTION IF EXISTS resolve_active_party_id_by_slug(TEXT);

CREATE OR REPLACE FUNCTION resolve_storefront_party_by_slug(p_slug TEXT)
RETURNS TABLE(id UUID, status TEXT) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, status FROM parties
  WHERE slug = p_slug AND status IN ('active', 'pending_approval')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION resolve_storefront_party_by_slug(TEXT) TO anon, authenticated;
