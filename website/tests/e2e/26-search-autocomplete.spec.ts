/**
 * 26 — nav search dropdown (live autocomplete)
 *
 * Covers the new /api/search endpoint + StorefrontNav dropdown:
 *   - typing a partial title shows matching products (image, price, stock) and category chips
 *   - unrelated products are excluded
 *   - clicking a result navigates to the product detail page
 *   - party scoping: /eshop-{slug} search never leaks another org's products
 */
import { test, expect, type Page } from "@playwright/test";
import { BASE, PARTY_ID, PARTY2_ID, WAREHOUSE_ID, USER, loginAs, screenshot, psql, replica, defaultRole, CATEGORY_ID } from "./helpers";

const ALPHA = { id: "c9000001-0000-0000-0000-000000000001", slug: "e2e-search-widget-alpha", title: "E2E Search Widget Alpha", price: 19.99 };
const BETA = { id: "c9000001-0000-0000-0000-000000000002", slug: "e2e-search-widget-beta", title: "E2E Search Widget Beta", price: 29.99 };
const UNRELATED = { id: "c9000001-0000-0000-0000-000000000003", slug: "e2e-totally-different-gadget", title: "E2E Totally Different Gadget", price: 9.99 };
const GAMMA = { id: "c9000001-0000-0000-0000-000000000004", slug: "e2e-search-widget-gamma", title: "E2E Search Widget Gamma", price: 39.99 };

const IMG_ALPHA = "c9000002-0000-0000-0000-000000000001";
const INV_ALPHA = "c9000003-0000-0000-0000-000000000001";
const INV_BETA = "c9000003-0000-0000-0000-000000000002";

function seed() {
  psql(`${replica}
    -- Other specs (14, 25) assume PARTY2_ID/"other-organisation" already exists but nothing
    -- in global-setup creates it — seed it idempotently here rather than depending on run order.
    INSERT INTO public.parties (id, name, slug, company_name, vat_number, billing_email, status)
    VALUES ('${PARTY2_ID}', 'Other Organisation', 'other-organisation', 'Other Org s.r.o.', 'CZ87654321', 'billing@otherorg.com', 'active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku)
    VALUES
      ('${ALPHA.id}', '${PARTY_ID}', '${ALPHA.title}', '${ALPHA.slug}', ${ALPHA.price}, 'active', true, 'SKU-${ALPHA.slug}'),
      ('${BETA.id}', '${PARTY_ID}', '${BETA.title}', '${BETA.slug}', ${BETA.price}, 'active', true, 'SKU-${BETA.slug}'),
      ('${UNRELATED.id}', '${PARTY_ID}', '${UNRELATED.title}', '${UNRELATED.slug}', ${UNRELATED.price}, 'active', true, 'SKU-${UNRELATED.slug}'),
      ('${GAMMA.id}', '${PARTY2_ID}', '${GAMMA.title}', '${GAMMA.slug}', ${GAMMA.price}, 'active', true, 'SKU-${GAMMA.slug}');

    INSERT INTO public.product_categories (product_id, category_id)
    VALUES ('${ALPHA.id}', '${CATEGORY_ID}'), ('${BETA.id}', '${CATEGORY_ID}');

    INSERT INTO public.product_images (id, product_id, url, is_primary)
    VALUES ('${IMG_ALPHA}', '${ALPHA.id}', 'https://placehold.co/64x64', true);

    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory)
    VALUES
      ('${INV_ALPHA}', '${PARTY_ID}', '${ALPHA.id}', '${WAREHOUSE_ID}', 10, 0, 5, true),
      ('${INV_BETA}', '${PARTY_ID}', '${BETA.id}', '${WAREHOUSE_ID}', 0, 0, 5, true);
  ${defaultRole}`);
}

function cleanup() {
  psql(`${replica}
    DELETE FROM public.inventory_items WHERE id IN ('${INV_ALPHA}', '${INV_BETA}');
    DELETE FROM public.product_images WHERE id = '${IMG_ALPHA}';
    DELETE FROM public.product_categories WHERE product_id IN ('${ALPHA.id}', '${BETA.id}');
    DELETE FROM public.products WHERE id IN ('${ALPHA.id}', '${BETA.id}', '${UNRELATED.id}', '${GAMMA.id}');
  ${defaultRole}`);
}

async function search(page: Page, term: string) {
  const input = page.locator("#nav-search-input");
  await input.click();
  await input.fill(term);
  await expect(page.locator("#nav-search-dropdown")).not.toHaveAttribute("hidden", "", { timeout: 10000 });
  await page.waitForTimeout(400); // debounce (250ms) + fetch round-trip
}

test.describe("26 — nav search dropdown", () => {
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

  test("26-00 typing a partial title shows matching products with image, price and stock, and excludes unrelated products", async () => {
    await page.goto(`${BASE}/eshop-test-organisation`);
    await page.waitForLoadState("networkidle");
    await search(page, "Search Widget");
    await screenshot(page, "26-00-search-dropdown-results");

    const alphaRow = page.locator(".search-product", { hasText: ALPHA.title });
    await expect(alphaRow).toBeVisible();
    await expect(alphaRow.locator("img")).toHaveAttribute("src", /placehold/);
    await expect(alphaRow.locator(".search-product-price")).toContainText("19.99");
    await expect(alphaRow.locator(".search-stock--in")).toBeVisible();

    const betaRow = page.locator(".search-product", { hasText: BETA.title });
    await expect(betaRow).toBeVisible();
    await expect(betaRow.locator(".search-stock--out")).toBeVisible();

    await expect(page.locator(".search-product", { hasText: UNRELATED.title })).toHaveCount(0);
  });

  test("26-00b typing a category name shows a matching category chip", async () => {
    await page.goto(`${BASE}/eshop-test-organisation`);
    await page.waitForLoadState("networkidle");
    await search(page, "Test Categ");
    await expect(page.locator(".search-chip", { hasText: "Test Category" })).toBeVisible();
  });

  test("26-01 clicking a search result navigates to the product detail page", async () => {
    await page.goto(`${BASE}/eshop-test-organisation`);
    await page.waitForLoadState("networkidle");
    await search(page, "Search Widget Alpha");
    await page.locator(".search-product", { hasText: ALPHA.title }).click();
    await page.waitForURL(`${BASE}/eshop-test-organisation/${ALPHA.slug}`);
    await expect(page.getByRole("heading", { name: ALPHA.title })).toBeVisible();
  });

  test("26-02 the view-all link points at the full shop search results", async () => {
    await page.goto(`${BASE}/eshop-test-organisation`);
    await page.waitForLoadState("networkidle");
    await search(page, "Search Widget");
    const viewAll = page.locator("#search-viewall");
    await expect(viewAll).toBeVisible();
    await expect(viewAll).toHaveAttribute("href", /\/eshop-test-organisation\?q=Search(%20|\+)Widget/);
  });

  test("26-03 party scoping: /eshop-other-organisation search never shows test-organisation's products, and vice versa", async () => {
    await page.goto(`${BASE}/eshop-other-organisation`);
    await page.waitForLoadState("networkidle");
    await search(page, "Search Widget");
    await screenshot(page, "26-03-search-scoped-other-org");

    await expect(page.locator(".search-product", { hasText: GAMMA.title })).toBeVisible();
    await expect(page.locator(".search-product", { hasText: ALPHA.title })).toHaveCount(0);
    await expect(page.locator(".search-product", { hasText: BETA.title })).toHaveCount(0);
  });
});
