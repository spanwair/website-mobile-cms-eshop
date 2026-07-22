# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-orders.spec.ts >> 05 — Orders: Status Workflow, Detail, Tracking >> 05-01 orders list loads with seeded order
- Location: tests/e2e/05-orders.spec.ts:18:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-6pvy8b --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301085
  - [pid=1301085][err] [1301085:1301085:0722/133852.955016:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301085][err] [1301085:1301085:0722/133852.955060:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301085] <gracefully close start>
  - [pid=1301085] <kill>
  - [pid=1301085] <will force kill>
  - [pid=1301085] <process did exit: exitCode=1, signal=null>
  - [pid=1301085] starting temporary directories cleanup
  - [pid=1301085] finished temporary directories cleanup
  - [pid=1301085] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, ORDER_ID, CUSTOMER_ID, login, screenshot } from "./helpers";
  3   | 
  4   | test.describe("05 — Orders: Status Workflow, Detail, Tracking", () => {
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
  18  |   test("05-01 orders list loads with seeded order", async () => {
  19  |     await page.goto(`${BASE}/admin/orders`);
  20  |     await page.waitForLoadState("networkidle");
  21  |     await screenshot(page, "05-01-orders-list");
  22  |     await expect(page.locator("table.data-table")).toBeVisible();
  23  |     await expect(page.getByText("ORD-SEED-001")).toBeVisible();
  24  |   });
  25  | 
  26  |   test("05-02 status tabs are visible", async () => {
  27  |     const tabs = page.locator(".tabs .tab");
  28  |     const count = await tabs.count();
  29  |     expect(count).toBeGreaterThanOrEqual(4);
  30  |     await screenshot(page, "05-02-status-tabs");
  31  |   });
  32  | 
  33  |   test("05-03 Pending tab shows seeded order", async () => {
  34  |     await page.goto(`${BASE}/admin/orders?status=pending`);
  35  |     await page.waitForLoadState("networkidle");
  36  |     await screenshot(page, "05-03-pending-tab");
  37  |     await expect(page.getByText("ORD-SEED-001")).toBeVisible();
  38  |   });
  39  | 
  40  |   test("05-04 Confirmed tab is initially empty", async () => {
  41  |     await page.goto(`${BASE}/admin/orders?status=confirmed`);
  42  |     await page.waitForLoadState("networkidle");
  43  |     await screenshot(page, "05-04-confirmed-tab-empty");
  44  |     await expect(page.getByText("ORD-SEED-001")).not.toBeVisible();
  45  |   });
  46  | 
  47  |   test("05-05 open order detail page", async () => {
  48  |     await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
  49  |     await page.waitForLoadState("networkidle");
  50  |     await screenshot(page, "05-05-order-detail");
  51  |     await expect(page.getByText("ORD-SEED-001")).toBeVisible();
  52  |     await expect(page.locator(".badge-pending")).toBeVisible();
  53  |   });
  54  | 
  55  |   test("05-06 customer link on order detail navigates to customer", async () => {
  56  |     const customerLink = page.locator("a.btn-ghost").filter({ hasText: /customer|jan test/i }).first();
  57  |     if (await customerLink.count() > 0) {
  58  |       await customerLink.click();
  59  |       await page.waitForLoadState("networkidle");
  60  |       await screenshot(page, "05-06-customer-from-order");
  61  |       await expect(page).toHaveURL(new RegExp(`/admin/customers/${CUSTOMER_ID}`));
  62  |       await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
  63  |       await page.waitForLoadState("networkidle");
  64  |     }
  65  |   });
  66  | 
  67  |   test("05-07 transition pending → confirmed", async () => {
  68  |     await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
  69  |     await page.waitForLoadState("networkidle");
  70  |     const statusSelect = page.locator("form.status-form select[name='to_status']");
  71  |     await statusSelect.selectOption("confirmed");
  72  |     const noteInput = page.locator("form.status-form input[name='note']");
  73  |     await noteInput.fill("Confirmed by E2E test");
  74  |     await screenshot(page, "05-07-confirm-order-form");
  75  |     await page.locator("form.status-form button[type='submit']").click();
  76  |     await page.waitForLoadState("networkidle");
  77  |     await screenshot(page, "05-07-after-confirm");
  78  |     await expect(page.locator(".badge-active, .badge").filter({ hasText: /confirmed/i })).toBeVisible();
  79  |   });
  80  | 
  81  |   test("05-08 transition confirmed → processing", async () => {
  82  |     const statusSelect = page.locator("form.status-form select[name='to_status']");
  83  |     await statusSelect.selectOption("processing");
  84  |     await page.locator("form.status-form button[type='submit']").click();
  85  |     await page.waitForLoadState("networkidle");
  86  |     await screenshot(page, "05-08-order-processing");
  87  |     await expect(page.locator(".badge").filter({ hasText: /processing/i })).toBeVisible();
  88  |   });
  89  | 
  90  |   test("05-09 transition processing → shipped with tracking number", async () => {
  91  |     const statusSelect = page.locator("form.status-form select[name='to_status']");
  92  |     await statusSelect.selectOption("shipped");
  93  |     await screenshot(page, "05-09-ship-form");
  94  |     await page.locator("form.status-form button[type='submit']").click();
  95  |     await page.waitForLoadState("networkidle");
  96  | 
  97  |     // Set tracking number
  98  |     const trackingForm = page.locator("form.tracking-form");
  99  |     if (await trackingForm.count() > 0) {
  100 |       await trackingForm.locator("input[name='tracking_number']").fill("TRACK-E2E-001");
  101 |       await trackingForm.locator("button[type='submit']").click();
  102 |       await page.waitForLoadState("networkidle");
  103 |     }
  104 |     await screenshot(page, "05-09-after-shipped");
  105 |     await expect(page.locator(".badge").filter({ hasText: /shipped/i })).toBeVisible();
  106 |   });
  107 | 
  108 |   test("05-10 tracking number is visible on order detail", async () => {
  109 |     await page.goto(`${BASE}/admin/orders/${ORDER_ID}`);
  110 |     await page.waitForLoadState("networkidle");
  111 |     await screenshot(page, "05-10-tracking-number-visible");
  112 |     const trackingInput = page.locator("form.tracking-form input[name='tracking_number']");
  113 |     if (await trackingInput.count() > 0) {
  114 |       await expect(trackingInput).toHaveValue("TRACK-E2E-001");
  115 |     }
```