import type { APIRoute } from "astro";
import { constructWebhookEvent, handleWebhookEvent } from "../../../lib/integrations/stripe";
import { sendOrderConfirmation } from "../../../lib/integrations/email";
import { createAdminClient } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature header", { status: 400 });

  const payload = await request.text();
  let event;
  try {
    event = constructWebhookEvent(payload, signature);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, { status: 400 });
  }

  const adminClient = createAdminClient();

  await handleWebhookEvent(event, async (orderId, status) => {
    await adminClient.from("orders").update({ payment_status: status }).eq("id", orderId);
    if (status !== "paid") return;

    const { data: order } = await adminClient
      .from("orders")
      .select("order_number, total_amount, currency, customer_id")
      .eq("id", orderId)
      .single();
    if (!order) return;

    const { data: customer } = await adminClient
      .from("customers")
      .select("email, first_name, last_name")
      .eq("id", order.customer_id)
      .single();
    const { data: items } = await adminClient
      .from("order_items")
      .select("title, quantity, unit_price")
      .eq("order_id", orderId);
    if (!customer || !items) return;

    await sendOrderConfirmation({
      to: customer.email,
      customerName: `${customer.first_name} ${customer.last_name}`,
      orderNumber: order.order_number,
      orderTotal: order.total_amount,
      items: items.map((i) => ({ title: i.title, quantity: i.quantity, price: i.unit_price })),
      currency: order.currency,
    });
  });

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
