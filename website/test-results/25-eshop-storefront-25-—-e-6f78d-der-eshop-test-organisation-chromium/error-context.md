# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 25-eshop-storefront.spec.ts >> 25 — /eshop-[slug] per-organization storefront >> 25-06 add to cart, checkout, and confirm — fully scoped under /eshop-test-organisation
- Location: tests/e2e/25-eshop-storefront.spec.ts:107:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "http://localhost:4321/eshop-test-organisation/order-confirmation**" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - banner [ref=e6]:
      - generic [ref=e8]:
        - link "Back to Web-Mobile-Template" [ref=e9] [cursor=pointer]:
          - /url: http://localhost:4321/eshop-test-organisation/checkout
          - generic [ref=e11]:
            - img [ref=e12]
            - generic [ref=e14]: Back
            - heading "Web-Mobile-Template" [level=1] [ref=e18]
        - generic [ref=e19]:
          - img [ref=e20]
          - text: Sandbox
    - generic [ref=e22]:
      - generic [ref=e24]:
        - heading "Pay Web-Mobile-Template" [level=2] [ref=e25]
        - generic [ref=e31]: CZK 91.50
      - list [ref=e33]:
        - listitem [ref=e34]:
          - generic [ref=e36]:
            - generic [ref=e40]: E2E Eshop Org1 Product
            - generic [ref=e43]: CZK 12.50
        - listitem [ref=e44]:
          - generic [ref=e46]:
            - generic [ref=e50]: Zásilkovna
            - generic [ref=e53]: CZK 79.00
  - generic [ref=e55]:
    - main [ref=e56]:
      - generic [ref=e61]:
        - generic [ref=e62]:
          - iframe [ref=e68]:
            - generic [ref=f6e6]:
              - iframe [ref=f6e11]:
                - button "Apple Pay" [ref=f10e5] [cursor=pointer]:
                  - img [ref=f10e7]:
                    - img "Apple Logo" [ref=f10e8]
              - button "Pay securely with Link" [ref=f6e14] [cursor=pointer]:
                - generic [ref=f6e16]:
                  - generic [ref=f6e17]:
                    - text: Pay with
                    - img [ref=f6e18]
                  - img [ref=f6e21]
          - paragraph [ref=e70]: Or
        - heading "Contact information" [level=2] [ref=e71]
      - generic [ref=e75]:
        - generic [ref=e76]:
          - generic [ref=e78]:
            - generic [ref=e80]: Email
            - textbox "Email" [ref=e88]:
              - /placeholder: email@example.com
          - heading "Payment method" [level=2] [ref=e90]
        - generic [ref=e91]:
          - generic [ref=e98]:
            - generic [ref=e112]: Card
            - generic [ref=e118]:
              - generic [ref=e120]:
                - generic [ref=e122]: Card information
                - group "Card information" [ref=e124]:
                  - generic [ref=e125]:
                    - generic [ref=e127]:
                      - textbox "Card number" [ref=e130]:
                        - /placeholder: 1234 1234 1234 1234
                      - generic:
                        - generic:
                          - generic:
                            - img
                        - generic:
                          - generic:
                            - img
                        - generic:
                          - generic:
                            - img
                        - generic:
                          - img
                          - img
                    - generic [ref=e131]: "Accepted card types: Visa, Mastercard, American Express, UnionPay, and JCB"
                    - textbox "Expiration" [ref=e136]:
                      - /placeholder: MM / YY
                    - generic [ref=e138]:
                      - textbox "Credit or debit card CVC/CVV" [ref=e141]:
                        - /placeholder: CVC
                      - generic:
                        - generic:
                          - img "Credit or debit card CVC/CVV"
                    - generic [ref=e142]: 3-digit code on back of card
              - group "Billing address" [ref=e148]:
                - generic [ref=e149]:
                  - generic [ref=e151]:
                    - generic [ref=e153]: Cardholder name
                    - textbox "Cardholder name" [ref=e161]:
                      - /placeholder: Full name on card
                  - generic [ref=e163]:
                    - generic [ref=e165]: Country or region
                    - generic [ref=e172]:
                      - combobox "Country or region" [ref=e173]:
                        - option "Afghanistan"
                        - option "Åland Islands"
                        - option "Albania"
                        - option "Algeria"
                        - option "Andorra"
                        - option "Angola"
                        - option "Anguilla"
                        - option "Antarctica"
                        - option "Antigua & Barbuda"
                        - option "Argentina"
                        - option "Armenia"
                        - option "Aruba"
                        - option "Ascension Island"
                        - option "Australia"
                        - option "Austria"
                        - option "Azerbaijan"
                        - option "Bahamas"
                        - option "Bahrain"
                        - option "Bangladesh"
                        - option "Barbados"
                        - option "Belarus"
                        - option "Belgium"
                        - option "Belize"
                        - option "Benin"
                        - option "Bermuda"
                        - option "Bhutan"
                        - option "Bolivia"
                        - option "Bosnia & Herzegovina"
                        - option "Botswana"
                        - option "Bouvet Island"
                        - option "Brazil"
                        - option "British Indian Ocean Territory"
                        - option "British Virgin Islands"
                        - option "Brunei"
                        - option "Bulgaria"
                        - option "Burkina Faso"
                        - option "Burundi"
                        - option "Cambodia"
                        - option "Cameroon"
                        - option "Canada"
                        - option "Cape Verde"
                        - option "Caribbean Netherlands"
                        - option "Cayman Islands"
                        - option "Central African Republic"
                        - option "Chad"
                        - option "Chile"
                        - option "China"
                        - option "Colombia"
                        - option "Comoros"
                        - option "Congo - Brazzaville"
                        - option "Congo - Kinshasa"
                        - option "Cook Islands"
                        - option "Costa Rica"
                        - option "Côte d’Ivoire"
                        - option "Croatia"
                        - option "Curaçao"
                        - option "Cyprus"
                        - option "Czechia" [selected]
                        - option "Denmark"
                        - option "Djibouti"
                        - option "Dominica"
                        - option "Dominican Republic"
                        - option "Ecuador"
                        - option "Egypt"
                        - option "El Salvador"
                        - option "Equatorial Guinea"
                        - option "Eritrea"
                        - option "Estonia"
                        - option "Eswatini"
                        - option "Ethiopia"
                        - option "Falkland Islands"
                        - option "Faroe Islands"
                        - option "Fiji"
                        - option "Finland"
                        - option "France"
                        - option "French Guiana"
                        - option "French Polynesia"
                        - option "French Southern Territories"
                        - option "Gabon"
                        - option "Gambia"
                        - option "Georgia"
                        - option "Germany"
                        - option "Ghana"
                        - option "Gibraltar"
                        - option "Greece"
                        - option "Greenland"
                        - option "Grenada"
                        - option "Guadeloupe"
                        - option "Guam"
                        - option "Guatemala"
                        - option "Guernsey"
                        - option "Guinea"
                        - option "Guinea-Bissau"
                        - option "Guyana"
                        - option "Haiti"
                        - option "Honduras"
                        - option "Hong Kong SAR China"
                        - option "Hungary"
                        - option "Iceland"
                        - option "India"
                        - option "Indonesia"
                        - option "Iraq"
                        - option "Ireland"
                        - option "Isle of Man"
                        - option "Israel"
                        - option "Italy"
                        - option "Jamaica"
                        - option "Japan"
                        - option "Jersey"
                        - option "Jordan"
                        - option "Kazakhstan"
                        - option "Kenya"
                        - option "Kiribati"
                        - option "Kosovo"
                        - option "Kuwait"
                        - option "Kyrgyzstan"
                        - option "Laos"
                        - option "Latvia"
                        - option "Lebanon"
                        - option "Lesotho"
                        - option "Liberia"
                        - option "Libya"
                        - option "Liechtenstein"
                        - option "Lithuania"
                        - option "Luxembourg"
                        - option "Macao SAR China"
                        - option "Madagascar"
                        - option "Malawi"
                        - option "Malaysia"
                        - option "Maldives"
                        - option "Mali"
                        - option "Malta"
                        - option "Martinique"
                        - option "Mauritania"
                        - option "Mauritius"
                        - option "Mayotte"
                        - option "Mexico"
                        - option "Moldova"
                        - option "Monaco"
                        - option "Mongolia"
                        - option "Montenegro"
                        - option "Montserrat"
                        - option "Morocco"
                        - option "Mozambique"
                        - option "Myanmar (Burma)"
                        - option "Namibia"
                        - option "Nauru"
                        - option "Nepal"
                        - option "Netherlands"
                        - option "New Caledonia"
                        - option "New Zealand"
                        - option "Nicaragua"
                        - option "Niger"
                        - option "Nigeria"
                        - option "Niue"
                        - option "North Macedonia"
                        - option "Norway"
                        - option "Oman"
                        - option "Pakistan"
                        - option "Palestinian Territories"
                        - option "Panama"
                        - option "Papua New Guinea"
                        - option "Paraguay"
                        - option "Peru"
                        - option "Philippines"
                        - option "Pitcairn Islands"
                        - option "Poland"
                        - option "Portugal"
                        - option "Puerto Rico"
                        - option "Qatar"
                        - option "Réunion"
                        - option "Romania"
                        - option "Russia"
                        - option "Rwanda"
                        - option "Samoa"
                        - option "San Marino"
                        - option "São Tomé & Príncipe"
                        - option "Saudi Arabia"
                        - option "Senegal"
                        - option "Serbia"
                        - option "Seychelles"
                        - option "Sierra Leone"
                        - option "Singapore"
                        - option "Sint Maarten"
                        - option "Slovakia"
                        - option "Slovenia"
                        - option "Solomon Islands"
                        - option "Somalia"
                        - option "South Africa"
                        - option "South Georgia & South Sandwich Islands"
                        - option "South Korea"
                        - option "South Sudan"
                        - option "Spain"
                        - option "Sri Lanka"
                        - option "St. Barthélemy"
                        - option "St. Helena"
                        - option "St. Kitts & Nevis"
                        - option "St. Lucia"
                        - option "St. Martin"
                        - option "St. Pierre & Miquelon"
                        - option "St. Vincent & Grenadines"
                        - option "Sudan"
                        - option "Suriname"
                        - option "Svalbard & Jan Mayen"
                        - option "Sweden"
                        - option "Switzerland"
                        - option "Taiwan"
                        - option "Tajikistan"
                        - option "Tanzania"
                        - option "Thailand"
                        - option "Timor-Leste"
                        - option "Togo"
                        - option "Tokelau"
                        - option "Tonga"
                        - option "Trinidad & Tobago"
                        - option "Tristan da Cunha"
                        - option "Tunisia"
                        - option "Turkey"
                        - option "Turkmenistan"
                        - option "Turks & Caicos Islands"
                        - option "Tuvalu"
                        - option "Uganda"
                        - option "Ukraine"
                        - option "United Arab Emirates"
                        - option "United Kingdom"
                        - option "United States"
                        - option "Uruguay"
                        - option "Uzbekistan"
                        - option "Vanuatu"
                        - option "Vatican City"
                        - option "Venezuela"
                        - option "Vietnam"
                        - option "Wallis & Futuna"
                        - option "Western Sahara"
                        - option "Yemen"
                        - option "Zambia"
                        - option "Zimbabwe"
                      - img
          - generic [ref=e186]:
            - checkbox "Save my information for faster checkout" [ref=e188] [cursor=pointer]
            - generic [ref=e189]:
              - generic [ref=e192] [cursor=pointer]: Save my information for faster checkout
              - generic [ref=e194]: Pay securely at Web-Mobile-Template and everywhere Link is accepted.
        - button "Pay" [ref=e199] [cursor=pointer]:
          - generic:
            - generic [ref=e201]: Pay
            - generic [ref=e202]: Processing
          - img [ref=e207]
          - img [ref=e212]
      - textbox [ref=e214]
    - contentinfo [ref=e216]:
      - link "Powered by Stripe" [ref=e218] [cursor=pointer]:
        - /url: https://stripe.com
        - generic [ref=e219]:
          - text: Powered by
          - img "Stripe" [ref=e221]
      - link "Terms" [ref=e223] [cursor=pointer]:
        - /url: https://stripe.com/legal/end-users
      - link "Privacy" [ref=e224] [cursor=pointer]:
        - /url: https://stripe.com/privacy
