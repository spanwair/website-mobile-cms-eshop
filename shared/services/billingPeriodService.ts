import type { SupabaseClient } from "@supabase/supabase-js";
import { getCalendarMonthPeriod, isPeriodElapsed } from "../utils/billingPeriod";
import {
  computeBillingPeriodTotals,
  autoFeeMode,
  resolveFeeSchedule,
  type BillingFeeMode,
} from "../utils/billingFeeCalc";

export interface BillingPeriodRow {
  id: string;
  partyId: string;
  periodStart: string;
  periodEnd: string;
  sellerMode: string;
  grossRevenue: number;
  realCosts: number;
  netRevenue: number;
  feeMode: BillingFeeMode;
  feeRate: number | null;
  feeAmount: number;
  netPayout: number;
  currency: string;
  status: "draft" | "finalized";
  computedAt: string | null;
  feePaidAt: string | null;
}

function mapRow(row: any): BillingPeriodRow {
  return {
    id: row.id,
    partyId: row.party_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    sellerMode: row.seller_mode,
    grossRevenue: Number(row.gross_revenue),
    realCosts: Number(row.real_costs),
    netRevenue: Number(row.net_revenue),
    feeMode: row.fee_mode,
    feeRate: row.fee_rate === null ? null : Number(row.fee_rate),
    feeAmount: Number(row.fee_amount),
    netPayout: Number(row.net_payout),
    currency: row.currency,
    status: row.status,
    computedAt: row.computed_at,
    feePaidAt: row.fee_paid_at ?? null,
  };
}

export async function listBillingPeriods(
  client: SupabaseClient,
  partyId: string,
  limit = 24
): Promise<BillingPeriodRow[]> {
  const { data, error } = await client
    .from("eshop_billing_periods")
    .select("*")
    .eq("party_id", partyId)
    .order("period_start", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

// Recomputes (or creates) one party's billing period for the given calendar month from live
// order/return/stock data, then upserts it. A 'finalized' period (its month has fully
// elapsed) is left untouched unless forceRecompute is set -- a past month's tax-export
// numbers must not silently change under a party that already downloaded them. The fee mode
// is derived automatically from the period's gross revenue (see autoFeeMode) -- never a
// manual per-period choice.
export async function recomputeBillingPeriod(
  client: SupabaseClient,
  partyId: string,
  year: number,
  monthIndex0: number,
  opts: { forceRecompute?: boolean } = {}
): Promise<{ error: Error | null; row: BillingPeriodRow | null }> {
  const period = getCalendarMonthPeriod(year, monthIndex0);

  const { data: existing } = await client
    .from("eshop_billing_periods")
    .select("*")
    .eq("party_id", partyId)
    .eq("period_start", period.periodStart)
    .maybeSingle();

  // Cache: a finalized (past) month is never silently recomputed, and even the live draft
  // month is only recomputed once its stored figures are older than a day - so a normal page
  // view reads the stored row instead of re-aggregating orders every time. The "Přepočítat"
  // action (forceRecompute) bypasses this for an on-demand refresh.
  if (existing && !opts.forceRecompute) {
    const freshMs = 24 * 60 * 60 * 1000;
    const isFresh = !!existing.computed_at && Date.now() - new Date(existing.computed_at).getTime() < freshMs;
    if (existing.status === "finalized" || isFresh) return { error: null, row: mapRow(existing) };
  }

  const { data: party, error: partyErr } = await client
    .from("parties")
    .select(
      "seller_mode, commission_rate_override, reduced_commission_rate_override, commission_threshold_override"
    )
    .eq("id", partyId)
    .single();
  if (partyErr || !party) return { error: new Error(partyErr?.message ?? "Party not found"), row: null };

  const { data: totals, error: totalsErr } = await client.rpc("get_billing_period_totals", {
    p_party_id: partyId,
    p_range_start: period.rangeStartIso,
    p_range_end: period.rangeEndIso,
  });
  if (totalsErr) return { error: new Error(totalsErr.message), row: null };

  const schedule = resolveFeeSchedule(party);
  const feeMode: BillingFeeMode = autoFeeMode(Number(totals.gross_revenue), party.seller_mode, schedule);

  const computation = computeBillingPeriodTotals(
    { grossRevenueKc: Number(totals.gross_revenue), realCostsKc: Number(totals.real_costs) },
    feeMode,
    Number(totals.ledger_fee_amount ?? 0),
    schedule
  );

  const status = isPeriodElapsed(period.periodEnd) ? "finalized" : "draft";

  const { data: upserted, error: upsertErr } = await client
    .from("eshop_billing_periods")
    .upsert(
      {
        party_id: partyId,
        period_start: period.periodStart,
        period_end: period.periodEnd,
        seller_mode: party.seller_mode,
        gross_revenue: computation.grossRevenueKc,
        real_costs: computation.realCostsKc,
        net_revenue: computation.netRevenueKc,
        fee_mode: computation.feeMode,
        fee_rate: computation.feeRate,
        fee_amount: computation.feeAmountKc,
        net_payout: computation.netPayoutKc,
        currency: totals.currency ?? "CZK",
        status,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "party_id,period_start" }
    )
    .select("*")
    .single();
  if (upsertErr) return { error: new Error(upsertErr.message), row: null };

  return { error: null, row: mapRow(upserted) };
}

export async function markBillingPeriodFeePaid(
  client: SupabaseClient,
  partyId: string,
  periodStart: string,
  paid: boolean
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("eshop_billing_periods")
    .update({ fee_paid_at: paid ? new Date().toISOString() : null })
    .eq("party_id", partyId)
    .eq("period_start", periodStart);
  return { error: error ? new Error(error.message) : null };
}
