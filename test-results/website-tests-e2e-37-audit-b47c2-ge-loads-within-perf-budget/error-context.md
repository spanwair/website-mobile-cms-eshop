# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: website/tests/e2e/37-audit-performance.spec.ts >> shop page loads within perf budget
- Location: website/tests/e2e/37-audit-performance.spec.ts:2:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/shop", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | test("shop page loads within perf budget", async ({ page }) => {
  3  |   const start = Date.now();
> 4  |   await page.goto("/shop");
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  5  |   await page.waitForLoadState("networkidle");
  6  |   const elapsed = Date.now() - start;
  7  |   expect(elapsed).toBeLessThan(5000);
  8  |   const productCards = page.locator("[data-testid='product-card']");
  9  |   expect(await productCards.count()).toBeGreaterThan(0);
  10 | });
  11 | 
```