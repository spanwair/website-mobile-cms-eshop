# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 13-new-features.spec.ts >> 13b — Product Image Uploads >> 13b-01 upload form is visible on product page
- Location: tests/e2e/13-new-features.spec.ts:108:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-qsndf9 --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301483
  - [pid=1301483][err] [1301483:1301483:0722/133901.717137:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301483][err] [1301483:1301483:0722/133901.717191:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301483] <gracefully close start>
  - [pid=1301483] <kill>
  - [pid=1301483] <will force kill>
  - [pid=1301483] <process did exit: exitCode=1, signal=null>
  - [pid=1301483] starting temporary directories cleanup
  - [pid=1301483] finished temporary directories cleanup
  - [pid=1301483] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
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
  36  |     await page.close();
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
> 105 |     await page.close();
      |                ^ TypeError: Cannot read properties of undefined (reading 'close')
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
  137 |   test("13b-04 first image is not primary (shows Set Primary button)", async () => {
  138 |     const imageSection = page.locator(".media-card").nth(1);
  139 |     // Set Primary button uses btn-secondary class; Delete uses btn-danger
  140 |     const setPrimaryBtn = imageSection.locator(".media-item .btn-secondary").first();
  141 |     await expect(setPrimaryBtn).toBeVisible();
  142 |     // No primary badge yet
  143 |     await expect(imageSection.locator(".primary-badge")).not.toBeVisible();
  144 |   });
  145 | 
  146 |   test("13b-05 set image as primary", async () => {
  147 |     const imageSection = page.locator(".media-card").nth(1);
  148 |     await imageSection.locator(".media-item .btn-secondary").first().click();
  149 |     await page.waitForURL(`${BASE}/admin/products/${PRODUCT_ID}`, { timeout: 10000 });
  150 |     await page.waitForLoadState("networkidle");
  151 |     await screenshot(page, "13b-05-primary-set");
  152 |     const imageSection2 = page.locator(".media-card").nth(1);
  153 |     await expect(imageSection2.locator(".primary-badge").first()).toBeVisible();
  154 |     // The first image (now primary) no longer shows Set Primary button
  155 |     // (other images from previous runs may still show it — check only first item)
  156 |     await expect(imageSection2.locator(".media-item").first().locator(".btn-secondary")).not.toBeVisible();
  157 |   });
  158 | 
  159 |   test("13b-06 delete the image", async () => {
  160 |     const imageSection = page.locator(".media-card").nth(1);
  161 |     const imagesBefore = await imageSection.locator(".media-item").count();
  162 |     // Delete the primary image (the first item we set as primary in 13b-05)
  163 |     await imageSection.locator(".media-item").first().locator(".btn-danger").click();
  164 |     await page.waitForURL(`${BASE}/admin/products/${PRODUCT_ID}`, { timeout: 10000 });
  165 |     await page.waitForLoadState("networkidle");
  166 |     await screenshot(page, "13b-06-image-deleted");
  167 |     const imageSection2 = page.locator(".media-card").nth(1);
  168 |     const imagesAfter = await imageSection2.locator(".media-item").count();
  169 |     expect(imagesAfter).toBe(imagesBefore - 1);
  170 |   });
  171 | 
  172 |   test("13b-07 primary image was deleted — no primary badge remains", async () => {
  173 |     // After deleting the primary image, no item in the gallery should have .primary-badge
  174 |     // (other images from previous runs may still exist, so .media-grid may still be visible)
  175 |     const imageSection = page.locator(".media-card").nth(1);
  176 |     await expect(imageSection.locator(".primary-badge")).not.toBeVisible();
  177 |     // Upload form still present (first one is the image upload)
  178 |     await expect(page.locator("form.upload-form").first()).toBeVisible();
  179 |   });
  180 | });
  181 | 
  182 | // ── 13c: User Hierarchy Visibility ───────────────────────────────────────────
  183 | 
  184 | test.describe("13c — User Hierarchy Visibility", () => {
  185 |   test.describe.configure({ mode: "serial" });
  186 | 
  187 |   let page: import("@playwright/test").Page;
  188 | 
  189 |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  190 |     page = await browser.newPage();
  191 |   });
  192 | 
  193 |   test.afterAll(async () => {
  194 |     await page.close();
  195 |   });
  196 | 
  197 |   test("13c-01 OWNER sees all users", async () => {
  198 |     await loginAs(page, OWNER.email, OWNER.password);
  199 |     await page.goto(`${BASE}/admin/users`);
  200 |     await page.waitForLoadState("networkidle");
  201 |     await screenshot(page, "13c-01-owner-sees-all");
  202 |     await expect(page.locator("tr").filter({ hasText: "admin@test.com" })).toBeVisible();
  203 |     await expect(page.locator("tr").filter({ hasText: "eshop@test.com" })).toBeVisible();
  204 |     await expect(page.locator("tr").filter({ hasText: "user@test.com" })).toBeVisible();
  205 |   });
```