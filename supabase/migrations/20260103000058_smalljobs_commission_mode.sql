-- "No company" creator selling mode: a party can sell either under its own registered
-- company, or as a commissionaire arrangement where Smalljobs s.r.o. contracts with the
-- end customer in its own name (§2455-2470 ObčZ) on the creator's account. Toward the
-- consumer, Smalljobs remains the statutory seller (14-day withdrawal, reklamace); the
-- creator's return-handling duty is an internal obligation captured in the accepted
-- agreement below, not a substitution of the consumer's rights.
--
-- VAT handling is a config toggle (see shared/constants/sellerMode.ts VAT_ENABLED) because
-- Smalljobs s.r.o.'s VAT-payer status is not yet confirmed — tax_rate/tax_amount are wired
-- through but computed as 0 until that flag is turned on.

ALTER TABLE parties
  ADD COLUMN seller_mode TEXT NOT NULL DEFAULT 'own_company'
  CONSTRAINT parties_seller_mode_check CHECK (seller_mode IN ('own_company', 'smalljobs_commission'));

-- Needed to compute the 60-day payout hold from the actual payment moment, not order creation.
ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ;

-- One active agreement per party — the record of consent that forms the komisionářská
-- smlouva (creator = komitent, Smalljobs = komisionář). Required before seller_mode can be
-- switched to smalljobs_commission (enforced in the app layer, not here).
CREATE TABLE IF NOT EXISTS commissionaire_agreements (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id              UUID        NOT NULL UNIQUE REFERENCES parties(id) ON DELETE CASCADE,
  legal_full_name       TEXT        NOT NULL,
  address_line1         TEXT        NOT NULL,
  address_city          TEXT        NOT NULL,
  address_postal_code   TEXT        NOT NULL,
  address_country_code  CHAR(2)     NOT NULL DEFAULT 'CZ',
  bank_account          TEXT        NOT NULL,
  personal_id_note      TEXT,
  terms_version         TEXT        NOT NULL,
  accepted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_by           UUID        NOT NULL REFERENCES auth.users(id),
  status                TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  revoked_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER commissionaire_agreements_updated_at
  BEFORE UPDATE ON commissionaire_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Per-order commission split, recorded once at payment time. hold_until gates when the
-- creator's net share becomes eligible for payout ("eligible" is derived at query time as
-- status='held' AND hold_until <= now(), not a stored state, so no cron is needed).
CREATE TABLE IF NOT EXISTS order_commission_ledger (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  party_id           UUID          NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  gross_amount       NUMERIC(12,2) NOT NULL,
  tax_rate           NUMERIC(5,2)  NOT NULL DEFAULT 0,
  tax_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_rate    NUMERIC(5,4)  NOT NULL DEFAULT 0.10,
  commission_amount  NUMERIC(12,2) NOT NULL,
  net_payable        NUMERIC(12,2) NOT NULL,
  currency           CHAR(3)       NOT NULL DEFAULT 'CZK',
  hold_until         TIMESTAMPTZ   NOT NULL,
  status             TEXT          NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'paid', 'reversed')),
  paid_at            TIMESTAMPTZ,
  paid_by            UUID          REFERENCES auth.users(id),
  payout_reference   TEXT,
  reversed_at        TIMESTAMPTZ,
  reversed_reason    TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER order_commission_ledger_updated_at
  BEFORE UPDATE ON order_commission_ledger FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_order_commission_ledger_party_status ON order_commission_ledger(party_id, status);

ALTER TABLE commissionaire_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_commission_ledger   ENABLE ROW LEVEL SECURITY;

-- MANAGE_AUDIT = 4096 — same bit that already gates party settings/status edits ([id].astro
-- canManageSettings), since forming/reading the agreement is an equally sensitive party-level
-- legal/financial action.
CREATE POLICY "Auditors manage commissionaire_agreements"
  ON commissionaire_agreements FOR ALL
  TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 4096))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 4096));

-- Order managers (MANAGE_ORDERS = 32) can see their own party's held/paid balances;
-- only MANAGE_AUDIT (4096) can mark a payout as paid (write access).
CREATE POLICY "Order managers read own commission ledger"
  ON order_commission_ledger FOR SELECT
  TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 32));

CREATE POLICY "Auditors write commission ledger"
  ON order_commission_ledger FOR ALL
  TO authenticated
  USING (user_has_permission(auth.uid(), party_id, 4096))
  WITH CHECK (user_has_permission(auth.uid(), party_id, 4096));

GRANT SELECT, INSERT, UPDATE, DELETE ON commissionaire_agreements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_commission_ledger   TO authenticated;
