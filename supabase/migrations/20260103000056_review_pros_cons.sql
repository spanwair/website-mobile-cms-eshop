ALTER TABLE product_reviews DROP COLUMN IF EXISTS title;
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS pros TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cons TEXT[] NOT NULL DEFAULT '{}';

-- Form is guest-friendly (author_name/author_email fields), but the only INSERT
-- policy so far is TO authenticated — anonymous submissions fail RLS silently.
CREATE POLICY "Guests can submit pending reviews"
  ON product_reviews FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');

GRANT INSERT ON product_reviews TO anon;
