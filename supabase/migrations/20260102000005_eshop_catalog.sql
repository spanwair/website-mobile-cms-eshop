CREATE TABLE IF NOT EXISTS brands (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  logo_url    TEXT,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, slug)
);

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS categories (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id        UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  parent_id       UUID        REFERENCES categories(id) ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  slug            TEXT        NOT NULL,
  icon            TEXT,
  image_url       TEXT,
  seo_title       TEXT,
  seo_description TEXT,
  sort_order      INT         NOT NULL DEFAULT 0,
  is_visible      BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, slug)
);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_categories_party_parent ON categories(party_id, parent_id);

CREATE TABLE IF NOT EXISTS products (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id         UUID           NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  brand_id         UUID           REFERENCES brands(id) ON DELETE SET NULL,
  title            TEXT           NOT NULL,
  slug             TEXT           NOT NULL,
  sku              TEXT,
  barcode          TEXT,
  description      TEXT,
  description_rich JSONB,
  seo_title        TEXT,
  seo_description  TEXT,
  price            NUMERIC(12,2)  NOT NULL DEFAULT 0,
  discount_price   NUMERIC(12,2),
  tax_rate         NUMERIC(5,2)   NOT NULL DEFAULT 0,
  weight           NUMERIC(8,3),
  status           TEXT           NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','active','inactive')),
  is_featured      BOOLEAN        NOT NULL DEFAULT false,
  is_visible       BOOLEAN        NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, slug)
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_products_party_status ON products(party_id, status);
CREATE INDEX IF NOT EXISTS idx_products_party_slug   ON products(party_id, slug);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id  UUID NOT NULL REFERENCES products(id)   ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS product_tags (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  PRIMARY KEY (product_id, tag)
);

CREATE TABLE IF NOT EXISTS product_images (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  alt        TEXT,
  sort_order INT         NOT NULL DEFAULT 0,
  is_primary BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order);

CREATE TABLE IF NOT EXISTS product_variants (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name       TEXT          NOT NULL,
  sku        TEXT,
  barcode    TEXT,
  price      NUMERIC(12,2),
  attributes JSONB         NOT NULL DEFAULT '{}',
  is_active  BOOLEAN       NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE brands             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants   ENABLE ROW LEVEL SECURITY;

-- MANAGE_PRODUCTS = 8
CREATE POLICY "Managers manage brands"
  ON brands FOR ALL USING (user_has_permission(auth.uid(), party_id, 8));

CREATE POLICY "Members read active brands"
  ON brands FOR SELECT
  USING (is_active AND EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = brands.party_id));

CREATE POLICY "Managers manage categories"
  ON categories FOR ALL USING (user_has_permission(auth.uid(), party_id, 8));

CREATE POLICY "Members read visible categories"
  ON categories FOR SELECT
  USING (is_visible AND EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = categories.party_id));

CREATE POLICY "Managers manage products"
  ON products FOR ALL USING (user_has_permission(auth.uid(), party_id, 8));

CREATE POLICY "Members read active products"
  ON products FOR SELECT
  USING (status = 'active' AND is_visible AND EXISTS (SELECT 1 FROM user_party_roles WHERE user_id = auth.uid() AND party_id = products.party_id));

-- Join and child tables inherit access through the parent product's party
CREATE POLICY "Members read product_categories"
  ON product_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p JOIN user_party_roles upr ON upr.party_id = p.party_id WHERE p.id = product_id AND upr.user_id = auth.uid()));

CREATE POLICY "Managers manage product_categories"
  ON product_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND user_has_permission(auth.uid(), p.party_id, 8)));

CREATE POLICY "Members read product_tags"
  ON product_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p JOIN user_party_roles upr ON upr.party_id = p.party_id WHERE p.id = product_id AND upr.user_id = auth.uid()));

CREATE POLICY "Managers manage product_tags"
  ON product_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND user_has_permission(auth.uid(), p.party_id, 8)));

CREATE POLICY "Members read product_images"
  ON product_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p JOIN user_party_roles upr ON upr.party_id = p.party_id WHERE p.id = product_id AND upr.user_id = auth.uid()));

CREATE POLICY "Managers manage product_images"
  ON product_images FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND user_has_permission(auth.uid(), p.party_id, 8)));

CREATE POLICY "Members read product_variants"
  ON product_variants FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p JOIN user_party_roles upr ON upr.party_id = p.party_id WHERE p.id = product_id AND upr.user_id = auth.uid()));

CREATE POLICY "Managers manage product_variants"
  ON product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND user_has_permission(auth.uid(), p.party_id, 8)));

GRANT SELECT, INSERT, UPDATE, DELETE ON brands, categories, products,
  product_categories, product_tags, product_images, product_variants TO authenticated;
