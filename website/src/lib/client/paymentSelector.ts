import { recomputeCheckoutSummary } from "./checkoutSummary";

export function initPaymentSelector() {
  const root = document.getElementById("payment-selector");
  if (!root) return;

  const radios = root.querySelectorAll<HTMLInputElement>('input[name="payment_method"]');
  radios.forEach((r) => r.addEventListener("change", recomputeCheckoutSummary));

  recomputeCheckoutSummary();
}
