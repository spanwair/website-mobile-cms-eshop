import { test, expect, type Browser, type Page } from "@playwright/test";
import {
  BASE, PARTY_ID, WAREHOUSE_ID, USER, USER_ID, loginAs, screenshot,
  psql, replica, defaultRole, createTestCustomer, deleteTestCustomer,
} from "./helpers";

// F: last-unit product, buying it should transition it to out-of-stock live.
// G: already at zero stock — must never offer an add-to-cart form at all.
// H: below its low-stock threshold but not zero — must show the low-stock hint.
const PROD_F = { id: "c1000001-0000-0000-0000-000000000001", slug: "e2e-oos-prod-f", title: "E2E OOS Product F", price: 12.0 };
const PROD_G = { id: "c1000001-0000-0000-0000-000000000002", slug: "e2e-oos-prod-g", title: "E2E OOS Product G", price: 12.0 };
const PROD_H = { id: "c1000001-0000-0000-0000-000000000003", slug: "e2e-oos-prod-h", title: "E2E OOS Product H", price: 12.0 };
const PROD_I = { id: "c1000001-0000-0000-0000-000000000004", slug: "e2e-oos-prod-i", title: "E2E OOS Race Product I", price: 12.0 };
const INV_F = "c1000002-0000-0000-0000-000000000001";
const INV_G = "c1000002-0000-0000-0000-000000000002";
const INV_H = "c1000002-0000-0000-0000-000000000003";
const INV_I = "c1000002-0000-0000-0000-000000000004";

const BUYER2_ID = "c1000003-0000-0000-0000-000000000001";
const BUYER2 = { email: "e2e-buyer2@test.com", password: "Buyer2E2E!" };

function seed() {
  psql(`${replica}
    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku) VALUES
      ('${PROD_F.id}', '${PARTY_ID}', '${PROD_F.title}', '${PROD_F.slug}', ${PROD_F.price}, 'active', true, 'SKU-${PROD_F.slug}'),
      ('${PROD_G.id}', '${PARTY_ID}', '${PROD_G.title}', '${PROD_G.slug}', ${PROD_G.price}, 'active', true, 'SKU-${PROD_G.slug}'),
      ('${PROD_H.id}', '${PARTY_ID}', '${PROD_H.title}', '${PROD_H.slug}', ${PROD_H.price}, 'active', true, 'SKU-${PROD_H.slug}'),
      ('${PROD_I.id}', '${PARTY_ID}', '${PROD_I.title}', '${PROD_I.slug}', ${PROD_I.price}, 'active', true, 'SKU-${PROD_I.slug}');
    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory) VALUES
      ('${INV_F}', '${PARTY_ID}', '${PROD_F.id}', '${WAREHOUSE_ID}', 1, 0, 5, true),
      ('${INV_G}', '${PARTY_ID}', '${PROD_G.id}', '${WAREHOUSE_ID}', 0, 0, 5, true),
      ('${INV_H}', '${PARTY_ID}', '${PROD_H.id}', '${WAREHOUSE_ID}', 3, 0, 5, true),
      ('${INV_I}', '${PARTY_ID}', '${PROD_I.id}', '${WAREHOUSE_ID}', 1, 0, 5, true);
  ${defaultRole}`);
}

function cleanup() {
  const ids = [PROD_F.id, PROD_G.id, PROD_H.id, PROD_I.id];
  const list = ids.map((id) => `'${id}'`).join(",");
  psql(`${replica}
    DELETE FROM public.orders WHERE id IN (SELECT DISTINCT order_id FROM public.order_items WHERE product_id IN (${list}));
    DELETE FROM public.customers WHERE party_id = '${PARTY_ID}' AND email IN ('${USER.email}', '${BUYER2.email}');
    DELETE FROM public.cart_items WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id IN ('${USER_ID}', '${BUYER2_ID}'));
    DELETE FROM public.carts WHERE user_id IN ('${USER_ID}', '${BUYER2_ID}');
    DELETE FROM public.inventory_items WHERE id IN ('${INV_F}', '${INV_G}', '${INV_H}', '${INV_I}');
    DELETE FROM public.products WHERE id IN (${list});
  ${defaultRole}`);
}

