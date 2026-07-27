import type { APIRoute } from "astro";
import { createCheckoutSession } from "../../lib/integrations/stripe";

export const POST: APIRoute = async ({ request, url }) => {
  const body = await request.json().catch(() => null);
  const { lineItems, orderId, customerId, currency } = body ?? {};

  if (!Array.isArray(lineItems) || lineItems.length === 0 || typeof orderId !== "string") {
    return new Response(JSON.stringify({ error: "lineItems and orderId are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { url: checkoutUrl, error } = await createCheckoutSession({
    lineItems,
    orderId,
    customerId,
    currency,
    successUrl: `${url.origin}/orders/${orderId}?paid=1`,
    cancelUrl: `${url.origin}/orders/${orderId}?cancelled=1`,
  });

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ url: checkoutUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
