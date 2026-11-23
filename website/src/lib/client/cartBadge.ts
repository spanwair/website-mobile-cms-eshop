export function updateCartBadge(count: number) {
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
  badge.hidden = false;
}
