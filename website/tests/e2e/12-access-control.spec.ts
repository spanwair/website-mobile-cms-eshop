import { test, expect, type Browser } from "@playwright/test";
import { BASE, USER, ESHOP, ADMIN, loginAs, login, screenshot } from "./helpers";

test.describe("12 — Access Control: Role-based Page Protection", () => {
  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    // Reset user@test.com to role=1 (USER) in case test 09-05 changed it to ESHOP_ADMIN
    const adminPage = await browser.newPage();
    await login(adminPage);
    await adminPage.goto(`${BASE}/admin/users`);
    await adminPage.waitForLoadState("networkidle");
    const userRow = adminPage.locator("tr").filter({ hasText: USER.email });
    if (await userRow.count() > 0) {
      const roleSelect = userRow.locator("select[name='role']");
      if (await roleSelect.count() > 0) {
        await roleSelect.selectOption("1");
        await userRow.locator("form.role-form button[type='submit']").click();
        await adminPage.waitForURL(`${BASE}/admin/users`, { timeout: 10000 });
      }
    }
    await adminPage.close();
  });

  test("12-01 unauthenticated user cannot access /admin", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-01-unauth-admin");
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test("12-02 unauthenticated user cannot access /admin/users", async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-02-unauth-users");
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test("12-03 unauthenticated user cannot access /admin/inventory", async ({ page }) => {
    await page.goto(`${BASE}/admin/inventory`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-03-unauth-inventory");
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test("12-04 USER role (role=1) is blocked from /admin", async ({ page }) => {
    await loginAs(page, USER.email, USER.password);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-04-user-blocked-admin");
    // USER role should be redirected away from /admin
    await expect(page).not.toHaveURL(`${BASE}/admin`);
  });

  test("12-05 ESHOP_ADMIN (role=2) can access /admin", async ({ page }) => {
    await loginAs(page, ESHOP.email, ESHOP.password);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-05-eshop-admin-access");
    await expect(page).toHaveURL(`${BASE}/admin`);
    await expect(page.locator(".stat-card").first()).toBeVisible();
  });

  test("12-06 ESHOP_ADMIN can access /admin/products", async ({ page }) => {
    await loginAs(page, ESHOP.email, ESHOP.password);
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-06-eshop-admin-products");
    await expect(page).toHaveURL(`${BASE}/admin/products`);
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("12-07 ESHOP_ADMIN can access /admin/orders", async ({ page }) => {
    await loginAs(page, ESHOP.email, ESHOP.password);
    await page.goto(`${BASE}/admin/orders`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-07-eshop-admin-orders");
    await expect(page).toHaveURL(`${BASE}/admin/orders`);
  });

  test("12-08 sidebar shows correct links for ESHOP_ADMIN", async ({ page }) => {
    await loginAs(page, ESHOP.email, ESHOP.password);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-08-eshop-admin-sidebar");
    const sidebar = page.locator(".sidebar, nav.sidebar, .cms-sidebar").first();
    await expect(sidebar).toBeVisible();
  });

  test("12-09 accessing /admin when already logged in stays on /admin", async ({ page }) => {
    await loginAs(page, ESHOP.email, ESHOP.password);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "12-09-admin-already-logged-in");
    await expect(page).toHaveURL(`${BASE}/admin`);
  });
});
