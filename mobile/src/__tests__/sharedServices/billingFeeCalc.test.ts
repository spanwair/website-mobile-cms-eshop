import {
  COMMISSION_RATE,
  REDUCED_COMMISSION_RATE,
  COMMISSION_REDUCED_THRESHOLD_CZK,
} from "@shared/constants/sellerMode";
import { computeBillingPeriodTotals, resolveFeeSchedule } from "@shared/utils/billingFeeCalc";

describe("resolveFeeSchedule", () => {
  it("falls back to the global defaults when no overrides are set", () => {
    expect(resolveFeeSchedule(null)).toEqual({
      standardRate: COMMISSION_RATE,
      reducedRate: REDUCED_COMMISSION_RATE,
      thresholdKc: COMMISSION_REDUCED_THRESHOLD_CZK,
    });
    expect(resolveFeeSchedule({})).toEqual({
      standardRate: COMMISSION_RATE,
      reducedRate: REDUCED_COMMISSION_RATE,
      thresholdKc: COMMISSION_REDUCED_THRESHOLD_CZK,
    });
  });

  it("applies each per-party override independently, accepting numeric strings from the DB", () => {
    const schedule = resolveFeeSchedule({
      commission_rate_override: 0.08,
      reduced_commission_rate_override: "0.04",
      commission_threshold_override: "50000",
    });
    expect(schedule).toEqual({ standardRate: 0.08, reducedRate: 0.04, thresholdKc: 50000 });
  });

  it("ignores non-finite override values and keeps the default", () => {
    const schedule = resolveFeeSchedule({ commission_rate_override: "not-a-number" });
    expect(schedule.standardRate).toBe(COMMISSION_RATE);
  });
});

// Both seller modes now pay per order via order_commission_ledger
// (shared/services/commissionLedgerService.ts) — computeBillingPeriodTotals is a pure rollup
// of already-computed ledger figures for a monthly statement, not a fee engine anymore.
describe("computeBillingPeriodTotals — rollup from ledger totals", () => {
  it("computes gross, real costs, net revenue, fee, net payout, paid and outstanding", () => {
    const result = computeBillingPeriodTotals({
      grossRevenueKc: 20000,
      realCostsKc: 8000,
      ledgerFeeKc: 1000,
      netPayableTotalKc: 19000,
      netPaidKc: 5000,
    });
    expect(result.grossRevenueKc).toBe(20000);
    expect(result.realCostsKc).toBe(8000);
    expect(result.netRevenueKc).toBe(12000);
    expect(result.feeAmountKc).toBe(1000);
    expect(result.netPayoutKc).toBe(19000);
    expect(result.paidAmountKc).toBe(5000);
    expect(result.outstandingAmountKc).toBe(14000);
  });

  it("rounds to whole haléře instead of drifting under repeated float math", () => {
    const result = computeBillingPeriodTotals({
      grossRevenueKc: 333.33,
      realCostsKc: 111.11,
      ledgerFeeKc: 33.33,
      netPayableTotalKc: 288.89,
      netPaidKc: 0,
    });
    expect(result.feeAmountKc).toBe(33.33);
    expect(result.netRevenueKc).toBeCloseTo(333.33 - 111.11, 2);
    expect(result.outstandingAmountKc).toBeCloseTo(288.89, 2);
  });

  it("defaults all ledger totals to zero when the period has no activity", () => {
    const result = computeBillingPeriodTotals({
      grossRevenueKc: 0,
      realCostsKc: 0,
      ledgerFeeKc: 0,
      netPayableTotalKc: 0,
      netPaidKc: 0,
    });
    expect(result.feeAmountKc).toBe(0);
    expect(result.netPayoutKc).toBe(0);
    expect(result.outstandingAmountKc).toBe(0);
  });
});
