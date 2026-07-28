-- cost_price backs real profit calculation (revenue - refunds - COGS) on the
-- products overview dashboard; without it "profit" could only ever mean gross revenue.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0;

-- return_requests had no actor column, so a completed/approved/rejected return
-- could never say who processed it — needed for the "who did what" audit trail.
ALTER TABLE return_requests
  ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id);
