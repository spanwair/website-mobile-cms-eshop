-- store_configs previously had only a public SELECT policy gated on party_is_active(). During
-- onboarding a new org is `pending_approval` (not active), so its own owner/settings-manager
-- could not read their store_config — and, because Postgres applies SELECT policies to locate
-- the rows targeted by an UPDATE ... WHERE, they silently could not update it either (the write
-- affected 0 rows with no error). Every other storefront content table already has a combined
-- "managers manage" ALL policy that covers this; store_configs was split into separate
-- INSERT/SELECT/UPDATE policies and the SELECT half was never granted to managers.
--
-- Add the missing manager/owner SELECT policy, mirroring the existing INSERT/UPDATE policies, so
-- a store owner can design and save their homepage before the platform owner activates the org.

CREATE POLICY "Managers read own store_configs"
  ON store_configs FOR SELECT
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, (1024)::bigint));
