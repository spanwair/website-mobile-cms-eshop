CREATE TABLE IF NOT EXISTS price_lists (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  currency   CHAR(3)     NOT NULL DEFAULT 'USD',
  is_default BOOLEAN     NOT NULL DEFAULT false,
  valid_from TIMESTAMPTZ,
  valid_to   TIMESTAMPTZ,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER price_lists_updated_at
  BEFORE UPDATE ON price_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_price_lists_party_default ON price_lists(party_id, is_default);

CREATE TABLE IF NOT EXISTS price_list_items (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID          NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id    UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id    UUID          REFERENCES product_variants(id) ON DELETE CASCADE,
  price         NUMERIC(12,2) NOT NULL,
  UNIQUE(price_list_id, product_id, variant_id)
);

CREATE TABLE IF NOT EXISTS discount_rules (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id         UUID          NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name             TEXT          NOT NULL,
  type             TEXT          NOT NULL
                     CHECK (type IN ('percentage','fixed','buy_x_get_y','free_shipping')),
  value            NUMERIC(12,2) NOT NULL,
  min_order_amount NUMERIC(12,2),
  min_quantity     INT,
  applies_to       TEXT          NOT NULL DEFAULT 'all'
                     CHECK (applies_to IN ('all','products','categories','customers')),
  applies_to_ids   UUID[]        NOT NULL DEFAULT '{}',
  customer_group   TEXT,
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  usage_limit      INT,
  usage_count      INT           NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER discount_rules_updated_at
  BEFORE UPDATE ON discount_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_discount_rules_party_active ON discount_rules(party_id, is_active);

CREATE TABLE IF NOT EXISTS coupons (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id         UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  code             TEXT        NOT NULL,
  discount_rule_id UUID        NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
  max_uses         INT,
  uses_count       INT         NOT NULL DEFAULT 0,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, code)
);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Global uniqueness on code so coupon lookup doesn't require party context at checkout
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

CREATE TABLE IF NOT EXISTS promotions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id         UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  banner_image_url TEXT,
  discount_rule_id UUID        NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE price_lists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions       ENABLE ROW LEVEL SECURITY;

-- MANAGE_PRICING = 128
CREATE POLICY "Managers manage price_lists"
  ON price_lists FOR ALL USING (user_has_permission(auth.uid(), party_id, 128));

CREATE POLICY "Members read active price_lists"
  ON price_lists FOR SELECT
  USING (is_active AND EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = price_lists.party_id));

CREATE POLICY "Managers manage price_list_items"
  ON price_list_items FOR ALL
  USING (EXISTS (SELECT 1 FROM price_lists pl WHERE pl.id = price_list_id AND user_has_permission(auth.uid(), pl.party_id, 128)));

CREATE POLICY "Members read price_list_items"
  ON price_list_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM price_lists pl JOIN user_party_roles upr ON upr.party_id = pl.party_id WHERE pl.id = price_list_id AND upr.user_id = auth.uid()));

CREATE POLICY "Managers manage discount_rules"
  ON discount_rules FOR ALL USING (user_has_permission(auth.uid(), party_id, 128));

CREATE POLICY "Members read active discount_rules"
  ON discount_rules FOR SELECT
  USING (is_active AND EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = discount_rules.party_id));

CREATE POLICY "Managers manage coupons"
  ON coupons FOR ALL USING (user_has_permission(auth.uid(), party_id, 128));

CREATE POLICY "Members read active coupons"
  ON coupons FOR SELECT
  USING (is_active AND EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = coupons.party_id));

CREATE POLICY "Managers manage promotions"
  ON promotions FOR ALL USING (user_has_permission(auth.uid(), party_id, 128));

CREATE POLICY "Members read active promotions"
  ON promotions FOR SELECT
  USING (is_active AND EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = promotions.party_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON price_lists, price_list_items,
  discount_rules, coupons, promotions TO authenticated;
