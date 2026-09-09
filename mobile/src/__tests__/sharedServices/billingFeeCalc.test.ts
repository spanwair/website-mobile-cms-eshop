import {
  COMMISSION_RATE,
  MONTHLY_COMMISSION_CAP_CZK,
} from "@shared/constants/sellerMode";
import { computeBillingPeriodTotals } from "@shared/utils/billingFeeCalc";

describe("computeBillingPeriodTotals — percentage mode", () => {
  it("computes gross, real costs, net revenue, fee and net payout correctly", () => {
    const result = computeBillingPeriodTotals(
      { grossRevenueKc: 100000, realCostsKc: 40000 },
      "percentage",
    );
    expect(result.grossRevenueKc).toBe(100000);
    expect(result.realCostsKc).toBe(40000);
    expect(result.netRevenueKc).toBe(60000);
    expect(result.feeRate).toBe(COMMISSION_RATE);
    expect(result.feeAmountKc).toBeCloseTo(100000 * COMMISSION_RATE, 2);
    expect(result.netPayoutKc).toBeCloseTo(60000 - 100000 * COMMISSION_RATE, 2);
  });

  it("rounds to whole haléře instead of drifting under repeated float math", () => {
    const result = computeBillingPeriodTotals(
      { grossRevenueKc: 333.33, realCostsKc: 111.11 },
      "percentage",
    );
    // 333.33 Kc -> 33333 haleru * 0.1 = 3333.3 -> rounds to 3333 haleru = 33.33 Kc
    expect(result.feeAmountKc).toBe(33.33);
    expect(result.netRevenueKc).toBeCloseTo(333.33 - 111.11, 2);
  });
});

describe("computeBillingPeriodTotals — fixed mode", () => {
  it("charges the flat monthly cap regardless of turnover size", () => {
    const small = computeBillingPeriodTotals(
      { grossRevenueKc: 5000, realCostsKc: 1000 },
      "fixed",
    );
    const large = computeBillingPeriodTotals(
      { grossRevenueKc: 500000, realCostsKc: 100000 },
      "fixed",
    );
    expect(small.feeAmountKc).toBe(MONTHLY_COMMISSION_CAP_CZK);
    expect(large.feeAmountKc).toBe(MONTHLY_COMMISSION_CAP_CZK);
    expect(small.feeRate).toBeNull();
  });

  it("net payout can go negative when the fixed fee exceeds net revenue for a quiet month", () => {
    const result = computeBillingPeriodTotals(
      { grossRevenueKc: 1000, realCostsKc: 500 },
      "fixed",
    );
    expect(result.netRevenueKc).toBe(500);
    expect(result.feeAmountKc).toBe(MONTHLY_COMMISSION_CAP_CZK);
    expect(result.netPayoutKc).toBe(500 - MONTHLY_COMMISSION_CAP_CZK);
  });
});

describe("computeBillingPeriodTotals — ledger mode", () => {
  it("uses the passed-in ledger fee total verbatim, not a recomputed percentage", () => {
    const result = computeBillingPeriodTotals(
      { grossRevenueKc: 100000, realCostsKc: 20000 },
      "ledger",
      12345.67,
    );
    expect(result.feeAmountKc).toBe(12345.67);
    expect(result.feeRate).toBeNull();
    expect(result.netPayoutKc).toBeCloseTo(100000 - 20000 - 12345.67, 2);
  });

  it("defaults the ledger fee to zero when not provided", () => {
    const result = computeBillingPeriodTotals(
      { grossRevenueKc: 1000, realCostsKc: 0 },
      "ledger",
    );
    expect(result.feeAmountKc).toBe(0);
  });
});
