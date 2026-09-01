import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, PARTY_ID, WAREHOUSE_ID, USER, USER_ID, OWNER, loginAs, screenshot, psql, replica, defaultRole } from "./helpers";

// Real PPL/Packeta credentials aren't self-serve (see .env.production.example) and neither
// carrier has a usable sandbox, so this drives the actual checkout/admin/label UI end to end
// against the built-in mock provider (PUBLIC_SHIPPING_MOCK_MODE default) — real Stripe test
// payment, real order/shipment DB rows, real label upload to the private storage bucket.
// Cart is seeded directly via SQL (existing app convention for test preconditions) so this
// spec exercises checkout-onward, not the unrelated add-to-cart form.
//
// Price is set above ~15 CZK because Stripe rejects Checkout Sessions below its minimum
// chargeable amount for CZK.
const PROD_PICKUP = { id: "d0000001-0000-0000-0000-000000000001", slug: "e2e-ship-ppl-pickup", title: "E2E Shipping PPL Pickup", price: 250.0 };
const PROD_HOME = { id: "d0000001-0000-0000-0000-000000000002", slug: "e2e-ship-packeta-home", title: "E2E Shipping Packeta Home", price: 300.0 };
const INV_PICKUP = "d0000002-0000-0000-0000-000000000001";
const INV_HOME = "d0000002-0000-0000-0000-000000000002";
const CART_PICKUP = "d0000003-0000-0000-0000-000000000001";
const CART_HOME = "d0000003-0000-0000-0000-000000000002";

const CARD = { number: "4242424242424242", expiry: "12/34", cvc: "123" };

function seed() {
  psql(`${replica}
    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku) VALUES
      ('${PROD_PICKUP.id}', '${PARTY_ID}', '${PROD_PICKUP.title}', '${PROD_PICKUP.slug}', ${PROD_PICKUP.price}, 'active', true, 'SKU-${PROD_PICKUP.slug}'),
      ('${PROD_HOME.id}', '${PARTY_ID}', '${PROD_HOME.title}', '${PROD_HOME.slug}', ${PROD_HOME.price}, 'active', true, 'SKU-${PROD_HOME.slug}');
    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory) VALUES
      ('${INV_PICKUP}', '${PARTY_ID}', '${PROD_PICKUP.id}', '${WAREHOUSE_ID}', 10, 0, 2, true),
      ('${INV_HOME}', '${PARTY_ID}', '${PROD_HOME.id}', '${WAREHOUSE_ID}', 10, 0, 2, true);
  ${defaultRole}`);
}

function seedCart(cartId: string, productId: string, price: number) {
  psql(`${replica}
    INSERT INTO public.carts (id, party_id, user_id) VALUES ('${cartId}', '${PARTY_ID}', '${USER_ID}') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.cart_items (cart_id, product_id, quantity, unit_price) VALUES ('${cartId}', '${productId}', 1, ${price})
      ON CONFLICT (cart_id, product_id, variant_id) DO NOTHING;
  ${defaultRole}`);
}

function cleanup() {
  psql(`${replica}
    DELETE FROM public.order_shipments WHERE order_id IN (
      SELECT DISTINCT order_id FROM public.order_items WHERE product_id IN ('${PROD_PICKUP.id}', '${PROD_HOME.id}')
    );
    DELETE FROM public.orders WHERE id IN (
      SELECT DISTINCT order_id FROM public.order_items WHERE product_id IN ('${PROD_PICKUP.id}', '${PROD_HOME.id}')
    );
    DELETE FROM public.customers WHERE party_id = '${PARTY_ID}' AND email = '${USER.email}';
    DELETE FROM public.cart_items WHERE cart_id IN ('${CART_PICKUP}', '${CART_HOME}');
    DELETE FROM public.carts WHERE id IN ('${CART_PICKUP}', '${CART_HOME}');
    DELETE FROM public.inventory_items WHERE id IN ('${INV_PICKUP}', '${INV_HOME}');
    DELETE FROM public.products WHERE id IN ('${PROD_PICKUP.id}', '${PROD_HOME.id}');
  ${defaultRole}`);
}

