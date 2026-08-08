import { formatPrice } from "@shared/utils/format";
import type { AppLanguage } from "@shared/i18n/getT";
import { submitAjax } from "./ajaxForm";

// Qty change / remove-item / apply-coupon all submit via fetch instead of a real POST
// navigation, so adjusting the cart never reloads the page or resets scroll position. Delegated
// on the page container since rows come and go as items are removed.
export function initCartPage() {
  const page = document.getElementById("cart-page");
  if (!page) return;
  const lang = (page.dataset.lang as AppLanguage) || "cs";
  const currency = page.dataset.currency || undefined;

  const subtotalEl = document.getElementById("cart-subtotal");
  const itemCountEl = document.getElementById("cart-item-count");
  const qtyErrorEl = document.getElementById("cart-qty-error");
  const couponOkEl = document.getElementById("coupon-ok-msg");
  const couponErrEl = document.getElementById("coupon-err-msg");

  function setSubtotal(subtotal: number, itemCount: number) {
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal, lang, currency);
    if (itemCountEl) itemCountEl.textContent = String(itemCount);
  }

  page.addEventListener("submit", async (e) => {
    const form = e.target as HTMLFormElement;
    if (!(form instanceof HTMLFormElement)) return;
    const action = (form.querySelector('input[name="_action"]') as HTMLInputElement | null)?.value;
    if (!action) return;
    e.preventDefault();

    if (action === "update_qty") {
      qtyErrorEl?.setAttribute("style", "display:none");
      try {
        const result = await submitAjax<{ ok: boolean; error?: string; itemTotal?: number; subtotal?: number; itemCount?: number }>(form);
        if (result.ok) {
          const totalEl = form.closest(".cart-item")?.querySelector(".item-total");
          if (totalEl && typeof result.itemTotal === "number") totalEl.textContent = formatPrice(result.itemTotal, lang, currency);
          if (typeof result.subtotal === "number" && typeof result.itemCount === "number") setSubtotal(result.subtotal, result.itemCount);
        } else if (qtyErrorEl) {
          qtyErrorEl.textContent = result.error ?? "";
          qtyErrorEl.removeAttribute("style");
        }
      } catch {
        form.submit();
      }
      return;
    }

    if (action === "remove_item") {
      try {
        const result = await submitAjax<{ ok: boolean; subtotal?: number; itemCount?: number }>(form);
        if (result.ok && typeof result.itemCount === "number") {
          if (result.itemCount === 0) {
            window.location.reload();
            return;
          }
          form.closest(".cart-item")?.remove();
          if (typeof result.subtotal === "number") setSubtotal(result.subtotal, result.itemCount);
        }
      } catch {
        form.submit();
      }
      return;
    }

    if (action === "apply_coupon") {
      couponOkEl?.setAttribute("style", "display:none");
      couponErrEl?.setAttribute("style", "display:none");
      try {
        const result = await submitAjax<{ ok: boolean; message?: string; error?: string }>(form);
        if (result.ok && couponOkEl) {
          couponOkEl.textContent = result.message ?? "";
          couponOkEl.removeAttribute("style");
        } else if (couponErrEl) {
          couponErrEl.textContent = result.error ?? "";
          couponErrEl.removeAttribute("style");
        }
      } catch {
        form.submit();
      }
    }
  });
}
