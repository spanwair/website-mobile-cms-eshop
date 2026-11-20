import { kcToHaleru, haleruToKc } from "./money";
import { COMMISSION_TIERS, type CommissionTier } from "../constants/sellerMode";

// A party's effective own_company commission schedule: the global COMMISSION_TIERS default,
// replaced wholesale by a per-party override when one is set. resolveFeeSchedule is the ONLY
// place overrides are applied, so every commission computation (per-order in
// shared/services/commissionLedgerService.ts) reads the same effective tier array.
export interface FeeScheduleOverrides {
  commission_tiers_override?: unknown;
}

function isValidTierArray(value: unknown): value is CommissionTier[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  let prevUpto = -Infinity;
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (typeof entry !== "object" || entry === null) return false;
    const { uptoKc, rate } = entry as { uptoKc?: unknown; rate?: unknown };
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 1) return false;
    const isLast = i === value.length - 1;
    if (isLast) {
      if (uptoKc !== null) return false;
    } else {
      if (typeof uptoKc !== "number" || !Number.isFinite(uptoKc) || uptoKc <= prevUpto) return false;
      prevUpto = uptoKc;
    }
  }
  return true;
}

// Ordered ascending by uptoKc, last entry's uptoKc is always null ("and above"). Falls back to
// the global COMMISSION_TIERS default whenever the override is absent or fails validation
// (malformed JSON should never silently charge Kč 0 or crash an order).
export function resolveFeeSchedule(overrides?: FeeScheduleOverrides | null): CommissionTier[] {
  const candidate = overrides?.commission_tiers_override;
  return isValidTierArray(candidate) ? candidate : COMMISSION_TIERS;
}

export interface TieredCommissionResult {
  commissionAmountKc: number;
  effectiveRate: number;
}

// Marginal/bracket commission for ONE order: the slice of the month's cumulative turnover that
// this order occupies (turnoverBeforeKc -> turnoverBeforeKc + grossAmountKc) is split across
// every tier band it overlaps, each portion charged at that band's own rate — never a
// whole-month re-rate. Progressive, not retroactive: earlier orders this month are never
// recomputed, only this order's own position in the running total decides its blended rate.
export function computeTieredCommission(
  grossAmountKc: number,
  turnoverBeforeKc: number,
  tiers: CommissionTier[]
): TieredCommissionResult {
  const beforeH = kcToHaleru(turnoverBeforeKc);
  const afterH = kcToHaleru(turnoverBeforeKc + grossAmountKc);

  let commissionH = 0;
  let lowerBoundH = 0;
  for (const tier of tiers) {
    const upperBoundH = tier.uptoKc === null ? Infinity : kcToHaleru(tier.uptoKc);
    const overlapStartH = Math.max(beforeH, lowerBoundH);
    const overlapEndH = Math.min(afterH, upperBoundH);
    const overlapH = Math.max(overlapEndH - overlapStartH, 0);
    commissionH += overlapH * tier.rate;
    lowerBoundH = upperBoundH;
  }

  const commissionAmountKc = haleruToKc(Math.round(commissionH));
  const effectiveRate = grossAmountKc > 0 ? Math.round((commissionAmountKc / grossAmountKc) * 1_000_000) / 1_000_000 : 0;
  return { commissionAmountKc, effectiveRate };
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
