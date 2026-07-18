# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 12-access-control.spec.ts >> 12 — Access Control: Role-based Page Protection >> 12-04 USER role (role=1) is blocked from /admin
- Location: tests/e2e/12-access-control.spec.ts:26:3

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected: not "http://localhost:4321/admin"
Received: "http://localhost:4321/admin"
Timeout:  5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:4321/admin"

```

```yaml
- navigation:
  - link "Template":
    - /url: /
  - link "Přehled":
    - /url: /dashboard
  - link "Položky":
    - /url: /items
  - link "Správa":
    - /url: /admin
  - button "R Regular User ▾"
- main:
  - complementary:
    - link "Template":
      - /url: /
    - navigation:
      - paragraph: Přehled
      - link "📊 Přehled":
        - /url: /admin
      - paragraph: E-shop
      - link "🛍️ Produkty":
        - /url: /admin/products
      - link "📦 Kategorie":
        - /url: /admin/categories
      - link "📋 Objednávky":
        - /url: /admin/orders
      - link "👥 Zákazníci":
        - /url: /admin/customers
      - link "💰 Ceník":
        - /url: /admin/pricing
      - link "🏭 Sklad":
        - /url: /admin/inventory
      - paragraph: Statistiky
      - link "📈 Přehledy":
        - /url: /admin/reports
      - paragraph: Lidé
      - link "👤 Uživatelé":
        - /url: /admin/users
      - link "🔑 Role":
        - /url: /admin/roles
      - link "🏢 Organizace":
        - /url: /admin/parties
      - paragraph: Systém
      - link "📝 Audit log":
        - /url: /admin/audit
      - link "🔔 Oznámení":
        - /url: /admin/notifications
  - heading "Přehled" [level=1]
  - text: ⚠️ Nemáte přiřazenou organizaci — vytvořte ji v
  - link "sekci Organizace":
    - /url: /admin/parties
  - text: . 1 Celkem uživatelů 1 Aktivní uživatelé 0 Celkem produktů 0 Aktivní produkty 0 Celkem objednávek 0.00 Kč Příjmy (tento měsíc)
  - heading "Nedávné objednávky" [level=2]
  - paragraph: Žádné objednávky.
  - heading "Graf příjmů" [level=2]
  - text: Graf brzy k dispozici
  - heading "Nedávná aktivita" [level=2]
  - paragraph: Žádné záznamy auditu.
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { BASE, USER, ESHOP, loginAs, screenshot } from "./helpers";
  3  | 
  4  | test.describe("12 — Access Control: Role-based Page Protection", () => {
  5  |   test("12-01 unauthenticated user cannot access /admin", async ({ page }) => {
  6  |     await page.goto(`${BASE}/admin`);
  7  |     await page.waitForLoadState("networkidle");
  8  |     await screenshot(page, "12-01-unauth-admin");
  9  |     await expect(page).toHaveURL(`${BASE}/login`);
  10 |   });
  11 | 
  12 |   test("12-02 unauthenticated user cannot access /admin/users", async ({ page }) => {
  13 |     await page.goto(`${BASE}/admin/users`);
  14 |     await page.waitForLoadState("networkidle");
  15 |     await screenshot(page, "12-02-unauth-users");
  16 |     await expect(page).toHaveURL(`${BASE}/login`);
  17 |   });
  18 | 
  19 |   test("12-03 unauthenticated user cannot access /admin/inventory", async ({ page }) => {
  20 |     await page.goto(`${BASE}/admin/inventory`);
  21 |     await page.waitForLoadState("networkidle");
  22 |     await screenshot(page, "12-03-unauth-inventory");
  23 |     await expect(page).toHaveURL(`${BASE}/login`);
  24 |   });
  25 | 
  26 |   test("12-04 USER role (role=1) is blocked from /admin", async ({ page }) => {
  27 |     await loginAs(page, USER.email, USER.password);
  28 |     await page.goto(`${BASE}/admin`);
  29 |     await page.waitForLoadState("networkidle");
  30 |     await screenshot(page, "12-04-user-blocked-admin");
  31 |     // USER role should be redirected away from /admin
> 32 |     await expect(page).not.toHaveURL(`${BASE}/admin`);
     |                            ^ Error: expect(page).not.toHaveURL(expected) failed
  33 |   });
  34 | 
  35 |   test("12-05 ESHOP_ADMIN (role=2) can access /admin", async ({ page }) => {
  36 |     await loginAs(page, ESHOP.email, ESHOP.password);
  37 |     await page.goto(`${BASE}/admin`);
  38 |     await page.waitForLoadState("networkidle");
  39 |     await screenshot(page, "12-05-eshop-admin-access");
  40 |     await expect(page).toHaveURL(`${BASE}/admin`);
  41 |     await expect(page.locator(".stat-card").first()).toBeVisible();
  42 |   });
  43 | 
  44 |   test("12-06 ESHOP_ADMIN can access /admin/products", async ({ page }) => {
  45 |     await loginAs(page, ESHOP.email, ESHOP.password);
  46 |     await page.goto(`${BASE}/admin/products`);
  47 |     await page.waitForLoadState("networkidle");
  48 |     await screenshot(page, "12-06-eshop-admin-products");
  49 |     await expect(page).toHaveURL(`${BASE}/admin/products`);
  50 |     await expect(page.locator("table.data-table")).toBeVisible();
  51 |   });
  52 | 
  53 |   test("12-07 ESHOP_ADMIN can access /admin/orders", async ({ page }) => {
  54 |     await loginAs(page, ESHOP.email, ESHOP.password);
  55 |     await page.goto(`${BASE}/admin/orders`);
  56 |     await page.waitForLoadState("networkidle");
  57 |     await screenshot(page, "12-07-eshop-admin-orders");
  58 |     await expect(page).toHaveURL(`${BASE}/admin/orders`);
  59 |   });
  60 | 
  61 |   test("12-08 sidebar shows correct links for ESHOP_ADMIN", async ({ page }) => {
  62 |     await loginAs(page, ESHOP.email, ESHOP.password);
  63 |     await page.goto(`${BASE}/admin`);
  64 |     await page.waitForLoadState("networkidle");
  65 |     await screenshot(page, "12-08-eshop-admin-sidebar");
  66 |     const sidebar = page.locator(".sidebar, nav.sidebar, .cms-sidebar").first();
  67 |     await expect(sidebar).toBeVisible();
  68 |   });
  69 | 
  70 |   test("12-09 accessing /admin when already logged in stays on /admin", async ({ page }) => {
  71 |     await loginAs(page, ESHOP.email, ESHOP.password);
  72 |     await page.goto(`${BASE}/admin`);
  73 |     await page.waitForLoadState("networkidle");
  74 |     await page.goto(`${BASE}/admin`);
  75 |     await page.waitForLoadState("networkidle");
  76 |     await screenshot(page, "12-09-admin-already-logged-in");
  77 |     await expect(page).toHaveURL(`${BASE}/admin`);
  78 |   });
  79 | });
  80 | 
```