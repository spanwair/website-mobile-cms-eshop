-- Powers the /shop "Stores" directory. Same problem as resolve_active_party_id_by_slug: the
-- caller (anon, or an authenticated customer who isn't a member of any party) can't read
-- `parties` directly, and shouldn't be granted to — only the public-safe columns are returned.
CREATE OR REPLACE FUNCTION list_active_stores()
RETURNS TABLE (party_id UUID, slug TEXT, brand_name TEXT, logo_url TEXT, tagline TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.slug, sc.brand_name, sc.logo_url, sc.tagline
  FROM parties p
  JOIN store_configs sc ON sc.party_id = p.id
  WHERE p.status = 'active'
  ORDER BY p.name;
$$;

GRANT EXECUTE ON FUNCTION list_active_stores() TO anon, authenticated;
