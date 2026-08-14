import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, PARTY_ID, WAREHOUSE_ID, OWNER, loginAs, screenshot, psql, replica, defaultRole } from "./helpers";

// Targeted verification of gaps NOT covered by 31-shipping-providers.spec.ts:
// guest (unauthenticated) checkout tracking visibility, admin cancel-shipment,
// and admin create-return-shipment + consignment code. Mock provider only —
// Packeta has no sandbox (see packeta.ts comment), so this never touches the
// live API; that is covered separately by a standalone script outside Playwright.
const PROD_GUEST = { id: "e0000001-0000-0000-0000-000000000001", slug: "e2e-packeta-guest", title: "E2E Packeta Guest Home", price: 280.0 };
const PROD_CANCEL = { id: "e0000001-0000-0000-0000-000000000002", slug: "e2e-packeta-cancel", title: "E2E Packeta Cancel", price: 260.0 };
const INV_GUEST = "e0000002-0000-0000-0000-000000000001";
const INV_CANCEL = "e0000002-0000-0000-0000-000000000002";
const GUEST_EMAIL = "e2e-guest-packeta@example.com";

const CARD = { number: "4242424242424242", expiry: "12/34", cvc: "123" };

function seed() {
  psql(`${replica}
    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku) VALUES
      ('${PROD_GUEST.id}', '${PARTY_ID}', '${PROD_GUEST.title}', '${PROD_GUEST.slug}', ${PROD_GUEST.price}, 'active', true, 'SKU-${PROD_GUEST.slug}'),
      ('${PROD_CANCEL.id}', '${PARTY_ID}', '${PROD_CANCEL.title}', '${PROD_CANCEL.slug}', ${PROD_CANCEL.price}, 'active', true, 'SKU-${PROD_CANCEL.slug}');
    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory) VALUES
      ('${INV_GUEST}', '${PARTY_ID}', '${PROD_GUEST.id}', '${WAREHOUSE_ID}', 10, 0, 2, true),
      ('${INV_CANCEL}', '${PARTY_ID}', '${PROD_CANCEL.id}', '${WAREHOUSE_ID}', 10, 0, 2, true);
  ${defaultRole}`);
}

function cleanup() {
  psql(`${replica}
    DELETE FROM public.order_shipments WHERE order_id IN (
      SELECT DISTINCT order_id FROM public.order_items WHERE product_id IN ('${PROD_GUEST.id}', '${PROD_CANCEL.id}')
    ) OR order_id IN ('e0000005-0000-0000-0000-000000000001', 'e0000005-0000-0000-0000-000000000002');
    DELETE FROM public.orders WHERE id IN (
      SELECT DISTINCT order_id FROM public.order_items WHERE product_id IN ('${PROD_GUEST.id}', '${PROD_CANCEL.id}')
    ) OR id IN ('e0000005-0000-0000-0000-000000000001', 'e0000005-0000-0000-0000-000000000002');
    DELETE FROM public.addresses WHERE id IN ('e0000004-0000-0000-0000-000000000001', 'e0000004-0000-0000-0000-000000000002');
    DELETE FROM public.customers WHERE party_id = '${PARTY_ID}' AND email IN ('${GUEST_EMAIL}', 'e2e-cancel-packeta@example.com', 'e2e-return-packeta@example.com');
    DELETE FROM public.inventory_items WHERE id IN ('${INV_GUEST}', '${INV_CANCEL}');
    DELETE FROM public.products WHERE id IN ('${PROD_GUEST.id}', '${PROD_CANCEL.id}');
  ${defaultRole}`);
}

async function addToCartAsGuest(page: Page, slug: string) {
  await page.goto(`${BASE}/shop/${slug}`);
  await page.waitForLoadState("networkidle");
  await page.locator("#cart-form button[type='submit']").click();
  await page.waitForTimeout(500);
}

