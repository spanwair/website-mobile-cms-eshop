-- product_conditions didn't exist yet when 20260103000041 (anon RLS fix) and 20260103000042
-- (owner-bypass fix) ran — it's created in 20260103000049. On a fresh install that runs
-- migrations strictly in timestamp order this fails with "relation does not exist". Split
-- out here, after product_conditions exists, with the exact same fixed policies those two
-- migrations intended.

DROP POLICY IF EXISTS "Public read active conditions" ON product_conditions;
CREATE POLICY "Public read active conditions"
  ON product_conditions FOR SELECT TO anon, authenticated
  USING (is_active AND party_is_active(party_id));

DROP POLICY IF EXISTS "Managers manage product_conditions" ON product_conditions;
CREATE POLICY "Managers manage product_conditions"
  ON product_conditions FOR ALL TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 8))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 8));
