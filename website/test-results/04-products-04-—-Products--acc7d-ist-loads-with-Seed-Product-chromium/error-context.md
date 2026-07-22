# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-products.spec.ts >> 04 — Products: CRUD, Search, Filter, Status >> 04-01 products list loads with Seed Product
- Location: tests/e2e/04-products.spec.ts:19:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-V7Zjrb --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301024
  - [pid=1301024][err] [1301024:1301024:0722/133851.958672:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301024][err] [1301024:1301024:0722/133851.958719:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301024] <gracefully close start>
  - [pid=1301024] <kill>
  - [pid=1301024] <will force kill>
  - [pid=1301024] <process did exit: exitCode=1, signal=null>
  - [pid=1301024] starting temporary directories cleanup
  - [pid=1301024] finished temporary directories cleanup
  - [pid=1301024] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, PRODUCT_ID, login, screenshot } from "./helpers";
  3   | 
  4   | test.describe("04 — Products: CRUD, Search, Filter, Status", () => {
  5   |   test.describe.configure({ mode: "serial" });
  6   | 
  7   |   let page: Page;
  8   |   let createdProductId = "";
  9   | 
  10  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  11  |     page = await browser.newPage();
  12  |     await login(page);
  13  |   });
  14  | 
  15  |   test.afterAll(async () => {
> 16  |     await page.close();
      |                ^ TypeError: Cannot read properties of undefined (reading 'close')
  17  |   });
  18  | 
  19  |   test("04-01 products list loads with Seed Product", async () => {
  20  |     await page.goto(`${BASE}/admin/products`);
  21  |     await page.waitForLoadState("networkidle");
  22  |     await screenshot(page, "04-01-products-list");
  23  |     await expect(page.locator("table.data-table")).toBeVisible();
  24  |     await expect(page.getByText("Seed Product")).toBeVisible();
  25  |   });
  26  | 
  27  |   test("04-02 search by title returns matching product", async () => {
  28  |     await page.fill("input[name='search']", "Seed");
  29  |     await page.locator("form.search-form button[type='submit']").click();
  30  |     await page.waitForLoadState("networkidle");
  31  |     await screenshot(page, "04-02-search-results");
  32  |     await expect(page.getByText("Seed Product")).toBeVisible();
  33  |     const rows = page.locator("table.data-table tbody tr");
  34  |     const count = await rows.count();
  35  |     expect(count).toBeGreaterThanOrEqual(1);
  36  |   });
  37  | 
  38  |   test("04-03 filter by status active shows Seed Product", async () => {
  39  |     await page.goto(`${BASE}/admin/products`);
  40  |     await page.waitForLoadState("networkidle");
  41  |     await page.selectOption("select[name='status']", "active");
  42  |     await page.locator("form.search-form button[type='submit']").click();
  43  |     await page.waitForLoadState("networkidle");
  44  |     await screenshot(page, "04-03-filter-active");
  45  |     await expect(page.getByText("Seed Product")).toBeVisible();
  46  |     const badges = page.locator("td .badge-active");
  47  |     const count = await badges.count();
  48  |     expect(count).toBeGreaterThanOrEqual(1);
  49  |   });
  50  | 
  51  |   test("04-04 filter by status draft shows no active products", async () => {
  52  |     await page.goto(`${BASE}/admin/products`);
  53  |     await page.waitForLoadState("networkidle");
  54  |     await page.selectOption("select[name='status']", "draft");
  55  |     await page.locator("form.search-form button[type='submit']").click();
  56  |     await page.waitForLoadState("networkidle");
  57  |     await screenshot(page, "04-04-filter-draft");
  58  |     const activeInTable = page.locator("td .badge-active");
  59  |     await expect(activeInTable.first()).not.toBeVisible().catch(() => {});
  60  |   });
  61  | 
  62  |   test("04-05 navigate to new product form", async () => {
  63  |     await page.goto(`${BASE}/admin/products`);
  64  |     await page.waitForLoadState("networkidle");
  65  |     await page.click("a.btn-primary");
  66  |     await page.waitForURL(`${BASE}/admin/products/new`);
  67  |     await screenshot(page, "04-05-new-product-form");
  68  |     await expect(page.locator("form.product-form")).toBeVisible();
  69  |   });
  70  | 
  71  |   test("04-06 create draft product with all fields", async () => {
  72  |     console.log('Starting 04-06: Creating draft product with all fields');
  73  |     await page.goto(`${BASE}/admin/products/new`);
  74  |     await page.waitForLoadState("networkidle");
  75  | 
  76  |     console.log('Filling product form');
  77  |     await page.fill("input[name='title']", "E2E Test Product");
  78  |     await page.fill("input[name='slug']", "e2e-test-product");
  79  |     await page.fill("input[name='sku']", "SKU-E2E-001");
  80  |     await page.fill("input[name='price']", "199.90");
  81  |     await page.fill("input[name='discount_price']", "149.90");
  82  |     await page.selectOption("select[name='status']", "draft");
  83  | 
  84  |     console.log('Submitting product form');
  85  |     await screenshot(page, "04-06-new-product-filled");
  86  |     await page.locator("form.product-form button.btn-primary").click();
  87  | 
  88  |     // Wait for navigation to product detail page
  89  |     console.log('Waiting for navigation after product creation');
  90  |     await page.waitForURL((url) => url.pathname.startsWith("/admin/products/") && url.pathname !== "/admin/products", { timeout: 15000 });
  91  |     await page.waitForLoadState("networkidle", { timeout: 10000 });
  92  | 
  93  |     // Capture the product ID from URL
  94  |     createdProductId = page.url().split("/").pop() ?? "";
  95  | 
  96  |     // Navigate to products list to verify
  97  |     console.log('Navigating to products list to verify');
  98  |     await page.goto(`${BASE}/admin/products`);
  99  |     await page.waitForLoadState("networkidle");
  100 | 
  101 |     console.log('Verifying product was created');
  102 |     await expect(page.getByText("E2E Test Product")).toBeVisible();
  103 | 
  104 |     // Capture final state
  105 |     await screenshot(page, "04-06-after-create-product");
  106 |     console.log('✅ 04-06 product creation test completed successfully');
  107 |   });
  108 | 
  109 |   test("04-07 draft product badge shows draft status", async () => {
  110 |     // Ensure we're on the products list page
  111 |     await page.goto(`${BASE}/admin/products`);
  112 |     await page.waitForLoadState("networkidle");
  113 |     
  114 |     // Check if product exists, create if needed (independent test)
  115 |     const existingRow = page.locator("tr").filter({ hasText: "E2E Test Product" });
  116 |     if (await existingRow.count() === 0) {
```