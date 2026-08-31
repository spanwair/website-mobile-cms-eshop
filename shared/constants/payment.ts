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
