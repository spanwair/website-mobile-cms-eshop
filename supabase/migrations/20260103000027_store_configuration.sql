-- Multi-tenant storefront configuration: per-party branding, design tokens,
-- component variants, homepage composition, and custom domain mapping.
-- MANAGE_SETTINGS = 1024 (1 << 10)

CREATE TABLE IF NOT EXISTS store_configs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id              UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE UNIQUE,

  brand_name            TEXT,
  tagline                TEXT,
  logo_url              TEXT,
  favicon_url           TEXT,

  color_primary         TEXT        NOT NULL DEFAULT '#4F46E5',
  color_secondary       TEXT        NOT NULL DEFAULT '#7C3AED',
  color_background      TEXT        NOT NULL DEFAULT '#FFFFFF',
  color_surface         TEXT        NOT NULL DEFAULT '#F8F9FA',
  color_text_primary    TEXT        NOT NULL DEFAULT '#212529',
  color_text_secondary  TEXT        NOT NULL DEFAULT '#6C757D',
  color_border          TEXT        NOT NULL DEFAULT '#E9ECEF',

  font_heading          TEXT        NOT NULL DEFAULT 'Inter',
  font_body             TEXT        NOT NULL DEFAULT 'Inter',
  radius_scale          TEXT        NOT NULL DEFAULT 'default',

  product_card_variant  TEXT        NOT NULL DEFAULT 'classic',

  homepage_layout       JSONB       NOT NULL DEFAULT '["hero","categories","featured_products","newsletter"]',

  enable_reviews        BOOLEAN     NOT NULL DEFAULT true,
  enable_wishlists      BOOLEAN     NOT NULL DEFAULT true,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT store_configs_radius_scale_check CHECK (radius_scale IN ('sharp', 'default', 'soft')),
  CONSTRAINT store_configs_product_card_variant_check CHECK (product_card_variant IN ('classic', 'minimal', 'luxury'))
);

CREATE TRIGGER store_configs_updated_at
  BEFORE UPDATE ON store_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Every party gets a default config row so the storefront always has a theme to render.
CREATE OR REPLACE FUNCTION create_default_store_config()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.store_configs (party_id, brand_name)
  VALUES (NEW.id, NEW.name)
  ON CONFLICT (party_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_party_created_seed_store_config
  AFTER INSERT ON parties
  FOR EACH ROW EXECUTE FUNCTION create_default_store_config();

-- Backfill config rows for parties that already existed before this migration.
INSERT INTO store_configs (party_id, brand_name)
SELECT id, name FROM parties
ON CONFLICT (party_id) DO NOTHING;

-- Custom domain -> party mapping. verification_token proves DNS ownership (TXT record).
CREATE TABLE IF NOT EXISTS store_domains (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id             UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  domain               TEXT        NOT NULL UNIQUE,
  verified             BOOLEAN     NOT NULL DEFAULT false,
  verification_token   TEXT        NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_domains_party_id ON store_domains(party_id);
CREATE INDEX IF NOT EXISTS idx_store_domains_domain    ON store_domains(domain);

-- RLS
ALTER TABLE store_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_domains ENABLE ROW LEVEL SECURITY;

-- Anonymous storefront visitors must read config to render the theme before any auth exists.
CREATE POLICY "Public read store_configs of active parties"
  ON store_configs FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM parties WHERE id = store_configs.party_id AND status = 'active')
  );

CREATE POLICY "Settings managers update store_configs"
  ON store_configs FOR UPDATE
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

CREATE POLICY "Settings managers insert store_configs"
  ON store_configs FOR INSERT
  TO authenticated
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

-- Domain resolution middleware runs on every request before auth — only verified
-- mappings are exposed so an unverified domain can't hijack another party's storefront.
CREATE POLICY "Public read verified store_domains"
  ON store_domains FOR SELECT
  TO anon, authenticated
  USING (verified = true);

CREATE POLICY "Settings managers read own store_domains"
  ON store_domains FOR SELECT
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

CREATE POLICY "Settings managers manage store_domains"
  ON store_domains FOR ALL
  TO authenticated
  USING (is_owner() OR user_has_permission(auth.uid(), party_id, 1024))
  WITH CHECK (is_owner() OR user_has_permission(auth.uid(), party_id, 1024));

GRANT SELECT ON store_configs TO anon, authenticated;
GRANT INSERT, UPDATE ON store_configs TO authenticated;
GRANT SELECT ON store_domains TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON store_domains TO authenticated;
