# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-products.spec.ts >> 04 — Products: CRUD, Search, Filter, Status >> 04-10 edit product — change title and price
- Location: tests/e2e/04-products.spec.ts:112:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('form.product-form button[type=\'submit\']') resolved to 2 elements:
    1) <button type="submit" class="btn btn-danger" data-astro-cid-jwnaoqkz="">Smazat</button> aka getByRole('button', { name: 'Smazat' })
    2) <button type="submit" class="btn btn-primary" data-astro-cid-jwnaoqkz="">Uložit změny</button> aka getByRole('button', { name: 'Uložit změny' })

Call log:
  - waiting for locator('form.product-form button[type=\'submit\']')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - link "Template" [ref=e4] [cursor=pointer]:
        - /url: /
      - generic [ref=e5]:
        - link "Přehled" [ref=e6] [cursor=pointer]:
          - /url: /dashboard
        - link "Položky" [ref=e7] [cursor=pointer]:
          - /url: /items
        - link "Správa" [ref=e8] [cursor=pointer]:
          - /url: /admin
      - button "T Test Admin ▾" [ref=e11] [cursor=pointer]:
        - generic [ref=e12]: T
        - generic [ref=e13]: Test Admin
        - generic [ref=e14]: ▾
  - main [ref=e15]:
    - generic [ref=e16]:
      - complementary [ref=e17]:
        - link "Template" [ref=e19] [cursor=pointer]:
          - /url: /
        - navigation [ref=e20]:
          - generic [ref=e21]:
            - paragraph [ref=e22]: Přehled
            - link "📊 Přehled" [ref=e23] [cursor=pointer]:
              - /url: /admin
              - generic [ref=e24]: 📊
              - generic [ref=e25]: Přehled
          - generic [ref=e26]:
            - paragraph [ref=e27]: E-shop
            - link "🛍️ Produkty" [ref=e28] [cursor=pointer]:
              - /url: /admin/products
              - generic [ref=e29]: 🛍️
              - generic [ref=e30]: Produkty
            - link "📦 Kategorie" [ref=e31] [cursor=pointer]:
              - /url: /admin/categories
              - generic [ref=e32]: 📦
              - generic [ref=e33]: Kategorie
            - link "📋 Objednávky" [ref=e34] [cursor=pointer]:
              - /url: /admin/orders
              - generic [ref=e35]: 📋
              - generic [ref=e36]: Objednávky
            - link "👥 Zákazníci" [ref=e37] [cursor=pointer]:
              - /url: /admin/customers
              - generic [ref=e38]: 👥
              - generic [ref=e39]: Zákazníci
            - link "💰 Ceník" [ref=e40] [cursor=pointer]:
              - /url: /admin/pricing
              - generic [ref=e41]: 💰
              - generic [ref=e42]: Ceník
            - link "🏭 Sklad" [ref=e43] [cursor=pointer]:
              - /url: /admin/inventory
              - generic [ref=e44]: 🏭
              - generic [ref=e45]: Sklad
          - generic [ref=e46]:
            - paragraph [ref=e47]: Statistiky
            - link "📈 Přehledy" [ref=e48] [cursor=pointer]:
              - /url: /admin/reports
              - generic [ref=e49]: 📈
              - generic [ref=e50]: Přehledy
          - generic [ref=e51]:
            - paragraph [ref=e52]: Lidé
            - link "👤 Uživatelé" [ref=e53] [cursor=pointer]:
              - /url: /admin/users
              - generic [ref=e54]: 👤
              - generic [ref=e55]: Uživatelé
            - link "🔑 Role" [ref=e56] [cursor=pointer]:
              - /url: /admin/roles
              - generic [ref=e57]: 🔑
              - generic [ref=e58]: Role
            - link "🏢 Organizace" [ref=e59] [cursor=pointer]:
              - /url: /admin/parties
              - generic [ref=e60]: 🏢
              - generic [ref=e61]: Organizace
          - generic [ref=e62]:
            - paragraph [ref=e63]: Systém
            - link "📝 Audit log" [ref=e64] [cursor=pointer]:
              - /url: /admin/audit
              - generic [ref=e65]: 📝
              - generic [ref=e66]: Audit log
            - link "🔔 Oznámení" [ref=e67] [cursor=pointer]:
              - /url: /admin/notifications
              - generic [ref=e68]: 🔔
              - generic [ref=e69]: Oznámení
      - generic [ref=e70]:
        - heading "Upravit produkt" [level=1] [ref=e72]
        - generic [ref=e74]:
          - link "← Zpět na produkty" [ref=e75] [cursor=pointer]:
            - /url: /admin/products
          - generic [ref=e76]:
            - generic [ref=e77]:
              - generic [ref=e78]:
                - generic [ref=e79]: Název *
                - textbox [ref=e80]: E2E Test Product (Updated)
              - generic [ref=e81]:
                - generic [ref=e82]: Slug *
                - textbox [ref=e83]: e2e-test-product
            - generic [ref=e84]:
              - generic [ref=e85]:
                - generic [ref=e86]: SKU
                - textbox [ref=e87]: SKU-E2E-001
              - generic [ref=e88]:
                - generic [ref=e89]: Čárový kód
                - textbox [ref=e90]
            - generic [ref=e91]:
              - generic [ref=e92]:
                - generic [ref=e93]: Cena *
                - spinbutton [active] [ref=e94]: "249.90"
              - generic [ref=e95]:
                - generic [ref=e96]: Slevová cena
                - spinbutton [ref=e97]: "149.9"
            - generic [ref=e98]:
              - generic [ref=e99]: Stav
              - combobox [ref=e100]:
                - option "Koncept" [selected]
                - option "Aktivní"
                - option "Neaktivní"
            - generic [ref=e101]:
              - generic [ref=e102]: Popis
              - textbox [ref=e103]
            - generic [ref=e104]:
              - checkbox "Doporučený produkt" [ref=e105]
              - generic [ref=e106]: Doporučený produkt
            - generic [ref=e107]:
              - button "Smazat" [ref=e108] [cursor=pointer]
              - generic [ref=e109]:
                - link "Zrušit" [ref=e110] [cursor=pointer]:
                  - /url: /admin/products
                - button "Uložit změny" [ref=e111] [cursor=pointer]
  - generic [ref=e114]:
    - button "Menu" [ref=e115]:
      - img [ref=e117]
      - generic: Menu
    - button "Inspect" [ref=e121]:
      - img [ref=e123]
      - generic: Inspect
    - button "Audit" [ref=e125]:
      - generic [ref=e126]:
        - img [ref=e127]
        - img [ref=e130]
      - generic: Audit
    - button "Settings" [ref=e133]:
      - img [ref=e135]
      - generic: Settings
