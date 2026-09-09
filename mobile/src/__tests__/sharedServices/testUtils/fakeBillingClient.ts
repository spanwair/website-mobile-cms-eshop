// Minimal in-memory stand-in for the exact Supabase query shapes
// evaluateFeeTierForClosedPeriod + recomputeBillingPeriod issue (eshop_fee_tier_events,
// eshop_billing_periods, parties, plus the get_billing_period_totals RPC). Not a general
// postgrest mock -- just enough surface for these two services, kept in one place so both the
// Jest test and the tsx cross-check script exercise identical behavior.

export interface FakeState {
  parties: Record<string, { seller_mode: string }>;
  billingPeriods: Map<string, any>; // key: `${party_id}|${period_start}`
  feeTierEvents: Map<string, any>; // key: `${party_id}|${period_start}`
  grossRevenueKc: number; // what the next get_billing_period_totals RPC call returns
  rpcCalls: number;
}

function key(partyId: string, periodStart: string) {
  return `${partyId}|${periodStart}`;
}

export function createFakeState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    parties: {},
    billingPeriods: new Map(),
    feeTierEvents: new Map(),
    grossRevenueKc: 0,
    rpcCalls: 0,
    ...overrides,
  };
}

export function createFakeClient(state: FakeState) {
  return {
    rpc: async (fn: string, args: any) => {
      if (fn !== "get_billing_period_totals")
        throw new Error(`unexpected rpc ${fn}`);
      state.rpcCalls += 1;
      return {
        data: {
          gross_revenue: state.grossRevenueKc,
          real_costs: 0,
          currency: "CZK",
          ledger_fee_amount: 0,
        },
        error: null,
      };
    },
    from: (table: string) => {
      if (table === "parties") {
        return {
          select: () => ({
            eq: (_col: string, partyId: string) => ({
              single: async () => {
                const p = state.parties[partyId];
                return p
                  ? { data: p, error: null }
                  : { data: null, error: { message: "not found" } };
              },
            }),
          }),
        };
      }

      if (table === "eshop_billing_periods") {
        return {
          select: () => ({
            eq: (_c1: string, partyId: string) => ({
              eq: (_c2: string, periodStart: string) => ({
                maybeSingle: async () => ({
                  data:
                    state.billingPeriods.get(key(partyId, periodStart)) ?? null,
                  error: null,
                }),
              }),
            }),
          }),
          upsert: (row: any) => ({
            select: () => ({
              single: async () => {
                const saved = {
                  id: `bp-${key(row.party_id, row.period_start)}`,
                  ...row,
                };
                state.billingPeriods.set(
                  key(row.party_id, row.period_start),
                  saved,
                );
                return { data: saved, error: null };
              },
            }),
          }),
        };
      }

      if (table === "eshop_fee_tier_events") {
        return {
          select: (_cols: string) => ({
            eq: (_c1: string, partyId: string) => ({
              eq: (_c2: string, periodStart: string) => ({
                single: async () => {
                  const row = state.feeTierEvents.get(
                    key(partyId, periodStart),
                  );
                  return row
                    ? { data: row, error: null }
                    : { data: null, error: { message: "not found" } };
                },
              }),
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => {
                    const rows = [...state.feeTierEvents.values()]
                      .filter((r) => r.party_id === partyId)
                      .sort((a, b) =>
                        a.period_start < b.period_start ? 1 : -1,
                      );
                    return { data: rows[0] ?? null, error: null };
                  },
                }),
              }),
            }),
          }),
          insert: async (row: any) => {
            const k = key(row.party_id, row.period_start);
            if (state.feeTierEvents.has(k)) {
              return {
                data: null,
                error: {
                  code: "23505",
                  message: "duplicate key value violates unique constraint",
                },
              };
            }
            state.feeTierEvents.set(k, row);
            return { data: row, error: null };
          },
          update: (patch: any) => ({
            eq: (_c1: string, partyId: string) => ({
              eq: (_c2: string, periodStart: string) => {
                const k = key(partyId, periodStart);
                const existing = state.feeTierEvents.get(k);
                if (existing)
                  state.feeTierEvents.set(k, { ...existing, ...patch });
                return Promise.resolve({ data: null, error: null });
              },
            }),
          }),
        };
      }

      throw new Error(`fakeBillingClient: unexpected table ${table}`);
    },
  };
}
