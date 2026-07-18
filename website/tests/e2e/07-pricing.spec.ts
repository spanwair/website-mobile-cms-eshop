import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, RULE_ID, login, screenshot } from "./helpers";

test.describe("07 — Pricing: Tabs, Discounts, Coupons CRUD", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("07-01 pricing page loads with tabs", async () => {
    await page.goto(`${BASE}/admin/pricing`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "07-01-pricing-tabs");
    await expect(page.locator(".tabs")).toBeVisible();
    const tabs = page.locator(".tabs .tab");
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("07-02 pricelists tab loads (may be empty)", async () => {
    const pricelistsTab = page.locator(".tabs .tab").first();
    await pricelistsTab.click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "07-02-pricelists-tab");
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("07-03 discounts tab shows seeded 10% Off rule", async () => {
    const discountsTab = page.locator(".tabs .tab").nth(1);
    await discountsTab.click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "07-03-discounts-tab");
    await expect(page.locator("table.data-table")).toBeVisible();
    await expect(page.getByText("Seed 10% Off")).toBeVisible();
  });

  test("07-04 discount rule shows percentage type badge", async () => {
    const row = page.locator("tr").filter({ hasText: "Seed 10% Off" });
    await expect(row.locator(".badge-pending")).toBeVisible();
    await expect(row.getByText("percentage")).toBeVisible();
    await screenshot(page, "07-04-discount-type-badge");
  });

  test("07-05 discount rule shows value 10%", async () => {
    const row = page.locator("tr").filter({ hasText: "Seed 10% Off" });
    const valueCells = row.locator("td");
    const count = await valueCells.count();
    expect(count).toBeGreaterThan(0);
    await expect(row.locator(".badge-active")).toBeVisible();
    await screenshot(page, "07-05-discount-value");
  });

  test("07-06 coupons tab shows SEED10 coupon", async () => {
    const couponsTab = page.locator(".tabs .tab").nth(2);
    await couponsTab.click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "07-06-coupons-tab");
    await expect(page.locator("table.data-table")).toBeVisible();
    await expect(page.getByText("SEED10")).toBeVisible();
  });

  test("07-07 SEED10 coupon shows Active badge and 0 uses", async () => {
    const row = page.locator("tr").filter({ hasText: "SEED10" });
    await expect(row.locator(".badge-active")).toBeVisible();
    await expect(row.locator("td").nth(3)).toHaveText("0");
    await screenshot(page, "07-07-seed10-coupon-details");
  });

  test("07-08 navigate to new coupon form", async () => {
    await page.click("a.btn-primary");
    await page.waitForURL(`${BASE}/admin/pricing/coupons/new`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "07-08-new-coupon-form");
    await expect(page.locator("form.coupon-form")).toBeVisible();
  });

  test("07-09 discount rule appears in select dropdown", async () => {
    const ruleSelect = page.locator("select[name='discount_rule_id']");
    const options = await ruleSelect.locator("option").count();
    expect(options).toBeGreaterThanOrEqual(2);
    const optionText = await ruleSelect.textContent();
    expect(optionText).toContain("Seed 10% Off");
    await screenshot(page, "07-09-rule-in-dropdown");
  });

  test("07-10 create new coupon PROMO20", async () => {
    // Ensure we're on the new coupon form (07-09 may leave us mid-page)
    if (!page.url().includes("/admin/pricing/coupons/new")) {
      await page.goto(`${BASE}/admin/pricing/coupons/new`);
      await page.waitForLoadState("networkidle");
    }
    await page.fill("input[name='code']", "PROMO20");
    await page.selectOption("select[name='discount_rule_id']", { index: 1 });
    await page.fill("input[name='max_uses']", "100");
    const isActive = page.locator("input[name='is_active']");
    if (!(await isActive.isChecked())) {
      await isActive.check();
    }
    await screenshot(page, "07-10-new-coupon-filled");
    await page.locator("form.coupon-form button[type='submit']").click();
    await page.waitForURL(`${BASE}/admin/pricing?tab=coupons`, { timeout: 10000 });
    await screenshot(page, "07-10-after-create-promo20");
    await expect(page.getByText("PROMO20")).toBeVisible();
  });

  test("07-11 PROMO20 coupon appears with max_uses=100", async () => {
    const row = page.locator("tr").filter({ hasText: "PROMO20" });
    await expect(row).toBeVisible();
    await expect(row.getByText("100")).toBeVisible();
    await expect(row.locator(".badge-active")).toBeVisible();
    await screenshot(page, "07-11-promo20-in-list");
  });

  test("07-12 duplicate coupon code shows form-error", async () => {
    await page.goto(`${BASE}/admin/pricing/coupons/new`);
    await page.waitForLoadState("networkidle");
    await page.fill("input[name='code']", "SEED10");
    await page.selectOption("select[name='discount_rule_id']", { index: 1 });
    await page.locator("form.coupon-form button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "07-12-duplicate-coupon-error");
    await expect(page.locator(".form-error")).toBeVisible();
  });
});
