import { test, expect } from "@playwright/test";
test("shop page loads within perf budget", async ({ page }) => {
  const start = Date.now();
  await page.goto("/shop");
  await page.waitForLoadState("networkidle");
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(5000);
  const productCards = page.locator("[data-testid='product-card']");
  expect(await productCards.count()).toBeGreaterThan(0);
});
