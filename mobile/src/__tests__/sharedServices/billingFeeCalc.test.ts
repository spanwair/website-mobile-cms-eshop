import { COMMISSION_TIERS } from "@shared/constants/sellerMode";
import { computeBillingPeriodTotals, computeTieredCommission, resolveFeeSchedule } from "@shared/utils/billingFeeCalc";

describe("resolveFeeSchedule", () => {
  it("falls back to the global COMMISSION_TIERS default when no override is set", () => {
    expect(resolveFeeSchedule(null)).toEqual(COMMISSION_TIERS);
    expect(resolveFeeSchedule({})).toEqual(COMMISSION_TIERS);
  });

  it("returns a valid per-party override tier array as-is", () => {
    const override = [
      { uptoKc: 50000, rate: 0.08 },
      { uptoKc: null, rate: 0.04 },
    ];
    expect(resolveFeeSchedule({ commission_tiers_override: override })).toEqual(override);
  });

  it("falls back to the default when the override is malformed", () => {
    expect(resolveFeeSchedule({ commission_tiers_override: "not-an-array" })).toEqual(COMMISSION_TIERS);
    expect(resolveFeeSchedule({ commission_tiers_override: [] })).toEqual(COMMISSION_TIERS);
    // Last entry's uptoKc must be null (open-ended) -- a schedule missing that is invalid.
    expect(resolveFeeSchedule({ commission_tiers_override: [{ uptoKc: 1000, rate: 0.05 }] })).toEqual(COMMISSION_TIERS);
    // Non-increasing thresholds are invalid.
    expect(
      resolveFeeSchedule({
        commission_tiers_override: [
          { uptoKc: 1000, rate: 0.05 },
          { uptoKc: 1000, rate: 0.03 },
          { uptoKc: null, rate: 0.02 },
        ],
      })
    ).toEqual(COMMISSION_TIERS);
  });
});

// Marginal/bracket math: each order's commission is a blend across every band its own slice of
// the month's cumulative turnover touches -- never a whole-month cliff re-rate.
describe("computeTieredCommission", () => {
  const tiers = [
    { uptoKc: 10000, rate: 0.05 },
    { uptoKc: 30000, rate: 0.04 },
    { uptoKc: 60000, rate: 0.03 },
    { uptoKc: 90000, rate: 0.02 },
    { uptoKc: null, rate: 0.02 },
  ];

  it("charges the first band's rate for an order fully inside it", () => {
    const result = computeTieredCommission(5000, 0, tiers);
    expect(result.commissionAmountKc).toBe(250);
    expect(result.effectiveRate).toBe(0.05);
  });

  it("blends across two bands when an order straddles the boundary", () => {
    // Party has sold 9 000 Kč so far this month; this 5 000 Kč order spans 9 000-10 000
    // (band 1, 5%) and 10 000-14 000 (band 2, 4%).
    const result = computeTieredCommission(5000, 9000, tiers);
    const expectedFee = 1000 * 0.05 + 4000 * 0.04; // 50 + 160 = 210
    expect(result.commissionAmountKc).toBeCloseTo(expectedFee, 2);
    expect(result.effectiveRate).toBeCloseTo(expectedFee / 5000, 4);
  });

  it("never rewrites earlier turnover -- only this order's own slice matters", () => {
    const first = computeTieredCommission(10000, 0, tiers);
    const second = computeTieredCommission(5000, 10000, tiers);
    expect(first.commissionAmountKc).toBe(500); // 10 000 * 5%
    expect(second.commissionAmountKc).toBe(200); // 5 000 * 4%, band 2 only
  });

  it("falls into the open-ended last band once turnover passes every finite threshold", () => {
    const result = computeTieredCommission(20000, 100000, tiers);
    expect(result.commissionAmountKc).toBe(400); // 20 000 * 2%
    expect(result.effectiveRate).toBe(0.02);
  });

  it("respects a custom (e.g. negotiated enterprise) tier schedule", () => {
    const enterpriseTiers = [{ uptoKc: null, rate: 0.01 }];
    const result = computeTieredCommission(200000, 0, enterpriseTiers);
    expect(result.commissionAmountKc).toBe(2000);
    expect(result.effectiveRate).toBe(0.01);
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
