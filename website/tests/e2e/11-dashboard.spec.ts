import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, ORDER_ID, login, screenshot } from "./helpers";

test.describe("11 — Dashboard: KPI Cards, Navigation, Recent Orders", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("11-01 dashboard loads with KPI cards", async () => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "11-01-dashboard-kpi-cards");
    const cards = page.locator(".stat-card");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("11-02 6 KPI cards are visible", async () => {
    const cards = page.locator(".stat-card");
    const count = await cards.count();
    expect(count).toBe(6);
    await screenshot(page, "11-02-all-6-kpi-cards");
  });

  test("11-03 KPI cards show numeric values", async () => {
    const statNums = page.locator(".stat-num");
    const count = await statNums.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const text = await statNums.nth(i).textContent();
      expect(text?.trim()).toBeTruthy();
    }
    await screenshot(page, "11-03-kpi-values");
  });

  test("11-04 sidebar navigation is visible", async () => {
    const sidebar = page.locator(".sidebar, nav.sidebar, .cms-sidebar");
    await expect(sidebar.first()).toBeVisible();
    await screenshot(page, "11-04-sidebar-navigation");
  });

  test("11-05 sidebar has key nav links", async () => {
    const sidebar = page.locator(".sidebar, nav.sidebar, .cms-sidebar").first();
    await expect(sidebar.locator("a")).not.toHaveCount(0);
    const links = sidebar.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(5);
    await screenshot(page, "11-05-sidebar-links");
  });

  test("11-06 navigate from sidebar to products", async () => {
    const productsLink = page.locator(".sidebar a, nav a").filter({ hasText: /products|produkt/i }).first();
    if (await productsLink.count() > 0) {
      await productsLink.click();
      await page.waitForLoadState("networkidle");
      await screenshot(page, "11-06-navigate-to-products");
      await expect(page).toHaveURL(new RegExp("/admin/products"));
    }
  });

  test("11-07 navigate from sidebar to orders", async () => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    const ordersLink = page.locator(".sidebar a, nav a").filter({ hasText: /orders|objedn/i }).first();
    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState("networkidle");
      await screenshot(page, "11-07-navigate-to-orders");
      await expect(page).toHaveURL(new RegExp("/admin/orders"));
    }
  });

  test("11-08 dashboard stats-row is visible", async () => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    const statsRow = page.locator(".stats-row");
    await expect(statsRow).toBeVisible();
    await screenshot(page, "11-08-stats-row");
  });
});