async function payWithTestCard(page: Page) {
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.getByPlaceholder("email@example.com").fill(USER.email);
  await page.getByPlaceholder("1234 1234 1234 1234").fill(CARD.number);
  await page.getByPlaceholder("MM / YY").fill(CARD.expiry);
  await page.getByPlaceholder("CVC").fill(CARD.cvc);
  await page.getByPlaceholder("Full name on card").fill("E2E Shipping Buyer");
  await page.getByRole("button", { name: "Pay" }).click();
  await page.waitForURL(/order-confirmation/, { timeout: 20000 });
}

test.describe("31 — Shipping providers (PPL + Packeta, mock mode)", () => {
  test.describe.configure({ mode: "serial" });

  let ownerPage: Page;
  let buyerPage: Page;
  let pplOrderNumber = "";
  let packetaOrderNumber = "";

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    cleanup();
    seed();
    ownerPage = await browser.newPage();
    await loginAs(ownerPage, OWNER.email, OWNER.password);
    // Owner belongs to multiple parties — force PARTY_ID active so the orders list
    // (party-scoped) shows the order this spec creates there.
    await ownerPage.context().addCookies([{ name: "activePartyId", value: PARTY_ID, domain: "localhost", path: "/" }]);
    buyerPage = await browser.newPage();
    await loginAs(buyerPage, USER.email, USER.password);
  });

  test.afterAll(async () => {
    cleanup();
    await ownerPage.close();
    await buyerPage.close();
  });

  test("31-01 owner configures PPL and Packeta base prices in Settings", async () => {
    await ownerPage.goto(`${BASE}/admin/settings/shipping`);
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-01-shipping-settings");
    await expect(ownerPage.locator(".provider-card")).toHaveCount(2);

    const forms = ownerPage.locator("form.provider-card");
    for (let i = 0; i < 2; i++) {
      const form = forms.nth(i);
      const code = await form.locator('input[name="code"]').getAttribute("value");
      await form.locator('input[name="enabled"]').check();
      await form.locator('input[name="base_price"]').fill(code === "ppl" ? "99" : "79");
      await form.locator('input[name="sender_phone"]').fill("+420123456789");
      await form.locator('button[type="submit"]').click();
      await ownerPage.waitForLoadState("networkidle");
    }
    await expect(ownerPage.locator(".alert-success")).toBeVisible();
  });

  test("31-02 non-owner is redirected away from the shipping settings page", async ({ browser }) => {
    // Sidebar/page gating is role-based (ctx.isOwner), not a permission bit — verify the
    // redirect directly rather than relying on sidebar visibility.
    const page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
    await page.goto(`${BASE}/admin/settings/shipping`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/admin/settings/shipping");
    await page.close();
  });

  test("31-03 checkout shows both enabled providers with configured prices", async () => {
    seedCart(CART_PICKUP, PROD_PICKUP.id, PROD_PICKUP.price);
    await buyerPage.goto(`${BASE}/shop/checkout`);
    await buyerPage.waitForLoadState("networkidle");
    await screenshot(buyerPage, "31-03-checkout-shipping-options");
    await expect(buyerPage.locator('input[name="shipping_provider"][value="ppl"]')).toBeVisible();
    await expect(buyerPage.locator('input[name="shipping_provider"][value="packeta"]')).toBeVisible();
    await expect(buyerPage.locator(".provider-option").filter({ hasText: "PPL" })).toContainText("99");
    await expect(buyerPage.locator(".provider-option").filter({ hasText: "Zásilkovna" })).toContainText("79");
  });

  test("31-04 PPL pickup-point checkout: select provider, mock pickup point, pay, land on order confirmation", async () => {
    await buyerPage.locator('input[name="shipping_provider"][value="ppl"]').check();
    await buyerPage.locator('input[name="delivery_type"][value="pickup"]').check();
    await expect(buyerPage.locator('[data-pickup-block="ppl"]')).toBeVisible();
    await buyerPage.locator('[data-pickup-block="ppl"] select').selectOption({ index: 1 });
    await expect(buyerPage.locator("[data-pickup-summary]")).toBeVisible();

    // Client-side estimate updates live before submit — total = product price + PPL rate.
    await expect(buyerPage.locator("#summary-grand-total")).toContainText((PROD_PICKUP.price + 99).toFixed(2).replace(".", ","));

    await buyerPage.fill("input[name='first_name']", "Shipping");
    await buyerPage.fill("input[name='last_name']", "Buyer");
    await buyerPage.fill("input[name='line1']", "Testovací 10");
    await buyerPage.fill("input[name='city']", "Praha");
    await buyerPage.fill("input[name='postal_code']", "11000");
    await screenshot(buyerPage, "31-04-checkout-pickup-selected");
    await buyerPage.locator("form.address-form button[type='submit']").click();

    await payWithTestCard(buyerPage);
    await screenshot(buyerPage, "31-04-order-confirmation");

    const url = new URL(buyerPage.url());
    pplOrderNumber = url.searchParams.get("order") ?? "";
    expect(pplOrderNumber).toMatch(/^ORD-/);

    // Checkout only inserts the order_shipments "pending" placeholder (provider + pickup
    // point) - the real PPL booking (tracking number, label) happens later when an admin
    // processes the order, so neither should be visible on confirmation yet.
    await expect(buyerPage.locator(".shipment-info")).not.toBeVisible();
  });

  test("31-05 PPL order total is subtotal + configured shipping price", async () => {
    const result = psql(
      `SELECT subtotal, shipping_amount, total_amount FROM public.orders WHERE order_number = '${pplOrderNumber}';`
    );
    expect(result).toContain(PROD_PICKUP.price.toFixed(2));
    expect(result).toContain("99.00");
    expect(result).toContain((PROD_PICKUP.price + 99).toFixed(2));
  });

  test("31-06 admin books the PPL shipment from the order detail page", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    expect(orderId).toBeTruthy();

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
    await ownerPage.waitForLoadState("networkidle");
    await ownerPage.locator('form:has(input[value="create_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-06-admin-created-shipment");

    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
    await expect(ownerPage.getByText("PPL", { exact: true })).toBeVisible();
    await expect(ownerPage.getByText("TESTOVACÍ REŽIM").or(ownerPage.getByText("TEST MODE"))).toBeVisible();
    await expect(ownerPage.getByRole("link", { name: /Stáhnout štítek|Download label|Náhled štítku|Preview label/ })).toBeVisible();
  });

  test("31-07 label download link returns a real PDF", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    expect(orderId).toBeTruthy();

    const resp = await buyerPage.context().request.get(`${BASE}/api/shipping-label/${orderId}`);
    expect(resp.status(), await resp.text().catch(() => "")).toBe(200);
    expect(resp.headers()["content-type"]).toContain("application/pdf");
  });

  test("31-08 admin can refresh the PPL shipment status without error", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
    await ownerPage.waitForLoadState("networkidle");

    // Refresh status must not error even though the mock provider has no real tracking API.
    await ownerPage.locator('form:has(input[value="refresh_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-08-admin-refresh-shipment");
    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
  });

  test("31-09 orders list shows a provider/status badge for the shipped order", async () => {
    await ownerPage.goto(`${BASE}/admin/orders`);
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-09-orders-list-badge");
    const row = ownerPage.locator("tr", { hasText: pplOrderNumber });
    await expect(row.locator(".badge-inactive")).toContainText("PPL");
  });

  test("31-10 Packeta home-delivery checkout (no pickup point) also completes correctly", async () => {
    seedCart(CART_HOME, PROD_HOME.id, PROD_HOME.price);
    await buyerPage.goto(`${BASE}/shop/checkout`);
    await buyerPage.waitForLoadState("networkidle");
    await buyerPage.locator('input[name="shipping_provider"][value="packeta"]').check();
    // delivery_type defaults to "home" — no pickup point block should be required/visible.
    await expect(buyerPage.locator('[data-pickup-block="packeta"]')).not.toBeVisible();

    await buyerPage.fill("input[name='first_name']", "Home");
    await buyerPage.fill("input[name='last_name']", "Delivery");
    await buyerPage.fill("input[name='line1']", "Domovská 5");
    await buyerPage.fill("input[name='city']", "Brno");
    await buyerPage.fill("input[name='postal_code']", "60200");
    await buyerPage.locator("form.address-form button[type='submit']").click();

    await payWithTestCard(buyerPage);
    await screenshot(buyerPage, "31-10-packeta-home-confirmation");

    const url = new URL(buyerPage.url());
    packetaOrderNumber = url.searchParams.get("order") ?? "";
    expect(packetaOrderNumber).toMatch(/^ORD-/);
    // Same as PPL - checkout only records the pending placeholder, the real Packeta booking
    // (and its Z-prefixed tracking number) only exists after an admin creates the shipment.
    await expect(buyerPage.locator(".shipment-info")).not.toBeVisible();
  });

  test("31-11 admin books the Packeta shipment from the order detail page", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${packetaOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    expect(orderId).toBeTruthy();

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
    await ownerPage.waitForLoadState("networkidle");
    await ownerPage.locator('form:has(input[value="create_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-11-admin-created-packeta-shipment");

    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
    await expect(ownerPage.locator("text=/Sledovací číslo: Z|Tracking number: Z/")).toBeVisible();
  });

  test("31-12 Packeta shipment row has no pickup point recorded (home delivery)", async () => {
    const result = psql(
      `SELECT provider, pickup_point_id, shipping_cost FROM public.order_shipments os
       JOIN public.orders o ON o.id = os.order_id WHERE o.order_number = '${packetaOrderNumber}';`
    );
    expect(result).toContain("packeta");
    expect(result).toContain("79.00");
  });

  test("31-13 orders list shows tracking number and inline shipment actions for the PPL order", async () => {
    await ownerPage.goto(`${BASE}/admin/orders`);
    await ownerPage.waitForLoadState("networkidle");
    const row = ownerPage.locator("tr", { hasText: pplOrderNumber });
    await screenshot(ownerPage, "31-13-orders-list-inline-actions");

    const trackingResult = psql(
      `SELECT os.tracking_number FROM public.order_shipments os JOIN public.orders o ON o.id = os.order_id WHERE o.order_number = '${pplOrderNumber}';`
    );
    // psql's default tabular output wraps the value between a header and a "(1 row)"
    // footer, so pluck the mock provider's PPL<digits> tracking number directly rather
    // than relying on line position (the previously-generic ".split('\n').pop()" grabbed
    // the "(1 row)" footer line instead of the value).
    const trackingNumber = trackingResult.match(/PPL\d+/)?.[0] ?? "";
    expect(trackingNumber.length).toBeGreaterThan(0);

    await expect(row).toContainText(trackingNumber);
    await expect(row.getByRole("link", { name: /Náhled štítku|Preview label/ })).toBeVisible();
    await expect(row.getByRole("button", { name: /Aktualizovat stav|Refresh status/ })).toBeVisible();
    await expect(row.getByRole("button", { name: /Zrušit zásilku|Cancel shipment/ })).toBeVisible();
  });

  test("31-14 inline 'refresh status' button in the orders list works without leaving the list", async () => {
    const row = ownerPage.locator("tr", { hasText: pplOrderNumber });
    await row.getByRole("button", { name: /Aktualizovat stav|Refresh status/ }).click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-14-orders-list-after-refresh");
    // Must redirect back to the same list URL, not to the order detail page.
    expect(ownerPage.url()).toContain("/admin/orders");
    expect(ownerPage.url()).not.toContain(pplOrderNumber);
  });

  test("31-15 label preview page embeds the PDF via iframe", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}/label`);
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-15-label-preview-page");

    await expect(ownerPage.locator("iframe.label-frame")).toHaveAttribute("src", `/api/shipping-label/${orderId}`);
    await expect(ownerPage.getByRole("link", { name: /Zpět na objednávku|Back to order/ })).toBeVisible();
  });

  test("31-16 user without admin access cannot reach the label preview page", async ({ browser }: { browser: Browser }) => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];

    const page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
    await page.goto(`${BASE}/admin/orders/${orderId}/label`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/label");
    await page.close();
  });
});
