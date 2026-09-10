import { kcToHaleru, haleruToKc } from "./money";
import { COMMISSION_RATE, MONTHLY_COMMISSION_CAP_CZK, SELLER_MODE } from "../constants/sellerMode";

// 'percentage': COMMISSION_RATE of gross revenue, uncapped here. 'fixed': the flat monthly
// cap. 'ledger': smalljobs_commission parties already pay per-order via
// order_commission_ledger -- their period fee is the sum of what that ledger already
// deducted, informational only, not a second remittance. Deciding WHICH of 'percentage' /
// 'fixed' a given own_company party/month should use (e.g. picking whichever is cheaper) is
// deliberately not implemented here -- fee_mode is a stored, per-party-per-period setting,
// and this function only computes the total for whichever mode is on file.
export type BillingFeeMode = "percentage" | "fixed" | "ledger";

export interface BillingPeriodTotalsKc {
  grossRevenueKc: number;
  realCostsKc: number; // COGS + completed refunds + damaged loss for the period
}

export interface BillingPeriodComputation {
  grossRevenueKc: number;
  realCostsKc: number;
  netRevenueKc: number; // gross - real costs, before the platform fee
  feeMode: BillingFeeMode;
  feeRate: number | null; // snapshot, only set for 'percentage'
  feeAmountKc: number;
  netPayoutKc: number; // what the eshop actually earns after real costs and the platform fee
}

// The platform fee is never a manual choice: smalljobs_commission sellers pay per-order via
// the ledger; own_company sellers pay COMMISSION_RATE of gross, automatically capped at the
// flat MONTHLY_COMMISSION_CAP_CZK once 10% of the month's turnover would exceed it. So the
// mode is fully determined by the period's gross revenue - no dropdown, no stored override.
export function autoFeeMode(grossRevenueKc: number, sellerMode: string | null): BillingFeeMode {
  if (sellerMode === SELLER_MODE.SMALLJOBS_COMMISSION) return "ledger";
  const grossH = kcToHaleru(grossRevenueKc);
  const capH = kcToHaleru(MONTHLY_COMMISSION_CAP_CZK);
  return Math.round(grossH * COMMISSION_RATE) > capH ? "fixed" : "percentage";
}

export function computeBillingPeriodTotals(
  totals: BillingPeriodTotalsKc,
  feeMode: BillingFeeMode,
  ledgerFeeKc = 0
): BillingPeriodComputation {
  const grossH = kcToHaleru(totals.grossRevenueKc);
  const costsH = kcToHaleru(totals.realCostsKc);
  const netRevenueH = grossH - costsH;

  let feeH: number;
  let feeRate: number | null = null;
  if (feeMode === "percentage") {
    feeRate = COMMISSION_RATE;
    feeH = Math.round(grossH * COMMISSION_RATE);
  } else if (feeMode === "fixed") {
    feeH = kcToHaleru(MONTHLY_COMMISSION_CAP_CZK);
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
