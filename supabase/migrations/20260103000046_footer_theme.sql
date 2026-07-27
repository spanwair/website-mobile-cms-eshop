-- The footer was shipped with a hardcoded dark background (not admin-adjustable). Make it a
-- real per-store choice, defaulting to 'light' so it matches the rest of the storefront out
-- of the box unless an admin opts into the dark variant.

ALTER TABLE store_configs
  ADD COLUMN IF NOT EXISTS footer_theme TEXT NOT NULL DEFAULT 'light';

ALTER TABLE store_configs
  ADD CONSTRAINT store_configs_footer_theme_check CHECK (footer_theme IN ('light', 'dark'));
