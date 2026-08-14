-- Shipping carrier integration (PPL + Zásilkovna/Packeta): platform-wide provider
-- config (one shared account per carrier, not per-party — matches how Stripe keys
-- work here) and a per-order shipment record with carrier id/tracking/label path.
-- MANAGE_ORDERS = 32 (already used by orders/order_items).

CREATE TABLE IF NOT EXISTS shipping_provider_configs (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT          NOT NULL UNIQUE CHECK (code IN ('ppl', 'packeta')),
  display_name       TEXT          NOT NULL,
  enabled            BOOLEAN       NOT NULL DEFAULT false,
  base_price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  free_above_amount  NUMERIC(12,2),
  sender_name        TEXT          NOT NULL DEFAULT 'Smalljobs s.r.o.',
  sender_street      TEXT          NOT NULL DEFAULT 'U parčíku 47/24, Topolany',
  sender_city        TEXT          NOT NULL DEFAULT 'Olomouc',
  sender_postal_code TEXT          NOT NULL DEFAULT '779 00',
  sender_country_code CHAR(2)      NOT NULL DEFAULT 'CZ',
  sender_phone       TEXT,
  sender_email       TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER shipping_provider_configs_updated_at
  BEFORE UPDATE ON shipping_provider_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enabled by default (at price 0, mock mode until real credentials are added) so
-- checkout — which now requires a shipping method — keeps working out of the box
-- instead of silently blocking every order until an owner visits Settings first.
INSERT INTO shipping_provider_configs (code, display_name, enabled) VALUES
  ('ppl', 'PPL', true),
  ('packeta', 'Zásilkovna', true)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS order_shipments (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  party_id             UUID          NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  provider             TEXT          NOT NULL CHECK (provider IN ('ppl', 'packeta')),
  status               TEXT          NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','created','label_ready','in_transit','delivered','returned','cancelled','failed')),
  provider_shipment_id TEXT,
  tracking_number      TEXT,
  pickup_point_id      TEXT,
  pickup_point_name    TEXT,
  pickup_point_address TEXT,
  label_storage_path   TEXT,
  shipping_cost        NUMERIC(12,2) NOT NULL DEFAULT 0,
  weight_kg            NUMERIC(6,2)  NOT NULL DEFAULT 1,
  is_mock              BOOLEAN       NOT NULL DEFAULT false,
  last_status_raw      JSONB,
  error_message        TEXT,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER order_shipments_updated_at
  BEFORE UPDATE ON order_shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_order_shipments_party ON order_shipments(party_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_order ON order_shipments(order_id);

-- Storage for label PDFs: private, no public/authenticated SELECT policy at all.
-- Every read goes through a signed URL minted server-side by createAdminClient()
-- after an app-level ownership check (admin ctx or customers.user_id = auth.uid()),
-- same idiom already used for guest-cart ownership guards.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('shipping-labels', 'shipping-labels', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

ALTER TABLE shipping_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_shipments           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read enabled shipping_provider_configs"
  ON shipping_provider_configs FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

CREATE POLICY "Owner manage shipping_provider_configs"
  ON shipping_provider_configs FOR ALL
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

CREATE POLICY "Managers manage order_shipments"
  ON order_shipments FOR ALL
  USING (user_has_permission(auth.uid(), party_id, 32));

-- Matches the "Owners or party admins manage orders/order_items" bypass in
-- 20260103000003_security_admin_bypasses.sql — owner/admin roles have no
-- user_party_roles row (that table is eshop_admin-only custom roles), so without
-- this the admin order detail page's shipment join silently returns null for them.
CREATE POLICY "Owners or party admins manage order_shipments"
  ON order_shipments FOR ALL
  USING (is_owner() OR is_admin_of(party_id))
  WITH CHECK (is_owner() OR is_admin_of(party_id));

CREATE POLICY "Customers read own order_shipments"
  ON order_shipments FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    )
  );

GRANT SELECT ON shipping_provider_configs TO anon, authenticated;
GRANT UPDATE ON shipping_provider_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON order_shipments TO authenticated;
