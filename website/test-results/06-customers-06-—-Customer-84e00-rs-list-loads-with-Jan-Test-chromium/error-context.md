# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-customers.spec.ts >> 06 — Customers: CRUD, Search, Order History >> 06-01 customers list loads with Jan Test
- Location: tests/e2e/06-customers.spec.ts:18:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-7ay02U --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301119
  - [pid=1301119][err] [1301119:1301119:0722/133853.934312:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301119][err] [1301119:1301119:0722/133853.934356:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301119] <gracefully close start>
  - [pid=1301119] <kill>
  - [pid=1301119] <will force kill>
  - [pid=1301119] <process did exit: exitCode=1, signal=null>
  - [pid=1301119] starting temporary directories cleanup
  - [pid=1301119] finished temporary directories cleanup
  - [pid=1301119] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, CUSTOMER_ID, ORDER_ID, login, screenshot } from "./helpers";
  3   | 
  4   | test.describe("06 — Customers: CRUD, Search, Order History", () => {
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
  18  |   test("06-01 customers list loads with Jan Test", async () => {
  19  |     await page.goto(`${BASE}/admin/customers`);
  20  |     await page.waitForLoadState("networkidle");
  21  |     await screenshot(page, "06-01-customers-list");
  22  |     await expect(page.locator("table.data-table")).toBeVisible();
  23  |     await expect(page.getByText("Jan Test")).toBeVisible();
  24  |   });
  25  | 
  26  |   test("06-02 search by first name finds customer", async () => {
  27  |     await page.fill("input[name='search']", "Jan");
  28  |     await page.locator("form.search-form button[type='submit']").click();
  29  |     await page.waitForLoadState("networkidle");
  30  |     await screenshot(page, "06-02-search-jan-test");
  31  |     await expect(page.getByText("Jan")).toBeVisible();
  32  |     const rows = page.locator("table.data-table tbody tr");
  33  |     const count = await rows.count();
  34  |     expect(count).toBeGreaterThanOrEqual(1);
  35  |   });
  36  | 
  37  |   test("06-03 search by email finds customer", async () => {
  38  |     await page.fill("input[name='search']", "customer@test.com");
  39  |     await page.locator("form.search-form button[type='submit']").click();
  40  |     await page.waitForLoadState("networkidle");
  41  |     await screenshot(page, "06-03-search-by-email");
  42  |     await expect(page.getByText("customer@test.com")).toBeVisible();
  43  |   });
  44  | 
  45  |   test("06-04 customer shows Active badge", async () => {
  46  |     await page.goto(`${BASE}/admin/customers`);
  47  |     await page.waitForLoadState("networkidle");
  48  |     const row = page.locator("tr").filter({ hasText: "Jan Test" });
  49  |     await expect(row.locator(".badge-active")).toBeVisible();
  50  |     await screenshot(page, "06-04-customer-active-badge");
  51  |   });
  52  | 
  53  |   test("06-05 open customer detail page", async () => {
  54  |     const row = page.locator("tr").filter({ hasText: "Jan Test" });
  55  |     await row.locator("a.btn-ghost").click();
  56  |     await page.waitForLoadState("networkidle");
  57  |     await screenshot(page, "06-05-customer-detail");
  58  |     await expect(page).toHaveURL(new RegExp(`/admin/customers/${CUSTOMER_ID}`));
  59  |     await expect(page.locator("form.info-form")).toBeVisible();
  60  |   });
  61  | 
  62  |   test("06-06 customer detail pre-fills correct values", async () => {
  63  |     const firstName = page.locator("input[name='first_name']");
  64  |     const lastName = page.locator("input[name='last_name']");
  65  |     const email = page.locator("input[name='email']");
  66  |     await expect(firstName).toHaveValue("Jan");
  67  |     await expect(lastName).toHaveValue("Test");
  68  |     await expect(email).toHaveValue("customer@test.com");
  69  |     await screenshot(page, "06-06-customer-fields-prefilled");
  70  |   });
  71  | 
  72  |   test("06-07 edit customer — add phone and notes", async () => {
  73  |     const phone = page.locator("input[name='phone']");
  74  |     await phone.fill("+420987654321");
  75  |     const notes = page.locator("textarea[name='notes'], input[name='notes']").first();
  76  |     if (await notes.count() > 0) {
  77  |       await notes.fill("E2E test customer note");
  78  |     }
  79  |     await screenshot(page, "06-07-customer-edit-filled");
  80  |     await page.locator("form.info-form button[type='submit']").click();
  81  |     await page.waitForLoadState("networkidle");
  82  |     await screenshot(page, "06-07-after-customer-edit");
  83  |     await expect(page.locator("input[name='phone']")).toHaveValue("+420987654321");
  84  |   });
  85  | 
  86  |   test("06-08 customer order history shows seeded order", async () => {
  87  |     await page.goto(`${BASE}/admin/customers/${CUSTOMER_ID}`);
  88  |     await page.waitForLoadState("networkidle");
  89  |     await screenshot(page, "06-08-customer-order-history");
  90  |     await expect(page.getByText("ORD-SEED-001")).toBeVisible();
  91  |   });
  92  | 
  93  |   test("06-09 click order link from customer navigates to order detail", async () => {
  94  |     const orderLink = page.locator("a").filter({ hasText: /ORD-SEED-001/i });
  95  |     if (await orderLink.count() > 0) {
  96  |       await orderLink.click();
  97  |       await page.waitForLoadState("networkidle");
  98  |       await screenshot(page, "06-09-order-from-customer-link");
  99  |       await expect(page).toHaveURL(new RegExp(`/admin/orders/${ORDER_ID}`));
  100 |       await page.goto(`${BASE}/admin/customers/${CUSTOMER_ID}`);
  101 |       await page.waitForLoadState("networkidle");
  102 |     }
  103 |   });
  104 | 
  105 |   test("06-10 clear search shows all customers", async () => {
  106 |     await page.goto(`${BASE}/admin/customers`);
  107 |     await page.waitForLoadState("networkidle");
  108 |     await screenshot(page, "06-10-all-customers");
  109 |     await expect(page.getByText("Jan Test")).toBeVisible();
  110 |   });
  111 | });
  112 | 
```