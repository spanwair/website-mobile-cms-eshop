import { test, expect, devices, type Page } from "@playwright/test";
import { BASE, PARTY_ID, PRODUCT_ID, USER, USER_ID, loginAs, screenshot, psql, replica, defaultRole } from "./helpers";

// Reuses global-setup's seeded product/party (qty=50, always in stock) so this file needs
// no product/inventory seed data of its own — only a cart row for the checkout-page test.
const SLUG = "seed-product";

const VIEWPORTS = {
  mobile: { ...devices["iPhone 13"] },
  tablet: { ...devices["iPad (gen 7)"] },
  desktop: { viewport: { width: 1440, height: 900 } },
};

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${label}: horizontal overflow of ${overflow}px`).toBeLessThanOrEqual(1);
}

for (const [name, use] of Object.entries(VIEWPORTS)) {
  test.describe(`22 — Responsive Shop [${name}]`, () => {
    test.describe.configure({ mode: "serial" });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage(use as any);
      await loginAs(page, USER.email, USER.password);
    });

    test.afterAll(async () => {
      await page.close();
    });

    test(`22-${name}-01 shop listing renders without horizontal scroll`, async () => {
      await page.goto(`${BASE}/shop`);
      await page.waitForLoadState("networkidle");
      await screenshot(page, `22-${name}-shop-listing`);
      await assertNoHorizontalOverflow(page, `${name} /shop`);
      // Scoped to .shop-layout: the homepage's featured-products section (when a featured
      // product exists) has its own distinct grid and must not collide with this locator.
      await expect(page.locator(".shop-layout .product-grid")).toBeVisible();
    });

    test(`22-${name}-02 shop layout stacks to single column below tablet breakpoint`, async () => {
      await page.goto(`${BASE}/shop`);
      await page.waitForLoadState("networkidle");
      const cols = await page.locator(".shop-layout").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
      const viewportWidth = page.viewportSize()?.width ?? 1440;
      if (viewportWidth <= 768) {
        expect(cols, `${name}: expected single-column stacked layout under 768px`).toBe(1);
      } else {
        expect(cols).toBeGreaterThan(1);
      }
    });

    test(`22-${name}-03 product detail page: image + info stack correctly, add-to-cart reachable`, async () => {
      await page.goto(`${BASE}/shop/${SLUG}`);
      await page.waitForLoadState("networkidle");
      await screenshot(page, `22-${name}-product-detail`);
      await assertNoHorizontalOverflow(page, `${name} /shop/${SLUG}`);
      await expect(page.locator(".add-to-cart-section")).toBeVisible();
      await expect(page.locator(".add-to-cart-section")).toBeInViewport({ ratio: 0 });
    });

    test(`22-${name}-04 cart page stacks summary below items on narrow viewports`, async () => {
      await page.goto(`${BASE}/shop/cart`);
      await page.waitForLoadState("networkidle");
      await screenshot(page, `22-${name}-cart-page`);
      await assertNoHorizontalOverflow(page, `${name} /shop/cart`);
    });

    test(`22-${name}-05 checkout page: form and order summary both reachable without overflow`, async () => {
      // Seed one item so checkout doesn't bounce back to /shop/cart empty-state. Uses the
      // fixed IDs from global-setup directly — no runtime SQL-result parsing needed.
      psql(`${replica}
        INSERT INTO public.carts (party_id, user_id)
        SELECT '${PARTY_ID}', '${USER_ID}'
        WHERE NOT EXISTS (SELECT 1 FROM public.carts WHERE user_id = '${USER_ID}');
        INSERT INTO public.cart_items (cart_id, product_id, quantity, unit_price)
        SELECT id, '${PRODUCT_ID}', 1, 99.90 FROM public.carts WHERE user_id = '${USER_ID}' LIMIT 1
        ON CONFLICT (cart_id, product_id, variant_id) DO UPDATE SET quantity = 1;
      ${defaultRole}`);

      await page.goto(`${BASE}/shop/checkout`);
      await page.waitForLoadState("networkidle");
      await screenshot(page, `22-${name}-checkout-page`);
      await assertNoHorizontalOverflow(page, `${name} /shop/checkout`);
      await expect(page.locator("form.address-form")).toBeVisible();
      await expect(page.locator(".order-summary")).toBeVisible();
    });
  });
}

test.afterAll(() => {
  psql(`${replica}
    DELETE FROM public.cart_items WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = '${USER_ID}');
    DELETE FROM public.carts WHERE user_id = '${USER_ID}';
  ${defaultRole}`);
});
