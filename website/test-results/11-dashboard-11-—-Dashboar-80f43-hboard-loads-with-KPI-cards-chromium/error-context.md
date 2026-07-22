# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-dashboard.spec.ts >> 11 — Dashboard: KPI Cards, Navigation, Recent Orders >> 11-01 dashboard loads with KPI cards
- Location: tests/e2e/11-dashboard.spec.ts:18:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-aG18ou --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301382
  - [pid=1301382][err] [1301382:1301382:0722/133858.883879:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301382][err] [1301382:1301382:0722/133858.883929:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301382] <gracefully close start>
  - [pid=1301382] <kill>
  - [pid=1301382] <will force kill>
  - [pid=1301382] <process did exit: exitCode=1, signal=null>
  - [pid=1301382] starting temporary directories cleanup
  - [pid=1301382] finished temporary directories cleanup
  - [pid=1301382] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1  | import { test, expect, type Browser, type Page } from "@playwright/test";
  2  | import { BASE, ORDER_ID, login, screenshot } from "./helpers";
  3  | 
  4  | test.describe("11 — Dashboard: KPI Cards, Navigation, Recent Orders", () => {
  5  |   test.describe.configure({ mode: "serial" });
  6  | 
  7  |   let page: Page;
  8  | 
  9  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  10 |     page = await browser.newPage();
  11 |     await login(page);
  12 |   });
  13 | 
  14 |   test.afterAll(async () => {
> 15 |     await page.close();
     |                ^ TypeError: Cannot read properties of undefined (reading 'close')
  16 |   });
  17 | 
  18 |   test("11-01 dashboard loads with KPI cards", async () => {
  19 |     await page.goto(`${BASE}/admin`);
  20 |     await page.waitForLoadState("networkidle");
  21 |     await screenshot(page, "11-01-dashboard-kpi-cards");
  22 |     const cards = page.locator(".stat-card");
  23 |     const count = await cards.count();
  24 |     expect(count).toBeGreaterThanOrEqual(4);
  25 |   });
  26 | 
  27 |   test("11-02 6 KPI cards are visible", async () => {
  28 |     const cards = page.locator(".stat-card");
  29 |     const count = await cards.count();
  30 |     expect(count).toBe(6);
  31 |     await screenshot(page, "11-02-all-6-kpi-cards");
  32 |   });
  33 | 
  34 |   test("11-03 KPI cards show numeric values", async () => {
  35 |     const statNums = page.locator(".stat-num");
  36 |     const count = await statNums.count();
  37 |     expect(count).toBeGreaterThanOrEqual(4);
  38 |     for (let i = 0; i < count; i++) {
  39 |       const text = await statNums.nth(i).textContent();
  40 |       expect(text?.trim()).toBeTruthy();
  41 |     }
  42 |     await screenshot(page, "11-03-kpi-values");
  43 |   });
  44 | 
  45 |   test("11-04 sidebar navigation is visible", async () => {
  46 |     const sidebar = page.locator(".sidebar, nav.sidebar, .cms-sidebar");
  47 |     await expect(sidebar.first()).toBeVisible();
  48 |     await screenshot(page, "11-04-sidebar-navigation");
  49 |   });
  50 | 
  51 |   test("11-05 sidebar has key nav links", async () => {
  52 |     const sidebar = page.locator(".sidebar, nav.sidebar, .cms-sidebar").first();
  53 |     await expect(sidebar.locator("a")).not.toHaveCount(0);
  54 |     const links = sidebar.locator("a");
  55 |     const count = await links.count();
  56 |     expect(count).toBeGreaterThanOrEqual(5);
  57 |     await screenshot(page, "11-05-sidebar-links");
  58 |   });
  59 | 
  60 |   test("11-06 navigate from sidebar to products", async () => {
  61 |     const productsLink = page.locator(".sidebar a, nav a").filter({ hasText: /products|produkt/i }).first();
  62 |     if (await productsLink.count() > 0) {
  63 |       await productsLink.click();
  64 |       await page.waitForLoadState("networkidle");
  65 |       await screenshot(page, "11-06-navigate-to-products");
  66 |       await expect(page).toHaveURL(new RegExp("/admin/products"));
  67 |     }
  68 |   });
  69 | 
  70 |   test("11-07 navigate from sidebar to orders", async () => {
  71 |     await page.goto(`${BASE}/admin`);
  72 |     await page.waitForLoadState("networkidle");
  73 |     const ordersLink = page.locator(".sidebar a, nav a").filter({ hasText: /orders|objedn/i }).first();
  74 |     if (await ordersLink.count() > 0) {
  75 |       await ordersLink.click();
  76 |       await page.waitForLoadState("networkidle");
  77 |       await screenshot(page, "11-07-navigate-to-orders");
  78 |       await expect(page).toHaveURL(new RegExp("/admin/orders"));
  79 |     }
  80 |   });
  81 | 
  82 |   test("11-08 dashboard stats-row is visible", async () => {
  83 |     await page.goto(`${BASE}/admin`);
  84 |     await page.waitForLoadState("networkidle");
  85 |     const statsRow = page.locator(".stats-row");
  86 |     await expect(statsRow).toBeVisible();
  87 |     await screenshot(page, "11-08-stats-row");
  88 |   });
  89 | });
  90 | 
```