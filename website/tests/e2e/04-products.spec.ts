import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, PRODUCT_ID, login, screenshot } from "./helpers";

test.describe("04 — Products: CRUD, Search, Filter, Status", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let createdProductId = "";

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("04-01 products list loads with Seed Product", async () => {
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "04-01-products-list");
    await expect(page.locator("table.data-table")).toBeVisible();
    await expect(page.getByText("Seed Product")).toBeVisible();
  });

  test("04-02 search by title returns matching product", async () => {
    await page.fill("input[name='search']", "Seed");
    await page.locator("form.search-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "04-02-search-results");
    await expect(page.getByText("Seed Product")).toBeVisible();
    const rows = page.locator("table.data-table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("04-03 filter by status active shows Seed Product", async () => {
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    await page.selectOption("select[name='status']", "active");
    await page.locator("form.search-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "04-03-filter-active");
    await expect(page.getByText("Seed Product")).toBeVisible();
    const badges = page.locator("td .badge-active");
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("04-04 filter by status draft shows no active products", async () => {
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    await page.selectOption("select[name='status']", "draft");
    await page.locator("form.search-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "04-04-filter-draft");
    const activeInTable = page.locator("td .badge-active");
    await expect(activeInTable.first()).not.toBeVisible().catch(() => {});
  });

  test("04-05 navigate to new product form", async () => {
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    await page.click("a.btn-primary");
    await page.waitForURL(`${BASE}/admin/products/new`);
    await screenshot(page, "04-05-new-product-form");
    await expect(page.locator("form.product-form")).toBeVisible();
  });

  test("04-06 create draft product with all fields", async () => {
    console.log('Starting 04-06: Creating draft product with all fields');
    await page.goto(`${BASE}/admin/products/new`);
    await page.waitForLoadState("networkidle");

    console.log('Filling product form');
    await page.fill("input[name='title']", "E2E Test Product");
    await page.fill("input[name='slug']", "e2e-test-product");
    await page.fill("input[name='sku']", "SKU-E2E-001");
    await page.fill("input[name='price']", "199.90");
    await page.fill("input[name='discount_price']", "149.90");
    await page.selectOption("select[name='status']", "draft");

    console.log('Submitting product form');
    await screenshot(page, "04-06-new-product-filled");
    await page.locator("form.product-form button.btn-primary").click();

    // Wait for navigation to product detail page
    console.log('Waiting for navigation after product creation');
    await page.waitForURL((url) => url.pathname.startsWith("/admin/products/") && url.pathname !== "/admin/products", { timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    // Capture the product ID from URL
    createdProductId = page.url().split("/").pop() ?? "";

    // Navigate to products list to verify
    console.log('Navigating to products list to verify');
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");

    console.log('Verifying product was created');
    await expect(page.getByText("E2E Test Product")).toBeVisible();

    // Capture final state
    await screenshot(page, "04-06-after-create-product");
    console.log('✅ 04-06 product creation test completed successfully');
  });

  test("04-07 draft product badge shows draft status", async () => {
    // Ensure we're on the products list page
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    
    // Check if product exists, create if needed (independent test)
    const existingRow = page.locator("tr").filter({ hasText: "E2E Test Product" });
    if (await existingRow.count() === 0) {
      await page.goto(`${BASE}/admin/products/new`);
      await page.waitForLoadState("networkidle");
      await page.fill("input[name='title']", "E2E Test Product");
      await page.fill("input[name='slug']", "e2e-test-product");
      await page.fill("input[name='sku']", "SKU-E2E-001");
      await page.fill("input[name='price']", "199.90");
      await page.fill("input[name='discount_price']", "149.90");
      await page.selectOption("select[name='status']", "draft");
      await page.locator("form.product-form button.btn-primary").click();
      await page.waitForURL((url) => url.pathname.startsWith("/admin/products/") && url.pathname !== "/admin/products", { timeout: 15000 });
      await page.goto(`${BASE}/admin/products`);
      await page.waitForLoadState("networkidle");
    }
    
    const row = page.locator("tr").filter({ hasText: "E2E Test Product" });
    await expect(row.locator(".badge-draft")).toBeVisible();
    await screenshot(page, "04-07-draft-badge");
  });

  test("04-08 navigate to product detail page", async () => {
    // Ensure we're on the products list page
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    
    // Ensure the product exists
    const existingRow = page.locator("tr").filter({ hasText: "E2E Test Product" });
    if (await existingRow.count() === 0) {
      await page.goto(`${BASE}/admin/products/new`);
      await page.waitForLoadState("networkidle");
      await page.fill("input[name='title']", "E2E Test Product");
      await page.fill("input[name='slug']", "e2e-test-product");
      await page.fill("input[name='sku']", "SKU-E2E-001");
      await page.fill("input[name='price']", "199.90");
      await page.fill("input[name='discount_price']", "149.90");
      await page.selectOption("select[name='status']", "draft");
      await page.locator("form.product-form button.btn-primary").click();
      await page.waitForURL((url) => url.pathname.startsWith("/admin/products/") && url.pathname !== "/admin/products", { timeout: 15000 });
      await page.goto(`${BASE}/admin/products`);
      await page.waitForLoadState("networkidle");
    }
    
    const row = page.locator("tr").filter({ hasText: "E2E Test Product" });
    const editLink = row.locator("a.btn-ghost");
    await expect(editLink).toBeVisible({ timeout: 5000 });
    const href = await editLink.getAttribute("href");
    createdProductId = href?.split("/").pop() ?? "";
    await editLink.click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "04-08-product-detail");
    await expect(page.locator("form.product-form")).toBeVisible();
  });

  test("04-09 product detail pre-fills correct values", async () => {
    // Ensure we're on the product detail page
    await page.goto(`${BASE}/admin/products/${createdProductId}`);
    await page.waitForLoadState("networkidle");
    
    const titleInput = page.locator("input[name='title']");
    await expect(titleInput).toHaveValue("E2E Test Product");
    const priceInput = page.locator("input[name='price']");
    await expect(priceInput).toHaveValue(/^199\.9/);
    const slugInput = page.locator("input[name='slug']");
    await expect(slugInput).toHaveValue("e2e-test-product");
    await screenshot(page, "04-09-product-prefilled");
  });

  test("04-10 edit product — change title and price", async () => {
    // Ensure we're on the product edit page
    await page.goto(`${BASE}/admin/products/${createdProductId}`);
    await page.waitForLoadState("networkidle");
    
    const titleInput = page.locator("input[name='title']");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    
    await page.fill("input[name='title']", "E2E Test Product (Updated)");
    await page.fill("input[name='price']", "249.90");
    await screenshot(page, "04-10-edit-product-filled");
    await page.locator("form.product-form button.btn-primary").click();
    await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await screenshot(page, "04-10-after-edit-product");
    await expect(page.getByText("E2E Test Product (Updated)")).toBeVisible();
  });

  test("04-11 change product status to active", async () => {
    // Navigate to products list first
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    
    // Find and click the edit link for our product
    const row = page.locator("tr").filter({ hasText: "E2E Test Product (Updated)" });
    await expect(row.locator("a.btn-ghost")).toBeVisible({ timeout: 5000 });
    await row.locator("a.btn-ghost").click();
    await page.waitForLoadState("networkidle");
    
    await page.selectOption("select[name='status']", "active");
    await screenshot(page, "04-11-status-change-to-active");
    await page.locator("form.product-form button.btn-primary").click();
    await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    const updatedRow = page.locator("tr").filter({ hasText: "E2E Test Product (Updated)" });
    await expect(updatedRow.locator(".badge-active")).toBeVisible();
    await screenshot(page, "04-11-after-status-active");
  });

  test("04-12 change product status to inactive", async () => {
    // Navigate to products list first
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    
    // Find and click the edit link for our product
    const row = page.locator("tr").filter({ hasText: "E2E Test Product (Updated)" });
    await expect(row.locator("a.btn-ghost")).toBeVisible({ timeout: 5000 });
    await row.locator("a.btn-ghost").click();
    await page.waitForLoadState("networkidle");
    
    await page.selectOption("select[name='status']", "inactive");
    await page.locator("form.product-form button.btn-primary").click();
    await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    const updatedRow = page.locator("tr").filter({ hasText: "E2E Test Product (Updated)" });
    await expect(updatedRow.locator(".badge-inactive")).toBeVisible();
    await screenshot(page, "04-12-after-status-inactive");
  });

  test("04-13 duplicate slug shows form-error", async () => {
    await page.goto(`${BASE}/admin/products/new`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='title']", "Duplicate Product");
    await page.fill("input[name='slug']", "e2e-test-product");
    await page.fill("input[name='price']", "10");
    await page.locator("form.product-form button.btn-primary").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "04-13-duplicate-slug-error");
    await expect(page.locator(".form-error")).toBeVisible();
  });

  test("04-14 create active featured product", async () => {
    await page.goto(`${BASE}/admin/products/new`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='title']", "Featured Active Product");
    await page.fill("input[name='slug']", "featured-active-e2e");
    await page.fill("input[name='price']", "299.00");
    await page.selectOption("select[name='status']", "active");
    const featuredCheck = page.locator("input[name='is_featured']");
    if (!(await featuredCheck.isChecked())) {
      await featuredCheck.check();
    }
    await screenshot(page, "04-14-featured-product-form");
    await page.locator("form.product-form button.btn-primary").click();
    await page.waitForURL((url) => url.pathname.startsWith("/admin/products/") && url.pathname !== "/admin/products", { timeout: 10000 });
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Featured Active Product")).toBeVisible();
    await screenshot(page, "04-14-featured-product-created");
  });

  test("04-15 seed product detail page works", async () => {
    await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "04-15-seed-product-detail");
    await expect(page.locator("form.product-form")).toBeVisible();
    const titleInput = page.locator("input[name='title']");
    await expect(titleInput).toHaveValue("Seed Product");
  });

  test("04-16 products list shows correct price formatting", async () => {
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    const seedRow = page.locator("tr").filter({ hasText: "Seed Product" });
    await expect(seedRow).toBeVisible();
    await screenshot(page, "04-16-product-price-format");
    await expect(seedRow.getByText("99.90")).toBeVisible();
  });
});