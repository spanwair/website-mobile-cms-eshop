-- Anonymous storefront visitors need to resolve a party by slug (path-based /eshop-[slug]
-- routing, and the pre-existing subdomain fallback in middleware.ts) but `parties` has no
-- anon SELECT policy — and should not get one, since the row also carries vat_number and
-- billing_email. A SECURITY DEFINER function returns only the id, scoped to active parties,
-- without ever exposing the rest of the row to anon.
CREATE OR REPLACE FUNCTION resolve_active_party_id_by_slug(p_slug TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM parties WHERE slug = p_slug AND status = 'active' LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION resolve_active_party_id_by_slug(TEXT) TO anon, authenticated;
