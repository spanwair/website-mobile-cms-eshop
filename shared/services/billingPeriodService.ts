import type { SupabaseClient } from "@supabase/supabase-js";
import { getCalendarMonthPeriod, isPeriodElapsed } from "../utils/billingPeriod";
import { computeBillingPeriodTotals } from "../utils/billingFeeCalc";

export interface BillingPeriodRow {
  id: string;
  partyId: string;
  periodStart: string;
  periodEnd: string;
  sellerMode: string;
  grossRevenue: number;
  realCosts: number;
  netRevenue: number;
  feeRate: number | null;
  feeAmount: number;
  netPayout: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
  status: "draft" | "finalized";
  computedAt: string | null;
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
    feeRate: row.fee_rate === null ? null : Number(row.fee_rate),
    feeAmount: Number(row.fee_amount),
    netPayout: Number(row.net_payout),
    paidAmount: Number(row.paid_amount ?? 0),
    outstandingAmount: Number(row.outstanding_amount ?? 0),
    currency: row.currency,
    status: row.status,
    computedAt: row.computed_at,
  };
}

// Read-only monthly STATEMENT history for a party — this is informational (what was earned,
// deducted, and paid out for that month), not an action point. Actually paying a seller
// happens any time via order_commission_ledger (website/src/pages/admin/payouts), never
// against this table.
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

// Same as listBillingPeriods but for every party at once (the cross-store Payouts page) -
// one query instead of N, capped per party client-side since Supabase has no built-in
// "top N per group" filter.
export async function listBillingPeriodsForParties(
  client: SupabaseClient,
  partyIds: string[],
  limitPerParty = 12
): Promise<Map<string, BillingPeriodRow[]>> {
  const map = new Map<string, BillingPeriodRow[]>();
  if (partyIds.length === 0) return map;

  const { data, error } = await client
    .from("eshop_billing_periods")
    .select("*")
    .in("party_id", partyIds)
    .order("period_start", { ascending: false })
    .limit(limitPerParty * partyIds.length);
  if (error) throw new Error(error.message);

  for (const row of (data ?? []).map(mapRow)) {
    const rows = map.get(row.partyId) ?? [];
    if (rows.length < limitPerParty) rows.push(row);
    map.set(row.partyId, rows);
  }
  return map;
}

// Recomputes (or creates) one party's monthly statement for the given calendar month, sourced
// entirely from order_commission_ledger (both seller modes pay per-order now — see
// shared/services/commissionLedgerService.ts) via the get_billing_period_totals RPC. A
// 'finalized' period (its month has fully elapsed) is left untouched unless forceRecompute is
// set -- a past month's figures must not silently change under a party that already saw them.
// The live "what's still owed right now" view is the ledger's Unpaid tab, not this row — this
// is a frozen point-in-time snapshot, like any invoice.
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
    .select("seller_mode")
    .eq("id", partyId)
    .single();
  if (partyErr || !party) return { error: new Error(partyErr?.message ?? "Party not found"), row: null };

  const { data: totals, error: totalsErr } = await client.rpc("get_billing_period_totals", {
    p_party_id: partyId,
    p_range_start: period.rangeStartIso,
    p_range_end: period.rangeEndIso,
  });
  if (totalsErr) return { error: new Error(totalsErr.message), row: null };

  const computation = computeBillingPeriodTotals({
    grossRevenueKc: Number(totals.gross_revenue),
    realCostsKc: Number(totals.real_costs),
    ledgerFeeKc: Number(totals.ledger_fee_amount ?? 0),
    netPayableTotalKc: Number(totals.net_payable_total ?? 0),
    netPaidKc: Number(totals.net_paid_amount ?? 0),
  });

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
        fee_mode: "ledger",
        // Blended effective rate for the WHOLE period (fee / gross), not a single tier's rate —
        // each order in the period may itself have been a blend across bands, see
        // computeTieredCommission in shared/utils/billingFeeCalc.ts. Informational snapshot only.
        fee_rate: computation.grossRevenueKc > 0 ? Math.round((computation.feeAmountKc / computation.grossRevenueKc) * 10000) / 10000 : 0,
        fee_amount: computation.feeAmountKc,
        net_payout: computation.netPayoutKc,
        paid_amount: computation.paidAmountKc,
        outstanding_amount: computation.outstandingAmountKc,
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
