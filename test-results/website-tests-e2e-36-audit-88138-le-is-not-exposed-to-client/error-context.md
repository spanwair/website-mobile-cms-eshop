# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: website/tests/e2e/36-audit-security.spec.ts >> service_role is not exposed to client
- Location: website/tests/e2e/36-audit-security.spec.ts:18:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/shop", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { loginAs, psql } from "./helpers";
  3  | 
  4  | const PARTY_ID = "11111111-1111-1111-1111-111111111111";
  5  | const PARTY2_ID = "11111111-2222-2222-2222-111111111111";
  6  | 
  7  | test("cross-tenant product access is blocked", async ({ browser }) => {
  8  |   const page = await browser.newPage();
  9  |   await loginAs(page, "admin@test.com", "Admin1234!");
  10 |   await page.goto(`/admin/products?party=${PARTY2_ID}`);
  11 |   await page.waitForLoadState("networkidle");
  12 |   // Admin is not member of PARTY2 - should not see PARTY2 products
  13 |   const body = await page.content();
  14 |   expect(body).not.toContain("Other Organisation");
  15 |   await page.close();
  16 | });
  17 | 
  18 | test("service_role is not exposed to client", async ({ page }) => {
> 19 |   await page.goto("/shop");
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  20 |   const content = await page.content();
  21 |   expect(content).not.toContain("service_role");
  22 | });
  23 | 
```