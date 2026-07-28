import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import type { AppLanguage } from "@shared/i18n/getT";
import { createCheckoutSession, retrieveCheckoutSession } from "./integrations/stripe";
import { sendOrderConfirmation } from "./integrations/email";

type AdminClient = SupabaseClient<Database>;

type CartItemForCheckout = {
  product?: { title?: string | null } | null;
  unit_price: number;
  quantity: number;
};

export function buildStripeLineItems(items: CartItemForCheckout[]) {
  return items.map((item) => ({
    name: item.product?.title ?? "Product",
    amount: Number(item.unit_price),
    quantity: item.quantity,
  }));
}

export async function startOrderCheckout(opts: {
  items: CartItemForCheckout[];
  orderId: string;
  successUrl: string;
  cancelUrl: string;
  currency?: string;
}): Promise<{ url: string | null; error: string | null }> {
  return createCheckoutSession({
    lineItems: buildStripeLineItems(opts.items),
    orderId: opts.orderId,
    currency: opts.currency,
    successUrl: opts.successUrl,
    cancelUrl: opts.cancelUrl,
  });
}

// Called from order-confirmation pages when redirected back from Stripe Checkout.
// Idempotent: only flips unpaid -> paid, and only sends the confirmation email
// when this call is the one that actually performed the transition (so a
// webhook that landed first, or a page revisit, never double-sends).
export async function confirmStripeSession(
  adminClient: AdminClient,
  sessionId: string,
  orderNumber: string,
  lang: AppLanguage = "cs"
): Promise<void> {
  try {
    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status !== "paid") return;

    const { data: order } = await adminClient
      .from("orders")
      .select("id, order_number, total_amount, currency, customer_id")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!order) return;
    if (session.metadata?.order_id !== order.id) return;

    const { data: updated } = await adminClient
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", order.id)
      .eq("payment_status", "unpaid")
      .select("id")
      .maybeSingle();
    if (!updated) return;

    const { data: customer } = await adminClient
      .from("customers")
      .select("email, first_name, last_name")
      .eq("id", order.customer_id)
      .single();
    const { data: items } = await adminClient
      .from("order_items")
      .select("title, quantity, unit_price")
      .eq("order_id", order.id);
    if (!customer || !items) return;

    await sendOrderConfirmation({
      to: customer.email,
      customerName: `${customer.first_name} ${customer.last_name}`,
      orderNumber: order.order_number,
      orderTotal: order.total_amount,
      items: items.map((i) => ({ title: i.title, quantity: i.quantity, price: i.unit_price })),
      currency: order.currency,
      lang,
    });
  } catch (err) {
    console.error("confirmStripeSession failed:", (err as Error).message);
  }
}
