-- Shipping price split: address delivery vs pickup point can cost different amounts.
-- `base_price` keeps its meaning as the ADDRESS (home-delivery) price; `pickup_price` is the
-- new price charged when the customer picks a výdejní místo / pickup point. `free_above_amount`
-- still applies to both delivery types. Platform-wide, one row per carrier (same as before).

ALTER TABLE shipping_provider_configs
  ADD COLUMN IF NOT EXISTS pickup_price NUMERIC(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN shipping_provider_configs.base_price IS 'Address (home) delivery price';
COMMENT ON COLUMN shipping_provider_configs.pickup_price IS 'Pickup-point (výdejní místo) delivery price';
