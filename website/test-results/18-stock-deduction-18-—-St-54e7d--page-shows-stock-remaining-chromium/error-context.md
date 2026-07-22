# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 18-stock-deduction.spec.ts >> 18 — Stock Deduction: Buy → Deduct → Notify >> 18-01 shop product page shows stock remaining
- Location: tests/e2e/18-stock-deduction.spec.ts:64:3

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
  - <launching> /usr/bin/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --no-sandbox --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/playwright_chromiumdev_profile-cE3aQy --remote-debugging-pipe --no-startup-window
  - <launched> pid=1305181
  - [pid=1305181][err] [1305181:1305181:0722/133953.667126:ERROR:chromium-150.0.7871.124/ui/ozone/platform/x11/ozone_platform_x11.cc:257] Missing X server or $DISPLAY
  - [pid=1305181][err] [1305181:1305181:0722/133953.667169:ERROR:chromium-150.0.7871.124/ui/aura/env.cc:246] The platform failed to initialize.  Exiting.
  - [pid=1305181] <gracefully close start>
  - [pid=1305181] <kill>
  - [pid=1305181] <will force kill>
  - [pid=1305181] <process did exit: exitCode=1, signal=null>
  - [pid=1305181] starting temporary directories cleanup
  - [pid=1305181] finished temporary directories cleanup
  - [pid=1305181] <gracefully close end>

