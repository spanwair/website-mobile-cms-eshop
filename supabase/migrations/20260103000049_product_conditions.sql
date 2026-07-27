-- Product condition/grading taxonomy (e.g. New/Like-new/A/B/C for refurbished goods).
-- Per-party so each store defines its own grading scale. Products can carry a condition
-- directly (simple products); variants can override it when condition is a variant axis
-- (same model sold in multiple grades as distinct SKUs).

CREATE TABLE IF NOT EXISTS product_conditions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  code       TEXT        NOT NULL,
  label      TEXT        NOT NULL,
  color_hex  TEXT        NOT NULL DEFAULT '#7CB342',
  sort_order INT         NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, code)
);

CREATE TRIGGER product_conditions_updated_at
  BEFORE UPDATE ON product_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE products         ADD COLUMN IF NOT EXISTS condition_id UUID REFERENCES product_conditions(id) ON DELETE SET NULL;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS condition_id UUID REFERENCES product_conditions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_condition         ON products(condition_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_condition ON product_variants(condition_id);

ALTER TABLE product_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active conditions"
  ON product_conditions FOR SELECT
  TO anon, authenticated
  USING (
    is_active AND EXISTS (SELECT 1 FROM parties WHERE id = product_conditions.party_id AND status = 'active')
  );

-- MANAGE_PRODUCTS = 8
CREATE POLICY "Managers manage product_conditions"
  ON product_conditions FOR ALL
  TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 8))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 8));

GRANT SELECT ON product_conditions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_conditions TO authenticated;
