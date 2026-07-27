/**
 * 25 — /eshop-[slug] per-organization storefront paths
 *
 * Covers the new path-based multi-tenant storefront routing added alongside /shop:
 *   - /eshop-{slug} scopes every catalog/cart/checkout query to that one organization
 *   - a product belonging to another party is never reachable through the wrong slug
 *   - /shop still works unscoped (aggregate view) and lists a "Stores" directory
 *   - an unknown/invalid slug redirects back to /shop rather than erroring
 */
import { test, expect, type Browser, type Page } from "@playwright/test";
import {
  BASE, PARTY_ID, PARTY2_ID, WAREHOUSE_ID, USER, USER_ID, ADMIN,
  loginAs, screenshot, psql, replica, defaultRole,
} from "./helpers";

const PROD_ORG1 = { id: "b9000001-0000-0000-0000-000000000001", slug: "e2e-eshop-org1-prod", title: "E2E Eshop Org1 Product", price: 12.5 };
const PROD_ORG2 = { id: "b9000001-0000-0000-0000-000000000002", slug: "e2e-eshop-org2-prod", title: "E2E Eshop Org2 Product", price: 33.0 };
const INV_ORG1 = "b9000002-0000-0000-0000-000000000001";

function seed() {
  psql(`${replica}
    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku)
    VALUES ('${PROD_ORG1.id}', '${PARTY_ID}', '${PROD_ORG1.title}', '${PROD_ORG1.slug}', ${PROD_ORG1.price}, 'active', true, 'SKU-${PROD_ORG1.slug}');
    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory)
    VALUES ('${INV_ORG1}', '${PARTY_ID}', '${PROD_ORG1.id}', '${WAREHOUSE_ID}', 20, 0, 5, true);
    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku)
    VALUES ('${PROD_ORG2.id}', '${PARTY2_ID}', '${PROD_ORG2.title}', '${PROD_ORG2.slug}', ${PROD_ORG2.price}, 'active', true, 'SKU-${PROD_ORG2.slug}');
  ${defaultRole}`);
}

function cleanup() {
  psql(`${replica}
    DELETE FROM public.cart_items WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = '${USER_ID}');
    DELETE FROM public.carts WHERE user_id = '${USER_ID}';
    DELETE FROM public.inventory_items WHERE id = '${INV_ORG1}';
    DELETE FROM public.products WHERE id IN ('${PROD_ORG1.id}', '${PROD_ORG2.id}');
  ${defaultRole}`);
}

test.describe("25 — /eshop-[slug] per-organization storefront", () => {
  test.describe.configure({ mode: "serial" });
  let page: Page;

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

  test("25-00 [regression] anonymous (logged-out) visitor can load /eshop-{slug} for every active org — RLS must never hard-fail for anon", async ({ browser }: { browser: Browser }) => {
    // Every other test in this file is logged in (Postgres role "authenticated"), which has
    // direct SELECT grants that mask RLS bugs only visible to true anonymous visitors (role
    // "anon") — exactly how this was first caught: a real anon page load 500'd with "permission
    // denied for table user_party_roles" because a policy queried `parties` directly inside
    // USING(), re-triggering parties' own RLS. Always exercise the anon path explicitly.
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    for (const slug of ["test-organisation", "other-organisation"]) {
      const response = await anonPage.goto(`${BASE}/eshop-${slug}`);
      expect(response?.status(), `/eshop-${slug} as anonymous visitor`).toBeLessThan(400);
      await expect(anonPage.locator(".shop-layout")).toBeVisible();
    }
    await anonContext.close();
  });

  test("25-01 /eshop-test-organisation shows only that org's product, not the other org's", async () => {
    await page.goto(`${BASE}/eshop-test-organisation`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "25-01-eshop-org1-listing");
    await expect(page.getByText(PROD_ORG1.title)).toBeVisible();
    await expect(page.getByText(PROD_ORG2.title)).not.toBeVisible();
  });

  test("25-02 /eshop-other-organisation shows only its own product", async () => {
    await page.goto(`${BASE}/eshop-other-organisation`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "25-02-eshop-org2-listing");
    await expect(page.getByText(PROD_ORG2.title)).toBeVisible();
    await expect(page.getByText(PROD_ORG1.title)).not.toBeVisible();
  });

  test("25-03 product from another org is not reachable under the wrong org slug (redirects back to that org's shop)", async () => {
    await page.goto(`${BASE}/eshop-test-organisation/${PROD_ORG2.slug}`);
    await page.waitForURL(`${BASE}/eshop-test-organisation`, { timeout: 10000 });
    await screenshot(page, "25-03-cross-org-product-redirect");
  });

  test("25-04 unknown org slug redirects to /shop", async () => {
    await page.goto(`${BASE}/eshop-does-not-exist`);
    await page.waitForURL(`${BASE}/shop`, { timeout: 10000 });
  });

  test("25-05 /shop lists a Stores directory linking to /eshop-{slug}", async () => {
    await page.goto(`${BASE}/shop`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "25-05-shop-stores-directory");
    await expect(page.locator(`a[href="/eshop-test-organisation"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/eshop-other-organisation"]`).first()).toBeVisible();
  });

  test("25-06 add to cart, checkout, and confirm — fully scoped under /eshop-test-organisation", async () => {
    await page.goto(`${BASE}/eshop-test-organisation/${PROD_ORG1.slug}`);
    await page.waitForLoadState("networkidle");
    await page.locator("form.cart-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".cart-success")).toBeVisible();

    await page.goto(`${BASE}/eshop-test-organisation/cart`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".cart-item").filter({ hasText: PROD_ORG1.title })).toBeVisible();
    await screenshot(page, "25-06-eshop-cart");

    await page.goto(`${BASE}/eshop-test-organisation/checkout`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='first_name']", "Eshop");
    await page.fill("input[name='last_name']", "Tester");
    await page.fill("input[name='line1']", "Test 1");
    await page.fill("input[name='city']", "Prague");
    await page.fill("input[name='postal_code']", "11000");
    await page.click("form.address-form button[type='submit']");
    await page.waitForURL(`${BASE}/eshop-test-organisation/order-confirmation**`, { timeout: 15000 });
    await screenshot(page, "25-06-eshop-order-confirmation");
    await expect(page.locator(".confirmation-card")).toBeVisible();
  });

  test("25-07 storefront nav stays scoped to the org — no Dashboard/Items/Admin links, brand click stays inside /eshop-{slug} — but the same admin still sees them on /dashboard", async ({ browser }: { browser: Browser }) => {
    const adminPage = await browser.newPage();
    await loginAs(adminPage, ADMIN.email, ADMIN.password);

    await adminPage.goto(`${BASE}/eshop-test-organisation`);
    await adminPage.waitForLoadState("networkidle");
    await screenshot(adminPage, "25-07-eshop-nav-scoped");
    await expect(adminPage.locator('a[href="/dashboard"]')).toHaveCount(0);
    await expect(adminPage.locator('a[href="/items"]')).toHaveCount(0);
    await expect(adminPage.locator('a[href="/admin"]')).toHaveCount(0);
    await expect(adminPage.locator("a.nav-brand")).toHaveAttribute("href", "/eshop-test-organisation");

    await adminPage.goto(`${BASE}/dashboard`);
    await adminPage.waitForLoadState("networkidle");
    await expect(adminPage.locator('nav a[href="/dashboard"]')).toBeVisible();
    await expect(adminPage.locator('nav a[href="/admin"]')).toBeVisible();
    await adminPage.close();
  });
});
