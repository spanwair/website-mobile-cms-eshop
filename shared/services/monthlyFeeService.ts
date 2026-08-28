import type { SupabaseClient } from "@supabase/supabase-js";
import { SELLER_MODE, COMMISSION_RATE, MONTHLY_COMMISSION_CAP_CZK } from "../constants/sellerMode";

export interface NewMonthlyFee {
  id: string;
  partyId: string;
  partyName: string;
  billingEmail: string | null;
  periodMonth: string;
  turnoverAmount: number;
  feeAmount: number;
  currency: string;
}

// Computes and records each own_company party's platform fee for one calendar month
// (10% of turnover, capped at MONTHLY_COMMISSION_CAP_CZK — shared/constants/sellerMode.ts is
// the single source of truth for both numbers). own_company has no per-order deduction
// (contrast smalljobs_commission, handled in real time by commissionLedgerService.ts), so this
// is billed after the fact as a manually-reconciled invoice — see monthly_platform_fees
// migration. Safe to re-run for the same period: upserts with ignoreDuplicates, so a row that
// already exists (already notified, possibly already paid) is left untouched.
export async function computeMonthlyFeesForPeriod(
  client: SupabaseClient,
  periodMonth: Date
): Promise<{ error: Error | null; created: NewMonthlyFee[] }> {
  const periodStart = new Date(Date.UTC(periodMonth.getUTCFullYear(), periodMonth.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(periodMonth.getUTCFullYear(), periodMonth.getUTCMonth() + 1, 1));
  const periodStartIso = periodStart.toISOString();
  const periodEndIso = periodEnd.toISOString();
  const periodMonthDate = periodStart.toISOString().slice(0, 10);

  const { data: parties, error: partiesErr } = await client
    .from("parties")
    .select("id, name, billing_email")
    .eq("seller_mode", SELLER_MODE.OWN_COMPANY)
    .eq("status", "active");
  if (partiesErr) return { error: new Error(partiesErr.message), created: [] };
  if (!parties || parties.length === 0) return { error: null, created: [] };

  const partyIds = parties.map((p) => p.id);
  const { data: orders, error: ordersErr } = await client
    .from("orders")
    .select("party_id, total_amount, currency")
    .in("party_id", partyIds)
    .eq("payment_status", "paid")
    .gte("paid_at", periodStartIso)
    .lt("paid_at", periodEndIso);
  if (ordersErr) return { error: new Error(ordersErr.message), created: [] };

  const turnoverByParty = new Map<string, number>();
  const currencyByParty = new Map<string, string>();
  for (const order of orders ?? []) {
    turnoverByParty.set(order.party_id, (turnoverByParty.get(order.party_id) ?? 0) + Number(order.total_amount));
    if (!currencyByParty.has(order.party_id)) currencyByParty.set(order.party_id, order.currency ?? "CZK");
  }

  const rows = parties
    .map((party) => {
      const turnover = turnoverByParty.get(party.id) ?? 0;
      if (turnover <= 0) return null;
      const feeAmount = Math.round(Math.min(turnover * COMMISSION_RATE, MONTHLY_COMMISSION_CAP_CZK) * 100) / 100;
      return {
        party_id: party.id,
        period_month: periodMonthDate,
        turnover_amount: Math.round(turnover * 100) / 100,
        fee_rate: COMMISSION_RATE,
        fee_amount: feeAmount,
        currency: currencyByParty.get(party.id) ?? "CZK",
        status: "unpaid" as const,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return { error: null, created: [] };

  const { data: inserted, error: insertErr } = await client
    .from("monthly_platform_fees")
    .upsert(rows, { onConflict: "party_id,period_month", ignoreDuplicates: true })
    .select("id, party_id, period_month, turnover_amount, fee_amount, currency");
  if (insertErr) return { error: new Error(insertErr.message), created: [] };

  const partyById = new Map(parties.map((p) => [p.id, p]));
  const created: NewMonthlyFee[] = (inserted ?? []).map((row) => {
    const party = partyById.get(row.party_id);
    return {
      id: row.id,
      partyId: row.party_id,
      partyName: party?.name ?? "",
      billingEmail: party?.billing_email ?? null,
      periodMonth: row.period_month,
      turnoverAmount: Number(row.turnover_amount),
      feeAmount: Number(row.fee_amount),
      currency: row.currency,
    };
  });

  return { error: null, created };
}
