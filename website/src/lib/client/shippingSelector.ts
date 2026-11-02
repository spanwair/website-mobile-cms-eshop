import { recomputeCheckoutSummary } from "./checkoutSummary";

// Drives the shipping-option button -> pickup-point widget cascade in
// ShippingProviderSelector.astro. Each button encodes one (carrier, delivery-type) pair;
// selecting one sets the hidden delivery_type input and, for pickup, reveals that carrier's
// real map widget (PPL Widget 2.0 / Packeta) whose selection fills the pickup_point_* inputs.
export function initShippingSelector() {
  const rootEl = document.getElementById("shipping-selector");
  if (!rootEl) return;
  const root = rootEl;

  const providerRadios = root.querySelectorAll<HTMLInputElement>('input[name="shipping_provider"]');
  const deliveryTypeInput = root.querySelector<HTMLInputElement>('input[name="delivery_type"]')!;
  const pickupBlocks = root.querySelectorAll<HTMLElement>("[data-pickup-block]");
  const pickupIdInput = root.querySelector<HTMLInputElement>('input[name="pickup_point_id"]')!;
  const pickupNameInput = root.querySelector<HTMLInputElement>('input[name="pickup_point_name"]')!;
  const pickupAddressInput = root.querySelector<HTMLInputElement>('input[name="pickup_point_address"]')!;
  const errorEl = root.querySelector<HTMLElement>("[data-pickup-error]");
  const requiredMsg = root.dataset.pickupRequiredMsg ?? "";

  function selectedRadio(): HTMLInputElement | null {
    return Array.from(providerRadios).find((r) => r.checked) ?? null;
  }
  function selectedProvider(): string | null {
    return selectedRadio()?.value ?? null;
  }
  function selectedDeliveryType(): string {
    return selectedRadio()?.dataset.deliveryType ?? "home";
  }

  function clearError() {
    if (errorEl) errorEl.style.display = "none";
    root.querySelectorAll<HTMLElement>("[data-pickup-block] .btn").forEach((b) => b.classList.remove("pickup-btn-invalid"));
  }

  function setPickupPoint(id: string, name: string, address: string) {
    pickupIdInput.value = id;
    pickupNameInput.value = name;
    pickupAddressInput.value = address;
    root.querySelectorAll<HTMLElement>("[data-pickup-summary]").forEach((el) => {
      el.style.display = id ? "" : "none";
    });
    root.querySelectorAll<HTMLElement>("[data-pickup-summary-text]").forEach((el) => {
      el.textContent = id ? `${name} — ${address}` : "";
    });
    if (id) clearError();
  }

  function refresh() {
    const provider = selectedProvider();
    const deliveryType = selectedDeliveryType();
    deliveryTypeInput.value = deliveryType;
    const showPickup = Boolean(provider) && deliveryType === "pickup";
    pickupBlocks.forEach((block) => {
      const match = block.dataset.pickupBlock === provider;
      block.style.display = showPickup && match ? "" : "none";
    });
    if (deliveryType === "home") setPickupPoint("", "", "");
    if (!showPickup) clearError();

    recomputeCheckoutSummary();
  }

  providerRadios.forEach((r) => r.addEventListener("change", refresh));

  // Block checkout submission while "pickup point" is chosen but no actual point is
  // selected — the server rejects this too, but only after a full round-trip that wipes
  // the address form. Guarding client-side keeps everything the customer already typed.
  const form = document.getElementById("checkout-form") as HTMLFormElement | null;
  form?.addEventListener("submit", (e) => {
    if (selectedDeliveryType() === "pickup" && !pickupIdInput.value) {
      e.preventDefault();
      if (errorEl) {
        errorEl.textContent = requiredMsg;
        errorEl.style.display = "";
      }
      root
        .querySelectorAll<HTMLElement>(`[data-pickup-block="${selectedProvider()}"] .btn`)
        .forEach((b) => b.classList.add("pickup-btn-invalid"));
      errorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  root.querySelectorAll<HTMLButtonElement>("[data-open-ppl-widget]").forEach((btn) => {
    btn.addEventListener("click", () => openPplWidget(btn.dataset.apiKey ?? "", setPickupPoint));
  });
  root.querySelectorAll<HTMLButtonElement>("[data-open-packeta-widget]").forEach((btn) => {
    btn.addEventListener("click", () => openPacketaWidget(btn.dataset.apiKey ?? "", setPickupPoint));
  });

  refresh();
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function openPplWidget(apiKey: string, setPickupPoint: (id: string, name: string, address: string) => void) {
  await loadScriptOnce("https://www.ppl.cz/accesspointwidget/loader.js");
  const existing = document.getElementById("ppl-access-point-widget") as any;
  if (existing) {
    existing.open?.();
    return;
  }

  const widget = document.createElement("ppl-access-point-widget") as any;
  widget.id = "ppl-access-point-widget";
  widget.setAttribute("api-key", apiKey);
  // Force modal regardless of the key's server-side default — matches the
  // click-to-open button UX used here (same pattern as the Packeta widget).
  widget.setAttribute("config", JSON.stringify({ viewMode: "modal" }));
  // DetailResponseModel: address is a nested object (street/city/zipCode), not flat
  // fields on the event detail — see Widget 2.0 API reference §7.8.
  widget.addEventListener("ppl-accesspointwidget-select", (e: any) => {
    const p = e.detail;
    setPickupPoint(p.code, p.name, `${p.address?.street ?? ""}, ${p.address?.zipCode ?? ""} ${p.address?.city ?? ""}`);
  });

  // The widget fetches its configuration asynchronously after being connected, and
  // open() is a no-op until that resolves — so on the very first click open() would
  // silently do nothing and the user would have to click twice. Wait for the widget's
  // ready event before opening, with a timeout fallback in case it never fires.
  const ready = new Promise<void>((resolve) => {
    widget.addEventListener("ppl-accesspointwidget-ready", () => resolve(), { once: true });
    setTimeout(resolve, 4000);
  });
  document.body.appendChild(widget);
  await ready;
  widget.open?.();
}

async function openPacketaWidget(apiKey: string, setPickupPoint: (id: string, name: string, address: string) => void) {
  await loadScriptOnce("https://widget.packeta.com/v6/www/js/library.js");
  (window as any).Packeta.Widget.pick(apiKey, (point: any) => {
    if (!point) return;
    setPickupPoint(String(point.id), point.name, `${point.street}, ${point.zip} ${point.city}`);
  }, { language: "cs", country: "cz,sk" });
}
