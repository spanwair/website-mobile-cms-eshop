import { test, expect, type Page } from "@playwright/test";
import { BASE, PARTY_ID, WAREHOUSE_ID, USER, loginAs, screenshot, psql, replica, defaultRole } from "./helpers";

// On-demand product: track_inventory=false, qty_on_hand=0. Must be purchasable with no
// stock ceiling and must never move qty_on_hand as a result of the sale or a later cancel.
const PROD = { id: "d1000001-0000-0000-0000-000000000001", slug: "e2e-on-demand-prod", title: "E2E On Demand Product", price: 20.0 };
const INV = "d1000002-0000-0000-0000-000000000001";

function seed() {
  psql(`${replica}
    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku) VALUES
      ('${PROD.id}', '${PARTY_ID}', '${PROD.title}', '${PROD.slug}', ${PROD.price}, 'active', true, 'SKU-${PROD.slug}');
    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory) VALUES
      ('${INV}', '${PARTY_ID}', '${PROD.id}', '${WAREHOUSE_ID}', 0, 0, 5, false);
  ${defaultRole}`);
}

function cleanup() {
  psql(`${replica}
    DELETE FROM public.orders WHERE id IN (SELECT DISTINCT order_id FROM public.order_items WHERE product_id = '${PROD.id}');
    DELETE FROM public.cart_items WHERE product_id = '${PROD.id}';
    DELETE FROM public.inventory_items WHERE id = '${INV}';
    DELETE FROM public.products WHERE id = '${PROD.id}';
  ${defaultRole}`);
}

test.describe("29 — On-Demand Products (track_inventory=false)", () => {
  test.describe.configure({ mode: "serial" });
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    cleanup();
    seed();
    page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
  });

  test.afterAll(async () => {
    cleanup();
    await page.close();
  });

  test("29-01 on-demand product with zero stock never shows out-of-stock and offers the cart form", async () => {
    await page.goto(`${BASE}/shop/${PROD.slug}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "29-01-on-demand-purchasable");
    await expect(page.locator(".out-of-stock-badge")).not.toBeVisible();
    await expect(page.locator("form.cart-form")).toHaveCount(1);
  });

  test("29-02 adding more than qty_on_hand to the cart succeeds", async () => {
    await page.locator("form.cart-form input[name='quantity']").fill("5");
    await page.locator("form.cart-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".cart-success")).toBeVisible();
  });

  test("29-03 checkout completes and qty_on_hand is left untouched (not decremented, not negative)", async () => {
    await page.goto(`${BASE}/shop/checkout`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='first_name']", "On");
    await page.fill("input[name='last_name']", "Demand");
    await page.fill("input[name='line1']", "Objednavka 1");
    await page.fill("input[name='city']", "Brno");
    await page.fill("input[name='postal_code']", "60200");
    await page.locator("form.address-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/shop/order-confirmation**`, { timeout: 15000 });

    const stock = psql(`SELECT qty_on_hand FROM public.inventory_items WHERE id = '${INV}';`);
    expect(stock).toContain("0");
    expect(stock).not.toContain("-");

    const orderCount = psql(`SELECT count(*) FROM public.order_items WHERE product_id = '${PROD.id}';`);
    expect(orderCount).not.toContain(" 0");
  });

  test("29-04 product page still shows no out-of-stock badge after the sale", async () => {
    await page.goto(`${BASE}/shop/${PROD.slug}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".out-of-stock-badge")).not.toBeVisible();
    await expect(page.locator("form.cart-form")).toHaveCount(1);
  });
});
