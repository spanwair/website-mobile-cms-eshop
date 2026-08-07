import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, PARTY_ID, ADMIN, loginAs, screenshot } from "./helpers";

// Smoke test for the "no company" commissionaire selling mode: a party admin (MANAGE_AUDIT
// via the seeded Super Admin role) switches Test Organisation into smalljobs_commission
// mode, verifies the payout ledger page renders, then reverts.
test.describe("28 — Smalljobs commission mode", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    page.on("dialog", (d) => d.accept());
    await loginAs(page, ADMIN.email, ADMIN.password);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("28-01 party starts in own_company mode", async () => {
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "28-01-own-company");
    await expect(page.locator(".mode-badge--own")).toBeVisible();
  });

  test("28-02 switch to Smalljobs commission mode", async () => {
    await page.locator(".switch-form > summary").click();
    await page.fill("input[name='legal_full_name']", "Jana Nováková");
    await page.fill("input[name='address_line1']", "Testovací 12");
    await page.fill("input[name='address_city']", "Olomouc");
    await page.fill("input[name='address_postal_code']", "779 00");
    await page.fill("input[name='bank_account']", "123456789/0800");
    await page.check("input[name='terms_accepted']");
    await screenshot(page, "28-02-form-filled");
    await page.locator("form:has(input[name='action'][value='accept_commission_agreement']) button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "28-02-after-submit");
    await expect(page.locator(".alert-success")).toBeVisible();
    await expect(page.locator(".mode-badge--commission")).toBeVisible();
  });

  test("28-03 payout ledger page loads for commission-mode party", async () => {
    await page.goto(`${BASE}/admin/payouts`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "28-03-payouts-page");
    await expect(page.locator(".summary-row")).toBeVisible();
    await expect(page.locator("table.data-table")).toBeVisible();
  });

  test("28-04 revert to own_company mode", async () => {
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");
    await page.locator("form:has(input[name='action'][value='revoke_commission_agreement']) button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "28-04-after-revert");
    await expect(page.locator(".alert-success")).toBeVisible();
    await expect(page.locator(".mode-badge--own")).toBeVisible();
  });
});
