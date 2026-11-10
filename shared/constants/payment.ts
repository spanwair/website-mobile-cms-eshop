// SINGLE SOURCE OF TRUTH for order payment method codes and the cash-on-delivery fee.
// Never redefine these values inline in a component or API route.

export const PAYMENT_METHOD = {
  STRIPE: "stripe",
  COD: "cod",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// Flat "dobírka" (cash/card on delivery) surcharge in CZK, charged by the carrier on
// handover instead of collected online via Stripe.
export const COD_FEE_CZK = 45;

// Stripe's published rate for European cards (the common case here), used ONLY for the
// public "what one order really nets you" pricing example (website/src/components/landing/
// sections/OrderValueBreakdown.astro) — display only, not wired into any real settlement or
// ledger math. There is one central platform Stripe account (no Stripe Connect), so this fee
// is paid out of platform revenue today, never deducted from a seller's payout. Confirm
// against the account's actual negotiated rate before treating this as exact.
export const STRIPE_FEE_PERCENT_EU = 0.015;
export const STRIPE_FEE_FIXED_CZK = 3;
