// Stripe payment integration.
// Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env.production
// Install: pnpm add stripe @stripe/stripe-js (in website/)

import Stripe from "stripe";

// Instantiated lazily so the server doesn't crash when keys are not yet configured.
// Fetch-based HTTP client — Cloudflare Workers has no Node `https` module.
function getStripe() {
  const key = import.meta.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set — add it to .env.production");
  return new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function createCheckoutSession(opts: {
  lineItems: Array<{ name: string; amount: number; quantity: number }>;
  orderId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  currency?: string;
}): Promise<{ url: string | null; error: string | null }> {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: opts.lineItems.map(i => ({
        price_data: {
          currency: opts.currency ?? "czk",
          product_data: { name: i.name },
          unit_amount: Math.round(i.amount * 100),
        },
        quantity: i.quantity,
      })),
      metadata: {
        order_id: opts.orderId,
        customer_id: opts.customerId ?? "",
      },
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
    });
    return { url: session.url, error: null };
  } catch (err: unknown) {
    return { url: null, error: (err as Error).message };
  }
}

export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
}

// Call from /api/stripe/webhook endpoint (POST handler in Astro).
// Async + SubtleCrypto provider: Workers only has WebCrypto, not Node's sync `crypto`.
export async function constructWebhookEvent(payload: string, signature: string) {
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  const stripe = getStripe();
  return stripe.webhooks.constructEventAsync(
    payload,
    signature,
    webhookSecret,
    undefined,
    Stripe.createSubtleCryptoProvider()
  );
}

// Webhook handler — update order payment_status on payment completion
export async function handleWebhookEvent(
  event: Stripe.Event,
  updateOrderPayment: (orderId: string, status: string) => Promise<void>
) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) await updateOrderPayment(orderId, "paid");
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) await updateOrderPayment(orderId, "failed");
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const orderId = charge.metadata?.order_id;
      if (orderId) await updateOrderPayment(orderId, "refunded");
      break;
    }
  }
}
