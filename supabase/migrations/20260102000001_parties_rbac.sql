-- Permission bitmask constants:
--   VIEW_DASHBOARD    = 1       (1 << 0)
--   MANAGE_USERS      = 2       (1 << 1)
--   MANAGE_ROLES      = 4       (1 << 2)
--   MANAGE_PRODUCTS   = 8       (1 << 3)
--   MANAGE_CATEGORIES = 16      (1 << 4)
--   MANAGE_ORDERS     = 32      (1 << 5)
--   MANAGE_INVENTORY  = 64      (1 << 6)
--   MANAGE_PRICING    = 128     (1 << 7)
--   MANAGE_CUSTOMERS  = 256     (1 << 8)
--   VIEW_REPORTS      = 512     (1 << 9)
--   MANAGE_CMS        = 1024    (1 << 10)
--   MANAGE_FILES      = 2048    (1 << 11)
--   MANAGE_SETTINGS   = 4096    (1 << 12)
--   BILLING           = 8192    (1 << 13)
--   API_MANAGEMENT    = 16384   (1 << 14)
--   FULL_ACCESS       = 32768   (1 << 15)

CREATE TABLE IF NOT EXISTS parties (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  slug           TEXT        UNIQUE NOT NULL,
  company_name   TEXT,
  vat_number     TEXT,
  billing_email  TEXT,
  logo_url       TEXT,
  settings       JSONB       NOT NULL DEFAULT '{}',
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER parties_updated_at
  BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS roles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id     UUID        NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  permissions  BIGINT      NOT NULL DEFAULT 0,
  is_system    BOOLEAN     NOT NULL DEFAULT false,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, name)
);

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_roles_party_id ON roles(party_id);

CREATE TABLE IF NOT EXISTS user_party_roles (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id    UUID        NOT NULL REFERENCES parties(id)   ON DELETE CASCADE,
  role_id     UUID        NOT NULL REFERENCES roles(id)     ON DELETE CASCADE,
  invited_by  UUID        REFERENCES auth.users(id)         ON DELETE SET NULL,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, party_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_upr_user_id  ON user_party_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_upr_party_id ON user_party_roles(party_id);

-- Returns bitwise OR of all permissions a user holds within a party.
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID, p_party_id UUID)
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(BIT_OR(r.permissions), 0)
  FROM user_party_roles upr
  JOIN roles r ON r.id = upr.role_id
  WHERE upr.user_id = p_user_id
    AND upr.party_id = p_party_id;
$$;

CREATE OR REPLACE FUNCTION user_has_permission(p_user_id UUID, p_party_id UUID, p_permission BIGINT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (get_user_permissions(p_user_id, p_party_id) & p_permission) = p_permission;
$$;

-- Seed a Super Admin system role (permissions 32767 = all bits 0-14) for every new party.
-- 32767 excludes FULL_ACCESS bit (32768) intentionally; use 65535 if you want all 16 bits.
CREATE OR REPLACE FUNCTION create_party_super_admin_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.roles (party_id, name, permissions, is_system, description)
  VALUES (NEW.id, 'Super Admin', 32767, true, 'System role with full access to all features');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_party_created_seed_role
  AFTER INSERT ON parties
  FOR EACH ROW EXECUTE FUNCTION create_party_super_admin_role();

-- RLS
ALTER TABLE parties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_party_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members can read their party"
  ON parties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_party_roles
      WHERE user_id = auth.uid() AND party_id = parties.id
    )
  );

CREATE POLICY "Party admins can update their party"
  ON parties FOR UPDATE
  USING (user_has_permission(auth.uid(), id, 4096));

CREATE POLICY "Party members can read roles"
  ON roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_party_roles
      WHERE user_id = auth.uid() AND party_id = roles.party_id
    )
  );

CREATE POLICY "Party admins can manage roles"
  ON roles FOR ALL
  USING (user_has_permission(auth.uid(), party_id, 4));

-- Users can read their own memberships; party admins (MANAGE_USERS) can read all.
CREATE POLICY "Users read own memberships"
  ON user_party_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Party admins read party memberships"
  ON user_party_roles FOR SELECT
  USING (user_has_permission(auth.uid(), party_id, 2));

CREATE POLICY "Party admins manage memberships"
  ON user_party_roles FOR ALL
  USING (user_has_permission(auth.uid(), party_id, 2));

GRANT SELECT ON parties           TO authenticated;
GRANT UPDATE ON parties           TO authenticated;
GRANT SELECT ON roles             TO authenticated;
GRANT INSERT, UPDATE, DELETE ON roles TO authenticated;
GRANT SELECT ON user_party_roles  TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_party_roles TO authenticated;
