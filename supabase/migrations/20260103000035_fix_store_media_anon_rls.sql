-- Same bug as 20260103000028 (see that migration's comment) — "Public read store_media of
-- active parties" queried `parties` directly inside USING(), which re-triggers parties' own
-- RLS ("Party members can read their party" -> user_party_roles). Anon has no SELECT grant on
-- user_party_roles, so the subquery hard-failed with "permission denied for table
-- user_party_roles" instead of just returning zero rows. Reuse the existing party_is_active()
-- SECURITY DEFINER helper instead of re-adding the same broken inline EXISTS pattern.

DROP POLICY IF EXISTS "Public read store_media of active parties" ON store_media;
CREATE POLICY "Public read store_media of active parties"
  ON store_media FOR SELECT
  TO anon, authenticated
  USING (party_is_active(party_id));