test.describe("21 — Out-of-Stock Scenarios (multiple products)", () => {
  test.describe.configure({ mode: "serial" });
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    cleanup();
    seed();
    createTestCustomer(BUYER2_ID, BUYER2.email, BUYER2.password);
    page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
  });

  test.afterAll(async () => {
    cleanup();
    deleteTestCustomer(BUYER2_ID);
    await page.close();
  });

  test("21-01 product already at zero stock shows out-of-stock badge, no add-to-cart form", async () => {
    await page.goto(`${BASE}/shop/${PROD_G.slug}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "21-01-already-out-of-stock");
    await expect(page.locator(".out-of-stock-badge")).toBeVisible();
    await expect(page.locator("form.cart-form")).toHaveCount(0);
  });

  test("21-02 low-stock product (below threshold, not zero) shows the remaining-stock hint", async () => {
    await page.goto(`${BASE}/shop/${PROD_H.slug}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "21-02-low-stock-hint");
    await expect(page.locator(".out-of-stock-badge")).not.toBeVisible();
    await expect(page.locator(".low-stock-hint")).toContainText("3");
  });

  test("21-03 buying the last unit of F flips it to out-of-stock live", async () => {
    await page.goto(`${BASE}/shop/${PROD_F.slug}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".out-of-stock-badge")).not.toBeVisible();
    await page.locator("form.cart-form input[name='quantity']").fill("1");
    await page.locator("form.cart-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".cart-success")).toBeVisible();

    await page.goto(`${BASE}/shop/checkout`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='first_name']", "Last");
    await page.fill("input[name='last_name']", "Unit");
    await page.fill("input[name='line1']", "Skladem 1");
    await page.fill("input[name='city']", "Ostrava");
    await page.fill("input[name='postal_code']", "70200");
    await page.locator("form.address-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/shop/order-confirmation**`, { timeout: 15000 });

    await page.goto(`${BASE}/shop/${PROD_F.slug}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "21-03-now-out-of-stock");
    await expect(page.locator(".out-of-stock-badge")).toBeVisible();
    await expect(page.locator("form.cart-form")).toHaveCount(0);
  });

  test.describe("FINDING: no server-side stock guard at checkout (overselling)", () => {
    // Product I starts with qty=1. Buyer 2 adds it to their cart while stock is still 1
    // (legitimate — nothing wrong yet). Buyer 1 (USER) then buys the same last unit first
    // through the normal UI, taking stock to 0. Buyer 2's cart still holds the item from
    // before the sellout — the question is whether checkout.astro re-validates availability
    // before creating the order. It currently does not: neither add_to_cart, updateCartItemQty,
    // nor the checkout POST handler ever compare requested quantity against qty_available.
    // This test documents the ACTUAL current behavior (order succeeds, stock goes negative),
    // not a desired one — see the summary reported to the user for the recommended fix
    // (validate `quantity <= qty_available` server-side in both handlers before writing).
    let buyer2Page: Page;

    test.beforeAll(async ({ browser }: { browser: Browser }) => {
      buyer2Page = await browser.newPage();
      await loginAs(buyer2Page, BUYER2.email, BUYER2.password);
    });

    test.afterAll(async () => {
      await buyer2Page.close();
    });

    test("21-04 buyer 2 adds the last unit of I to their cart while it is still in stock", async () => {
      await buyer2Page.goto(`${BASE}/shop/${PROD_I.slug}`);
      await buyer2Page.waitForLoadState("networkidle");
      await expect(buyer2Page.locator(".out-of-stock-badge")).not.toBeVisible();
      await buyer2Page.locator("form.cart-form input[name='quantity']").fill("1");
      await buyer2Page.locator("form.cart-form button[type='submit']").click();
      await buyer2Page.waitForLoadState("networkidle");
      await expect(buyer2Page.locator(".cart-success")).toBeVisible();
    });

    test("21-05 buyer 1 buys the same last unit first, taking stock to zero", async () => {
      await page.goto(`${BASE}/shop/${PROD_I.slug}`);
      await page.waitForLoadState("networkidle");
      await page.locator("form.cart-form input[name='quantity']").fill("1");
      await page.locator("form.cart-form button[type='submit']").click();
      await page.waitForLoadState("networkidle");
      await page.goto(`${BASE}/shop/checkout`);
      await page.waitForLoadState("networkidle");
      await page.fill("input[name='first_name']", "First");
      await page.fill("input[name='last_name']", "Buyer");
      await page.fill("input[name='line1']", "Rychla 1");
      await page.fill("input[name='city']", "Plzen");
      await page.fill("input[name='postal_code']", "30100");
      await page.locator("form.address-form button[type='submit']").click();
      await page.waitForURL(`${BASE}/shop/order-confirmation**`, { timeout: 15000 });

      const stock = psql(`SELECT qty_on_hand FROM public.inventory_items WHERE id = '${INV_I}';`);
      expect(stock).toContain("0");
    });

    test("21-06 [FINDING] buyer 2 can still complete checkout with stock already at zero", async () => {
      await buyer2Page.goto(`${BASE}/shop/checkout`);
      await buyer2Page.waitForLoadState("networkidle");
      await screenshot(buyer2Page, "21-06-buyer2-checkout-stale-cart");
      await buyer2Page.fill("input[name='first_name']", "Second");
      await buyer2Page.fill("input[name='last_name']", "Buyer");
      await buyer2Page.fill("input[name='line1']", "Pozde 2");
      await buyer2Page.fill("input[name='city']", "Liberec");
      await buyer2Page.fill("input[name='postal_code']", "46001");
      await buyer2Page.locator("form.address-form button[type='submit']").click();

      // Documents ACTUAL behavior: the order is NOT blocked despite zero stock.
      await buyer2Page.waitForURL(`${BASE}/shop/order-confirmation**`, { timeout: 15000 });
      await screenshot(buyer2Page, "21-06-order-succeeded-despite-oos");

      const stock = psql(`SELECT qty_on_hand FROM public.inventory_items WHERE id = '${INV_I}';`);
      // Stock is driven negative — no floor at zero. This is the reportable gap.
      expect(stock).toContain("-1");
    });
  });
});
