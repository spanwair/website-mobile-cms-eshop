# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-pricing.spec.ts >> 07 — Pricing: Tabs, Discounts, Coupons CRUD >> 07-07 SEED10 coupon shows Active badge and 0 uses
- Location: tests/e2e/07-pricing.spec.ts:70:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('tr').filter({ hasText: 'SEED10' }).locator('td').nth(2)
Expected: "0"
Received: "Neomezeno"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for locator('tr').filter({ hasText: 'SEED10' }).locator('td').nth(2)
    14 × locator resolved to <td data-astro-cid-3zpujsxa="">Neomezeno</td>
       - unexpected value "Neomezeno"

```

```yaml
- cell "Neomezeno"
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, RULE_ID, login, screenshot } from "./helpers";
  3   | 
  4   | test.describe("07 — Pricing: Tabs, Discounts, Coupons CRUD", () => {
  5   |   test.describe.configure({ mode: "serial" });
  6   | 
  7   |   let page: Page;
  8   | 
  9   |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  10  |     page = await browser.newPage();
  11  |     await login(page);
  12  |   });
  13  | 
  14  |   test.afterAll(async () => {
  15  |     await page.close();
  16  |   });
  17  | 
  18  |   test("07-01 pricing page loads with tabs", async () => {
  19  |     await page.goto(`${BASE}/admin/pricing`);
  20  |     await page.waitForLoadState("networkidle");
  21  |     await screenshot(page, "07-01-pricing-tabs");
  22  |     await expect(page.locator(".tabs")).toBeVisible();
  23  |     const tabs = page.locator(".tabs .tab");
  24  |     const count = await tabs.count();
  25  |     expect(count).toBeGreaterThanOrEqual(3);
  26  |   });
  27  | 
  28  |   test("07-02 pricelists tab loads (may be empty)", async () => {
  29  |     const pricelistsTab = page.locator(".tabs .tab").first();
  30  |     await pricelistsTab.click();
  31  |     await page.waitForLoadState("networkidle");
  32  |     await screenshot(page, "07-02-pricelists-tab");
  33  |     await expect(page.locator("table.data-table")).toBeVisible();
  34  |   });
  35  | 
  36  |   test("07-03 discounts tab shows seeded 10% Off rule", async () => {
  37  |     const discountsTab = page.locator(".tabs .tab").nth(1);
  38  |     await discountsTab.click();
  39  |     await page.waitForLoadState("networkidle");
  40  |     await screenshot(page, "07-03-discounts-tab");
  41  |     await expect(page.locator("table.data-table")).toBeVisible();
  42  |     await expect(page.getByText("Seed 10% Off")).toBeVisible();
  43  |   });
  44  | 
  45  |   test("07-04 discount rule shows percentage type badge", async () => {
  46  |     const row = page.locator("tr").filter({ hasText: "Seed 10% Off" });
  47  |     await expect(row.locator(".badge-pending")).toBeVisible();
  48  |     await expect(row.getByText("percentage")).toBeVisible();
  49  |     await screenshot(page, "07-04-discount-type-badge");
  50  |   });
  51  | 
  52  |   test("07-05 discount rule shows value 10%", async () => {
  53  |     const row = page.locator("tr").filter({ hasText: "Seed 10% Off" });
  54  |     const valueCells = row.locator("td");
  55  |     const count = await valueCells.count();
  56  |     expect(count).toBeGreaterThan(0);
  57  |     await expect(row.locator(".badge-active")).toBeVisible();
  58  |     await screenshot(page, "07-05-discount-value");
  59  |   });
  60  | 
  61  |   test("07-06 coupons tab shows SEED10 coupon", async () => {
  62  |     const couponsTab = page.locator(".tabs .tab").nth(2);
  63  |     await couponsTab.click();
  64  |     await page.waitForLoadState("networkidle");
  65  |     await screenshot(page, "07-06-coupons-tab");
  66  |     await expect(page.locator("table.data-table")).toBeVisible();
  67  |     await expect(page.getByText("SEED10")).toBeVisible();
  68  |   });
  69  | 
  70  |   test("07-07 SEED10 coupon shows Active badge and 0 uses", async () => {
  71  |     const row = page.locator("tr").filter({ hasText: "SEED10" });
  72  |     await expect(row.locator(".badge-active")).toBeVisible();
> 73  |     await expect(row.locator("td").nth(2)).toHaveText("0");
      |                                            ^ Error: expect(locator).toHaveText(expected) failed
  74  |     await screenshot(page, "07-07-seed10-coupon-details");
  75  |   });
  76  | 
  77  |   test("07-08 navigate to new coupon form", async () => {
  78  |     await page.click("a.btn-primary");
  79  |     await page.waitForURL(`${BASE}/admin/pricing/coupons/new`);
  80  |     await page.waitForLoadState("networkidle");
  81  |     await screenshot(page, "07-08-new-coupon-form");
  82  |     await expect(page.locator("form.coupon-form")).toBeVisible();
  83  |   });
  84  | 
  85  |   test("07-09 discount rule appears in select dropdown", async () => {
  86  |     const ruleSelect = page.locator("select[name='discount_rule_id']");
  87  |     const options = await ruleSelect.locator("option").count();
  88  |     expect(options).toBeGreaterThanOrEqual(2);
  89  |     const optionText = await ruleSelect.textContent();
  90  |     expect(optionText).toContain("Seed 10% Off");
  91  |     await screenshot(page, "07-09-rule-in-dropdown");
  92  |   });
  93  | 
  94  |   test("07-10 create new coupon PROMO20", async () => {
  95  |     await page.fill("input[name='code']", "PROMO20");
  96  |     await page.selectOption("select[name='discount_rule_id']", { label: /Seed 10% Off/i });
  97  |     await page.fill("input[name='max_uses']", "100");
  98  |     const isActive = page.locator("input[name='is_active']");
  99  |     if (!(await isActive.isChecked())) {
  100 |       await isActive.check();
  101 |     }
  102 |     await screenshot(page, "07-10-new-coupon-filled");
  103 |     await page.locator("form.coupon-form button[type='submit']").click();
  104 |     await page.waitForURL(`${BASE}/admin/pricing?tab=coupons`, { timeout: 10000 });
  105 |     await screenshot(page, "07-10-after-create-promo20");
  106 |     await expect(page.getByText("PROMO20")).toBeVisible();
  107 |   });
  108 | 
  109 |   test("07-11 PROMO20 coupon appears with max_uses=100", async () => {
  110 |     const row = page.locator("tr").filter({ hasText: "PROMO20" });
  111 |     await expect(row).toBeVisible();
  112 |     await expect(row.getByText("100")).toBeVisible();
  113 |     await expect(row.locator(".badge-active")).toBeVisible();
  114 |     await screenshot(page, "07-11-promo20-in-list");
  115 |   });
  116 | 
  117 |   test("07-12 duplicate coupon code shows form-error", async () => {
  118 |     await page.goto(`${BASE}/admin/pricing/coupons/new`);
  119 |     await page.waitForLoadState("networkidle");
  120 |     await page.fill("input[name='code']", "SEED10");
  121 |     await page.selectOption("select[name='discount_rule_id']", { index: 1 });
  122 |     await page.locator("form.coupon-form button[type='submit']").click();
  123 |     await page.waitForLoadState("networkidle");
  124 |     await screenshot(page, "07-12-duplicate-coupon-error");
  125 |     await expect(page.locator(".form-error")).toBeVisible();
  126 |   });
  127 | });
  128 | 
```