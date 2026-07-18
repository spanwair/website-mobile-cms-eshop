-- Product reviews: customers can review products they have purchased.
-- Admins can approve/reject/hide reviews. Aggregate rating stored on products via trigger.

CREATE TABLE IF NOT EXISTS product_reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id     UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  product_id   UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id  UUID        REFERENCES customers(id) ON DELETE SET NULL,
  order_id     UUID        REFERENCES orders(id) ON DELETE SET NULL,
  author_name  TEXT        NOT NULL,
  author_email TEXT        NOT NULL,
  rating       SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title        TEXT,
  body         TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','approved','rejected','hidden')),
  is_verified  BOOLEAN     NOT NULL DEFAULT false,
  helpful_count INT        NOT NULL DEFAULT 0,
  image_urls   TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product  ON product_reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_party    ON product_reviews(party_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON product_reviews(customer_id);

DROP TRIGGER IF EXISTS reviews_updated_at ON product_reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Aggregate rating columns on products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS review_count  INT           NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_avg    NUMERIC(3,2)  NOT NULL DEFAULT 0;

-- Trigger: keep review_count and rating_avg in sync after each review change
CREATE OR REPLACE FUNCTION sync_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE products
  SET
    review_count = sub.cnt,
    rating_avg   = COALESCE(sub.avg, 0)
  FROM (
    SELECT COUNT(*)::INT AS cnt, ROUND(AVG(rating)::NUMERIC, 2) AS avg
    FROM product_reviews
    WHERE product_id = v_product_id AND status = 'approved'
  ) sub
  WHERE id = v_product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_rating_after_review ON product_reviews;
CREATE TRIGGER sync_rating_after_review
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION sync_product_rating();

-- RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON product_reviews;
CREATE POLICY "Anyone can read approved reviews"
  ON product_reviews FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admins read all party reviews" ON product_reviews;
CREATE POLICY "Admins read all party reviews"
  ON product_reviews FOR SELECT
  USING (user_has_permission(auth.uid(), party_id, 8));

DROP POLICY IF EXISTS "Admins manage reviews" ON product_reviews;
CREATE POLICY "Admins manage reviews"
  ON product_reviews FOR ALL
  USING (user_has_permission(auth.uid(), party_id, 8));

DROP POLICY IF EXISTS "Authenticated users submit reviews" ON product_reviews;
CREATE POLICY "Authenticated users submit reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

GRANT SELECT ON product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_reviews TO authenticated;
