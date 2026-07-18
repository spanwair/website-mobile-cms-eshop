import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, ADMIN_ID, USER_ID, login, screenshot } from "./helpers";

test.describe("09 — Users & Roles: Role Management, Custom Roles", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let createdRoleVisible = false;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("09-01 users list loads and shows all test users", async () => {
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "09-01-users-list");
    await expect(page.locator("table.data-table")).toBeVisible();
    await expect(page.getByText("admin@test.com")).toBeVisible();
  });

  test("09-02 admin user shows OWNER badge (red)", async () => {
    const adminRow = page.locator("tr").filter({ hasText: "admin@test.com" });
    await expect(adminRow).toBeVisible();
    const badge = adminRow.locator(".badge-error");
    await expect(badge).toBeVisible();
    await screenshot(page, "09-02-owner-badge");
  });

  test("09-03 current user row shows 'You' indicator", async () => {
    const adminRow = page.locator("tr").filter({ hasText: "admin@test.com" });
    // "You" in Czech is "Vy" — match either locale
    await expect(adminRow.getByText(/you|vy/i)).toBeVisible();
    await screenshot(page, "09-03-you-indicator");
  });

  test("09-04 other user rows show role change form", async () => {
    const userRow = page.locator("tr").filter({ hasText: "user@test.com" });
    if (await userRow.count() > 0) {
      const roleForm = userRow.locator("form.role-form");
      await expect(roleForm).toBeVisible();
      await screenshot(page, "09-04-role-change-form");
    }
  });

  test("09-05 change user@test.com to ESHOP_ADMIN role", async () => {
    const userRow = page.locator("tr").filter({ hasText: "user@test.com" });
    if (await userRow.count() > 0) {
      const roleSelect = userRow.locator("select[name='role']");
      await roleSelect.selectOption("2");
      await screenshot(page, "09-05-role-change-filled");
      await userRow.locator("form.role-form button[type='submit']").click();
      await page.waitForURL(`${BASE}/admin/users`, { timeout: 10000 });
      await page.waitForLoadState("networkidle");
      await screenshot(page, "09-05-after-role-change");
      const updatedRow = page.locator("tr").filter({ hasText: "user@test.com" });
      const badge = updatedRow.locator(".badge-draft, .badge");
      await expect(badge.first()).toBeVisible();

      // Revert user@test.com back to USER role so later tests (12-04) are not affected
      const revertSelect = updatedRow.locator("select[name='role']");
      await revertSelect.selectOption("1");
      await updatedRow.locator("form.role-form button[type='submit']").click();
      await page.waitForURL(`${BASE}/admin/users`, { timeout: 10000 });
      await page.waitForLoadState("networkidle");
    }
  });

  test("09-06 users list shows user count in toolbar", async () => {
    const toolbar = page.locator(".toolbar .total-label");
    await expect(toolbar).toBeVisible();
    await screenshot(page, "09-06-users-count");
  });

  test("09-07 roles list loads", async () => {
    await page.goto(`${BASE}/admin/roles`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "09-07-roles-list");
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("09-08 Super Admin system role is visible", async () => {
    await expect(page.getByText("Super Admin")).toBeVisible();
    const superAdminRow = page.locator("tr").filter({ hasText: "Super Admin" });
    const systemBadge = superAdminRow.locator(".badge-pending");
    await expect(systemBadge).toBeVisible();
    await screenshot(page, "09-08-super-admin-system-role");
  });

  test("09-09 Super Admin has no delete button", async () => {
    const superAdminRow = page.locator("tr").filter({ hasText: "Super Admin" });
    const deleteBtn = superAdminRow.locator("button.btn-danger");
    await expect(deleteBtn).not.toBeVisible();
    await screenshot(page, "09-09-no-delete-for-system-role");
  });

  test("09-10 navigate to new role form", async () => {
    await page.click(".toolbar a.btn-primary");
    await page.waitForURL(`${BASE}/admin/roles/new`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "09-10-new-role-form");
    await expect(page.locator("form.role-form")).toBeVisible();
  });

  test("09-11 create custom role Viewer with 2 permissions", async () => {
    await page.fill("input[name='name']", "E2E Viewer");
    await page.fill("input[name='description']", "Read-only viewer for E2E tests");
    // Check VIEW_DASHBOARD (bit=1) and MANAGE_REPORTS (bit=512)
    const dashPerm = page.locator("input[name='perm_VIEW_DASHBOARD']");
    const reportPerm = page.locator("input[name='perm_MANAGE_REPORTS']");
    if (await dashPerm.count() > 0) {
      await dashPerm.check();
    }
    if (await reportPerm.count() > 0) {
      await reportPerm.check();
    }
    await screenshot(page, "09-11-new-role-filled");
    await page.locator("form.role-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/roles`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await screenshot(page, "09-11-after-create-role");
    await expect(page.getByText("E2E Viewer")).toBeVisible();
    createdRoleVisible = true;
  });

  test("09-12 new role shows permission chips", async () => {
    const viewerRow = page.locator("tr").filter({ hasText: "E2E Viewer" });
    await expect(viewerRow).toBeVisible();
    const chips = viewerRow.locator(".perm-chip");
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await screenshot(page, "09-12-role-permission-chips");
  });

  test("09-13 custom role shows Custom type badge", async () => {
    const viewerRow = page.locator("tr").filter({ hasText: "E2E Viewer" });
    const customBadge = viewerRow.locator(".badge-inactive");
    await expect(customBadge).toBeVisible();
    await screenshot(page, "09-13-custom-role-badge");
  });

  test("09-14 delete custom role E2E Viewer", async () => {
    if (!createdRoleVisible) {
      console.log("[09-14] Skipping: E2E Viewer role was not created");
      return;
    }
    const viewerRow = page.locator("tr").filter({ hasText: "E2E Viewer" });
    await expect(viewerRow).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await viewerRow.locator("button.btn-danger").click();
    await page.waitForURL(`${BASE}/admin/roles`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await screenshot(page, "09-14-after-delete-role");
    await expect(page.locator("tr").filter({ hasText: "E2E Viewer" })).not.toBeVisible();
  });
});
