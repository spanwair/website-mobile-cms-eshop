import { kcToHaleru, haleruToKc } from "./money";
import { COMMISSION_RATE, REDUCED_COMMISSION_RATE, COMMISSION_REDUCED_THRESHOLD_CZK } from "../constants/sellerMode";

// A party's effective own_company commission schedule: the global defaults from
// shared/constants/sellerMode.ts, each replaced by a per-party override when one is set.
// resolveFeeSchedule is the ONLY place overrides are applied, so every commission computation
// (per-order in shared/services/commissionLedgerService.ts) reads the same effective numbers.
export interface FeeScheduleOverrides {
  commission_rate_override?: number | string | null;
  reduced_commission_rate_override?: number | string | null;
  commission_threshold_override?: number | string | null;
}

export interface FeeSchedule {
  standardRate: number;
  reducedRate: number;
  thresholdKc: number;
}

function coerce(value: number | string | null | undefined, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : fallback;
}

export function resolveFeeSchedule(overrides?: FeeScheduleOverrides | null): FeeSchedule {
  return {
    standardRate: coerce(overrides?.commission_rate_override, COMMISSION_RATE),
    reducedRate: coerce(overrides?.reduced_commission_rate_override, REDUCED_COMMISSION_RATE),
    thresholdKc: coerce(overrides?.commission_threshold_override, COMMISSION_REDUCED_THRESHOLD_CZK),
  };
}

// Inputs for a monthly STATEMENT (shared/services/billingPeriodService.ts): both seller modes
// now pay per-order via order_commission_ledger (shared/services/commissionLedgerService.ts),
// so a period's fee/net/paid/outstanding figures are always aggregated from the ledger, never
// independently recomputed from a rate formula here — this is a pure rollup, not a fee engine.
export interface BillingPeriodTotalsKc {
  grossRevenueKc: number;
  realCostsKc: number; // COGS + completed refunds + damaged loss — informational, tax-export only
  ledgerFeeKc: number; // sum of order_commission_ledger.commission_amount for the period
  netPayableTotalKc: number; // sum of order_commission_ledger.net_payable for the period
  netPaidKc: number; // portion of netPayableTotalKc already status='paid', as of computation time
}

export interface BillingPeriodComputation {
  grossRevenueKc: number;
  realCostsKc: number;
  netRevenueKc: number; // gross - real costs (tax-export figure, not the fee basis)
  feeAmountKc: number;
  netPayoutKc: number; // what the party earns net of commission, for this month's orders
  paidAmountKc: number; // snapshot: already paid out, as of computed_at
  outstandingAmountKc: number; // snapshot: netPayoutKc - paidAmountKc, as of computed_at
}

export function computeBillingPeriodTotals(totals: BillingPeriodTotalsKc): BillingPeriodComputation {
  const grossH = kcToHaleru(totals.grossRevenueKc);
  const costsH = kcToHaleru(totals.realCostsKc);
  const feeH = kcToHaleru(totals.ledgerFeeKc);
  const netPayoutH = kcToHaleru(totals.netPayableTotalKc);
  const paidH = kcToHaleru(totals.netPaidKc);

  return {
    grossRevenueKc: haleruToKc(grossH),
    realCostsKc: haleruToKc(costsH),
    netRevenueKc: haleruToKc(grossH - costsH),
    feeAmountKc: haleruToKc(feeH),
    netPayoutKc: haleruToKc(netPayoutH),
    paidAmountKc: haleruToKc(paidH),
    outstandingAmountKc: haleruToKc(netPayoutH - paidH),
  };
}
