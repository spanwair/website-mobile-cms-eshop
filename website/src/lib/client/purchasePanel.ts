import { formatPrice } from "@shared/utils/format";
import type { AppLanguage } from "@shared/i18n/getT";
import { submitAjax } from "./ajaxForm";

// Switching the selected variant re-points the whole purchase panel at it — stock text, qty
// cap, price (a variant's own price is always authoritative once the product has any), and
// the out-of-stock state — without a page reload. No-op when there are no variant radios
// (simple products keep the server-rendered state as-is). Add-to-cart and wishlist submit via
// fetch instead of a real POST navigation so the shopper never loses their place on the page.
export function initPurchasePanel() {
  const section = document.querySelector<HTMLElement>(".add-to-cart-section");
  const infoJson = section?.dataset.variantInfo;
  const variantInfo: Record<string, { price: number; qtyAvailable: number | null; isOutOfStock: boolean }> = infoJson
    ? JSON.parse(infoJson)
    : {};
  const currency = section?.dataset.currency;
  const lang = (section?.dataset.lang as AppLanguage) || "cs";

  const radios = document.querySelectorAll<HTMLInputElement>('input[name="variant"]');
  const variantIdInput = document.getElementById("variant-id-input") as HTMLInputElement | null;
  const unitPriceInput = document.getElementById("unit-price-input") as HTMLInputElement | null;
  const priceMain = document.getElementById("price-main");
  const qtyInput = document.getElementById("qty-input") as HTMLInputElement | null;
  const lowStockHint = document.getElementById("low-stock-hint");
  const oosBadge = document.getElementById("oos-badge");
  const cartForm = document.getElementById("cart-form");

  function applyVariant(variantId: string) {
    const info = variantInfo[variantId];
    if (!info || !variantIdInput || !qtyInput || !lowStockHint || !oosBadge || !cartForm) return;

    variantIdInput.value = variantId;
    if (unitPriceInput) unitPriceInput.value = String(info.price);
    if (priceMain) priceMain.textContent = formatPrice(info.price, lang, currency);
    document.dispatchEvent(new CustomEvent("variantchange", { detail: { variantId } }));

    if (info.isOutOfStock) {
      oosBadge.style.display = "";
      cartForm.style.display = "none";
      return;
    }
    oosBadge.style.display = "none";
    cartForm.style.display = "";

    qtyInput.max = String(info.qtyAvailable && info.qtyAvailable > 0 ? info.qtyAvailable : 99);
    if (info.qtyAvailable !== null && Number(qtyInput.value) > info.qtyAvailable) {
      qtyInput.value = String(Math.max(1, info.qtyAvailable));
    }

    const showLowStock = info.qtyAvailable !== null && info.qtyAvailable <= 10 && info.qtyAvailable > 0;
    lowStockHint.style.display = showLowStock ? "" : "none";
    if (showLowStock) {
      lowStockHint.textContent = lowStockHint.textContent?.replace(/\d+/, String(info.qtyAvailable)) ?? "";
    }
  }

  radios.forEach((radio) => radio.addEventListener("change", () => applyVariant(radio.value)));

  const genericError = section?.dataset.genericError ?? "Something went wrong";
  const successMsg = document.getElementById("cart-success-msg");
  const errorMsg = document.getElementById("cart-error-msg");

  function updateCartBadge(count: number) {
    const cartLink = document.querySelector<HTMLElement>(".icon-link--cart");
    if (!cartLink) return;
    let badge = cartLink.querySelector<HTMLElement>(".cart-badge");
    if (count <= 0) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "cart-badge";
      // Astro's scoped CSS keys .cart-badge to a data-astro-cid-* attribute that only exists on
      // elements the component actually rendered — copy it from the link so this JS-created
      // badge picks up the same scoped style instead of rendering unstyled.
      for (const attr of Array.from(cartLink.attributes)) {
        if (attr.name.startsWith("data-astro-cid")) badge.setAttribute(attr.name, "");
      }
      cartLink.appendChild(badge);
    }
    badge.textContent = String(count);
  }

  cartForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg?.setAttribute("style", "display:none");
    try {
      const result = await submitAjax<{ ok: boolean; error?: string; cartCount?: number }>(cartForm as HTMLFormElement);
      if (result.ok) {
        successMsg?.removeAttribute("style");
        if (typeof result.cartCount === "number") updateCartBadge(result.cartCount);
      } else if (errorMsg) {
        errorMsg.textContent = result.error || genericError;
        errorMsg.removeAttribute("style");
      }
    } catch {
      (cartForm as HTMLFormElement).submit();
    }
  });

  const wishlistBtn = document.getElementById("wishlist-toggle-btn") as HTMLButtonElement | null;
  wishlistBtn?.closest("form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    try {
      const result = await submitAjax<{ inWishlist: boolean }>(form);
      if (!wishlistBtn) return;
      wishlistBtn.classList.toggle("wishlist-toggle--active", result.inWishlist);
      wishlistBtn.textContent = `${result.inWishlist ? "♥" : "♡"} ${
        result.inWishlist ? wishlistBtn.dataset.labelRemove : wishlistBtn.dataset.labelAdd
      }`;
    } catch {
      form.submit();
    }
  });
}
