import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, PARTY_ID, WAREHOUSE_ID, USER, USER_ID, loginAs, screenshot, psql, replica, defaultRole } from "./helpers";

// Three distinct products so cart-quantity math can't be faked by a single-item happy path.
const PROD_A = { id: "a9000001-0000-0000-0000-000000000001", slug: "e2e-cart-prod-a", title: "E2E Cart Product A", price: 10.0 };
const PROD_B = { id: "a9000001-0000-0000-0000-000000000002", slug: "e2e-cart-prod-b", title: "E2E Cart Product B", price: 25.5 };
const PROD_C = { id: "a9000001-0000-0000-0000-000000000003", slug: "e2e-cart-prod-c", title: "E2E Cart Product C", price: 5.0 };
const INV_A = "a9000002-0000-0000-0000-000000000001";
const INV_B = "a9000002-0000-0000-0000-000000000002";
const INV_C = "a9000002-0000-0000-0000-000000000003";

function seedProduct(p: typeof PROD_A, invId: string, qty: number) {
  psql(`${replica}
    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku)
    VALUES ('${p.id}', '${PARTY_ID}', '${p.title}', '${p.slug}', ${p.price}, 'active', true, 'SKU-${p.slug}');
    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory)
    VALUES ('${invId}', '${PARTY_ID}', '${p.id}', '${WAREHOUSE_ID}', ${qty}, 0, 10, true);
  ${defaultRole}`);
}

function cleanup() {
  psql(`${replica}
    DELETE FROM public.cart_items WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = '${USER_ID}');
    DELETE FROM public.carts WHERE user_id = '${USER_ID}';
    DELETE FROM public.inventory_items WHERE id IN ('${INV_A}', '${INV_B}', '${INV_C}');
    DELETE FROM public.products WHERE id IN ('${PROD_A.id}', '${PROD_B.id}', '${PROD_C.id}');
  ${defaultRole}`);
}

test.describe("19 — Customer Cart Flow: add, merge quantities, multi-product totals", () => {
  test.describe.configure({ mode: "serial" });
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    cleanup();
    seedProduct(PROD_A, INV_A, 20);
    seedProduct(PROD_B, INV_B, 20);
    seedProduct(PROD_C, INV_C, 20);
    page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
  });

  test.afterAll(async () => {
    cleanup();
    await page.close();
  });

  async function addToCart(slug: string, qty: number) {
    await page.goto(`${BASE}/shop/${slug}`);
    await page.waitForLoadState("networkidle");
    await page.locator("form.cart-form input[name='quantity']").fill(String(qty));
    await page.locator("form.cart-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
  }

  test("19-01 add product A qty=1 — cart shows exactly 1 item, correct price", async () => {
    await addToCart(PROD_A.slug, 1);
    await expect(page.locator(".cart-success")).toBeVisible();
    await page.goto(`${BASE}/shop/cart`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "19-01-cart-single-item");
    const row = page.locator(".cart-item").filter({ hasText: PROD_A.title });
    await expect(row).toBeVisible();
    await expect(row.locator(".qty-input")).toHaveValue("1");
    await expect(row.locator(".item-total")).toHaveText(`${PROD_A.price.toFixed(2)} Kč`);
  });

  test("19-02 adding product A again merges quantity (does not create a second row)", async () => {
    await addToCart(PROD_A.slug, 2);
    await page.goto(`${BASE}/shop/cart`);
    await page.waitForLoadState("networkidle");
    const rows = page.locator(".cart-item").filter({ hasText: PROD_A.title });
    await expect(rows).toHaveCount(1);
    await expect(rows.locator(".qty-input")).toHaveValue("3");
    await expect(rows.locator(".item-total")).toHaveText(`${(PROD_A.price * 3).toFixed(2)} Kč`);
    await screenshot(page, "19-02-merged-quantity");
  });

  test("19-03 add two more distinct products — cart holds 3 line items with correct subtotal", async () => {
    await addToCart(PROD_B.slug, 2);
    await addToCart(PROD_C.slug, 5);
    await page.goto(`${BASE}/shop/cart`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "19-03-three-products");

    await expect(page.locator(".cart-item")).toHaveCount(3);
    const expectedSubtotal = PROD_A.price * 3 + PROD_B.price * 2 + PROD_C.price * 5;
    const expectedItemCount = 3 + 2 + 5;
    await expect(page.getByText(`Subtotal (${expectedItemCount} items)`)).toBeVisible();
    await expect(page.locator(".total-price")).toHaveText(`${expectedSubtotal.toFixed(2)} Kč`);
  });

  test("19-04 update quantity in cart recalculates line total and subtotal", async () => {
    const rowB = page.locator(".cart-item").filter({ hasText: PROD_B.title });
    await rowB.locator(".qty-input").fill("4");
    await rowB.locator(".qty-input").press("Tab"); // triggers onchange -> auto-submit
    await page.waitForLoadState("networkidle");
    await screenshot(page, "19-04-updated-quantity");

    const expectedSubtotal = PROD_A.price * 3 + PROD_B.price * 4 + PROD_C.price * 5;
    await expect(page.locator(".total-price")).toHaveText(`${expectedSubtotal.toFixed(2)} Kč`);
  });

  test("19-05 removing an item drops it from the cart and recalculates totals", async () => {
    const rowC = page.locator(".cart-item").filter({ hasText: PROD_C.title });
    await rowC.locator(".remove-btn").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "19-05-after-remove");

    await expect(page.locator(".cart-item")).toHaveCount(2);
    await expect(page.getByText(PROD_C.title)).not.toBeVisible();
    const expectedSubtotal = PROD_A.price * 3 + PROD_B.price * 4;
    await expect(page.locator(".total-price")).toHaveText(`${expectedSubtotal.toFixed(2)} Kč`);
  });

  test("19-06 removing all items shows the empty-cart state", async () => {
    let row = page.locator(".cart-item").first();
    while (await row.count() > 0) {
      await row.locator(".remove-btn").click();
      await page.waitForLoadState("networkidle");
      row = page.locator(".cart-item").first();
    }
    await screenshot(page, "19-06-empty-cart");
    await expect(page.locator(".empty-cart")).toBeVisible();
  });
});
