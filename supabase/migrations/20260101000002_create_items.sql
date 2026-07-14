CREATE TYPE item_status AS ENUM ('draft', 'active', 'inactive');

CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  status      item_status NOT NULL DEFAULT 'draft',
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_created_by ON items(created_by);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active items
CREATE POLICY "Active items are public"
  ON items FOR SELECT USING (status = 'active');

-- Owners can read their own items
CREATE POLICY "Owners can read own items"
  ON items FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Owners can create items"
  ON items FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update own items"
  ON items FOR UPDATE USING (auth.uid() = created_by);

-- Admins have full access
CREATE POLICY "Admins full access items"
  ON items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
