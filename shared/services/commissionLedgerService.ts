import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SELLER_MODE,
  NO_ICO_DEDUCTION_RATE,
  NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK,
  NO_ICO_WITHHOLDING_EXPIRY_YEARS,
  PAYOUT_HOLD_DAYS,
  OWN_COMPANY_PAYOUT_HOLD_DAYS,
} from "../constants/sellerMode";
import { resolveFeeSchedule } from "../utils/billingFeeCalc";

// Called once from the "order became paid" path (both website/src/pages/api/stripe/webhook.ts
// and website/src/lib/checkoutFlow.ts confirmStripeSession call this instead of duplicating
// the split logic) — for EVERY seller_mode now. Idempotent, safe to call from both paths for
// the same order. The two seller modes still use independent rate/hold rules (own_company:
// resolveFeeSchedule's progressive rate, short hold, no monthly cap; smalljobs_commission:
// flat NO_ICO_DEDUCTION_RATE, 60-day hold, 12 000 Kč/month payout cap) — pick one set per
// seller_mode, never mix them.
export async function recordCommissionForOrder(
  client: SupabaseClient,
  orderId: string
): Promise<{ error: Error | null; payoutLimitReached?: boolean; partyId?: string }> {
  const { data: order, error: orderErr } = await client
    .from("orders")
    .select("id, party_id, subtotal, tax_amount, total_amount, currency, paid_at")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) return { error: orderErr ? new Error(orderErr.message) : new Error("Order not found") };

  // Backfilled here regardless of seller_mode — the monthly statement's turnover aggregation
  // (shared/services/billingPeriodService.ts) needs paid_at populated too, and this is the only
  // "order became paid" write path in the codebase (grepped: no other `.update({ paid_at` call site).
  const paidAt = order.paid_at ?? new Date().toISOString();
  if (!order.paid_at) {
    await client.from("orders").update({ paid_at: paidAt }).eq("id", orderId);
  }

  const { data: party } = await client
    .from("parties")
    .select("seller_mode, commission_rate_override, reduced_commission_rate_override, commission_threshold_override")
    .eq("id", order.party_id)
    .single();
  if (!party) return { error: null };

  const { data: existing } = await client
    .from("order_commission_ledger")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing) return { error: null };

  const grossAmount = Number(order.total_amount);
  const taxAmount = Number(order.tax_amount ?? 0);
  const taxRate = grossAmount > 0 ? Math.round(((taxAmount / (grossAmount - taxAmount)) * 100) * 100) / 100 : 0;

  const monthStart = new Date(Date.UTC(new Date(paidAt).getUTCFullYear(), new Date(paidAt).getUTCMonth(), 1)).toISOString();
  const monthEnd = new Date(Date.UTC(new Date(paidAt).getUTCFullYear(), new Date(paidAt).getUTCMonth() + 1, 1)).toISOString();

  if (party.seller_mode === SELLER_MODE.OWN_COMPANY) {
    const schedule = resolveFeeSchedule(party);

    // Progressive, not retroactive: this order's rate is decided by cumulative turnover
    // INCLUDING it, not a whole-month rewrite of earlier orders once the threshold is crossed
    // (that retroactive behavior only applied to the old monthly-aggregate invoice, which this
    // per-order ledger replaces). Irrelevant while standardRate === reducedRate (the current
    // default), only matters for a party with a differentiated custom override.
    const { data: monthRows } = await client
      .from("order_commission_ledger")
      .select("gross_amount")
      .eq("party_id", order.party_id)
      .neq("status", "reversed")
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd);
    const turnoverSoFar = (monthRows ?? []).reduce((sum, r) => sum + Number(r.gross_amount), 0);
    const commissionRate = turnoverSoFar + grossAmount > schedule.thresholdKc ? schedule.reducedRate : schedule.standardRate;

    const commissionAmount = Math.round(grossAmount * commissionRate * 100) / 100;
    const netPayable = Math.round((grossAmount - taxAmount - commissionAmount) * 100) / 100;
    const holdUntil = new Date(new Date(paidAt).getTime() + OWN_COMPANY_PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await client.from("order_commission_ledger").insert({
      order_id: orderId,
      party_id: order.party_id,
      gross_amount: grossAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      net_payable: netPayable,
      withheld_amount: 0,
      withheld_expires_at: null,
      currency: order.currency,
      hold_until: holdUntil,
      status: "held",
    });
    return { error: error ? new Error(error.message) : null, partyId: order.party_id };
  }

  if (party.seller_mode !== SELLER_MODE.SMALLJOBS_COMMISSION) return { error: null };

  // Flat 30% deduction, not capped at the order level — this bundles the platform's cut with
  // the social/health contributions Smalljobs withholds on the creator's behalf, see
  // NO_ICO_DEDUCTION_RATE.
  const commissionAmount = Math.round(grossAmount * NO_ICO_DEDUCTION_RATE * 100) / 100;
  const rawNet = Math.round((grossAmount - taxAmount - commissionAmount) * 100) / 100;

  // What's capped is the creator's PAYOUT, not the deduction: a no-IČO creator may legally
  // receive at most NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK net per calendar month. Look up how much
  // has already been made payable this month (held/eligible/paid, i.e. not reversed) and only
  // release up to the remaining room; anything past that is withheld rather than paid.
  const { data: monthRows } = await client
    .from("order_commission_ledger")
    .select("net_payable")
    .eq("party_id", order.party_id)
    .neq("status", "reversed")
    .gte("created_at", monthStart)
    .lt("created_at", monthEnd);
  const payableSoFar = (monthRows ?? []).reduce((sum, r) => sum + Number(r.net_payable), 0);
  const remainingPayoutRoom = Math.max(NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK - payableSoFar, 0);

  const netPayable = Math.min(rawNet, remainingPayoutRoom);
  const withheldAmount = Math.round((rawNet - netPayable) * 100) / 100;
  const payoutLimitReached = payableSoFar < NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK && payableSoFar + netPayable >= NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK;

  const holdUntil = new Date(new Date(paidAt).getTime() + PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const withheldExpiresAt =
    withheldAmount > 0
      ? new Date(new Date(paidAt).setUTCFullYear(new Date(paidAt).getUTCFullYear() + NO_ICO_WITHHOLDING_EXPIRY_YEARS)).toISOString()
      : null;

  const { error } = await client.from("order_commission_ledger").insert({
    order_id: orderId,
    party_id: order.party_id,
    gross_amount: grossAmount,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    commission_rate: NO_ICO_DEDUCTION_RATE,
    commission_amount: commissionAmount,
    net_payable: netPayable,
    withheld_amount: withheldAmount,
    withheld_expires_at: withheldExpiresAt,
    currency: order.currency,
    hold_until: holdUntil,
    status: "held",
  });
  return { error: error ? new Error(error.message) : null, payoutLimitReached, partyId: order.party_id };
}

// Called from the refund path (charge.refunded webhook). Marks the ledger entry reversed —
// if it had already been paid out, the reversal is still recorded but needs manual
// reconciliation with the creator (no automated clawback is attempted).
export async function reverseCommissionForOrder(
  client: SupabaseClient,
  orderId: string,
  reason: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("order_commission_ledger")
    .update({ status: "reversed", reversed_at: new Date().toISOString(), reversed_reason: reason })
    .eq("order_id", orderId)
    .neq("status", "reversed");
  return { error: error ? new Error(error.message) : null };
}