```

# Test source

```ts
  16  |     await page.close();
  17  |   });
  18  | 
  19  |   test("04-01 products list loads with Seed Product", async () => {
  20  |     await page.goto(`${BASE}/admin/products`);
  21  |     await page.waitForLoadState("networkidle");
  22  |     await screenshot(page, "04-01-products-list");
  23  |     await expect(page.locator("table.data-table")).toBeVisible();
  24  |     await expect(page.getByText("Seed Product")).toBeVisible();
  25  |   });
  26  | 
  27  |   test("04-02 search by title returns matching product", async () => {
  28  |     await page.fill("input[name='search']", "Seed");
  29  |     await page.locator("form.search-form button[type='submit']").click();
  30  |     await page.waitForLoadState("networkidle");
  31  |     await screenshot(page, "04-02-search-results");
  32  |     await expect(page.getByText("Seed Product")).toBeVisible();
  33  |     const rows = page.locator("table.data-table tbody tr");
  34  |     const count = await rows.count();
  35  |     expect(count).toBeGreaterThanOrEqual(1);
  36  |   });
  37  | 
  38  |   test("04-03 filter by status active shows Seed Product", async () => {
  39  |     await page.goto(`${BASE}/admin/products`);
  40  |     await page.waitForLoadState("networkidle");
  41  |     await page.selectOption("select[name='status']", "active");
  42  |     await page.locator("form.search-form button[type='submit']").click();
  43  |     await page.waitForLoadState("networkidle");
  44  |     await screenshot(page, "04-03-filter-active");
  45  |     await expect(page.getByText("Seed Product")).toBeVisible();
  46  |     const badges = page.locator("td .badge-active");
  47  |     const count = await badges.count();
  48  |     expect(count).toBeGreaterThanOrEqual(1);
  49  |   });
  50  | 
  51  |   test("04-04 filter by status draft shows no active products", async () => {
  52  |     await page.goto(`${BASE}/admin/products`);
  53  |     await page.waitForLoadState("networkidle");
  54  |     await page.selectOption("select[name='status']", "draft");
  55  |     await page.locator("form.search-form button[type='submit']").click();
  56  |     await page.waitForLoadState("networkidle");
  57  |     await screenshot(page, "04-04-filter-draft");
  58  |     const activeInTable = page.locator("td .badge-active");
  59  |     await expect(activeInTable.first()).not.toBeVisible().catch(() => {});
  60  |   });
  61  | 
  62  |   test("04-05 navigate to new product form", async () => {
  63  |     await page.goto(`${BASE}/admin/products`);
  64  |     await page.waitForLoadState("networkidle");
  65  |     await page.click("a.btn-primary");
  66  |     await page.waitForURL(`${BASE}/admin/products/new`);
  67  |     await screenshot(page, "04-05-new-product-form");
  68  |     await expect(page.locator("form.product-form")).toBeVisible();
  69  |   });
  70  | 
  71  |   test("04-06 create draft product with all fields", async () => {
  72  |     await page.fill("input[name='title']", "E2E Test Product");
  73  |     await page.fill("input[name='slug']", "e2e-test-product");
  74  |     await page.fill("input[name='sku']", "SKU-E2E-001");
  75  |     await page.fill("input[name='price']", "199.90");
  76  |     await page.fill("input[name='discount_price']", "149.90");
  77  |     await page.selectOption("select[name='status']", "draft");
  78  |     await screenshot(page, "04-06-new-product-filled");
  79  |     await page.locator("form.product-form button[type='submit']").click();
  80  |     await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
  81  |     await screenshot(page, "04-06-after-create-product");
  82  |     await expect(page.getByText("E2E Test Product")).toBeVisible();
  83  |   });
  84  | 
  85  |   test("04-07 draft product badge shows draft status", async () => {
  86  |     const row = page.locator("tr").filter({ hasText: "E2E Test Product" });
  87  |     await expect(row.locator(".badge-draft")).toBeVisible();
  88  |     await screenshot(page, "04-07-draft-badge");
  89  |   });
  90  | 
  91  |   test("04-08 navigate to product detail page", async () => {
  92  |     const row = page.locator("tr").filter({ hasText: "E2E Test Product" });
  93  |     const editLink = row.locator("a.btn-ghost");
  94  |     const href = await editLink.getAttribute("href");
  95  |     createdProductId = href?.split("/").pop() ?? "";
  96  |     await editLink.click();
  97  |     await page.waitForLoadState("networkidle");
  98  |     await screenshot(page, "04-08-product-detail");
  99  |     await expect(page.locator("form.product-form")).toBeVisible();
  100 |   });
  101 | 
  102 |   test("04-09 product detail pre-fills correct values", async () => {
  103 |     const titleInput = page.locator("input[name='title']");
  104 |     await expect(titleInput).toHaveValue("E2E Test Product");
  105 |     const priceInput = page.locator("input[name='price']");
  106 |     await expect(priceInput).toHaveValue(/^199\.9/);
  107 |     const slugInput = page.locator("input[name='slug']");
  108 |     await expect(slugInput).toHaveValue("e2e-test-product");
  109 |     await screenshot(page, "04-09-product-prefilled");
  110 |   });
  111 | 
  112 |   test("04-10 edit product — change title and price", async () => {
  113 |     await page.fill("input[name='title']", "E2E Test Product (Updated)");
  114 |     await page.fill("input[name='price']", "249.90");
  115 |     await screenshot(page, "04-10-edit-product-filled");
> 116 |     await page.locator("form.product-form button[type='submit']").click();
      |                                                                   ^ Error: locator.click: Error: strict mode violation: locator('form.product-form button[type=\'submit\']') resolved to 2 elements:
  117 |     await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
  118 |     await screenshot(page, "04-10-after-edit-product");
  119 |     await expect(page.getByText("E2E Test Product (Updated)")).toBeVisible();
  120 |   });
  121 | 
  122 |   test("04-11 change product status to active", async () => {
  123 |     const row = page.locator("tr").filter({ hasText: "E2E Test Product (Updated)" });
  124 |     await row.locator("a.btn-ghost").click();
  125 |     await page.waitForLoadState("networkidle");
  126 |     await page.selectOption("select[name='status']", "active");
  127 |     await screenshot(page, "04-11-status-change-to-active");
  128 |     await page.locator("form.product-form button[type='submit']").click();
  129 |     await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
  130 |     const updatedRow = page.locator("tr").filter({ hasText: "E2E Test Product (Updated)" });
  131 |     await expect(updatedRow.locator(".badge-active")).toBeVisible();
  132 |     await screenshot(page, "04-11-after-status-active");
  133 |   });
  134 | 
  135 |   test("04-12 change product status to inactive", async () => {
  136 |     const row = page.locator("tr").filter({ hasText: "E2E Test Product (Updated)" });
  137 |     await row.locator("a.btn-ghost").click();
  138 |     await page.waitForLoadState("networkidle");
  139 |     await page.selectOption("select[name='status']", "inactive");
  140 |     await page.locator("form.product-form button[type='submit']").click();
  141 |     await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
  142 |     const updatedRow = page.locator("tr").filter({ hasText: "E2E Test Product (Updated)" });
  143 |     await expect(updatedRow.locator(".badge-inactive")).toBeVisible();
  144 |     await screenshot(page, "04-12-after-status-inactive");
  145 |   });
  146 | 
  147 |   test("04-13 duplicate slug shows form-error", async () => {
  148 |     await page.goto(`${BASE}/admin/products/new`);
  149 |     await page.waitForLoadState("networkidle");
  150 |     await page.fill("input[name='title']", "Duplicate Product");
  151 |     await page.fill("input[name='slug']", "e2e-test-product");
  152 |     await page.fill("input[name='price']", "10");
  153 |     await page.locator("form.product-form button[type='submit']").click();
  154 |     await page.waitForLoadState("networkidle");
  155 |     await screenshot(page, "04-13-duplicate-slug-error");
  156 |     await expect(page.locator(".form-error")).toBeVisible();
  157 |   });
  158 | 
  159 |   test("04-14 create active featured product", async () => {
  160 |     await page.goto(`${BASE}/admin/products/new`);
  161 |     await page.waitForLoadState("networkidle");
  162 |     await page.fill("input[name='title']", "Featured Active Product");
  163 |     await page.fill("input[name='slug']", "featured-active-e2e");
  164 |     await page.fill("input[name='price']", "299.00");
  165 |     await page.selectOption("select[name='status']", "active");
  166 |     const featuredCheck = page.locator("input[name='is_featured']");
  167 |     if (!(await featuredCheck.isChecked())) {
  168 |       await featuredCheck.check();
  169 |     }
  170 |     await screenshot(page, "04-14-featured-product-form");
  171 |     await page.locator("form.product-form button[type='submit']").click();
  172 |     await page.waitForURL(`${BASE}/admin/products`, { timeout: 10000 });
  173 |     await expect(page.getByText("Featured Active Product")).toBeVisible();
  174 |     await screenshot(page, "04-14-featured-product-created");
  175 |   });
  176 | 
  177 |   test("04-15 seed product detail page works", async () => {
  178 |     await page.goto(`${BASE}/admin/products/${PRODUCT_ID}`);
  179 |     await page.waitForLoadState("networkidle");
  180 |     await screenshot(page, "04-15-seed-product-detail");
  181 |     await expect(page.locator("form.product-form")).toBeVisible();
  182 |     const titleInput = page.locator("input[name='title']");
  183 |     await expect(titleInput).toHaveValue("Seed Product");
  184 |   });
  185 | 
  186 |   test("04-16 products list shows correct price formatting", async () => {
  187 |     await page.goto(`${BASE}/admin/products`);
  188 |     await page.waitForLoadState("networkidle");
  189 |     const seedRow = page.locator("tr").filter({ hasText: "Seed Product" });
  190 |     await expect(seedRow).toBeVisible();
  191 |     await screenshot(page, "04-16-product-price-format");
  192 |     await expect(seedRow.getByText("99.90")).toBeVisible();
  193 |   });
  194 | });
  195 | 
```