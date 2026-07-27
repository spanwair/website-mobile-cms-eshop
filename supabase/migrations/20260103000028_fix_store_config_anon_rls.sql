-- Fix: "Public read store_configs of active parties" queried `parties` directly inside
-- USING(), which re-triggers parties' own RLS ("Party members can read their party" ->
-- user_party_roles). Anon has no SELECT grant on user_party_roles (by design, see
-- 20260103000022), so the subquery hard-failed with "permission denied for table
-- user_party_roles" instead of just returning zero rows. Same bug class as 20260103000022,
-- here hitting the newly added store_configs table.

CREATE OR REPLACE FUNCTION party_is_active(p_party_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM parties WHERE id = p_party_id AND status = 'active');
$$;

DROP POLICY IF EXISTS "Public read store_configs of active parties" ON store_configs;
CREATE POLICY "Public read store_configs of active parties"
  ON store_configs FOR SELECT
  TO anon, authenticated
  USING (party_is_active(party_id));