```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { execSync } from "child_process";
  2   | import { writeFileSync, unlinkSync } from "fs";
  3   | import { test, expect, type Browser, type Page } from "@playwright/test";
  4   | import { BASE, PARTY_ID, WAREHOUSE_ID, ADMIN, ADMIN_ID, loginAs, screenshot } from "./helpers";
  5   | 
  6   | const STOCK_PRODUCT_ID = "18181818-1818-1818-1818-181818181818";
  7   | const STOCK_INV_ID = "19191919-1919-1919-1919-191919191919";
  8   | const STOCK_SLUG = "e2e-stock-deduction";
  9   | const INITIAL_QTY = 2;
  10  | 
  11  | function psql(sql: string) {
  12  |   const tmp = `/tmp/e2e-18-${Date.now()}.sql`;
  13  |   writeFileSync(tmp, sql);
  14  |   try {
  15  |     return execSync(
  16  |       `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f ${tmp}`,
  17  |       { stdio: "pipe" }
  18  |     ).toString();
  19  |   } finally {
  20  |     unlinkSync(tmp);
  21  |   }
  22  | }
  23  | 
  24  | const replica = "SET session_replication_role = replica;";
  25  | const defaultRole = "SET session_replication_role = DEFAULT;";
  26  | 
  27  | test.describe("18 — Stock Deduction: Buy → Deduct → Notify", () => {
  28  |   test.describe.configure({ mode: "serial" });
  29  | 
  30  |   let page: Page;
  31  | 
  32  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  33  |     // Clean up any leftover test data and admin user's cart
  34  |     psql(`${replica}
  35  |       DELETE FROM public.cart_items WHERE cart_id IN (
  36  |         SELECT id FROM public.carts WHERE user_id = '${ADMIN_ID}'
  37  |       );
  38  |       DELETE FROM public.carts WHERE user_id = '${ADMIN_ID}';
  39  |       DELETE FROM public.inventory_items WHERE id = '${STOCK_INV_ID}';
  40  |       DELETE FROM public.products WHERE id = '${STOCK_PRODUCT_ID}';
  41  |     ${defaultRole}`);
  42  | 
  43  |     // Seed test product with inventory qty=${INITIAL_QTY}
  44  |     psql(`${replica}
  45  |       INSERT INTO public.products (id, party_id, title, slug, price, status, is_visible, sku)
  46  |       VALUES ('${STOCK_PRODUCT_ID}', '${PARTY_ID}', 'Stock Test Product', '${STOCK_SLUG}', 29.90, 'active', true, 'SKU-STOCK-E2E');
  47  |       INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold, track_inventory)
  48  |       VALUES ('${STOCK_INV_ID}', '${PARTY_ID}', '${STOCK_PRODUCT_ID}', '${WAREHOUSE_ID}', ${INITIAL_QTY}, 0, 10, true);
  49  |     ${defaultRole}`);
  50  | 
  51  |     page = await browser.newPage();
  52  |     await loginAs(page, ADMIN.email, ADMIN.password);
  53  |   });
  54  | 
  55  |   test.afterAll(async () => {
  56  |     // Clean up
  57  |     psql(`${replica}
  58  |       DELETE FROM public.inventory_items WHERE id = '${STOCK_INV_ID}';
  59  |       DELETE FROM public.products WHERE id = '${STOCK_PRODUCT_ID}';
  60  |     ${defaultRole}`);
> 61  |     await page.close();
      |                ^ TypeError: Cannot read properties of undefined (reading 'close')
  62  |   });
  63  | 
  64  |   test("18-01 shop product page shows stock remaining", async () => {
  65  |     await page.goto(`${BASE}/shop/${STOCK_SLUG}`);
  66  |     await page.waitForLoadState("networkidle");
  67  |     await screenshot(page, "18-01-product-page");
  68  |     // Should show qty remaining hint (2 left in stock) or at least Add to Cart
  69  |     await expect(page.locator(".add-to-cart-section")).toBeVisible();
  70  |     await expect(page.locator(".out-of-stock-badge")).not.toBeVisible();
  71  |   });
  72  | 
  73  |   test("18-02 add all stock (qty=2) to cart", async () => {
  74  |     await page.goto(`${BASE}/shop/${STOCK_SLUG}`);
  75  |     await page.waitForLoadState("networkidle");
  76  |     const qtyInput = page.locator("form.cart-form input[name='quantity']");
  77  |     await qtyInput.fill(String(INITIAL_QTY));
  78  |     await screenshot(page, "18-02-add-to-cart");
  79  |     await page.locator("form.cart-form button[type='submit']").click();
  80  |     await page.waitForLoadState("networkidle");
  81  |     // Should redirect back with ?added=1
  82  |     await expect(page.locator(".cart-success")).toBeVisible();
  83  |     await screenshot(page, "18-02-after-add-to-cart");
  84  |   });
  85  | 
  86  |   test("18-03 cart shows the item", async () => {
  87  |     await page.goto(`${BASE}/shop/cart`);
  88  |     await page.waitForLoadState("networkidle");
  89  |     await screenshot(page, "18-03-cart-page");
  90  |     await expect(page.getByText("Stock Test Product")).toBeVisible();
  91  |     await expect(page.locator(".checkout-btn")).toBeVisible();
  92  |   });
  93  | 
  94  |   test("18-04 proceed to checkout and place order", async () => {
  95  |     await page.goto(`${BASE}/shop/checkout`);
  96  |     await page.waitForLoadState("networkidle");
  97  |     await screenshot(page, "18-04-checkout-page");
  98  |     await expect(page.getByText("Stock Test Product")).toBeVisible();
  99  | 
  100 |     await page.fill("input[name='first_name']", "Test");
  101 |     await page.fill("input[name='last_name']", "Buyer");
  102 |     await page.fill("input[name='line1']", "Testova 1");
  103 |     await page.fill("input[name='city']", "Praha");
  104 |     await page.fill("input[name='postal_code']", "10000");
  105 | 
  106 |     await screenshot(page, "18-04-checkout-filled");
  107 |     await page.locator("form.address-form button[type='submit']").click();
  108 |     await page.waitForLoadState("networkidle");
  109 | 
  110 |     // Should redirect to order confirmation
  111 |     await page.waitForURL(`${BASE}/shop/order-confirmation**`, { timeout: 15000 });
  112 |     await screenshot(page, "18-04-order-confirmation");
  113 |     await expect(page.locator(".confirmation-card")).toBeVisible();
  114 |   });
  115 | 
  116 |   test("18-05 admin inventory shows qty=0 after order", async () => {
  117 |     await page.goto(`${BASE}/admin/inventory`);
  118 |     await page.waitForLoadState("networkidle");
  119 |     await screenshot(page, "18-05-inventory-after-order");
  120 |     // The stock test product should show qty=0 with out-of-stock badge
  121 |     const rows = page.locator("table.data-table tbody tr");
  122 |     // Find the row for our test product
  123 |     const stockRow = rows.filter({ hasText: "Stock Test Product" });
  124 |     await expect(stockRow).toBeVisible();
  125 |     const qtyCell = stockRow.locator("td").nth(2);
  126 |     await expect(qtyCell).toHaveText("0");
  127 |   });
  128 | 
  129 |   test("18-06 admin inventory out-of-stock tab shows the product", async () => {
  130 |     await page.goto(`${BASE}/admin/inventory?filter=out`);
  131 |     await page.waitForLoadState("networkidle");
  132 |     await screenshot(page, "18-06-out-of-stock-tab");
  133 |     await expect(page.getByText("Stock Test Product")).toBeVisible();
  134 |   });
  135 | 
  136 |   test("18-07 admin notifications shows low_inventory alert", async () => {
  137 |     await page.goto(`${BASE}/admin/notifications`);
  138 |     await page.waitForLoadState("networkidle");
  139 |     await screenshot(page, "18-07-notifications");
  140 |     // Should have an out-of-stock notification for our test product
  141 |     await expect(page.getByText(/out of stock|stock test product/i).first()).toBeVisible();
  142 |   });
  143 | 
  144 |   test("18-08 shop product page now shows out of stock", async () => {
  145 |     await page.goto(`${BASE}/shop/${STOCK_SLUG}`);
  146 |     await page.waitForLoadState("networkidle");
  147 |     await screenshot(page, "18-08-product-out-of-stock");
  148 |     await expect(page.locator(".out-of-stock-badge")).toBeVisible();
  149 |     await expect(page.locator("form.cart-form button[type='submit']")).not.toBeVisible();
  150 |   });
  151 | 
  152 |   test("18-09 admin product detail shows inventory section with qty=0", async () => {
  153 |     await page.goto(`${BASE}/admin/products/${STOCK_PRODUCT_ID}`);
  154 |     await page.waitForLoadState("networkidle");
  155 |     await screenshot(page, "18-09-product-detail-inventory");
  156 |     await expect(page.locator(".inv-card")).toBeVisible();
  157 |     const onHandValue = page.locator(".inv-stat").first().locator(".inv-value");
  158 |     await expect(onHandValue).toHaveText("0");
  159 |   });
  160 | });
  161 | 
```