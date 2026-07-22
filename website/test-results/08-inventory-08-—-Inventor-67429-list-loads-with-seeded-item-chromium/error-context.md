# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-inventory.spec.ts >> 08 — Inventory: Stock Levels, Adjustments, Low Stock >> 08-01 inventory list loads with seeded item
- Location: tests/e2e/08-inventory.spec.ts:18:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-hMCm8S --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301209
  - [pid=1301209][err] [1301209:1301209:0722/133855.863397:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301209][err] [1301209:1301209:0722/133855.863442:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301209] <gracefully close start>
  - [pid=1301209] <kill>
  - [pid=1301209] <will force kill>
  - [pid=1301209] <process did exit: exitCode=1, signal=null>
  - [pid=1301209] starting temporary directories cleanup
  - [pid=1301209] finished temporary directories cleanup
  - [pid=1301209] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, INVENTORY_ID, login, screenshot } from "./helpers";
  3   | 
  4   | test.describe("08 — Inventory: Stock Levels, Adjustments, Low Stock", () => {
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
  18  |   test("08-01 inventory list loads with seeded item", async () => {
  19  |     await page.goto(`${BASE}/admin/inventory`);
  20  |     await page.waitForLoadState("networkidle");
  21  |     await screenshot(page, "08-01-inventory-list");
  22  |     await expect(page.locator("table.data-table")).toBeVisible();
  23  |     const rows = page.locator("table.data-table tbody tr");
  24  |     const count = await rows.count();
  25  |     expect(count).toBeGreaterThanOrEqual(1);
  26  |   });
  27  | 
  28  |   test("08-02 seeded item shows qty=50", async () => {
  29  |     const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  30  |     await expect(seedRow).toBeVisible();
  31  |     const qtyCell = seedRow.locator("td").nth(2);
  32  |     await expect(qtyCell).toHaveText("50");
  33  |     await screenshot(page, "08-02-inventory-qty-50");
  34  |   });
  35  | 
  36  |   test("08-03 All filter is active by default", async () => {
  37  |     const allFilterBtn = page.locator(".filter-btn.active");
  38  |     await expect(allFilterBtn).toBeVisible();
  39  |     await screenshot(page, "08-03-all-filter-active");
  40  |   });
  41  | 
  42  |   test("08-04 Low Stock filter shows no items (50 > threshold 10)", async () => {
  43  |     await page.click(".filter-btn:not(.active)");
  44  |     await page.waitForLoadState("networkidle");
  45  |     await screenshot(page, "08-04-low-stock-filter-empty");
  46  |     const rows = page.locator("table.data-table tbody tr");
  47  |     const count = await rows.count();
  48  |     if (count === 1) {
  49  |       const emptyCell = rows.first().locator("td[colspan]");
  50  |       await expect(emptyCell).toBeVisible();
  51  |     }
  52  |   });
  53  | 
  54  |   test("08-05 return to All filter and adjust stock +20 (purchase)", async () => {
  55  |     await page.goto(`${BASE}/admin/inventory`);
  56  |     await page.waitForLoadState("networkidle");
  57  |     const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  58  |     await expect(seedRow).toBeVisible();
  59  |     await seedRow.locator("input.qty-input").fill("20");
  60  |     await seedRow.locator("select.type-select").selectOption("purchase");
  61  |     await seedRow.locator("input.note-input").fill("Restock E2E");
  62  |     await screenshot(page, "08-05-stock-adjustment-purchase");
  63  |     await seedRow.locator(".adjust-form button[type='submit']").click();
  64  |     await page.waitForURL(`${BASE}/admin/inventory`, { timeout: 10000 });
  65  |     await page.waitForLoadState("networkidle");
  66  |     await screenshot(page, "08-05-after-purchase");
  67  |     // qty should now be 70
  68  |     const updatedSeedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  69  |     await expect(updatedSeedRow.locator("td").nth(2)).toHaveText("70");
  70  |   });
  71  | 
  72  |   test("08-06 adjust stock -5 (damage)", async () => {
  73  |     const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  74  |     await seedRow.locator("input.qty-input").fill("5");
  75  |     await seedRow.locator("select.type-select").selectOption("damage");
  76  |     await screenshot(page, "08-06-stock-damage");
  77  |     await seedRow.locator(".adjust-form button[type='submit']").click();
  78  |     await page.waitForURL(`${BASE}/admin/inventory`, { timeout: 10000 });
  79  |     await page.waitForLoadState("networkidle");
  80  |     // qty should now be 65
  81  |     const updatedSeedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  82  |     await expect(updatedSeedRow.locator("td").nth(2)).toHaveText("65");
  83  |     await screenshot(page, "08-06-after-damage");
  84  |   });
  85  | 
  86  |   test("08-07 adjust stock +3 (return)", async () => {
  87  |     const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  88  |     await seedRow.locator("input.qty-input").fill("3");
  89  |     await seedRow.locator("select.type-select").selectOption("return");
  90  |     await seedRow.locator(".adjust-form button[type='submit']").click();
  91  |     await page.waitForURL(`${BASE}/admin/inventory`, { timeout: 10000 });
  92  |     await page.waitForLoadState("networkidle");
  93  |     // qty should now be 68
  94  |     const updatedSeedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  95  |     await expect(updatedSeedRow.locator("td").nth(2)).toHaveText("68");
  96  |     await screenshot(page, "08-07-after-return");
  97  |   });
  98  | 
  99  |   test("08-08 adjust stock to low (damage -60, making qty=8 < threshold=10)", async () => {
  100 |     const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  101 |     await seedRow.locator("input.qty-input").fill("60");
  102 |     await seedRow.locator("select.type-select").selectOption("damage");
  103 |     await screenshot(page, "08-08-low-stock-adjustment");
  104 |     await seedRow.locator(".adjust-form button[type='submit']").click();
  105 |     await page.waitForURL(`${BASE}/admin/inventory`, { timeout: 10000 });
  106 |     await page.waitForLoadState("networkidle");
  107 |     // qty should now be 8 (< threshold=10)
  108 |     const updatedSeedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  109 |     await expect(updatedSeedRow.locator("td").nth(2)).toHaveText("8");
  110 |     await screenshot(page, "08-08-after-low-stock");
  111 |   });
  112 | 
  113 |   test("08-09 low stock badge appears on row", async () => {
  114 |     const seedRow = page.locator("table.data-table tbody tr").filter({ hasText: "Seed Product" });
  115 |     const lowBadge = seedRow.locator(".badge-error");
```