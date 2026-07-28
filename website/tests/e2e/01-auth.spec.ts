import { test, expect } from "@playwright/test";
import { BASE, ADMIN, USER, ESHOP, login, loginAs, screenshot } from "./helpers";

test.describe("01 — Auth: Login, Logout, Access Control", () => {
  test("01-01 admin login redirects to /", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "01-01-login-page");
    await page.fill("#si-email", ADMIN.email);
    await page.fill("#si-password", ADMIN.password);
    await screenshot(page, "01-01-login-filled");
    await page.click("#signin-btn");
    await page.waitForURL(`${BASE}/`, { timeout: 20000 });
    await screenshot(page, "01-01-post-login");
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test("01-02 wrong password shows error message", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await page.fill("#si-email", ADMIN.email);
    await page.fill("#si-password", "wrong-password");
    await page.click("#signin-btn");
    await page.waitForTimeout(3000);
    await screenshot(page, "01-02-wrong-password-error");
    const error = page.locator("#error-si");
    await expect(error).toBeVisible();
    expect(await error.textContent()).toBeTruthy();
  });

  test("01-03 nonexistent email shows error message", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await page.fill("#si-email", "nobody@nowhere.invalid");
    await page.fill("#si-password", "somepassword");
    await page.click("#signin-btn");
    await page.waitForTimeout(3000);
    await screenshot(page, "01-03-nonexistent-email-error");
    const error = page.locator("#error-si");
    await expect(error).toBeVisible();
  });

  test("01-04 unauthenticated /admin redirects to /login", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "01-04-admin-redirect-login");
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test("01-05 unauthenticated /admin/products redirects to /login", async ({ page }) => {
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "01-05-products-redirect-login");
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test("01-06 unauthenticated /admin/orders redirects to /login", async ({ page }) => {
    await page.goto(`${BASE}/admin/orders`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test("01-07 USER role cannot access /admin (redirected away)", async ({ page }) => {
    await loginAs(page, USER.email, USER.password);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "01-07-user-role-blocked");
    await expect(page).not.toHaveURL(`${BASE}/admin`);
  });

  test("01-08 ESHOP_ADMIN role can access /admin", async ({ page }) => {
    await loginAs(page, ESHOP.email, ESHOP.password);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "01-08-eshop-admin-access");
    await expect(page).toHaveURL(`${BASE}/admin`);
  });

  test("01-09 session persists after navigation", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/admin/products`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "01-09-session-persists");
    await expect(page).toHaveURL(`${BASE}/admin/products`);
    await expect(page.locator("table.data-table")).toBeVisible();
  });
});
