import {
  COMMISSION_RATE,
  REDUCED_COMMISSION_RATE,
  COMMISSION_REDUCED_THRESHOLD_CZK,
} from "@shared/constants/sellerMode";
import {
  computeBillingPeriodTotals,
  autoFeeMode,
  resolveFeeSchedule,
} from "@shared/utils/billingFeeCalc";
import { SELLER_MODE } from "@shared/constants/sellerMode";

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

describe("autoFeeMode — tier selection by monthly turnover", () => {
  it("stays on the standard rate at or below the threshold, switches to reduced strictly above it", () => {
    expect(autoFeeMode(COMMISSION_REDUCED_THRESHOLD_CZK, SELLER_MODE.OWN_COMPANY)).toBe("percentage");
    expect(autoFeeMode(COMMISSION_REDUCED_THRESHOLD_CZK + 1, SELLER_MODE.OWN_COMPANY)).toBe("reduced");
  });

  it("switches at haléř precision just above the threshold", () => {
    expect(autoFeeMode(29900.01, SELLER_MODE.OWN_COMPANY)).toBe("reduced");
    expect(autoFeeMode(29899.99, SELLER_MODE.OWN_COMPANY)).toBe("percentage");
  });

  it("honours a per-party threshold override", () => {
    const schedule = resolveFeeSchedule({ commission_threshold_override: 50000 });
    expect(autoFeeMode(40000, SELLER_MODE.OWN_COMPANY, schedule)).toBe("percentage");
    expect(autoFeeMode(50001, SELLER_MODE.OWN_COMPANY, schedule)).toBe("reduced");
  });

  it("always returns 'ledger' for smalljobs_commission sellers regardless of turnover", () => {
    expect(autoFeeMode(5000, SELLER_MODE.SMALLJOBS_COMMISSION)).toBe("ledger");
    expect(autoFeeMode(500000, SELLER_MODE.SMALLJOBS_COMMISSION)).toBe("ledger");
  });
});

describe("computeBillingPeriodTotals — percentage mode (standard rate)", () => {
  it("computes gross, real costs, net revenue, fee and net payout correctly", () => {
    const result = computeBillingPeriodTotals(
      { grossRevenueKc: 20000, realCostsKc: 8000 },
      "percentage",
    );
    expect(result.netRevenueKc).toBe(12000);
    expect(result.feeRate).toBe(COMMISSION_RATE);
    expect(result.feeAmountKc).toBeCloseTo(20000 * COMMISSION_RATE, 2); // 2000
    expect(result.netPayoutKc).toBeCloseTo(12000 - 2000, 2);
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

describe("computeBillingPeriodTotals — reduced mode (5% of the whole turnover)", () => {
  it("charges the reduced rate on the entire turnover, snapshotting the rate used", () => {
    const result = computeBillingPeriodTotals(
      { grossRevenueKc: 100000, realCostsKc: 40000 },
      "reduced",
    );
    expect(result.feeRate).toBe(REDUCED_COMMISSION_RATE);
    expect(result.feeAmountKc).toBeCloseTo(100000 * REDUCED_COMMISSION_RATE, 2); // 5000
    expect(result.netPayoutKc).toBeCloseTo(60000 - 5000, 2);
  });

  it("produces the documented drop at the threshold: 29 900 pays more than 30 000", () => {
    const atThreshold = computeBillingPeriodTotals(
      { grossRevenueKc: 29900, realCostsKc: 0 },
      autoFeeMode(29900, SELLER_MODE.OWN_COMPANY),
    );
    const justAbove = computeBillingPeriodTotals(
      { grossRevenueKc: 30000, realCostsKc: 0 },
      autoFeeMode(30000, SELLER_MODE.OWN_COMPANY),
    );
    expect(atThreshold.feeMode).toBe("percentage");
    expect(atThreshold.feeAmountKc).toBeCloseTo(2990, 2); // 29900 * 10%
    expect(justAbove.feeMode).toBe("reduced");
    expect(justAbove.feeAmountKc).toBeCloseTo(1500, 2); // 30000 * 5%
    expect(justAbove.feeAmountKc).toBeLessThan(atThreshold.feeAmountKc);
  });

  it("uses a per-party reduced-rate override", () => {
    const schedule = resolveFeeSchedule({ reduced_commission_rate_override: 0.06 });
    const result = computeBillingPeriodTotals(
      { grossRevenueKc: 100000, realCostsKc: 0 },
      "reduced",
      0,
      schedule,
    );
    expect(result.feeRate).toBe(0.06);
    expect(result.feeAmountKc).toBeCloseTo(6000, 2);
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
