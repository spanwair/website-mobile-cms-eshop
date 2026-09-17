import { kcToHaleru, haleruToKc } from "./money";
import {
  COMMISSION_RATE,
  REDUCED_COMMISSION_RATE,
  COMMISSION_REDUCED_THRESHOLD_CZK,
  SELLER_MODE,
} from "../constants/sellerMode";

// 'percentage': standardRate of gross revenue. 'reduced': reducedRate of gross revenue, applied
// to the WHOLE month once turnover exceeds the threshold. 'ledger': smalljobs_commission parties
// already pay per-order via order_commission_ledger -- their period fee is the sum of what that
// ledger already deducted, informational only, not a second remittance. WHICH of
// 'percentage' / 'reduced' a given own_company party/month uses is decided by autoFeeMode from the
// period's gross revenue against the party's threshold -- there is no manual override of the mode.
export type BillingFeeMode = "percentage" | "reduced" | "ledger";

// A party's effective fee schedule: the global defaults from shared/constants/sellerMode.ts,
// each replaced by a per-party override when one is set. resolveFeeSchedule is the ONLY place
// overrides are applied, so every fee computation reads the same effective numbers.
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

export interface BillingPeriodTotalsKc {
  grossRevenueKc: number;
  realCostsKc: number; // COGS + completed refunds + damaged loss for the period
}

export interface BillingPeriodComputation {
  grossRevenueKc: number;
  realCostsKc: number;
  netRevenueKc: number; // gross - real costs, before the platform fee
  feeMode: BillingFeeMode;
  feeRate: number | null; // snapshot, set for both 'percentage' and 'reduced'
  feeAmountKc: number;
  netPayoutKc: number; // what the eshop actually earns after real costs and the platform fee
}

// The platform fee is never a manual choice: smalljobs_commission sellers pay per-order via the
// ledger; own_company sellers pay the standard rate of gross, dropping to the reduced rate on the
// whole month once turnover passes the threshold. So the mode is fully determined by the period's
// gross revenue against the party's (possibly overridden) threshold - no dropdown, no stored mode.
export function autoFeeMode(
  grossRevenueKc: number,
  sellerMode: string | null,
  schedule: FeeSchedule = resolveFeeSchedule(),
): BillingFeeMode {
  if (sellerMode === SELLER_MODE.SMALLJOBS_COMMISSION) return "ledger";
  const grossH = kcToHaleru(grossRevenueKc);
  const thresholdH = kcToHaleru(schedule.thresholdKc);
  return grossH > thresholdH ? "reduced" : "percentage";
}

export function computeBillingPeriodTotals(
  totals: BillingPeriodTotalsKc,
  feeMode: BillingFeeMode,
  ledgerFeeKc = 0,
  schedule: FeeSchedule = resolveFeeSchedule(),
): BillingPeriodComputation {
  const grossH = kcToHaleru(totals.grossRevenueKc);
  const costsH = kcToHaleru(totals.realCostsKc);
  const netRevenueH = grossH - costsH;

  let feeH: number;
  let feeRate: number | null = null;
  if (feeMode === "percentage") {
    feeRate = schedule.standardRate;
    feeH = Math.round(grossH * schedule.standardRate);
  } else if (feeMode === "reduced") {
    feeRate = schedule.reducedRate;
    feeH = Math.round(grossH * schedule.reducedRate);
  } else {
    feeH = kcToHaleru(ledgerFeeKc);
  }

  const netPayoutH = netRevenueH - feeH;

  return {
    grossRevenueKc: haleruToKc(grossH),
    realCostsKc: haleruToKc(costsH),
    netRevenueKc: haleruToKc(netRevenueH),
    feeMode,
    feeRate,
    feeAmountKc: haleruToKc(feeH),
    netPayoutKc: haleruToKc(netPayoutH),
  };
}
