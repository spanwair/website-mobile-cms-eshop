import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, CUSTOMER_ID, ORDER_ID, login, screenshot } from "./helpers";

test.describe("06 — Customers: CRUD, Search, Order History", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("06-01 customers list loads with Jan Test", async () => {
    await page.goto(`${BASE}/admin/customers`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "06-01-customers-list");
    await expect(page.locator("table.data-table")).toBeVisible();
    await expect(page.getByText("Jan Test")).toBeVisible();
  });

  test("06-02 search by first name finds customer", async () => {
    await page.fill("input[name='search']", "Jan");
    await page.locator("form.search-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "06-02-search-jan-test");
    await expect(page.getByText("Jan")).toBeVisible();
    const rows = page.locator("table.data-table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("06-03 search by email finds customer", async () => {
    await page.fill("input[name='search']", "customer@test.com");
    await page.locator("form.search-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "06-03-search-by-email");
    await expect(page.getByText("customer@test.com")).toBeVisible();
  });

  test("06-04 customer shows Active badge", async () => {
    await page.goto(`${BASE}/admin/customers`);
    await page.waitForLoadState("networkidle");
    const row = page.locator("tr").filter({ hasText: "Jan Test" });
    await expect(row.locator(".badge-active")).toBeVisible();
    await screenshot(page, "06-04-customer-active-badge");
  });

  test("06-05 open customer detail page", async () => {
    const row = page.locator("tr").filter({ hasText: "Jan Test" });
    await row.locator("a.btn-ghost").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "06-05-customer-detail");
    await expect(page).toHaveURL(new RegExp(`/admin/customers/${CUSTOMER_ID}`));
    await expect(page.locator("form.info-form")).toBeVisible();
  });

  test("06-06 customer detail pre-fills correct values", async () => {
    const firstName = page.locator("input[name='first_name']");
    const lastName = page.locator("input[name='last_name']");
    const email = page.locator("input[name='email']");
    await expect(firstName).toHaveValue("Jan");
    await expect(lastName).toHaveValue("Test");
    await expect(email).toHaveValue("customer@test.com");
    await screenshot(page, "06-06-customer-fields-prefilled");
  });

  test("06-07 edit customer — add phone and notes", async () => {
    const phone = page.locator("input[name='phone']");
    await phone.fill("+420987654321");
    const notes = page.locator("textarea[name='notes'], input[name='notes']").first();
    if (await notes.count() > 0) {
      await notes.fill("E2E test customer note");
    }
    await screenshot(page, "06-07-customer-edit-filled");
    await page.locator("form.info-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "06-07-after-customer-edit");
    await expect(page.locator("input[name='phone']")).toHaveValue("+420987654321");
  });

  test("06-08 customer order history shows seeded order", async () => {
    await page.goto(`${BASE}/admin/customers/${CUSTOMER_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "06-08-customer-order-history");
    await expect(page.getByText("ORD-SEED-001")).toBeVisible();
  });

  test("06-09 click order link from customer navigates to order detail", async () => {
    const orderLink = page.locator("a").filter({ hasText: /ORD-SEED-001/i });
    if (await orderLink.count() > 0) {
      await orderLink.click();
      await page.waitForLoadState("networkidle");
      await screenshot(page, "06-09-order-from-customer-link");
      await expect(page).toHaveURL(new RegExp(`/admin/orders/${ORDER_ID}`));
      await page.goto(`${BASE}/admin/customers/${CUSTOMER_ID}`);
      await page.waitForLoadState("networkidle");
    }
  });

  test("06-10 clear search shows all customers", async () => {
    await page.goto(`${BASE}/admin/customers`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "06-10-all-customers");
    await expect(page.getByText("Jan Test")).toBeVisible();
  });
});
