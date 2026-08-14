import type { SupabaseClient } from "@supabase/supabase-js";
import { SELLER_MODE, COMMISSION_RATE, PAYOUT_HOLD_DAYS } from "../constants/sellerMode";

// Called once from the "order became paid" path (both website/src/pages/api/stripe/webhook.ts
// and website/src/lib/checkoutFlow.ts confirmStripeSession call this instead of duplicating
// the split logic). No-ops for own_company parties and is idempotent — safe to call from both
// paths for the same order.
export async function recordCommissionForOrder(client: SupabaseClient, orderId: string): Promise<{ error: Error | null }> {
  const { data: order, error: orderErr } = await client
    .from("orders")
    .select("id, party_id, subtotal, tax_amount, total_amount, currency, paid_at")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) return { error: orderErr ? new Error(orderErr.message) : new Error("Order not found") };

  const { data: party } = await client.from("parties").select("seller_mode").eq("id", order.party_id).single();
  if (party?.seller_mode !== SELLER_MODE.SMALLJOBS_COMMISSION) return { error: null };

  const { data: existing } = await client
    .from("order_commission_ledger")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing) return { error: null };

  const paidAt = order.paid_at ?? new Date().toISOString();
  if (!order.paid_at) {
    await client.from("orders").update({ paid_at: paidAt }).eq("id", orderId);
  }

  const grossAmount = Number(order.total_amount);
  const taxAmount = Number(order.tax_amount ?? 0);
  const taxRate = grossAmount > 0 ? Math.round(((taxAmount / (grossAmount - taxAmount)) * 100) * 100) / 100 : 0;
  const commissionAmount = Math.round(grossAmount * COMMISSION_RATE * 100) / 100;
  const netPayable = Math.round((grossAmount - taxAmount - commissionAmount) * 100) / 100;
  const holdUntil = new Date(new Date(paidAt).getTime() + PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await client.from("order_commission_ledger").insert({
    order_id: orderId,
    party_id: order.party_id,
    gross_amount: grossAmount,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    commission_rate: COMMISSION_RATE,
    commission_amount: commissionAmount,
    net_payable: netPayable,
    currency: order.currency,
    hold_until: holdUntil,
    status: "held",
  });
  return { error: error ? new Error(error.message) : null };
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
