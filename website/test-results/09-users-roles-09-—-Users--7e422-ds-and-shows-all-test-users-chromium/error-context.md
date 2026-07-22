# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-users-roles.spec.ts >> 09 — Users & Roles: Role Management, Custom Roles >> 09-01 users list loads and shows all test users
- Location: tests/e2e/09-users-roles.spec.ts:19:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-VjJOtF --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301297
  - [pid=1301297][err] [1301297:1301297:0722/133856.907749:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301297][err] [1301297:1301297:0722/133856.907816:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301297] <gracefully close start>
  - [pid=1301297] <kill>
  - [pid=1301297] <will force kill>
  - [pid=1301297] <process did exit: exitCode=1, signal=null>
  - [pid=1301297] starting temporary directories cleanup
  - [pid=1301297] finished temporary directories cleanup
  - [pid=1301297] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser, type Page } from "@playwright/test";
  2   | import { BASE, ADMIN_ID, USER_ID, login, screenshot } from "./helpers";
  3   | 
  4   | test.describe("09 — Users & Roles: Role Management, Custom Roles", () => {
  5   |   test.describe.configure({ mode: "serial" });
  6   | 
  7   |   let page: Page;
  8   |   let createdRoleVisible = false;
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
  19  |   test("09-01 users list loads and shows all test users", async () => {
  20  |     await page.goto(`${BASE}/admin/users`);
  21  |     await page.waitForLoadState("networkidle");
  22  |     await screenshot(page, "09-01-users-list");
  23  |     await expect(page.locator("table.data-table")).toBeVisible();
  24  |     await expect(page.getByText("admin@test.com")).toBeVisible();
  25  |   });
  26  | 
  27  |   test("09-02 admin user shows ADMIN badge", async () => {
  28  |     const adminRow = page.locator("tr").filter({ hasText: "admin@test.com" });
  29  |     await expect(adminRow).toBeVisible();
  30  |     const badge = adminRow.locator(".badge-pending");
  31  |     await expect(badge).toBeVisible();
  32  |     await screenshot(page, "09-02-admin-badge");
  33  |   });
  34  | 
  35  |   test("09-03 current user row shows 'You' indicator", async () => {
  36  |     const adminRow = page.locator("tr").filter({ hasText: "admin@test.com" });
  37  |     // "You" in Czech is "Vy" — match either locale
  38  |     await expect(adminRow.getByText(/you|vy/i)).toBeVisible();
  39  |     await screenshot(page, "09-03-you-indicator");
  40  |   });
  41  | 
  42  |   test("09-04 other user rows show role change form", async () => {
  43  |     const userRow = page.locator("tr").filter({ hasText: "user@test.com" });
  44  |     if (await userRow.count() > 0) {
  45  |       const roleForm = userRow.locator("form.role-form");
  46  |       await expect(roleForm).toBeVisible();
  47  |       await screenshot(page, "09-04-role-change-form");
  48  |     }
  49  |   });
  50  | 
  51  |   test("09-05 change user@test.com to ESHOP_ADMIN role", async () => {
  52  |     const userRow = page.locator("tr").filter({ hasText: "user@test.com" });
  53  |     if (await userRow.count() > 0) {
  54  |       const roleSelect = userRow.locator("select[name='role']");
  55  |       await roleSelect.selectOption("2");
  56  |       await screenshot(page, "09-05-role-change-filled");
  57  |       await userRow.locator("form.role-form button[type='submit']").click();
  58  |       await page.waitForURL(`${BASE}/admin/users`, { timeout: 10000 });
  59  |       await page.waitForLoadState("networkidle");
  60  |       await screenshot(page, "09-05-after-role-change");
  61  |       const updatedRow = page.locator("tr").filter({ hasText: "user@test.com" });
  62  |       const badge = updatedRow.locator(".badge-draft, .badge");
  63  |       await expect(badge.first()).toBeVisible();
  64  | 
  65  |       // Revert user@test.com back to USER role so later tests (12-04) are not affected
  66  |       const revertSelect = updatedRow.locator("select[name='role']");
  67  |       await revertSelect.selectOption("1");
  68  |       await updatedRow.locator("form.role-form button[type='submit']").click();
  69  |       await page.waitForURL(`${BASE}/admin/users`, { timeout: 10000 });
  70  |       await page.waitForLoadState("networkidle");
  71  |     }
  72  |   });
  73  | 
  74  |   test("09-06 users list shows user count in toolbar", async () => {
  75  |     const toolbar = page.locator(".toolbar .total-label");
  76  |     await expect(toolbar).toBeVisible();
  77  |     await screenshot(page, "09-06-users-count");
  78  |   });
  79  | 
  80  |   test("09-07 roles list loads", async () => {
  81  |     await page.goto(`${BASE}/admin/roles`);
  82  |     await page.waitForLoadState("networkidle");
  83  |     await screenshot(page, "09-07-roles-list");
  84  |     await expect(page.locator("table.data-table")).toBeVisible();
  85  |   });
  86  | 
  87  |   test("09-08 Super Admin system role is visible", async () => {
  88  |     await expect(page.getByText("Super Admin")).toBeVisible();
  89  |     const superAdminRow = page.locator("tr").filter({ hasText: "Super Admin" });
  90  |     const systemBadge = superAdminRow.locator(".badge-pending");
  91  |     await expect(systemBadge).toBeVisible();
  92  |     await screenshot(page, "09-08-super-admin-system-role");
  93  |   });
  94  | 
  95  |   test("09-09 Super Admin has no delete button", async () => {
  96  |     const superAdminRow = page.locator("tr").filter({ hasText: "Super Admin" });
  97  |     const deleteBtn = superAdminRow.locator("button.btn-danger");
  98  |     await expect(deleteBtn).not.toBeVisible();
  99  |     await screenshot(page, "09-09-no-delete-for-system-role");
  100 |   });
  101 | 
  102 |   test("09-10 navigate to new role form", async () => {
  103 |     await page.click(".toolbar a.btn-primary");
  104 |     await page.waitForURL(`${BASE}/admin/roles/new`);
  105 |     await page.waitForLoadState("networkidle");
  106 |     await screenshot(page, "09-10-new-role-form");
  107 |     await expect(page.locator("form.role-form")).toBeVisible();
  108 |   });
  109 | 
  110 |   test("09-11 create custom role Viewer with 2 permissions", async () => {
  111 |     await page.fill("input[name='name']", "E2E Viewer");
  112 |     await page.fill("input[name='description']", "Read-only viewer for E2E tests");
  113 |     // Check VIEW_DASHBOARD (bit=1) and MANAGE_REPORTS (bit=512)
  114 |     const dashPerm = page.locator("input[name='perm_VIEW_DASHBOARD']");
  115 |     const reportPerm = page.locator("input[name='perm_MANAGE_REPORTS']");
  116 |     if (await dashPerm.count() > 0) {
```