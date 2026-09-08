-- Landing page "real eshops" showcase: a curated, ordered subset of active stores,
-- distinct from the full /shop directory (list_active_stores). New orgs stay hidden
-- from marketing until someone explicitly flips landing_featured on.

ALTER TABLE store_configs
  ADD COLUMN IF NOT EXISTS landing_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS landing_sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS landing_description TEXT,
  ADD COLUMN IF NOT EXISTS landing_screenshot_url TEXT;

-- Same anon-read gap as list_active_stores: parties has no anon SELECT policy, so this
-- goes through a SECURITY DEFINER function scoped to public-safe columns only.
CREATE OR REPLACE FUNCTION list_landing_featured_stores()
RETURNS TABLE (
  party_id UUID, slug TEXT, brand_name TEXT, tagline TEXT,
  landing_description TEXT, landing_screenshot_url TEXT, logo_url TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.slug, sc.brand_name, sc.tagline,
         sc.landing_description, sc.landing_screenshot_url, sc.logo_url
  FROM parties p
  JOIN store_configs sc ON sc.party_id = p.id
  WHERE p.status = 'active' AND sc.landing_featured = true
  ORDER BY sc.landing_sort_order, p.name;
$$;

GRANT EXECUTE ON FUNCTION list_landing_featured_stores() TO anon, authenticated;
