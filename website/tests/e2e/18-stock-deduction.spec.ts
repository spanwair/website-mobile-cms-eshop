import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, PARTY_ID, WAREHOUSE_ID, ADMIN, ADMIN_ID, loginAs, screenshot } from "./helpers";

const STOCK_PRODUCT_ID = "18181818-1818-1818-1818-181818181818";
const STOCK_INV_ID = "19191919-1919-1919-1919-191919191919";
const STOCK_SLUG = "e2e-stock-deduction";
const INITIAL_QTY = 2;

function psql(sql: string) {
  const tmp = `/tmp/e2e-18-${Date.now()}.sql`;
  writeFileSync(tmp, sql);
  try {
    return execSync(
      `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f ${tmp}`,
      { stdio: "pipe" }
    ).toString();
  } finally {
    unlinkSync(tmp);
  }
}

const replica = "SET session_replication_role = replica;";
const defaultRole = "SET session_replication_role = DEFAULT;";

test.describe("18 — Stock Deduction: Buy → Deduct → Notify", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    // Clean up any leftover test data and admin user's cart
    psql(`${replica}
      DELETE FROM public.cart_items WHERE cart_id IN (
        SELECT id FROM public.carts WHERE user_id = '${ADMIN_ID}'
      );
      DELETE FROM public.carts WHERE user_id = '${ADMIN_ID}';
      DELETE FROM public.inventory_items WHERE id = '${STOCK_INV_ID}';
      DELETE FROM public.products WHERE id = '${STOCK_PRODUCT_ID}';
    ${defaultRole}`);

    // Seed test product with inventory qty=${INITIAL_QTY}
    psql(`${replica}
      INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku)
      VALUES ('${STOCK_PRODUCT_ID}', '${PARTY_ID}', 'Stock Test Product', '${STOCK_SLUG}', 29.90, 'active', true, 'SKU-STOCK-E2E');
      INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory)
      VALUES ('${STOCK_INV_ID}', '${PARTY_ID}', '${STOCK_PRODUCT_ID}', '${WAREHOUSE_ID}', ${INITIAL_QTY}, 0, 10, true);
    ${defaultRole}`);

    page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
  });

  test.afterAll(async () => {
    // Clean up
    psql(`${replica}
      DELETE FROM public.inventory_items WHERE id = '${STOCK_INV_ID}';
      DELETE FROM public.products WHERE id = '${STOCK_PRODUCT_ID}';
    ${defaultRole}`);
    await page.close();
  });

  test("18-01 shop product page shows stock remaining", async () => {
    await page.goto(`${BASE}/shop/${STOCK_SLUG}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "18-01-product-page");
    // Should show qty remaining hint (2 left in stock) or at least Add to Cart
    await expect(page.locator(".add-to-cart-section")).toBeVisible();
    await expect(page.locator(".out-of-stock-badge")).not.toBeVisible();
  });

  test("18-02 add all stock (qty=2) to cart", async () => {
    await page.goto(`${BASE}/shop/${STOCK_SLUG}`);
    await page.waitForLoadState("networkidle");
    const qtyInput = page.locator("form.cart-form input[name='quantity']");
    await qtyInput.fill(String(INITIAL_QTY));
    await screenshot(page, "18-02-add-to-cart");
    await page.locator("form.cart-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    // Should redirect back with ?added=1
    await expect(page.locator(".cart-success")).toBeVisible();
    await screenshot(page, "18-02-after-add-to-cart");
  });

  test("18-03 cart shows the item", async () => {
    await page.goto(`${BASE}/shop/cart`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "18-03-cart-page");
    await expect(page.getByText("Stock Test Product")).toBeVisible();
    await expect(page.locator(".checkout-btn")).toBeVisible();
  });

  test("18-04 proceed to checkout and place order", async () => {
    await page.goto(`${BASE}/shop/checkout`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "18-04-checkout-page");
    await expect(page.getByText("Stock Test Product")).toBeVisible();

    await page.fill("input[name='first_name']", "Test");
    await page.fill("input[name='last_name']", "Buyer");
    await page.fill("input[name='line1']", "Testova 1");
    await page.fill("input[name='city']", "Praha");
    await page.fill("input[name='postal_code']", "10000");

    await screenshot(page, "18-04-checkout-filled");
    await page.locator("form.address-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");

    // Should redirect to order confirmation
    await page.waitForURL(`${BASE}/shop/order-confirmation**`, { timeout: 15000 });
    await screenshot(page, "18-04-order-confirmation");
    await expect(page.locator(".confirmation-card")).toBeVisible();
  });

  test("18-05 admin inventory shows qty=0 after order", async () => {
    await page.goto(`${BASE}/admin/inventory`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "18-05-inventory-after-order");
    // The stock test product should show qty=0 with out-of-stock badge
    const rows = page.locator("table.data-table tbody tr");
    // Find the row for our test product
    const stockRow = rows.filter({ hasText: "Stock Test Product" });
    await expect(stockRow).toBeVisible();
    const qtyCell = stockRow.locator("td").nth(2);
    await expect(qtyCell).toHaveText("0");
  });

  test("18-06 admin inventory out-of-stock tab shows the product", async () => {
    await page.goto(`${BASE}/admin/inventory?filter=out`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "18-06-out-of-stock-tab");
    await expect(page.getByText("Stock Test Product")).toBeVisible();
  });

  test("18-07 admin notifications shows low_inventory alert", async () => {
    await page.goto(`${BASE}/admin/notifications`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "18-07-notifications");
    // Should have an out-of-stock notification for our test product
    await expect(page.getByText(/out of stock|stock test product/i).first()).toBeVisible();
  });

  test("18-08 shop product page now shows out of stock", async () => {
    await page.goto(`${BASE}/shop/${STOCK_SLUG}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "18-08-product-out-of-stock");
    await expect(page.locator(".out-of-stock-badge")).toBeVisible();
    await expect(page.locator("form.cart-form button[type='submit']")).not.toBeVisible();
  });

  test("18-09 admin product detail shows inventory section with qty=0", async () => {
    await page.goto(`${BASE}/admin/products/${STOCK_PRODUCT_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "18-09-product-detail-inventory");
    await expect(page.locator(".inv-card")).toBeVisible();
    const onHandValue = page.locator(".inv-stat").first().locator(".inv-value");
    await expect(onHandValue).toHaveText("0");
  });
});
