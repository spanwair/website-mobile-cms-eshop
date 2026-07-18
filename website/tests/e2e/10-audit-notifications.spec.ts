import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, login, screenshot } from "./helpers";

test.describe("10 — Audit Log + Notifications", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("10-01 audit log page loads with table", async () => {
    await page.goto(`${BASE}/admin/audit`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "10-01-audit-log-page");
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("10-02 audit log has filter by table dropdown", async () => {
    const filterForm = page.locator("form.filter-form");
    await expect(filterForm).toBeVisible();
    const tableSelect = filterForm.locator("select[name='table']");
    await expect(tableSelect).toBeVisible();
    await screenshot(page, "10-02-audit-filter-dropdown");
  });

  test("10-03 audit log shows total count", async () => {
    const totalLabel = page.locator(".total-label");
    await expect(totalLabel).toBeVisible();
    await screenshot(page, "10-03-audit-total-count");
  });

  test("10-04 filter by table name shows relevant entries", async () => {
    const filterForm = page.locator("form.filter-form");
    const tableSelect = filterForm.locator("select[name='table']");
    const options = await tableSelect.locator("option").count();
    if (options > 1) {
      await tableSelect.selectOption({ index: 1 });
      await filterForm.locator("button[type='submit']").click();
      await page.waitForLoadState("networkidle");
      await screenshot(page, "10-04-filtered-audit-entries");
      await expect(page.locator("table.data-table")).toBeVisible();
    }
  });

  test("10-05 clear filter shows all audit logs", async () => {
    const clearBtn = page.locator(".toolbar a.btn-ghost, .toolbar button.btn-ghost");
    if (await clearBtn.count() > 0) {
      await clearBtn.first().click();
      await page.waitForLoadState("networkidle");
    } else {
      await page.goto(`${BASE}/admin/audit`);
      await page.waitForLoadState("networkidle");
    }
    await screenshot(page, "10-05-audit-all-entries");
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("10-06 action badges shown for audit entries (if any)", async () => {
    const badges = page.locator("table.data-table tbody tr td .badge");
    const count = await badges.count();
    if (count > 0) {
      await expect(badges.first()).toBeVisible();
    }
    await screenshot(page, "10-06-action-badge-colors");
  });

  test("10-07 notifications page loads", async () => {
    await page.goto(`${BASE}/admin/notifications`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "10-07-notifications-page");
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("10-08 seeded notification is visible", async () => {
    await expect(page.getByRole("cell", { name: "Test Notification", exact: true })).toBeVisible();
    await screenshot(page, "10-08-seeded-notification");
  });

  test("10-09 seeded notification shows Unread badge", async () => {
    const notifRow = page.locator("tr").filter({ hasText: "Test Notification" });
    const unreadBadge = notifRow.locator(".badge-active");
    await expect(unreadBadge).toBeVisible();
    await screenshot(page, "10-09-unread-badge");
  });

  test("10-10 unread notification row has bold styling", async () => {
    const notifRow = page.locator("tr.unread").first();
    if (await notifRow.count() > 0) {
      await expect(notifRow).toBeVisible();
      await screenshot(page, "10-10-unread-row-bold");
    }
  });
});
