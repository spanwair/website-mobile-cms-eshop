import type { SupabaseClient } from "@supabase/supabase-js";

import { recomputeBillingPeriod } from "./billingPeriodService";
import {
  SELLER_MODE,
  COMMISSION_BREAK_EVEN_CZK,
} from "../constants/sellerMode";
import { autoFeeMode, type BillingFeeMode } from "../utils/billingFeeCalc";
import {
  getCalendarMonthPeriod,
  isPeriodElapsed,
} from "../utils/billingPeriod";

export interface FeeTierParty {
  id: string;
  name: string;
  billing_email: string | null;
  lang: string | null;
  seller_mode: string;
}

export interface FeeTierEvaluation {
  partyId: string;
  partyName: string;
  billingEmail: string | null;
  lang: "cs" | "en";
  periodStart: string;
  previousFeeMode: BillingFeeMode;
  newFeeMode: BillingFeeMode;
  changed: boolean;
  alreadyEvaluated: boolean; // true if a prior cron run already decided this exact month
  grossRevenueKc: number;
}

// Last mode this party was actually switched to/confirmed at (the audit trail IS the state --
// no separate "current tier" column on parties, so there is exactly one place that can drift).
// Defaults to 'percentage' -- same default a brand-new own_company billing period gets in
// billingPeriodService.recomputeBillingPeriod.
export async function getCurrentFeeTier(
  client: SupabaseClient,
  partyId: string,
): Promise<BillingFeeMode> {
  const { data } = await client
    .from("eshop_fee_tier_events")
    .select("new_fee_mode")
    .eq("party_id", partyId)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.new_fee_mode as BillingFeeMode | undefined) ?? "percentage";
}

// Evaluates ONE own_company party's just-closed calendar month against COMMISSION_BREAK_EVEN_CZK
// (shared/utils/billingFeeCalc.ts decideAutoFeeMode) and, only if the tier actually changes,
// persists the new fee_mode via recomputeBillingPeriod -- the SAME write path the manual admin
// UI in /admin/reports uses, so there is exactly one place fee numbers get computed.
//
// Idempotent by construction: the (party_id, period_start) unique key on eshop_fee_tier_events
// is the ONLY thing that decides whether a notification goes out. recomputeBillingPeriod is
// called first regardless (it is itself a safe upsert, so calling it twice for the same month
// just rewrites the same numbers) -- then the insert into eshop_fee_tier_events is attempted.
// If a concurrent or retried run already inserted that exact row, this insert hits a
// unique-violation (23505) and the function returns alreadyEvaluated: true without deciding
// anything new or asking the caller to notify.
export async function evaluateFeeTierForClosedPeriod(
  client: SupabaseClient,
  party: FeeTierParty,
  year: number,
  monthIndex0: number,
): Promise<FeeTierEvaluation | null> {
  if (party.seller_mode !== SELLER_MODE.OWN_COMPANY) return null;

  const period = getCalendarMonthPeriod(year, monthIndex0);
  if (!isPeriodElapsed(period.periodEnd)) {
    throw new Error(
      `Refusing to auto-evaluate a fee tier for a period that has not fully elapsed: ${period.periodStart}`,
    );
  }

  const lang: "cs" | "en" = party.lang === "en" ? "en" : "cs";
  const previousFeeMode = await getCurrentFeeTier(client, party.id);

  const { data: totals, error: totalsErr } = await client.rpc(
    "get_billing_period_totals",
    {
      p_party_id: party.id,
      p_range_start: period.rangeStartIso,
      p_range_end: period.rangeEndIso,
    },
  );
  if (totalsErr) throw new Error(totalsErr.message);

  const grossRevenueKc = Number(totals.gross_revenue);
  // Same determination the live /admin/reports recompute uses (autoFeeMode), so the tier the
  // cron records always matches what recomputeBillingPeriod persists for the month.
  const newFeeMode = autoFeeMode(grossRevenueKc, party.seller_mode);
  const changed = newFeeMode !== previousFeeMode;

  const { error: recomputeErr } = await recomputeBillingPeriod(
    client,
    party.id,
    year,
    monthIndex0,
    { forceRecompute: true },
  );
  if (recomputeErr) throw recomputeErr;

  const { error: insertErr } = await client
    .from("eshop_fee_tier_events")
    .insert({
      party_id: party.id,
      period_start: period.periodStart,
      previous_fee_mode: previousFeeMode,
      new_fee_mode: newFeeMode,
      changed,
      gross_revenue: grossRevenueKc,
      threshold_amount: COMMISSION_BREAK_EVEN_CZK,
    });

  if (insertErr) {
    if (insertErr.code === "23505") {
      const { data: existing, error: fetchErr } = await client
        .from("eshop_fee_tier_events")
        .select("previous_fee_mode, new_fee_mode, changed, gross_revenue")
        .eq("party_id", party.id)
        .eq("period_start", period.periodStart)
        .single();
      if (fetchErr) throw new Error(fetchErr.message);
      return {
        partyId: party.id,
        partyName: party.name,
        billingEmail: party.billing_email,
        lang,
        periodStart: period.periodStart,
        previousFeeMode: existing.previous_fee_mode as BillingFeeMode,
        newFeeMode: existing.new_fee_mode as BillingFeeMode,
        changed: false, // another run already owns the notification for this exact month
        alreadyEvaluated: true,
        grossRevenueKc: Number(existing.gross_revenue),
      };
    }
    throw new Error(insertErr.message);
  }

  return {
    partyId: party.id,
    partyName: party.name,
    billingEmail: party.billing_email,
    lang,
    periodStart: period.periodStart,
    previousFeeMode,
    newFeeMode,
    changed,
    alreadyEvaluated: false,
    grossRevenueKc,
  };
}

// eshop_fee_tier_events isn't in the generated Database type yet (this branch's migration
// hasn't been pushed to the shared dev DB -- see the review doc), so this, like every other
// query against that table, takes an untyped SupabaseClient rather than the app's typed one.
export async function markFeeTierEventNotified(
  client: SupabaseClient,
  partyId: string,
  periodStart: string,
  channel: "notified_in_app" | "notified_email",
): Promise<void> {
  await client
    .from("eshop_fee_tier_events")
    .update({ [channel]: true })
    .eq("party_id", partyId)
    .eq("period_start", periodStart);
}
