import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, PARTY_ID, WAREHOUSE_ID, USER, USER_ID, loginAs, screenshot, psql, replica, defaultRole } from "./helpers";

// Two distinct products bought together in one order — proves per-line quantities,
// per-line totals, and the order total all stay correct once multiple SKUs are combined,
// and that stock is deducted independently and correctly for each product afterwards.
const PROD_D = { id: "b0000001-0000-0000-0000-000000000001", slug: "e2e-checkout-prod-d", title: "E2E Checkout Product D", price: 40.0, initialQty: 10, buyQty: 3 };
const PROD_E = { id: "b0000001-0000-0000-0000-000000000002", slug: "e2e-checkout-prod-e", title: "E2E Checkout Product E", price: 15.0, initialQty: 10, buyQty: 2 };
const INV_D = "b0000002-0000-0000-0000-000000000001";
const INV_E = "b0000002-0000-0000-0000-000000000002";

function seed() {
  psql(`${replica}
    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku)
    VALUES
      ('${PROD_D.id}', '${PARTY_ID}', '${PROD_D.title}', '${PROD_D.slug}', ${PROD_D.price}, 'active', true, 'SKU-${PROD_D.slug}'),
      ('${PROD_E.id}', '${PARTY_ID}', '${PROD_E.title}', '${PROD_E.slug}', ${PROD_E.price}, 'active', true, 'SKU-${PROD_E.slug}');
    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory)
    VALUES
      ('${INV_D}', '${PARTY_ID}', '${PROD_D.id}', '${WAREHOUSE_ID}', ${PROD_D.initialQty}, 0, 2, true),
      ('${INV_E}', '${PARTY_ID}', '${PROD_E.id}', '${WAREHOUSE_ID}', ${PROD_E.initialQty}, 0, 2, true);
  ${defaultRole}`);
}

function cleanup() {
  psql(`${replica}
    -- orders -> order_items cascades; customers -> addresses cascades. Order matters:
    -- orders.customer_id is ON DELETE RESTRICT, so orders must go before the customer.
    DELETE FROM public.orders WHERE id IN (
      SELECT DISTINCT order_id FROM public.order_items WHERE product_id IN ('${PROD_D.id}', '${PROD_E.id}')
    );
    DELETE FROM public.customers WHERE party_id = '${PARTY_ID}' AND email = '${USER.email}';
    DELETE FROM public.cart_items WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = '${USER_ID}');
    DELETE FROM public.carts WHERE user_id = '${USER_ID}';
    DELETE FROM public.inventory_items WHERE id IN ('${INV_D}', '${INV_E}');
    DELETE FROM public.products WHERE id IN ('${PROD_D.id}', '${PROD_E.id}');
  ${defaultRole}`);
}

test.describe("20 — Customer Multi-Product Checkout: buy 2 different products in one order", () => {
  test.describe.configure({ mode: "serial" });
  let page: Page;
  let orderNumber = "";

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    cleanup();
    seed();
    page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
  });

  test.afterAll(async () => {
    cleanup();
    await page.close();
  });

  test("20-01 add both products to cart with different quantities", async () => {
    for (const p of [PROD_D, PROD_E]) {
      await page.goto(`${BASE}/shop/${p.slug}`);
      await page.waitForLoadState("networkidle");
      await page.locator("form.cart-form input[name='quantity']").fill(String(p.buyQty));
      await page.locator("form.cart-form button[type='submit']").click();
      await page.waitForLoadState("networkidle");
    }
    await page.goto(`${BASE}/shop/cart`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".cart-item")).toHaveCount(2);
    await screenshot(page, "20-01-cart-two-products");
  });

  test("20-02 checkout page lists both products with correct per-line and order totals", async () => {
    await page.goto(`${BASE}/shop/checkout`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "20-02-checkout-summary");

    const expectedD = PROD_D.price * PROD_D.buyQty;
    const expectedE = PROD_E.price * PROD_E.buyQty;
    const expectedTotal = expectedD + expectedE;

    await expect(page.getByText(`${PROD_D.title} × ${PROD_D.buyQty}`)).toBeVisible();
    await expect(page.getByText(`${PROD_E.title} × ${PROD_E.buyQty}`)).toBeVisible();
    await expect(page.locator(".summary-item").filter({ hasText: PROD_D.title }).locator(".summary-price"))
      .toHaveText(`${expectedD.toFixed(2)} Kč`);
    await expect(page.locator(".summary-item").filter({ hasText: PROD_E.title }).locator(".summary-price"))
      .toHaveText(`${expectedE.toFixed(2)} Kč`);
    await expect(page.locator(".summary-total .total-price")).toHaveText(`${expectedTotal.toFixed(2)} Kč`);
  });

  test("20-03 submitting the address places the order and redirects to confirmation", async () => {
    await page.fill("input[name='first_name']", "Multi");
    await page.fill("input[name='last_name']", "Buyer");
    await page.fill("input[name='line1']", "Nákupní 2");
    await page.fill("input[name='city']", "Brno");
    await page.fill("input[name='postal_code']", "60200");
    await page.locator("form.address-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/shop/order-confirmation**`, { timeout: 15000 });
    await screenshot(page, "20-03-order-confirmation");
    await expect(page.locator(".confirmation-card")).toBeVisible();

    const url = new URL(page.url());
    orderNumber = url.searchParams.get("order") ?? "";
    expect(orderNumber).toMatch(/^ORD-/);

    // Cart must be empty immediately after a successful order.
    await page.goto(`${BASE}/shop/cart`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".empty-cart")).toBeVisible();
  });

  test("20-04 both products' stock deducted independently by the correct amounts", async () => {
    const result = psql(
      `SELECT product_id, qty_on_hand FROM public.inventory_items WHERE id IN ('${INV_D}', '${INV_E}') ORDER BY id;`
    );
    expect(result).toContain(String(PROD_D.initialQty - PROD_D.buyQty));
    expect(result).toContain(String(PROD_E.initialQty - PROD_E.buyQty));
  });

  test("20-05 order_items row exists for both products with correct quantity and line total", async () => {
    const result = psql(
      `SELECT oi.product_id, oi.quantity, oi.total_price
       FROM public.order_items oi
       JOIN public.orders o ON o.id = oi.order_id
       WHERE o.order_number = '${orderNumber}'
       ORDER BY oi.product_id;`
    );
    expect(result).toContain(`${PROD_D.buyQty}`);
    expect(result).toContain(`${PROD_E.buyQty}`);
    expect(result).toContain((PROD_D.price * PROD_D.buyQty).toFixed(2));
    expect(result).toContain((PROD_E.price * PROD_E.buyQty).toFixed(2));
  });
});
