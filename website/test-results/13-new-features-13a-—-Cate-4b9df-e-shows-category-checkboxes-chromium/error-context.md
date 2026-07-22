# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 13-new-features.spec.ts >> 13a — Categories on Products >> 13a-01 product edit page shows category checkboxes
- Location: tests/e2e/13-new-features.spec.ts:39:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-h1CAyj --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301450
  - [pid=1301450][err] [1301450:1301450:0722/133900.776495:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301450][err] [1301450:1301450:0722/133900.776589:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301450] <gracefully close start>
  - [pid=1301450] <kill>
  - [pid=1301450] <will force kill>
  - [pid=1301450] <process did exit: exitCode=1, signal=null>
  - [pid=1301450] starting temporary directories cleanup
  - [pid=1301450] finished temporary directories cleanup
  - [pid=1301450] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect, type Browser } from "@playwright/test";
  2   | import path from "path";
  3   | import fs from "fs";
  4   | import { BASE, ADMIN, ESHOP, OWNER, PRODUCT_ID, CATEGORY_ID, login, loginAs, screenshot } from "./helpers";
  5   | 
  6   | // One tiny 1x1 PNG written to disk once, reused for all image upload tests.
  7   | const FIXTURES_DIR = path.join(process.cwd(), "tests", "fixtures");
  8   | const TEST_IMAGE = path.join(FIXTURES_DIR, "test-image.png");
  9   | 
  10  | function ensureTestImage() {
  11  |   if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  12  |   if (!fs.existsSync(TEST_IMAGE)) {
  13  |     // Minimal 1x1 grey PNG
  14  |     const png = Buffer.from(
  15  |       "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==",
  16  |       "base64"
  17  |     );
  18  |     fs.writeFileSync(TEST_IMAGE, png);
  19  |   }
  20  | }
  21  | 
  22  | // ── 13a: Categories on Products ───────────────────────────────────────────────
  23  | 
  24  | test.describe("13a — Categories on Products", () => {
  25  |   test.describe.configure({ mode: "serial" });
  26  | 
  27  |   let page: import("@playwright/test").Page;
  28  | 
  29  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  30  |     page = await browser.newPage();
  31  |     page.on("dialog", (d) => d.accept());
  32  |     await login(page);
  33  |   });
  34  | 
  35  |   test.afterAll(async () => {
> 36  |     await page.close();
      |                ^ TypeError: Cannot read properties of undefined (reading 'close')
  37  |   });
  38  | 
  39  |   test("13a-01 product edit page shows category checkboxes", async () => {
  40  |     await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
  41  |     await page.waitForLoadState("networkidle");
  42  |     await screenshot(page, "13a-01-product-with-categories");
  43  |     const grid = page.locator(".checkbox-grid");
  44  |     await expect(grid).toBeVisible();
  45  |     const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
  46  |     await expect(catCheckbox).toBeVisible();
  47  |   });
  48  | 
  49  |   test("13a-02 seed category starts unchecked", async () => {
  50  |     const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
  51  |     await expect(catCheckbox).not.toBeChecked();
  52  |   });
  53  | 
  54  |   test("13a-03 assign category and save", async () => {
  55  |     const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
  56  |     await catCheckbox.check();
  57  |     await screenshot(page, "13a-03-category-checked");
  58  |     await page.locator("form.product-form button[type='submit']").click();
  59  |     await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
  60  |     await page.waitForLoadState("networkidle");
  61  |   });
  62  | 
  63  |   test("13a-04 category assignment persists after reload", async () => {
  64  |     await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
  65  |     await page.waitForLoadState("networkidle");
  66  |     await screenshot(page, "13a-04-category-persisted");
  67  |     const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
  68  |     await expect(catCheckbox).toBeChecked();
  69  |   });
  70  | 
  71  |   test("13a-05 unassign category and save", async () => {
  72  |     const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
  73  |     await catCheckbox.uncheck();
  74  |     await page.locator("form.product-form button[type='submit']").click();
  75  |     await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
  76  |     await page.waitForLoadState("networkidle");
  77  |   });
  78  | 
  79  |   test("13a-06 unassignment persists after reload", async () => {
  80  |     await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
  81  |     await page.waitForLoadState("networkidle");
  82  |     await screenshot(page, "13a-06-category-unchecked");
  83  |     const catCheckbox = page.locator(`input[name="category_ids[]"][value="${CATEGORY_ID}"]`);
  84  |     await expect(catCheckbox).not.toBeChecked();
  85  |   });
  86  | });
  87  | 
  88  | // ── 13b: Product Image Uploads ────────────────────────────────────────────────
  89  | 
  90  | test.describe("13b — Product Image Uploads", () => {
  91  |   test.describe.configure({ mode: "serial" });
  92  | 
  93  |   let page: import("@playwright/test").Page;
  94  | 
  95  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  96  |     ensureTestImage();
  97  |     page = await browser.newPage();
  98  |     page.on("dialog", (d) => d.accept());
  99  |     await login(page);
  100 |     await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
  101 |     await page.waitForLoadState("networkidle");
  102 |   });
  103 | 
  104 |   test.afterAll(async () => {
  105 |     await page.close();
  106 |   });
  107 | 
  108 |   test("13b-01 upload form is visible on product page", async () => {
  109 |     await screenshot(page, "13b-01-upload-form");
  110 |     const uploadForm = page.locator("form.upload-form").first();
  111 |     await expect(uploadForm).toBeVisible();
  112 |     // File input is hidden by CSS (triggered via button) — check the submit button instead
  113 |     await expect(uploadForm.locator("button[type='submit']")).toBeVisible();
  114 |   });
  115 | 
  116 |   test("13b-02 upload a product image", async () => {
  117 |     // The image upload form is the second form.upload-form (first is video upload)
  118 |     const imageForm = page.locator("form.upload-form").nth(1);
  119 |     const fileInput = imageForm.locator("input[type='file']");
  120 |     await fileInput.setInputFiles(TEST_IMAGE);
  121 |     await imageForm.locator("input[name='image_alt']").fill("E2E test image");
  122 |     await screenshot(page, "13b-02-file-selected");
  123 |     await imageForm.locator("button[type='submit']").click();
  124 |     await page.waitForURL(`${BASE}/admin/products/${PRODUCT_ID}`, { timeout: 20000 });
  125 |     await page.waitForLoadState("networkidle");
  126 |   });
  127 | 
  128 |   test("13b-03 uploaded image appears in gallery", async () => {
  129 |     await screenshot(page, "13b-03-image-in-gallery");
  130 |     // Image section is the second .media-card; .media-grid only renders when images exist
  131 |     const imageSection = page.locator(".media-card").nth(1);
  132 |     const imageGrid = imageSection.locator(".media-grid");
  133 |     await expect(imageGrid).toBeVisible();
  134 |     await expect(imageGrid.locator(".media-item").first()).toBeVisible();
  135 |   });
  136 | 
```