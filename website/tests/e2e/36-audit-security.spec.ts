import { test, expect } from "@playwright/test";
import { loginAs, psql } from "./helpers";

const PARTY_ID = "11111111-1111-1111-1111-111111111111";
const PARTY2_ID = "11111111-2222-2222-2222-111111111111";

test("cross-tenant product access is blocked", async ({ browser }) => {
  const page = await browser.newPage();
  await loginAs(page, "admin@test.com", "Admin1234!");
  await page.goto(`/admin/products?party=${PARTY2_ID}`);
  await page.waitForLoadState("networkidle");
  // Admin is not member of PARTY2 - should not see PARTY2 products
  const body = await page.content();
  expect(body).not.toContain("Other Organisation");
  await page.close();
});

test("service_role is not exposed to client", async ({ page }) => {
  await page.goto("/shop");
  const content = await page.content();
  expect(content).not.toContain("service_role");
});
