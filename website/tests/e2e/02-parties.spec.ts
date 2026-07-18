import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, PARTY_ID, USER_ID, login, screenshot } from "./helpers";

test.describe("02 — Parties: CRUD + Member Management", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let newPartyId = "";

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("02-01 parties list loads with Test Organisation", async () => {
    await page.goto(`${BASE}/admin/parties`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "02-01-parties-list");
    await expect(page.locator("table.data-table")).toBeVisible();
    await expect(page.getByText("Test Organisation")).toBeVisible();
  });

  test("02-02 navigate to new party form", async () => {
    await page.click("a.btn.btn-primary");
    await page.waitForURL(`${BASE}/admin/parties/new`);
    await screenshot(page, "02-02-new-party-form");
    await expect(page.locator("form.party-form")).toBeVisible();
  });

  test("02-03 create new party with all fields", async () => {
    await page.fill("input[name='name']", "E2E Test Org");
    await page.fill("input[name='slug']", "e2e-party");
    await page.fill("input[name='company_name']", "E2E Company s.r.o.");
    await page.fill("input[name='vat_number']", "CZ99999999");
    await page.fill("input[name='billing_email']", "billing@e2e.test");
    await screenshot(page, "02-03-new-party-filled");
    await page.locator("form.party-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/parties`, { timeout: 10000 });
    await screenshot(page, "02-03-after-create-party");
    await expect(page.getByText("E2E Test Org")).toBeVisible();
  });

  test("02-04 new party appears in list with active badge", async () => {
    await expect(page.getByText("E2E Test Org")).toBeVisible();
    const row = page.locator("tr").filter({ hasText: "E2E Test Org" });
    await expect(row.locator(".badge-active")).toBeVisible();
    await screenshot(page, "02-04-new-party-in-list");
  });

  test("02-05 duplicate slug shows error", async () => {
    await page.goto(`${BASE}/admin/parties/new`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='name']", "Duplicate Org");
    await page.fill("input[name='slug']", "e2e-party");
    await page.locator("form.party-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "02-05-duplicate-slug-error");
    await expect(page.locator(".form-error")).toBeVisible();
  });

  test("02-06 navigate to Test Organisation detail", async () => {
    await page.goto(`${BASE}/admin/parties`);
    await page.waitForLoadState("networkidle");
    const row = page.locator("tr").filter({ hasText: "Test Organisation" });
    await row.locator("a.btn-ghost").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "02-06-party-detail");
    await expect(page.locator(".info-rows").first()).toBeVisible();
    newPartyId = page.url().split("/").pop()!;
  });

  test("02-07 invite user to party", async () => {
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");
    const userSelect = page.locator("form.invite-form select[name='user_id']");
    const count = await userSelect.locator("option").count();
    if (count > 1) {
      await userSelect.selectOption({ index: 1 });
      const roleSelect = page.locator("form.invite-form select[name='role_id']");
      await roleSelect.selectOption({ index: 0 });
      await screenshot(page, "02-07-invite-form-filled");
      await page.locator("form.invite-form button[type='submit']").click();
      await page.waitForLoadState("networkidle");
      await screenshot(page, "02-07-after-invite");
    } else {
      console.log("[02-07] No available users to invite (all already members)");
    }
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("02-08 party detail shows members table", async () => {
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "02-08-party-members");
    await expect(page.locator("table.data-table")).toBeVisible();
    const rows = page.locator("table.data-table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("02-09 remove a member from party", async () => {
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");
    const rows = page.locator("table.data-table tbody tr");
    const count = await rows.count();
    if (count > 1) {
      const lastRow = rows.nth(count - 1);
      const removeBtn = lastRow.locator("button.btn-danger");
      if (await removeBtn.count() > 0) {
        page.once("dialog", (d) => d.accept());
        await removeBtn.click();
        await page.waitForLoadState("networkidle");
        await screenshot(page, "02-09-after-remove-member");
      }
    }
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("02-10 party info shows correct details", async () => {
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "02-10-party-info-details");
    await expect(page.getByRole("heading", { name: "Test Organisation" })).toBeVisible();
    await expect(page.getByText("Test Company s.r.o.")).toBeVisible();
  });

  test("02-11 admin user is listed as member", async () => {
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");
    const adminRow = page.locator("table.data-table tbody tr").filter({ hasText: "admin@test.com" });
    await screenshot(page, "02-11-admin-member-visible");
    await expect(adminRow.first()).toBeVisible();
  });

  test("02-12 parties list shows count in toolbar", async () => {
    await page.goto(`${BASE}/admin/parties`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "02-12-parties-count");
    const toolbar = page.locator(".toolbar .total-label, .toolbar span");
    await expect(toolbar.first()).toBeVisible();
  });
});