```

# Test source

```ts
  27  |     VALUES ('${PROD_ORG2.id}', '${PARTY2_ID}', '${PROD_ORG2.title}', '${PROD_ORG2.slug}', ${PROD_ORG2.price}, 'active', true, 'SKU-${PROD_ORG2.slug}');
  28  |   ${defaultRole}`);
  29  | }
  30  | 
  31  | function cleanup() {
  32  |   psql(`${replica}
  33  |     DELETE FROM public.cart_items WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = '${USER_ID}');
  34  |     DELETE FROM public.carts WHERE user_id = '${USER_ID}';
  35  |     DELETE FROM public.inventory_items WHERE id = '${INV_ORG1}';
  36  |     DELETE FROM public.products WHERE id IN ('${PROD_ORG1.id}', '${PROD_ORG2.id}');
  37  |   ${defaultRole}`);
  38  | }
  39  | 
  40  | test.describe("25 — /eshop-[slug] per-organization storefront", () => {
  41  |   test.describe.configure({ mode: "serial" });
  42  |   let page: Page;
  43  | 
  44  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  45  |     cleanup();
  46  |     seed();
  47  |     page = await browser.newPage();
  48  |     await loginAs(page, USER.email, USER.password);
  49  |   });
  50  | 
  51  |   test.afterAll(async () => {
  52  |     cleanup();
  53  |     await page.close();
  54  |   });
  55  | 
  56  |   test("25-00 [regression] anonymous (logged-out) visitor can load /eshop-{slug} for every active org — RLS must never hard-fail for anon", async ({ browser }: { browser: Browser }) => {
  57  |     // Every other test in this file is logged in (Postgres role "authenticated"), which has
  58  |     // direct SELECT grants that mask RLS bugs only visible to true anonymous visitors (role
  59  |     // "anon") — exactly how this was first caught: a real anon page load 500'd with "permission
  60  |     // denied for table user_party_roles" because a policy queried `parties` directly inside
  61  |     // USING(), re-triggering parties' own RLS. Always exercise the anon path explicitly.
  62  |     const anonContext = await browser.newContext();
  63  |     const anonPage = await anonContext.newPage();
  64  |     for (const slug of ["test-organisation", "other-organisation"]) {
  65  |       const response = await anonPage.goto(`${BASE}/eshop-${slug}`);
  66  |       expect(response?.status(), `/eshop-${slug} as anonymous visitor`).toBeLessThan(400);
  67  |       await expect(anonPage.locator(".shop-layout")).toBeVisible();
  68  |     }
  69  |     await anonContext.close();
  70  |   });
  71  | 
  72  |   test("25-01 /eshop-test-organisation shows only that org's product, not the other org's", async () => {
  73  |     await page.goto(`${BASE}/eshop-test-organisation`);
  74  |     await page.waitForLoadState("networkidle");
  75  |     await screenshot(page, "25-01-eshop-org1-listing");
  76  |     await expect(page.getByText(PROD_ORG1.title)).toBeVisible();
  77  |     await expect(page.getByText(PROD_ORG2.title)).not.toBeVisible();
  78  |   });
  79  | 
  80  |   test("25-02 /eshop-other-organisation shows only its own product", async () => {
  81  |     await page.goto(`${BASE}/eshop-other-organisation`);
  82  |     await page.waitForLoadState("networkidle");
  83  |     await screenshot(page, "25-02-eshop-org2-listing");
  84  |     await expect(page.getByText(PROD_ORG2.title)).toBeVisible();
  85  |     await expect(page.getByText(PROD_ORG1.title)).not.toBeVisible();
  86  |   });
  87  | 
  88  |   test("25-03 product from another org is not reachable under the wrong org slug (redirects back to that org's shop)", async () => {
  89  |     await page.goto(`${BASE}/eshop-test-organisation/${PROD_ORG2.slug}`);
  90  |     await page.waitForURL(`${BASE}/eshop-test-organisation`, { timeout: 10000 });
  91  |     await screenshot(page, "25-03-cross-org-product-redirect");
  92  |   });
  93  | 
  94  |   test("25-04 unknown org slug redirects to /shop", async () => {
  95  |     await page.goto(`${BASE}/eshop-does-not-exist`);
  96  |     await page.waitForURL(`${BASE}/shop`, { timeout: 10000 });
  97  |   });
  98  | 
  99  |   test("25-05 /shop lists a Stores directory linking to /eshop-{slug}", async () => {
  100 |     await page.goto(`${BASE}/shop`);
  101 |     await page.waitForLoadState("networkidle");
  102 |     await screenshot(page, "25-05-shop-stores-directory");
  103 |     await expect(page.locator(`a[href="/eshop-test-organisation"]`).first()).toBeVisible();
  104 |     await expect(page.locator(`a[href="/eshop-other-organisation"]`).first()).toBeVisible();
  105 |   });
  106 | 
  107 |   test("25-06 add to cart, checkout, and confirm — fully scoped under /eshop-test-organisation", async () => {
  108 |     await page.goto(`${BASE}/eshop-test-organisation/${PROD_ORG1.slug}`);
  109 |     await page.waitForLoadState("networkidle");
  110 |     await page.locator("form.cart-form button[type='submit']").click();
  111 |     await page.waitForLoadState("networkidle");
  112 |     await expect(page.locator(".cart-success")).toBeVisible();
  113 | 
  114 |     await page.goto(`${BASE}/eshop-test-organisation/cart`);
  115 |     await page.waitForLoadState("networkidle");
  116 |     await expect(page.locator(".cart-item").filter({ hasText: PROD_ORG1.title })).toBeVisible();
  117 |     await screenshot(page, "25-06-eshop-cart");
  118 | 
  119 |     await page.goto(`${BASE}/eshop-test-organisation/checkout`);
  120 |     await page.waitForLoadState("networkidle");
  121 |     await page.fill("input[name='first_name']", "Eshop");
  122 |     await page.fill("input[name='last_name']", "Tester");
  123 |     await page.fill("input[name='line1']", "Test 1");
  124 |     await page.fill("input[name='city']", "Prague");
  125 |     await page.fill("input[name='postal_code']", "11000");
  126 |     await page.click("form.address-form button[type='submit']");
> 127 |     await page.waitForURL(`${BASE}/eshop-test-organisation/order-confirmation**`, { timeout: 15000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  128 |     await screenshot(page, "25-06-eshop-order-confirmation");
  129 |     await expect(page.locator(".confirmation-card")).toBeVisible();
  130 |   });
  131 | 
  132 |   test("25-07 storefront nav stays scoped to the org — no Items link, brand click stays inside /eshop-{slug} — generic nav elsewhere shows a smart Obchod link plus Admin in the profile dropdown", async ({ browser }: { browser: Browser }) => {
  133 |     const adminPage = await browser.newPage();
  134 |     await loginAs(adminPage, ADMIN.email, ADMIN.password);
  135 | 
  136 |     await adminPage.goto(`${BASE}/eshop-test-organisation`);
  137 |     await adminPage.waitForLoadState("networkidle");
  138 |     await screenshot(adminPage, "25-07-eshop-nav-scoped");
  139 |     await expect(adminPage.locator('a[href="/items"]')).toHaveCount(0);
  140 |     // /admin is intentionally reachable from the storefront too, via the hidden profile dropdown.
  141 |     await expect(adminPage.locator("a.nav-brand")).toHaveAttribute("href", "/eshop-test-organisation");
  142 | 
  143 |     await adminPage.goto(`${BASE}/admin`);
  144 |     await adminPage.waitForLoadState("networkidle");
  145 |     await expect(adminPage.locator('.nav-links a[href^="/eshop-"]')).toBeVisible();
  146 |     await adminPage.locator("#profile-toggle").click();
  147 |     await expect(adminPage.locator('.dropdown-item[href="/admin"]')).toBeVisible();
  148 |     await adminPage.close();
  149 |   });
  150 | });
  151 | 
```