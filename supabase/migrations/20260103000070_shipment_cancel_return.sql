-- Adds carrier cancel/return tracking to order_shipments. A return is a second,
-- independent shipment traveling the opposite direction, so it gets its own id/tracking/
-- label/password columns rather than overwriting the forward shipment's fields.

ALTER TABLE order_shipments
  ADD COLUMN IF NOT EXISTS cancelled_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_provider_shipment_id TEXT,
  ADD COLUMN IF NOT EXISTS return_tracking_number     TEXT,
  ADD COLUMN IF NOT EXISTS return_password            TEXT,
  ADD COLUMN IF NOT EXISTS return_label_storage_path  TEXT,
  ADD COLUMN IF NOT EXISTS return_created_at          TIMESTAMPTZ;
