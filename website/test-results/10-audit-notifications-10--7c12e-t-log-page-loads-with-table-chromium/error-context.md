# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 10-audit-notifications.spec.ts >> 10 — Audit Log + Notifications >> 10-01 audit log page loads with table
- Location: tests/e2e/10-audit-notifications.spec.ts:18:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-EVAxxC --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301330
  - [pid=1301330][err] [1301330:1301330:0722/133857.916302:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301330][err] [1301330:1301330:0722/133857.916384:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301330] <gracefully close start>
  - [pid=1301330] <kill>
  - [pid=1301330] <will force kill>
  - [pid=1301330] <process did exit: exitCode=1, signal=null>
  - [pid=1301330] starting temporary directories cleanup
  - [pid=1301330] finished temporary directories cleanup
  - [pid=1301330] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, login, screenshot } from "./helpers";
  3   | 
  4   | test.describe("10 — Audit Log + Notifications", () => {
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
  18  |   test("10-01 audit log page loads with table", async () => {
  19  |     await page.goto(`${BASE}/admin/audit`);
  20  |     await page.waitForLoadState("networkidle");
  21  |     await screenshot(page, "10-01-audit-log-page");
  22  |     await expect(page.locator("table.data-table")).toBeVisible();
  23  |   });
  24  | 
  25  |   test("10-02 audit log has filter by table dropdown", async () => {
  26  |     const filterForm = page.locator("form.filter-form");
  27  |     await expect(filterForm).toBeVisible();
  28  |     const tableSelect = filterForm.locator("select[name='table']");
  29  |     await expect(tableSelect).toBeVisible();
  30  |     await screenshot(page, "10-02-audit-filter-dropdown");
  31  |   });
  32  | 
  33  |   test("10-03 audit log shows total count", async () => {
  34  |     const totalLabel = page.locator(".total-label");
  35  |     await expect(totalLabel).toBeVisible();
  36  |     await screenshot(page, "10-03-audit-total-count");
  37  |   });
  38  | 
  39  |   test("10-04 filter by table name shows relevant entries", async () => {
  40  |     const filterForm = page.locator("form.filter-form");
  41  |     const tableSelect = filterForm.locator("select[name='table']");
  42  |     const options = await tableSelect.locator("option").count();
  43  |     if (options > 1) {
  44  |       await tableSelect.selectOption({ index: 1 });
  45  |       await filterForm.locator("button[type='submit']").click();
  46  |       await page.waitForLoadState("networkidle");
  47  |       await screenshot(page, "10-04-filtered-audit-entries");
  48  |       await expect(page.locator("table.data-table")).toBeVisible();
  49  |     }
  50  |   });
  51  | 
  52  |   test("10-05 clear filter shows all audit logs", async () => {
  53  |     const clearBtn = page.locator(".toolbar a.btn-ghost, .toolbar button.btn-ghost");
  54  |     if (await clearBtn.count() > 0) {
  55  |       await clearBtn.first().click();
  56  |       await page.waitForLoadState("networkidle");
  57  |     } else {
  58  |       await page.goto(`${BASE}/admin/audit`);
  59  |       await page.waitForLoadState("networkidle");
  60  |     }
  61  |     await screenshot(page, "10-05-audit-all-entries");
  62  |     await expect(page.locator("table.data-table")).toBeVisible();
  63  |   });
  64  | 
  65  |   test("10-06 action badges shown for audit entries (if any)", async () => {
  66  |     const badges = page.locator("table.data-table tbody tr td .badge");
  67  |     const count = await badges.count();
  68  |     if (count > 0) {
  69  |       await expect(badges.first()).toBeVisible();
  70  |     }
  71  |     await screenshot(page, "10-06-action-badge-colors");
  72  |   });
  73  | 
  74  |   test("10-07 notifications page loads", async () => {
  75  |     await page.goto(`${BASE}/admin/notifications`);
  76  |     await page.waitForLoadState("networkidle");
  77  |     await screenshot(page, "10-07-notifications-page");
  78  |     await expect(page.locator("table.data-table")).toBeVisible();
  79  |   });
  80  | 
  81  |   test("10-08 seeded notification is visible", async () => {
  82  |     await expect(page.getByRole("cell", { name: "Test Notification", exact: true })).toBeVisible();
  83  |     await screenshot(page, "10-08-seeded-notification");
  84  |   });
  85  | 
  86  |   test("10-09 seeded notification shows Unread badge", async () => {
  87  |     const notifRow = page.locator("tr").filter({ hasText: "Test Notification" });
  88  |     const unreadBadge = notifRow.locator(".badge-active");
  89  |     await expect(unreadBadge).toBeVisible();
  90  |     await screenshot(page, "10-09-unread-badge");
  91  |   });
  92  | 
  93  |   test("10-10 unread notification row has bold styling", async () => {
  94  |     const notifRow = page.locator("tr.unread").first();
  95  |     if (await notifRow.count() > 0) {
  96  |       await expect(notifRow).toBeVisible();
  97  |       await screenshot(page, "10-10-unread-row-bold");
  98  |     }
  99  |   });
  100 | });
  101 | 
```