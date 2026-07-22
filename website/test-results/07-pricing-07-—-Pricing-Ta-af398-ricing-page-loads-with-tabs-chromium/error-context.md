# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-pricing.spec.ts >> 07 — Pricing: Tabs, Discounts, Coupons CRUD >> 07-01 pricing page loads with tabs
- Location: tests/e2e/07-pricing.spec.ts:18:3

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

╔════════════════════════════════════════════════════════════════════════════════════════════════╗
║ Looks like you launched a headed browser without having a XServer running.                     ║
║ Set either 'headless: true' or use 'xvfb-run <your-playwright-app>' before running Playwright. ║
║                                                                                                ║
║ <3 Playwright Team                                                                             ║
╚════════════════════════════════════════════════════════════════════════════════════════════════╝
Call log:
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-VwcEbw --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301152
  - [pid=1301152][err] [1301152:1301152:0722/133854.883996:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301152][err] [1301152:1301152:0722/133854.884071:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301152] <gracefully close start>
  - [pid=1301152] <kill>
  - [pid=1301152] <will force kill>
  - [pid=1301152][err] [1301159:1301159:0100/000000.891539:ERROR:chromium-150.0.7871.124/content/zygote/zygote_linux.cc:662] write: Broken pipe (32)
  - [pid=1301152] <process did exit: exitCode=1, signal=null>
  - [pid=1301152] starting temporary directories cleanup
  - [pid=1301152] finished temporary directories cleanup
  - [pid=1301152] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
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
> 15  |     await page.close();
      |                ^ TypeError: Cannot read properties of undefined (reading 'close')
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
  73  |     await expect(row.locator("td").nth(3)).toHaveText("0");
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
  95  |     // Ensure we're on the new coupon form (07-09 may leave us mid-page)
  96  |     if (!page.url().includes("/admin/pricing/coupons/new")) {
  97  |       await page.goto(`${BASE}/admin/pricing/coupons/new`);
  98  |       await page.waitForLoadState("networkidle");
  99  |     }
  100 |     await page.fill("input[name='code']", "PROMO20");
  101 |     await page.selectOption("select[name='discount_rule_id']", { index: 1 });
  102 |     await page.fill("input[name='max_uses']", "100");
  103 |     const isActive = page.locator("input[name='is_active']");
  104 |     if (!(await isActive.isChecked())) {
  105 |       await isActive.check();
  106 |     }
  107 |     await screenshot(page, "07-10-new-coupon-filled");
  108 |     await page.locator("form.coupon-form button[type='submit']").click();
  109 |     await page.waitForURL(`${BASE}/admin/pricing?tab=coupons`, { timeout: 10000 });
  110 |     await screenshot(page, "07-10-after-create-promo20");
  111 |     await expect(page.getByText("PROMO20")).toBeVisible();
  112 |   });
  113 | 
  114 |   test("07-11 PROMO20 coupon appears with max_uses=100", async () => {
  115 |     const row = page.locator("tr").filter({ hasText: "PROMO20" });
```