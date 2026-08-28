-- Tracks the no-IČO (smalljobs_commission) 12,000 Kč/month net-payout limit —
-- shared/constants/sellerMode.ts NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK is the source of truth.
-- Corrects an earlier mistake: order_commission_ledger.net_payable previously had no cap at
-- all for this seller mode. From this migration on, net_payable is the amount ACTUALLY
-- payable (after the monthly limit is applied); withheld_amount is the portion of this
-- order's net that exceeded the creator's remaining room for the month and is being held
-- back — legally still owed to the creator, released once they register an IČO, but the
-- claim on it lapses withheld_expires_at (see shared/services/commissionLedgerService.ts).

ALTER TABLE order_commission_ledger
  ADD COLUMN withheld_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN withheld_expires_at TIMESTAMPTZ;
