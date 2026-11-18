import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SELLER_MODE,
  NO_ICO_DEDUCTION_RATE,
  NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK,
  NO_ICO_WITHHOLDING_EXPIRY_YEARS,
  PAYOUT_HOLD_DAYS,
  OWN_COMPANY_PAYOUT_HOLD_DAYS,
  COMMISSION_ENTERPRISE_THRESHOLD_CZK,
} from "../constants/sellerMode";
import { resolveFeeSchedule, computeTieredCommission } from "../utils/billingFeeCalc";
import { createNotification, resolvePartyNotificationRecipients } from "./notificationService";

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
    .select("seller_mode, commission_tiers_override")
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
    const tiers = resolveFeeSchedule(party);

    // Progressive, not retroactive: this order's rate is a blend across whichever bands its
    // own slice of the month's cumulative turnover touches (marginal/bracket, like income tax)
    // — earlier orders this month are never rewritten, only this order's position in the
    // running total decides its own blended rate (computeTieredCommission in billingFeeCalc.ts).
    const { data: monthRows } = await client
      .from("order_commission_ledger")
      .select("gross_amount")
      .eq("party_id", order.party_id)
      .neq("status", "reversed")
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd);
    const turnoverSoFar = (monthRows ?? []).reduce((sum, r) => sum + Number(r.gross_amount), 0);
    const { commissionAmountKc: commissionAmount, effectiveRate: commissionRate } = computeTieredCommission(
      grossAmount,
      turnoverSoFar,
      tiers
    );

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
    if (error) return { error: new Error(error.message), partyId: order.party_id };

    // Sales signal, not a billing action: a party still on the public default schedule (no
    // custom commission_tiers_override) that just crossed the enterprise threshold should be
    // offered a negotiated "own eshop" schedule by a human, not an automatic rate change. Fire
    // at most once per calendar month per party — re-checking every order this month would
    // otherwise spam the inbox once the party is already above the line.
    if (party.commission_tiers_override === null && turnoverSoFar < COMMISSION_ENTERPRISE_THRESHOLD_CZK && turnoverSoFar + grossAmount >= COMMISSION_ENTERPRISE_THRESHOLD_CZK) {
      const { data: existingNotice } = await client
        .from("notifications")
        .select("id")
        .eq("party_id", order.party_id)
        .eq("type", "fee_tier_change")
        .gte("created_at", monthStart)
        .lt("created_at", monthEnd)
        .maybeSingle();
      if (!existingNotice) {
        const recipients = await resolvePartyNotificationRecipients(client, order.party_id);
        await createNotification(
          client,
          {
            party_id: order.party_id,
            type: "fee_tier_change",
            title: "Party crossed the enterprise commission threshold",
            body: `This party's turnover passed ${COMMISSION_ENTERPRISE_THRESHOLD_CZK.toLocaleString("cs-CZ")} Kč this month on the public default commission schedule. Consider reaching out about a negotiated "own eshop" schedule.`,
            metadata: { monthlyTurnoverKc: turnoverSoFar + grossAmount, thresholdKc: COMMISSION_ENTERPRISE_THRESHOLD_CZK },
          },
          recipients
        );
      }
    }

    return { error: null, partyId: order.party_id };
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
