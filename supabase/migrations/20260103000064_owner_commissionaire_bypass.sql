-- commissionaire_agreements / order_commission_ledger policies check user_has_permission()
-- only, with no is_owner() bypass — unlike virtually every other party-scoped policy in this
-- schema. That breaks the documented invariant "no permission check can block an owner"
-- (admin-permissions skill) whenever an owner isn't also a user_party_roles member of the
-- party in question (owner normally needs no such row — is_owner() alone is enough
-- everywhere else). Surfaced while wiring org onboarding: an owner walking the same
-- no-IČO/commission-mode form a self-serve admin uses would otherwise be silently blocked.

DROP POLICY IF EXISTS "Auditors manage commissionaire_agreements" ON commissionaire_agreements;
CREATE POLICY "Owners or auditors manage commissionaire_agreements"
  ON commissionaire_agreements FOR ALL
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 4096))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 4096));

DROP POLICY IF EXISTS "Order managers read own commission ledger" ON order_commission_ledger;
CREATE POLICY "Owners or order managers read commission ledger"
  ON order_commission_ledger FOR SELECT
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 32));

DROP POLICY IF EXISTS "Auditors write commission ledger" ON order_commission_ledger;
CREATE POLICY "Owners or auditors write commission ledger"
  ON order_commission_ledger FOR ALL
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 4096))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 4096));
