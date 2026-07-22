# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-categories.spec.ts >> 03 — Categories: CRUD + Tree Hierarchy >> 03-01 categories list page loads
- Location: tests/e2e/03-categories.spec.ts:20:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-cWYxaY --remote-debugging-pipe --no-startup-window
  - <launched> pid=1300908
  - [pid=1300908][err] [1300908:1300908:0722/133850.987293:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1300908][err] [1300908:1300908:0722/133850.987334:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1300908] <gracefully close start>
  - [pid=1300908] <kill>
  - [pid=1300908] <will force kill>
  - [pid=1300908] <process did exit: exitCode=1, signal=null>
  - [pid=1300908] starting temporary directories cleanup
  - [pid=1300908] finished temporary directories cleanup
  - [pid=1300908] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, login, screenshot } from "./helpers";
  3   | 
  4   | test.describe("03 — Categories: CRUD + Tree Hierarchy", () => {
  5   |   test.describe.configure({ mode: "serial" });
  6   | 
  7   |   let page: Page;
  8   |   let electronicsId = "";
  9   | 
  10  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  11  |     page = await browser.newPage();
  12  |     page.on("dialog", (d) => d.accept());
  13  |     await login(page);
  14  |   });
  15  | 
  16  |   test.afterAll(async () => {
> 17  |     await page.close();
      |                ^ TypeError: Cannot read properties of undefined (reading 'close')
  18  |   });
  19  | 
  20  |   test("03-01 categories list page loads", async () => {
  21  |     await page.goto(`${BASE}/admin/categories`);
  22  |     await page.waitForLoadState("networkidle");
  23  |     await screenshot(page, "03-01-categories-list");
  24  |     await expect(page.locator("table.data-table")).toBeVisible();
  25  |     await expect(page.locator(".toolbar a.btn-primary")).toBeVisible();
  26  |   });
  27  | 
  28  |   test("03-02 create root category Electronics", async () => {
  29  |     await page.click(".toolbar a.btn-primary");
  30  |     await page.waitForURL(`${BASE}/admin/categories/new`);
  31  |     await page.waitForLoadState("networkidle");
  32  |     await page.fill("input[name='name']", "Electronics");
  33  |     await page.fill("input[name='slug']", "electronics-e2e");
  34  |     await screenshot(page, "03-02-create-category-filled");
  35  |     await page.locator("form.cat-form button[type='submit']").click();
  36  |     await page.waitForURL(`${BASE}/admin/categories`, { timeout: 10000 });
  37  |     await screenshot(page, "03-02-after-create-electronics");
  38  |     await expect(page.getByText("Electronics")).toBeVisible();
  39  |   });
  40  | 
  41  |   test("03-03 Electronics shows in categories tree as root", async () => {
  42  |     const row = page.locator("tr").filter({ hasText: "Electronics" });
  43  |     await expect(row).toBeVisible();
  44  |     await screenshot(page, "03-03-electronics-in-tree");
  45  |     // Root category should have 0 children
  46  |     const childCount = row.locator("td").nth(2);
  47  |     await expect(childCount).toHaveText("0");
  48  |   });
  49  | 
  50  |   test("03-04 create child category Phones under Electronics", async () => {
  51  |     // Get the Electronics row edit link to find its ID
  52  |     const editLink = page.locator("tr").filter({ hasText: "Electronics" }).locator("a.btn-ghost");
  53  |     const href = await editLink.getAttribute("href");
  54  |     electronicsId = href?.split("/").pop() ?? "";
  55  | 
  56  |     await page.click(".toolbar a.btn-primary");
  57  |     await page.waitForURL(`${BASE}/admin/categories/new`);
  58  |     await page.waitForLoadState("networkidle");
  59  |     await page.fill("input[name='name']", "Phones");
  60  |     await page.fill("input[name='slug']", "phones-e2e");
  61  | 
  62  |     const parentSelect = page.locator("select[name='parent_id']");
  63  |     if (await parentSelect.locator("option").count() > 1) {
  64  |       await parentSelect.selectOption({ label: "Electronics" });
  65  |     }
  66  |     await screenshot(page, "03-04-create-phones-filled");
  67  |     await page.locator("form.cat-form button[type='submit']").click();
  68  |     await page.waitForURL(`${BASE}/admin/categories`, { timeout: 10000 });
  69  |     await screenshot(page, "03-04-after-create-phones");
  70  |     await expect(page.getByText("Phones")).toBeVisible();
  71  |   });
  72  | 
  73  |   test("03-05 child category shows indented under Electronics", async () => {
  74  |     await page.goto(`${BASE}/admin/categories`);
  75  |     await page.waitForLoadState("networkidle");
  76  |     await screenshot(page, "03-05-category-hierarchy");
  77  |     // Electronics should now have 1 child
  78  |     const elRow = page.locator("tr").filter({ hasText: "Electronics" });
  79  |     await expect(elRow).toBeVisible();
  80  |     await expect(page.getByText("Phones")).toBeVisible();
  81  |     // Phones row should contain the tree indent marker
  82  |     const phonesRow = page.locator("tr").filter({ hasText: "Phones" });
  83  |     await expect(phonesRow.locator(".tree-indent")).toBeVisible();
  84  |   });
  85  | 
  86  |   test("03-06 create category with icon field", async () => {
  87  |     await page.click(".toolbar a.btn-primary");
  88  |     await page.waitForURL(`${BASE}/admin/categories/new`);
  89  |     await page.waitForLoadState("networkidle");
  90  |     await page.fill("input[name='name']", "Accessories");
  91  |     await page.fill("input[name='slug']", "accessories-e2e");
  92  |     await page.fill("input[name='icon']", "🎧");
  93  |     await page.fill("input[name='sort_order']", "5");
  94  |     await screenshot(page, "03-06-category-with-icon");
  95  |     await page.locator("form.cat-form button[type='submit']").click();
  96  |     await page.waitForURL(`${BASE}/admin/categories`, { timeout: 10000 });
  97  |     await expect(page.getByText("Accessories")).toBeVisible();
  98  |     await screenshot(page, "03-06-accessories-in-list");
  99  |   });
  100 | 
  101 |   test("03-07 edit a category — change name", async () => {
  102 |     const editLink = page.locator("tr").filter({ hasText: "Accessories" }).locator("a.btn-ghost");
  103 |     await editLink.click();
  104 |     await page.waitForLoadState("networkidle");
  105 |     await screenshot(page, "03-07-edit-category-form");
  106 |     await page.fill("input[name='name']", "Accessories Updated");
  107 |     await screenshot(page, "03-07-edit-filled");
  108 |     await page.locator("form.cat-form button.btn-primary").click();
  109 |     await page.waitForURL(`${BASE}/admin/categories`, { timeout: 10000 });
  110 |     await screenshot(page, "03-07-after-edit");
  111 |     await expect(page.getByText("Accessories Updated")).toBeVisible();
  112 |   });
  113 | 
  114 |   test("03-08 duplicate slug shows form-error", async () => {
  115 |     await page.click(".toolbar a.btn-primary");
  116 |     await page.waitForURL(`${BASE}/admin/categories/new`);
  117 |     await page.waitForLoadState("networkidle");
```