async function fillAddressAndPay(page: Page, opts: { email?: string; firstName: string; lastName: string; line1: string; city: string; postal: string }) {
  await page.locator('input[name="shipping_provider"][value="packeta"]').check();
  if (opts.email) await page.fill("input[name='email']", opts.email);
  await page.fill("input[name='first_name']", opts.firstName);
  await page.fill("input[name='last_name']", opts.lastName);
  await page.fill("input[name='line1']", opts.line1);
  await page.fill("input[name='city']", opts.city);
  await page.fill("input[name='postal_code']", opts.postal);
  await page.locator("form.address-form button[type='submit']").click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.getByPlaceholder("email@example.com").fill(opts.email ?? "buyer@example.com");
  await page.getByPlaceholder("1234 1234 1234 1234").fill(CARD.number);
  await page.getByPlaceholder("MM / YY").fill(CARD.expiry);
  await page.getByPlaceholder("CVC").fill(CARD.cvc);
  await page.getByPlaceholder("Full name on card").fill(`${opts.firstName} ${opts.lastName}`);
  await page.getByRole("button", { name: "Pay" }).click();
  await page.waitForURL(/order-confirmation/, { timeout: 20000 });
}

test.describe("32 — Packeta verification: guest tracking visibility + admin cancel/return (mock mode)", () => {
  test.describe.configure({ mode: "serial" });

  let ownerPage: Page;
  let guestOrderNumber = "";
  let cancelOrderNumber = "";

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    cleanup();
    seed();
    ownerPage = await browser.newPage();
    await loginAs(ownerPage, OWNER.email, OWNER.password);
    await ownerPage.context().addCookies([{ name: "activePartyId", value: PARTY_ID, domain: "localhost", path: "/" }]);
  });

  test.afterAll(async () => {
    cleanup();
    await ownerPage.close();
  });

  test("32-01 guest (unauthenticated) checkout with Packeta: does order-confirmation show tracking?", async ({ browser }) => {
    const guestPage = await browser.newPage();
    await addToCartAsGuest(guestPage, PROD_GUEST.slug);
    await guestPage.goto(`${BASE}/shop/checkout`);
    await guestPage.waitForLoadState("networkidle");
    await screenshot(guestPage, "32-01-guest-checkout-page");

    await fillAddressAndPay(guestPage, {
      email: GUEST_EMAIL,
      firstName: "Guest",
      lastName: "Buyer",
      line1: "Hostovská 1",
      city: "Plzeň",
      postal: "30100",
    });
    await screenshot(guestPage, "32-01-guest-order-confirmation");

    const url = new URL(guestPage.url());
    guestOrderNumber = url.searchParams.get("order") ?? "";
    expect(guestOrderNumber).toMatch(/^ORD-/);

    // Ground truth: the shipment WAS created server-side (service-role client bypasses RLS).
    const dbResult = psql(
      `SELECT os.tracking_number FROM public.order_shipments os
       JOIN public.orders o ON o.id = os.order_id WHERE o.order_number = '${guestOrderNumber}';`
    );
    console.log("[32-01] DB tracking_number for guest order:", dbResult);
    expect(dbResult).toMatch(/^\s*Z\d+/m);

    // What the guest actually sees on the page they're looking at right now.
    const trackingVisible = await guestPage.locator(".tracking-line").isVisible().catch(() => false);
    console.log("[32-01] Tracking line visible to guest on order-confirmation page:", trackingVisible);
    await guestPage.close();

    // This assertion is expected to FAIL if the RLS gap suspected from code review
    // (order-confirmation.astro uses the session-bound client; "Customers read own
    // orders"/"...order_shipments" policies are `TO authenticated` only, no anon grant)
    // is real. Left as a real assertion (not soft) so the report reflects true pass/fail.
    expect(trackingVisible, "Guest should see their tracking number on the confirmation page").toBe(true);
  });

  test("32-02 admin creates Packeta shipment, then cancels it", async () => {
    // Seed a paid order directly (faster/more deterministic than another full checkout)
    // then drive the real create_shipment -> cancel_shipment actions through the admin UI.
    const custId = "e0000003-0000-0000-0000-000000000001";
    const addrId = "e0000004-0000-0000-0000-000000000001";
    const orderId = "e0000005-0000-0000-0000-000000000001";
    cancelOrderNumber = "ORD-E2E-CANCEL-01";
    psql(`${replica}
      INSERT INTO public.customers (id, party_id, first_name, last_name, email, phone, is_active)
      VALUES ('${custId}', '${PARTY_ID}', 'Cancel', 'Buyer', 'e2e-cancel-packeta@example.com', '+420123456789', true)
      ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.addresses (id, customer_id, type, first_name, last_name, line1, city, postal_code, country_code)
      VALUES ('${addrId}', '${custId}', 'shipping', 'Cancel', 'Buyer', 'Zrušená 1', 'Ostrava', '70200', 'CZ')
      ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.orders (id, party_id, customer_id, order_number, status, payment_status, subtotal, shipping_amount, total_amount, currency, shipping_address_id)
      VALUES ('${orderId}', '${PARTY_ID}', '${custId}', '${cancelOrderNumber}', 'processing', 'paid', ${PROD_CANCEL.price}, 79, ${PROD_CANCEL.price + 79}, 'CZK', '${addrId}');
      INSERT INTO public.order_shipments (order_id, party_id, provider, status, shipping_cost, weight_kg)
      VALUES ('${orderId}', '${PARTY_ID}', 'packeta', 'pending', 79, 1);
    ${defaultRole}`);

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "32-02-admin-order-before-shipment");

    await ownerPage.locator('form:has(input[value="create_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "32-02-admin-shipment-created");
    await expect(ownerPage.getByText("PACKETA", { exact: true })).toBeVisible();
    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();

    const afterCreate = psql(`SELECT status, provider_shipment_id, tracking_number, consignment_code FROM public.order_shipments WHERE order_id = '${orderId}';`);
    console.log("[32-02] After create_shipment:", afterCreate);
    expect(afterCreate).toContain("label_ready");

    await ownerPage.locator('form:has(input[value="cancel_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "32-02-admin-shipment-cancelled");
    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();

    const afterCancel = psql(`SELECT status, cancelled_at FROM public.order_shipments WHERE order_id = '${orderId}';`);
    console.log("[32-02] After cancel_shipment:", afterCancel);
    expect(afterCancel).toContain("cancelled");
    expect(afterCancel).not.toContain("cancelled_at    | \n"); // cancelled_at must be set, not null
  });

  test("32-03 admin creates a Packeta return shipment on a shipped order + consignment code shown", async () => {
    const custId = "e0000003-0000-0000-0000-000000000002";
    const addrId = "e0000004-0000-0000-0000-000000000002";
    const orderId = "e0000005-0000-0000-0000-000000000002";
    psql(`${replica}
      INSERT INTO public.customers (id, party_id, first_name, last_name, email, phone, is_active)
      VALUES ('${custId}', '${PARTY_ID}', 'Return', 'Buyer', 'e2e-return-packeta@example.com', '+420123456789', true)
      ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.addresses (id, customer_id, type, first_name, last_name, line1, city, postal_code, country_code)
      VALUES ('${addrId}', '${custId}', 'shipping', 'Return', 'Buyer', 'Vratná 2', 'Liberec', '46001', 'CZ')
      ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.orders (id, party_id, customer_id, order_number, status, payment_status, subtotal, shipping_amount, total_amount, currency, shipping_address_id)
      VALUES ('${orderId}', '${PARTY_ID}', '${custId}', 'ORD-E2E-RETURN-01', 'processing', 'paid', ${PROD_CANCEL.price}, 79, ${PROD_CANCEL.price + 79}, 'CZK', '${addrId}');
      INSERT INTO public.order_shipments (order_id, party_id, provider, status, shipping_cost, weight_kg, provider_shipment_id, tracking_number, is_mock)
      VALUES ('${orderId}', '${PARTY_ID}', 'packeta', 'label_ready', 79, 1, 'MOCK-PACKETA-SEEDED-01', 'Z0000000001', true);
    ${defaultRole}`);

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "32-03-admin-order-before-return");

    await ownerPage.locator('form:has(input[value="create_return_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "32-03-admin-return-created");
    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();

    const afterReturn = psql(
      `SELECT return_provider_shipment_id, return_tracking_number, return_password FROM public.order_shipments WHERE order_id = '${orderId}';`
    );
    console.log("[32-03] After create_return_shipment:", afterReturn);
    expect(afterReturn).toMatch(/\|\s*\d{6}\s*\n/);
  });
});
