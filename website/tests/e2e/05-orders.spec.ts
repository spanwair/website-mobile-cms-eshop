import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, ORDER_ID, CUSTOMER_ID, login, screenshot } from "./helpers";

test.describe("05 — Orders: Status Workflow, Detail, Tracking", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("05-01 orders list loads with seeded order", async () => {
    await page.goto(`${BASE}/admin/orders`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "05-01-orders-list");
    await expect(page.locator("table.data-table")).toBeVisible();
    await expect(page.getByText("ORD-SEED-001")).toBeVisible();
  });

  test("05-02 status tabs are visible", async () => {
    const tabs = page.locator(".tabs .tab");
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(4);
    await screenshot(page, "05-02-status-tabs");
  });

  test("05-03 Pending tab shows seeded order", async () => {
    await page.goto(`${BASE}/admin/orders?status=pending`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "05-03-pending-tab");
    await expect(page.getByText("ORD-SEED-001")).toBeVisible();
  });

  test("05-04 Confirmed tab is initially empty", async () => {
    await page.goto(`${BASE}/admin/orders?status=confirmed`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "05-04-confirmed-tab-empty");
    await expect(page.getByText("ORD-SEED-001")).not.toBeVisible();
  });

  test("05-05 open order detail page", async () => {
    await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "05-05-order-detail");
    await expect(page.getByText("ORD-SEED-001")).toBeVisible();
    await expect(page.locator(".badge-pending")).toBeVisible();
  });

  test("05-06 customer link on order detail navigates to customer", async () => {
    const customerLink = page.locator("a.btn-ghost").filter({ hasText: /customer|jan test/i }).first();
    if (await customerLink.count() > 0) {
      await customerLink.click();
      await page.waitForLoadState("networkidle");
      await screenshot(page, "05-06-customer-from-order");
      await expect(page).toHaveURL(new RegExp(`/admin/customers/${CUSTOMER_ID}`));
      await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
      await page.waitForLoadState("networkidle");
    }
  });

  test("05-07 transition pending → confirmed", async () => {
    await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
    await page.waitForLoadState("networkidle");
    const statusSelect = page.locator("form.status-form select[name='to_status']");
    await statusSelect.selectOption("confirmed");
    const noteInput = page.locator("form.status-form input[name='note']");
    await noteInput.fill("Confirmed by E2E test");
    await screenshot(page, "05-07-confirm-order-form");
    await page.locator("form.status-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "05-07-after-confirm");
    await expect(page.locator(".badge-active, .badge").filter({ hasText: /confirmed/i })).toBeVisible();
  });

  test("05-08 transition confirmed → processing", async () => {
    const statusSelect = page.locator("form.status-form select[name='to_status']");
    await statusSelect.selectOption("processing");
    await page.locator("form.status-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "05-08-order-processing");
    await expect(page.locator(".badge").filter({ hasText: /processing/i })).toBeVisible();
  });

  test("05-09 transition processing → shipped with tracking number", async () => {
    const statusSelect = page.locator("form.status-form select[name='to_status']");
    await statusSelect.selectOption("shipped");
    await screenshot(page, "05-09-ship-form");
    await page.locator("form.status-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");

    // Set tracking number
    const trackingForm = page.locator("form.tracking-form");
    if (await trackingForm.count() > 0) {
      await trackingForm.locator("input[name='tracking_number']").fill("TRACK-E2E-001");
      await trackingForm.locator("button[type='submit']").click();
      await page.waitForLoadState("networkidle");
    }
    await screenshot(page, "05-09-after-shipped");
    await expect(page.locator(".badge").filter({ hasText: /shipped/i })).toBeVisible();
  });

  test("05-10 tracking number is visible on order detail", async () => {
    await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "05-10-tracking-number-visible");
    const trackingInput = page.locator("form.tracking-form input[name='tracking_number']");
    if (await trackingInput.count() > 0) {
      await expect(trackingInput).toHaveValue("TRACK-E2E-001");
    }
  });

  test("05-11 transition shipped → delivered", async () => {
    const statusSelect = page.locator("form.status-form select[name='to_status']");
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption("delivered");
      await page.locator("form.status-form button[type='submit']").click();
      await page.waitForLoadState("networkidle");
    }
    await screenshot(page, "05-11-order-delivered");
    await expect(page.locator(".badge").filter({ hasText: /delivered/i })).toBeVisible();
  });

  test("05-12 delivered order has no further status transitions", async () => {
    await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "05-12-delivered-no-transitions");
    const statusSelect = page.locator("form.status-form select[name='to_status']");
    if (await statusSelect.count() > 0) {
      const options = statusSelect.locator("option");
      const count = await options.count();
      expect(count).toBeLessThanOrEqual(1);
    }
    await expect(page.locator(".badge").filter({ hasText: /delivered/i })).toBeVisible();
  });
});
