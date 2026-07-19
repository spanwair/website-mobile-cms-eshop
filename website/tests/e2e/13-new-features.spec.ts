import { test, expect, type Browser } from "@playwright/test";
import path from "path";
import fs from "fs";
import { BASE, ADMIN, ESHOP, OWNER, PRODUCT_ID, CATEGORY_ID, login, loginAs, screenshot } from "./helpers";

// One tiny 1x1 PNG written to disk once, reused for all image upload tests.
const FIXTURES_DIR = path.join(process.cwd(), "tests", "fixtures");
const TEST_IMAGE = path.join(FIXTURES_DIR, "test-image.png");

function ensureTestImage() {
  if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  if (!fs.existsSync(TEST_IMAGE)) {
    // Minimal 1x1 grey PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(TEST_IMAGE, png);
  }
}

// ── 13a: Categories on Products ───────────────────────────────────────────────

test.describe("13a — Categories on Products", () => {
  test.describe.configure({ mode: "serial" });

  let page: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    page.on("dialog", (d) => d.accept());
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("13a-01 product edit page shows category checkboxes", async () => {
    await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "13a-01-product-with-categories");
    const grid = page.locator(".checkbox-grid");
    await expect(grid).toBeVisible();
    const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
    await expect(catCheckbox).toBeVisible();
  });

  test("13a-02 seed category starts unchecked", async () => {
    const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
    await expect(catCheckbox).not.toBeChecked();
  });

  test("13a-03 assign category and save", async () => {
    const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
    await catCheckbox.check();
    await screenshot(page, "13a-03-category-checked");
    await page.locator("form.product-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
  });

  test("13a-04 category assignment persists after reload", async () => {
    await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "13a-04-category-persisted");
    const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
    await expect(catCheckbox).toBeChecked();
  });

  test("13a-05 unassign category and save", async () => {
    const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
    await catCheckbox.uncheck();
    await page.locator("form.product-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
  });

  test("13a-06 unassignment persists after reload", async () => {
    await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "13a-06-category-unchecked");
    const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
    await expect(catCheckbox).not.toBeChecked();
  });
});

// ── 13b: Product Image Uploads ────────────────────────────────────────────────

test.describe("13b — Product Image Uploads", () => {
  test.describe.configure({ mode: "serial" });

  let page: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    ensureTestImage();
    page = await browser.newPage();
    page.on("dialog", (d) => d.accept());
    await login(page);
    await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
    await page.waitForLoadState("networkidle");
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("13b-01 upload form is visible on product page", async () => {
    await screenshot(page, "13b-01-upload-form");
    const uploadForm = page.locator("form.upload-form").first();
    await expect(uploadForm).toBeVisible();
    // File input is hidden by CSS (triggered via button) — check the submit button instead
    await expect(uploadForm.locator("button[type='submit']")).toBeVisible();
  });

  test("13b-02 upload a product image", async () => {
    // The image upload form is the second form.upload-form (first is video upload)
    const imageForm = page.locator("form.upload-form").nth(1);
    const fileInput = imageForm.locator("input[type='file']");
    await fileInput.setInputFiles(TEST_IMAGE);
    await imageForm.locator("input[name='image_alt']").fill("E2E test image");
    await screenshot(page, "13b-02-file-selected");
    await imageForm.locator("button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/products/${PRODUCT_ID}`, { timeout: 20000 });
    await page.waitForLoadState("networkidle");
  });

  test("13b-03 uploaded image appears in gallery", async () => {
    await screenshot(page, "13b-03-image-in-gallery");
    // Image section is the second .media-card; .media-grid only renders when images exist
    const imageSection = page.locator(".media-card").nth(1);
    const imageGrid = imageSection.locator(".media-grid");
    await expect(imageGrid).toBeVisible();
    await expect(imageGrid.locator(".media-item").first()).toBeVisible();
  });

  test("13b-04 first image is not primary (shows Set Primary button)", async () => {
    const imageSection = page.locator(".media-card").nth(1);
    // Set Primary button uses btn-secondary class; Delete uses btn-danger
    const setPrimaryBtn = imageSection.locator(".media-item .btn-secondary").first();
    await expect(setPrimaryBtn).toBeVisible();
    // No primary badge yet
    await expect(imageSection.locator(".primary-badge")).not.toBeVisible();
  });

  test("13b-05 set image as primary", async () => {
    const imageSection = page.locator(".media-card").nth(1);
    await imageSection.locator(".media-item .btn-secondary").first().click();
    await page.waitForURL(`${BASE}/admin/products/${PRODUCT_ID}`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await screenshot(page, "13b-05-primary-set");
    const imageSection2 = page.locator(".media-card").nth(1);
    await expect(imageSection2.locator(".primary-badge").first()).toBeVisible();
    // The first image (now primary) no longer shows Set Primary button
    // (other images from previous runs may still show it — check only first item)
    await expect(imageSection2.locator(".media-item").first().locator(".btn-secondary")).not.toBeVisible();
  });

  test("13b-06 delete the image", async () => {
    const imageSection = page.locator(".media-card").nth(1);
    const imagesBefore = await imageSection.locator(".media-item").count();
    // Delete the primary image (the first item we set as primary in 13b-05)
    await imageSection.locator(".media-item").first().locator(".btn-danger").click();
    await page.waitForURL(`${BASE}/admin/products/${PRODUCT_ID}`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await screenshot(page, "13b-06-image-deleted");
    const imageSection2 = page.locator(".media-card").nth(1);
    const imagesAfter = await imageSection2.locator(".media-item").count();
    expect(imagesAfter).toBe(imagesBefore - 1);
  });

  test("13b-07 primary image was deleted — no primary badge remains", async () => {
    // After deleting the primary image, no item in the gallery should have .primary-badge
    // (other images from previous runs may still exist, so .media-grid may still be visible)
    const imageSection = page.locator(".media-card").nth(1);
    await expect(imageSection.locator(".primary-badge")).not.toBeVisible();
    // Upload form still present
    await expect(page.locator("form.upload-form")).toBeVisible();
  });
});

// ── 13c: User Hierarchy Visibility ───────────────────────────────────────────

test.describe("13c — User Hierarchy Visibility", () => {
  test.describe.configure({ mode: "serial" });

  let page: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("13c-01 OWNER sees all users", async () => {
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "13c-01-owner-sees-all");
    await expect(page.locator("tr").filter({ hasText: "admin@test.com" })).toBeVisible();
    await expect(page.locator("tr").filter({ hasText: "eshop@test.com" })).toBeVisible();
    await expect(page.locator("tr").filter({ hasText: "user@test.com" })).toBeVisible();
  });

  test("13c-02 ESHOP_ADMIN does not see OWNER", async () => {
    await page.context().clearCookies();
    await loginAs(page, ESHOP.email, ESHOP.password);
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "13c-02-eshop-users");
    const adminRow = page.locator("tr").filter({ hasText: "admin@test.com" });
    await expect(adminRow).not.toBeVisible();
  });

  test("13c-03 ESHOP_ADMIN sees own account", async () => {
    const eshopRow = page.locator("tr").filter({ hasText: "eshop@test.com" });
    await expect(eshopRow).toBeVisible();
    await screenshot(page, "13c-03-eshop-sees-self");
  });

  test("13c-04 ESHOP_ADMIN does not see USER outside their party", async () => {
    // user@test.com has no party membership → eshop should not see them
    const userRow = page.locator("tr").filter({ hasText: "user@test.com" });
    await expect(userRow).not.toBeVisible();
    await screenshot(page, "13c-04-eshop-no-outside-user");
  });
});
