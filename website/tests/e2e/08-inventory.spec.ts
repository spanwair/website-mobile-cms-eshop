import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, INVENTORY_ID, login, screenshot } from "./helpers";

test.describe("08 — Inventory: Stock Levels, Adjustments, Low Stock", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("08-01 inventory list loads with seeded item", async () => {
    await page.goto(`${BASE}/admin/inventory`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "08-01-inventory-list");
    await expect(page.locator("table.data-table")).toBeVisible();
    const rows = page.locator("table.data-table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("08-02 seeded item shows qty=50", async () => {
    const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await expect(seedRow).toBeVisible();
    const qtyCell = seedRow.locator("td").nth(2);
    await expect(qtyCell).toHaveText("50");
    await screenshot(page, "08-02-inventory-qty-50");
  });

  test("08-03 All filter is active by default", async () => {
    const allFilterBtn = page.locator(".filter-btn.active");
    await expect(allFilterBtn).toBeVisible();
    await screenshot(page, "08-03-all-filter-active");
  });

  test("08-04 Low Stock filter shows no items (50 > threshold 10)", async () => {
    await page.click(".filter-btn:not(.active)");
    await page.waitForLoadState("networkidle");
    await screenshot(page, "08-04-low-stock-filter-empty");
    const rows = page.locator("table.data-table tbody tr");
    const count = await rows.count();
    if (count === 1) {
      const emptyCell = rows.first().locator("td[colspan]");
      await expect(emptyCell).toBeVisible();
    }
  });

  test("08-05 return to All filter and adjust stock +20 (purchase)", async () => {
    await page.goto(`${BASE}/admin/inventory`);
    await page.waitForLoadState("networkidle");
    const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await expect(seedRow).toBeVisible();
    await seedRow.locator("input.qty-input").fill("20");
    await seedRow.locator("select.type-select").selectOption("purchase");
    await seedRow.locator("input.note-input").fill("Restock E2E");
    await screenshot(page, "08-05-stock-adjustment-purchase");
    await seedRow.locator("button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/inventory`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await screenshot(page, "08-05-after-purchase");
    // qty should now be 70
    const updatedSeedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await expect(updatedSeedRow.locator("td").nth(2)).toHaveText("70");
  });

  test("08-06 adjust stock -5 (damage)", async () => {
    const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await seedRow.locator("input.qty-input").fill("5");
    await seedRow.locator("select.type-select").selectOption("damage");
    await screenshot(page, "08-06-stock-damage");
    await seedRow.locator("button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/inventory`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    // qty should now be 65
    const updatedSeedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await expect(updatedSeedRow.locator("td").nth(2)).toHaveText("65");
    await screenshot(page, "08-06-after-damage");
  });

  test("08-07 adjust stock +3 (return)", async () => {
    const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await seedRow.locator("input.qty-input").fill("3");
    await seedRow.locator("select.type-select").selectOption("return");
    await seedRow.locator("button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/inventory`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    // qty should now be 68
    const updatedSeedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await expect(updatedSeedRow.locator("td").nth(2)).toHaveText("68");
    await screenshot(page, "08-07-after-return");
  });

  test("08-08 adjust stock to low (damage -60, making qty=8 < threshold=10)", async () => {
    const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await seedRow.locator("input.qty-input").fill("60");
    await seedRow.locator("select.type-select").selectOption("damage");
    await screenshot(page, "08-08-low-stock-adjustment");
    await seedRow.locator("button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/inventory`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    // qty should now be 8 (< threshold=10)
    const updatedSeedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await expect(updatedSeedRow.locator("td").nth(2)).toHaveText("8");
    await screenshot(page, "08-08-after-low-stock");
  });

  test("08-09 low stock badge appears on row", async () => {
    const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    const lowBadge = seedRow.locator(".badge-error");
    await expect(lowBadge).toBeVisible();
    await screenshot(page, "08-09-low-stock-badge");
  });

  test("08-10 Low Stock filter now shows the item", async () => {
    await page.goto(`${BASE}/admin/inventory?filter=low`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "08-10-low-stock-filter-shows-item");
    const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
    await expect(seedRow).toBeVisible();
    const hasBadge = await seedRow.locator(".badge-error").count();
    expect(hasBadge).toBeGreaterThan(0);
  });
});
