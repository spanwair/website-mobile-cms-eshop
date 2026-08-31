import { formatPrice } from "@shared/utils/format";
import type { AppLanguage } from "@shared/i18n/getT";

// Shared by ShippingProviderSelector and PaymentProviderSelector's client scripts so the
// order summary (chosen provider name + cost per row, and the grand total) always reflects
// BOTH selections at once — each script owning its own total-calc independently would
// overwrite the other's contribution to summary-grand-total.
export function recomputeCheckoutSummary(): void {
  const summaryEl = document.getElementById("order-summary");
  if (!summaryEl) return;

  const subtotal = Number(summaryEl.dataset.subtotal ?? 0);
  const currency = summaryEl.dataset.currency || undefined;
  const lang = (summaryEl.dataset.lang as AppLanguage) || "cs";
  const freeLabel = summaryEl.dataset.freeLabel ?? "";

  const shippingRadio = document.querySelector<HTMLInputElement>('input[name="shipping_provider"]:checked');
  const paymentRadio = document.querySelector<HTMLInputElement>('input[name="payment_method"]:checked');
  const shippingCost = shippingRadio ? Number(shippingRadio.dataset.cost ?? 0) : 0;
  const paymentFee = paymentRadio ? Number(paymentRadio.dataset.cost ?? 0) : 0;

  const shippingNameEl = document.getElementById("summary-shipping-name");
  const shippingPriceEl = document.getElementById("summary-shipping-price");
  const paymentNameEl = document.getElementById("summary-payment-name");
  const paymentPriceEl = document.getElementById("summary-payment-price");
  const grandTotalEl = document.getElementById("summary-grand-total");

  if (shippingNameEl) shippingNameEl.textContent = shippingRadio?.dataset.label ? ` (${shippingRadio.dataset.label})` : "";
  if (shippingPriceEl) shippingPriceEl.textContent = shippingCost === 0 ? freeLabel : formatPrice(shippingCost, lang, currency);
  if (paymentNameEl) paymentNameEl.textContent = paymentRadio?.dataset.label ? ` (${paymentRadio.dataset.label})` : "";
  if (paymentPriceEl) paymentPriceEl.textContent = paymentFee === 0 ? freeLabel : formatPrice(paymentFee, lang, currency);
  if (grandTotalEl) grandTotalEl.textContent = formatPrice(subtotal + shippingCost + paymentFee, lang, currency);
}
