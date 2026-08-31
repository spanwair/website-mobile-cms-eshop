-- Adds a real payment_method to orders — until now checkout always assumed Stripe.
-- 'cod' (dobírka / cash-on-delivery) is settled by the carrier on handover instead of
-- online, so payment_status stays 'unpaid' until the delivery-status poller (see
-- 20260103000076_shipment_status_cron.sql) confirms the carrier marked the shipment
-- delivered. payment_fee is stored separately from shipping_amount so shipping-cost
-- reporting isn't polluted by the COD surcharge — see shared/constants/payment.ts.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'stripe'
  CHECK (payment_method IN ('stripe', 'cod'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_fee NUMERIC(12,2) NOT NULL DEFAULT 0;
