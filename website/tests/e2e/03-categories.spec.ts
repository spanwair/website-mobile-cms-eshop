import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, login, screenshot } from "./helpers";

test.describe("03 — Categories: CRUD + Tree Hierarchy", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let electronicsId = "";

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    page.on("dialog", (d) => d.accept());
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("03-01 categories list page loads", async () => {
    await page.goto(`${BASE}/admin/categories`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "03-01-categories-list");
    await expect(page.locator("table.data-table")).toBeVisible();
    await expect(page.locator(".toolbar a.btn-primary")).toBeVisible();
  });

  test("03-02 create root category Electronics", async () => {
    await page.click(".toolbar a.btn-primary");
    await page.waitForURL(`${BASE}/admin/categories/new`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='name']", "Electronics");
    await page.fill("input[name='slug']", "electronics-e2e");
    await screenshot(page, "03-02-create-category-filled");
    await page.locator("form.cat-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/categories`, { timeout: 10000 });
    await screenshot(page, "03-02-after-create-electronics");
    await expect(page.getByText("Electronics")).toBeVisible();
  });

  test("03-03 Electronics shows in categories tree as root", async () => {
    const row = page.locator("tr").filter({ hasText: "Electronics" });
    await expect(row).toBeVisible();
    await screenshot(page, "03-03-electronics-in-tree");
    // Root category should have 0 children
    const childCount = row.locator("td").nth(2);
    await expect(childCount).toHaveText("0");
  });

  test("03-04 create child category Phones under Electronics", async () => {
    // Get the Electronics row edit link to find its ID
    const editLink = page.locator("tr").filter({ hasText: "Electronics" }).locator("a.btn-ghost");
    const href = await editLink.getAttribute("href");
    electronicsId = href?.split("/").pop() ?? "";

    await page.click(".toolbar a.btn-primary");
    await page.waitForURL(`${BASE}/admin/categories/new`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='name']", "Phones");
    await page.fill("input[name='slug']", "phones-e2e");

    const parentSelect = page.locator("select[name='parent_id']");
    if (await parentSelect.locator("option").count() > 1) {
      await parentSelect.selectOption({ label: "Electronics" });
    }
    await screenshot(page, "03-04-create-phones-filled");
    await page.locator("form.cat-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/categories`, { timeout: 10000 });
    await screenshot(page, "03-04-after-create-phones");
    await expect(page.getByText("Phones")).toBeVisible();
  });

  test("03-05 child category shows indented under Electronics", async () => {
    await page.goto(`${BASE}/admin/categories`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "03-05-category-hierarchy");
    // Electronics should now have 1 child
    const elRow = page.locator("tr").filter({ hasText: "Electronics" });
    await expect(elRow).toBeVisible();
    await expect(page.getByText("Phones")).toBeVisible();
    // Phones row should contain the tree indent marker
    const phonesRow = page.locator("tr").filter({ hasText: "Phones" });
    await expect(phonesRow.locator(".tree-indent")).toBeVisible();
  });

  test("03-06 create category with icon field", async () => {
    await page.click(".toolbar a.btn-primary");
    await page.waitForURL(`${BASE}/admin/categories/new`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='name']", "Accessories");
    await page.fill("input[name='slug']", "accessories-e2e");
    await page.fill("input[name='icon']", "🎧");
    await page.fill("input[name='sort_order']", "5");
    await screenshot(page, "03-06-category-with-icon");
    await page.locator("form.cat-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/categories`, { timeout: 10000 });
    await expect(page.getByText("Accessories")).toBeVisible();
    await screenshot(page, "03-06-accessories-in-list");
  });

  test("03-07 edit a category — change name", async () => {
    const editLink = page.locator("tr").filter({ hasText: "Accessories" }).locator("a.btn-ghost");
    await editLink.click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "03-07-edit-category-form");
    await page.fill("input[name='name']", "Accessories Updated");
    await screenshot(page, "03-07-edit-filled");
    await page.locator("form.cat-form button.btn-primary").click();
    await page.waitForURL(`${BASE}/admin/categories`, { timeout: 10000 });
    await screenshot(page, "03-07-after-edit");
    await expect(page.getByText("Accessories Updated")).toBeVisible();
  });

  test("03-08 duplicate slug shows form-error", async () => {
    await page.click(".toolbar a.btn-primary");
    await page.waitForURL(`${BASE}/admin/categories/new`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='name']", "Duplicate");
    await page.fill("input[name='slug']", "electronics-e2e");
    await page.locator("form.cat-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "03-08-duplicate-slug-error");
    await expect(page.locator(".form-error")).toBeVisible();
  });

  test("03-09 delete leaf category Phones", async () => {
    await page.goto(`${BASE}/admin/categories`);
    await page.waitForLoadState("networkidle");
    const phonesRow = page.locator("tr").filter({ hasText: "Phones" });
    await expect(phonesRow).toBeVisible();
    await phonesRow.locator("button.btn-danger").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "03-09-after-delete-phones");
    await expect(page.locator("tr").filter({ hasText: "Phones" })).not.toBeVisible();
  });

  test("03-10 delete root category Electronics", async () => {
    const elRow = page.locator("tr").filter({ hasText: "Electronics" });
    await expect(elRow).toBeVisible();
    await elRow.locator("button.btn-danger").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "03-10-after-delete-electronics");
    await expect(page.locator("tr").filter({ hasText: "Electronics" })).not.toBeVisible();
  });
});
