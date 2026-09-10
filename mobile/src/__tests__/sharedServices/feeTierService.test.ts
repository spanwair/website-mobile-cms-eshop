import {
  evaluateFeeTierForClosedPeriod,
  getCurrentFeeTier,
} from "@shared/services/feeTierService";

import {
  createFakeClient,
  createFakeState,
} from "./testUtils/fakeBillingClient";

// A month safely in the past so isPeriodElapsed() is always true regardless of when this
// test runs -- the function must refuse to evaluate anything but a fully closed month.
const PAST_YEAR = 2020;
const PAST_MONTH0 = 0; // January 2020

const party = {
  id: "party-1",
  name: "Test Eshop",
  billing_email: "billing@test.cz",
  lang: "cs",
  seller_mode: "own_company",
};
const partiesSeed = { [party.id]: { seller_mode: party.seller_mode } };

describe("evaluateFeeTierForClosedPeriod - bod 5 auto switch", () => {
  it("switches percentage -> fixed when the closed month's revenue is above the threshold", async () => {
    const state = createFakeState({
      grossRevenueKc: 35000,
      parties: partiesSeed,
    });
    const client = createFakeClient(state) as any;

    const result = await evaluateFeeTierForClosedPeriod(
      client,
      party,
      PAST_YEAR,
      PAST_MONTH0,
    );

    expect(result?.previousFeeMode).toBe("percentage");
    expect(result?.newFeeMode).toBe("fixed");
    expect(result?.changed).toBe(true);
    expect(result?.alreadyEvaluated).toBe(false);
  });

  it("stays on percentage, reports changed:false, when revenue is at or below the threshold", async () => {
    const state = createFakeState({
      grossRevenueKc: 10000,
      parties: partiesSeed,
    });
    const client = createFakeClient(state) as any;

    const result = await evaluateFeeTierForClosedPeriod(
      client,
      party,
      PAST_YEAR,
      PAST_MONTH0,
    );

    expect(result?.previousFeeMode).toBe("percentage");
    expect(result?.newFeeMode).toBe("percentage");
    expect(result?.changed).toBe(false);
  });

  it("switches fixed -> percentage the month after revenue drops back down", async () => {
    const state = createFakeState({
      grossRevenueKc: 40000,
      parties: partiesSeed,
    });
    const client = createFakeClient(state) as any;

    await evaluateFeeTierForClosedPeriod(client, party, PAST_YEAR, PAST_MONTH0);
    expect(await getCurrentFeeTier(client, party.id)).toBe("fixed");

    state.grossRevenueKc = 5000;
    const nextMonth = await evaluateFeeTierForClosedPeriod(
      client,
      party,
      PAST_YEAR,
      PAST_MONTH0 + 1,
    );

    expect(nextMonth?.previousFeeMode).toBe("fixed");
    expect(nextMonth?.newFeeMode).toBe("percentage");
    expect(nextMonth?.changed).toBe(true);
  });

  it("skips smalljobs_commission parties entirely (ledger mode is never auto-assigned)", async () => {
    const state = createFakeState({
      grossRevenueKc: 99999,
      parties: { [party.id]: { seller_mode: "smalljobs_commission" } },
    });
    const client = createFakeClient(state) as any;
    const commissionParty = { ...party, seller_mode: "smalljobs_commission" };

    const result = await evaluateFeeTierForClosedPeriod(
      client,
      commissionParty,
      PAST_YEAR,
      PAST_MONTH0,
    );
    expect(result).toBeNull();
  });

  it("refuses to evaluate a month that has not fully elapsed yet", async () => {
    const state = createFakeState({
      grossRevenueKc: 40000,
      parties: partiesSeed,
    });
    const client = createFakeClient(state) as any;
    const now = new Date();

    await expect(
      evaluateFeeTierForClosedPeriod(
        client,
        party,
        now.getUTCFullYear(),
        now.getUTCMonth(),
      ),
    ).rejects.toThrow();
  });

  it("a second run for the same closed month is idempotent: no re-decision, no re-switch", async () => {
    const state = createFakeState({
      grossRevenueKc: 40000,
      parties: partiesSeed,
    });
    const client = createFakeClient(state) as any;

    const first = await evaluateFeeTierForClosedPeriod(
      client,
      party,
      PAST_YEAR,
      PAST_MONTH0,
    );
    expect(first?.alreadyEvaluated).toBe(false);
    expect(first?.changed).toBe(true);

    // Simulate a retried/duplicated cron invocation -- revenue input even changes underneath
    // it (network retry after a late order), but the (party_id, period_start) row already
    // exists, so this run must defer to the first decision instead of deciding again.
    state.grossRevenueKc = 1000;
    const second = await evaluateFeeTierForClosedPeriod(
      client,
      party,
      PAST_YEAR,
      PAST_MONTH0,
    );

    expect(second?.alreadyEvaluated).toBe(true);
    expect(second?.changed).toBe(false);
    expect(second?.newFeeMode).toBe("fixed"); // still the first run's decision, not re-derived
  });
});
