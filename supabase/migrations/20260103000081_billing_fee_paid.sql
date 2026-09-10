-- Payment status for a billing period's platform fee: when the eshop has settled the fee
-- for that month (owner marks it, or a future payment flow sets it). NULL = not yet paid.
ALTER TABLE eshop_billing_periods
  ADD COLUMN IF NOT EXISTS fee_paid_at timestamptz;
