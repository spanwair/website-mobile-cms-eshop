-- Storefront nav bar (hours/phone/email/currency label) needs per-party adjustable contact
-- info and a display currency. All rendered as plain text (Astro auto-escapes), so no
-- <style set:html>-style XSS risk like color_*/font_* — only currency_code gets a format
-- check since it's a stable 3-letter code, not free text.

ALTER TABLE store_configs
  ADD COLUMN IF NOT EXISTS contact_phone  TEXT,
  ADD COLUMN IF NOT EXISTS contact_email  TEXT,
  ADD COLUMN IF NOT EXISTS business_hours TEXT,
  ADD COLUMN IF NOT EXISTS currency_code  TEXT NOT NULL DEFAULT 'CZK';

ALTER TABLE store_configs
  ADD CONSTRAINT store_configs_currency_code_check CHECK (currency_code ~ '^[A-Z]{3}$');
