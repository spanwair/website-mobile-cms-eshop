import { recomputeCheckoutSummary } from "./checkoutSummary";

// Drives the provider radio -> delivery-type radio -> pickup-point widget cascade in
// ShippingProviderSelector.astro. Mock mode (no real widget scripts) renders a plain
// <select> per provider instead — this same script wires both paths so Playwright can
// drive the mock path without depending on ppl.cz/packeta.com being reachable.
export function initShippingSelector() {
  const rootEl = document.getElementById("shipping-selector");
  if (!rootEl) return;
  const root = rootEl;

  const providerRadios = root.querySelectorAll<HTMLInputElement>('input[name="shipping_provider"]');
  const deliveryTypeBlock = root.querySelector<HTMLElement>("[data-delivery-type-block]");
  const deliveryTypeRadios = root.querySelectorAll<HTMLInputElement>('input[name="delivery_type"]');
  const pickupBlocks = root.querySelectorAll<HTMLElement>("[data-pickup-block]");
  const pickupIdInput = root.querySelector<HTMLInputElement>('input[name="pickup_point_id"]')!;
  const pickupNameInput = root.querySelector<HTMLInputElement>('input[name="pickup_point_name"]')!;
  const pickupAddressInput = root.querySelector<HTMLInputElement>('input[name="pickup_point_address"]')!;

  function selectedProvider(): string | null {
    return Array.from(providerRadios).find((r) => r.checked)?.value ?? null;
  }
  function selectedDeliveryType(): string {
    return Array.from(deliveryTypeRadios).find((r) => r.checked)?.value ?? "home";
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
  }

  function refresh() {
    const provider = selectedProvider();
    deliveryTypeBlock!.style.display = provider ? "" : "none";
    const deliveryType = selectedDeliveryType();
    const showPickup = Boolean(provider) && deliveryType === "pickup";
    pickupBlocks.forEach((block) => {
      const match = block.dataset.pickupBlock === provider;
      block.style.display = showPickup && match ? "" : "none";
    });
    if (deliveryType === "home") setPickupPoint("", "", "");

    recomputeCheckoutSummary();
  }

  providerRadios.forEach((r) => r.addEventListener("change", refresh));
  deliveryTypeRadios.forEach((r) => r.addEventListener("change", refresh));

  root.querySelectorAll<HTMLSelectElement>("[data-mock-pickup-select]").forEach((select) => {
    select.addEventListener("change", () => {
      const opt = select.selectedOptions[0];
      if (!opt || !opt.value) return setPickupPoint("", "", "");
      setPickupPoint(opt.value, opt.dataset.pointName ?? "", opt.dataset.pointAddress ?? "");
    });
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
  let widget = document.getElementById("ppl-access-point-widget") as any;
  if (!widget) {
    widget = document.createElement("ppl-access-point-widget");
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
    document.body.appendChild(widget);
  }
  widget.open?.();
}

async function openPacketaWidget(apiKey: string, setPickupPoint: (id: string, name: string, address: string) => void) {
  await loadScriptOnce("https://widget.packeta.com/v6/www/js/library.js");
  (window as any).Packeta.Widget.pick(apiKey, (point: any) => {
    if (!point) return;
    setPickupPoint(String(point.id), point.name, `${point.street}, ${point.zip} ${point.city}`);
  }, { language: "cs", country: "cz,sk" });
}
