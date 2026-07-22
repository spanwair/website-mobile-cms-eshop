# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-parties.spec.ts >> 02 — Parties: CRUD + Member Management >> 02-01 parties list loads with Test Organisation
- Location: tests/e2e/02-parties.spec.ts:20:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-xeP9y5 --remote-debugging-pipe --no-startup-window
  - <launched> pid=1300876
  - [pid=1300876][err] [1300876:1300876:0722/133850.002746:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1300876][err] [1300876:1300876:0722/133850.002797:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1300876] <gracefully close start>
  - [pid=1300876] <kill>
  - [pid=1300876] <will force kill>
  - [pid=1300876] <process did exit: exitCode=1, signal=null>
  - [pid=1300876] starting temporary directories cleanup
  - [pid=1300876] finished temporary directories cleanup
  - [pid=1300876] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, PARTY_ID, OWNER, loginAs, screenshot } from "./helpers";
  3   | 
  4   | test.describe("02 — Parties: CRUD + Member Management", () => {
  5   |   test.describe.configure({ mode: "serial" });
  6   | 
  7   |   let page: Page;
  8   |   let newPartyId = "";
  9   | 
  10  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  11  |     page = await browser.newPage();
  12  |     // Only OWNER (role=8) can create parties — use owner throughout this suite.
  13  |     await loginAs(page, OWNER.email, OWNER.password);
  14  |   });
  15  | 
  16  |   test.afterAll(async () => {
> 17  |     await page.close();
      |                ^ TypeError: Cannot read properties of undefined (reading 'close')
  18  |   });
  19  | 
  20  |   test("02-01 parties list loads with Test Organisation", async () => {
  21  |     await page.goto(`${BASE}/admin/parties`);
  22  |     await page.waitForLoadState("networkidle");
  23  |     await screenshot(page, "02-01-parties-list");
  24  |     await expect(page.locator("table.data-table")).toBeVisible();
  25  |     await expect(page.locator("table.data-table td").filter({ hasText: "Test Organisation" }).first()).toBeVisible();
  26  |   });
  27  | 
  28  |   test("02-02 navigate to new party form", async () => {
  29  |     await page.click("a.btn.btn-primary");
  30  |     await page.waitForURL(`${BASE}/admin/parties/new`);
  31  |     await screenshot(page, "02-02-new-party-form");
  32  |     await expect(page.locator("form.party-form")).toBeVisible();
  33  |   });
  34  | 
  35  |   test("02-03 create new party with all fields", async () => {
  36  |     await page.fill("input[name='name']", "E2E Test Org");
  37  |     await page.fill("input[name='slug']", "e2e-party");
  38  |     await page.fill("input[name='company_name']", "E2E Company s.r.o.");
  39  |     await page.fill("input[name='vat_number']", "CZ99999999");
  40  |     await page.fill("input[name='billing_email']", "billing@e2e.test");
  41  |     await screenshot(page, "02-03-new-party-filled");
  42  |     await page.locator("form.party-form button[type='submit']").click();
  43  |     await page.waitForURL(`${BASE}/admin/parties`, { timeout: 10000 });
  44  |     await screenshot(page, "02-03-after-create-party");
  45  |     await expect(page.locator("table.data-table td").filter({ hasText: "E2E Test Org" }).first()).toBeVisible();
  46  |   });
  47  | 
  48  |   test("02-04 new party appears in list with active badge", async () => {
  49  |     await expect(page.locator("table.data-table td").filter({ hasText: "E2E Test Org" }).first()).toBeVisible();
  50  |     const row = page.locator("tr").filter({ hasText: "E2E Test Org" });
  51  |     await expect(row.locator(".badge-active")).toBeVisible();
  52  |     await screenshot(page, "02-04-new-party-in-list");
  53  |   });
  54  | 
  55  |   test("02-05 duplicate slug shows error", async () => {
  56  |     await page.goto(`${BASE}/admin/parties/new`);
  57  |     await page.waitForLoadState("networkidle");
  58  |     await page.fill("input[name='name']", "Duplicate Org");
  59  |     await page.fill("input[name='slug']", "e2e-party");
  60  |     await page.locator("form.party-form button[type='submit']").click();
  61  |     await page.waitForLoadState("networkidle");
  62  |     await screenshot(page, "02-05-duplicate-slug-error");
  63  |     await expect(page.locator(".form-error")).toBeVisible();
  64  |   });
  65  | 
  66  |   test("02-06 navigate to Test Organisation detail", async () => {
  67  |     await page.goto(`${BASE}/admin/parties`);
  68  |     await page.waitForLoadState("networkidle");
  69  |     const row = page.locator("tr").filter({ hasText: "Test Organisation" });
  70  |     await row.locator("a.btn-ghost").click();
  71  |     await page.waitForLoadState("networkidle");
  72  |     await screenshot(page, "02-06-party-detail");
  73  |     await expect(page.locator("table.data-table")).toBeVisible();
  74  |     newPartyId = page.url().split("/").pop()!;
  75  |   });
  76  | 
  77  |   test("02-07 invite user to party", async () => {
  78  |     await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
  79  |     await page.waitForLoadState("networkidle");
  80  |     const userSelect = page.locator("form.invite-form select[name='user_id']");
  81  |     const count = await userSelect.locator("option").count();
  82  |     if (count > 1) {
  83  |       await userSelect.selectOption({ index: 1 });
  84  |       const roleSelect = page.locator("form.invite-form select[name='role_id']");
  85  |       await roleSelect.selectOption({ index: 0 });
  86  |       await screenshot(page, "02-07-invite-form-filled");
  87  |       await page.locator("form.invite-form button[type='submit']").click();
  88  |       await page.waitForLoadState("networkidle");
  89  |       await screenshot(page, "02-07-after-invite");
  90  |     } else {
  91  |       console.log("[02-07] No available users to invite (all already members)");
  92  |     }
  93  |     await expect(page.locator("table.data-table")).toBeVisible();
  94  |   });
  95  | 
  96  |   test("02-08 party detail shows members table", async () => {
  97  |     await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
  98  |     await page.waitForLoadState("networkidle");
  99  |     await screenshot(page, "02-08-party-members");
  100 |     await expect(page.locator("table.data-table")).toBeVisible();
  101 |     const rows = page.locator("table.data-table tbody tr");
  102 |     const count = await rows.count();
  103 |     expect(count).toBeGreaterThanOrEqual(1);
  104 |   });
  105 | 
  106 |   test("02-09 remove a member from party", async () => {
  107 |     await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
  108 |     await page.waitForLoadState("networkidle");
  109 |     const rows = page.locator("table.data-table tbody tr");
  110 |     const count = await rows.count();
  111 |     // Guard: only remove if there are more than the 2 seeded members (admin + eshop).
  112 |     // Members are ordered by joined_at DESC, so admin (seeded first) sits last —
  113 |     // removing the last row without this guard would delete admin and break later tests.
  114 |     if (count > 2) {
  115 |       const lastRow = rows.nth(count - 1);
  116 |       const removeBtn = lastRow.locator("button.btn-danger");
  117 |       if (await removeBtn.count() > 0) {
```