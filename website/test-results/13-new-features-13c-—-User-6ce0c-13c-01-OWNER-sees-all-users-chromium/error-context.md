# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 13-new-features.spec.ts >> 13c — User Hierarchy Visibility >> 13c-01 OWNER sees all users
- Location: tests/e2e/13-new-features.spec.ts:197:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-a0g293 --remote-debugging-pipe --no-startup-window
  - <launched> pid=1301627
  - [pid=1301627][err] [1301627:1301627:0722/133902.643531:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1301627][err] [1301627:1301627:0722/133902.643594:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1301627] <gracefully close start>
  - [pid=1301627] <kill>
  - [pid=1301627] <will force kill>
  - [pid=1301627] <process did exit: exitCode=1, signal=null>
  - [pid=1301627] starting temporary directories cleanup
  - [pid=1301627] finished temporary directories cleanup
  - [pid=1301627] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
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
> 194 |     await page.close();
      |                ^ TypeError: Cannot read properties of undefined (reading 'close')
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
  206 | 
  207 |   test("13c-02 ESHOP_ADMIN does not see OWNER", async () => {
  208 |     await page.context().clearCookies();
  209 |     await loginAs(page, ESHOP.email, ESHOP.password);
  210 |     await page.goto(`${BASE}/admin/users`);
  211 |     await page.waitForLoadState("networkidle");
  212 |     await screenshot(page, "13c-02-eshop-users");
  213 |     const adminRow = page.locator("tr").filter({ hasText: "admin@test.com" });
  214 |     await expect(adminRow).not.toBeVisible();
  215 |   });
  216 | 
  217 |   test("13c-03 ESHOP_ADMIN sees own account", async () => {
  218 |     const eshopRow = page.locator("tr").filter({ hasText: "eshop@test.com" });
  219 |     await expect(eshopRow).toBeVisible();
  220 |     await screenshot(page, "13c-03-eshop-sees-self");
  221 |   });
  222 | 
  223 |   test("13c-04 ESHOP_ADMIN does not see USER outside their party", async () => {
  224 |     // user@test.com has no party membership → eshop should not see them
  225 |     const userRow = page.locator("tr").filter({ hasText: "user@test.com" });
  226 |     await expect(userRow).not.toBeVisible();
  227 |     await screenshot(page, "13c-04-eshop-no-outside-user");
  228 |   });
  229 | });
  230 | 
```