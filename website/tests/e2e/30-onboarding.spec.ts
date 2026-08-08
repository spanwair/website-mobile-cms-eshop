import { test, expect, type Browser, type Page } from "@playwright/test";
import { BASE, OWNER, loginAs, screenshot, psql, replica, defaultRole } from "./helpers";

// Self-serve org onboarding: a fresh organic signup (no invite) becomes ADMIN(4) immediately
// and can create exactly one organization through the same form staff use. With an IČO the
// storefront goes live immediately (own_company); without one it sells via Smalljobs s.r.o.
// and stays hidden (pending_approval) until an owner approves it — and only an owner can
// make that specific transition, even though the creating admin has ALL_PERMISSIONS on
// their own party.
const RUN = Date.now();
const icoEmail = `onboard-ico-${RUN}@e2e.test`;
const noIcoEmail = `onboard-noico-${RUN}@e2e.test`;
const PASSWORD = "Onboard1234!";
const icoSlug = `e2e-onboard-ico-${RUN}`;
const noIcoSlug = `e2e-onboard-noico-${RUN}`;

async function signUp(page: Page, name: string, email: string) {
  await page.goto(`${BASE}/login?mode=signup`);
  await page.waitForLoadState("networkidle");
  await page.fill("#su-name", name);
  await page.fill("#su-email", email);
  await page.fill("#su-password", PASSWORD);
  await page.fill("#su-confirm", PASSWORD);
  await page.click("#signup-btn");
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
}

test.describe("30 — Self-serve org onboarding", () => {
  test.describe.configure({ mode: "serial" });

  let icoPage: Page;
  let noIcoPage: Page;
  let icoPartyId = "";
  let noIcoPartyId = "";

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    icoPage = await browser.newPage();
    noIcoPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await icoPage.close();
    await noIcoPage.close();
    psql(`${replica}
      DELETE FROM public.parties WHERE slug IN ('${icoSlug}', '${noIcoSlug}');
      ${defaultRole}`);
    for (const email of [icoEmail, noIcoEmail]) {
      const out = psql(`SELECT id FROM public.profiles WHERE email = '${email}';`);
      const id = out.trim().split("\n").find((l) => /^[0-9a-f-]{36}$/i.test(l.trim()))?.trim();
      if (id) {
        psql(`${replica} DELETE FROM auth.users WHERE id = '${id}'; DELETE FROM public.profiles WHERE id = '${id}'; ${defaultRole}`);
      }
    }
  });

  test("30-01 organic signup becomes ADMIN and lands on onboarding welcome", async () => {
    await signUp(icoPage, "Onboard Ico", icoEmail);
    await icoPage.goto(`${BASE}/admin`);
    await icoPage.waitForURL(`${BASE}/admin/onboarding`, { timeout: 15000 });
    await screenshot(icoPage, "30-01-onboarding-welcome");
    await expect(icoPage.locator(".welcome-title")).toBeVisible();

    const out = psql(`SELECT role FROM public.profiles WHERE email = '${icoEmail}';`);
    expect(out.trim().split("\n").some((l) => l.trim() === "4")).toBeTruthy();
  });

  test("30-02 create org with IČO goes live immediately", async () => {
    await icoPage.click("a.btn.btn-primary.btn-lg");
    await icoPage.waitForURL(/\/admin\/parties\/new\?onboarding=1/, { timeout: 10000 });
    await expect(icoPage.locator(".onboarding-banner")).toBeVisible();

    await icoPage.fill("input[name='name']", "E2E Onboard ICO Org");
    await icoPage.fill("input[name='slug']", icoSlug);
    await icoPage.fill("input[name='company_ico']", "11223344");
    await icoPage.check("input[name='privacy_accepted']");
    await icoPage.check("input[name='terms_accepted']");
    await screenshot(icoPage, "30-02-ico-form-filled");
    await icoPage.locator("form.party-form button[type='submit']").click();
    await icoPage.waitForURL(/\/admin\/parties\/[0-9a-f-]+\?onboarding=1/, { timeout: 10000 });
    await screenshot(icoPage, "30-02-ico-created");

    icoPartyId = icoPage.url().split("/").pop()!.split("?")[0];
    await expect(icoPage.locator(".onboarding-cta")).toBeVisible();

    const out = psql(`SELECT status, seller_mode, company_ico FROM public.parties WHERE slug = '${icoSlug}';`);
    expect(out).toContain("active");
    expect(out).toContain("own_company");
    expect(out).toContain("11223344");
  });

  test("30-03 ICO org storefront is publicly visible immediately", async () => {
    const page = icoPage;
    await page.goto(`${BASE}/eshop-${icoSlug}`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(`${BASE}/eshop-${icoSlug}`);
  });

  test("30-04 continue to tutorial checklist", async () => {
    await icoPage.goto(`${BASE}/admin/parties/${icoPartyId}?onboarding=1`);
    await icoPage.waitForLoadState("networkidle");
    await icoPage.click(".onboarding-cta a");
    await icoPage.waitForURL(`${BASE}/admin/onboarding/tutorial`, { timeout: 10000 });
    await screenshot(icoPage, "30-04-tutorial");
    await expect(icoPage.locator(".tutorial-title")).toBeVisible();
    await expect(icoPage.locator(".checklist-item")).toHaveCount(3);
  });

  test("30-05 organic signup without IČO creates a pending_approval commission-mode org", async () => {
    await signUp(noIcoPage, "Onboard NoIco", noIcoEmail);
    await noIcoPage.goto(`${BASE}/admin/parties/new?onboarding=1`);
    await noIcoPage.waitForLoadState("networkidle");

    await noIcoPage.fill("input[name='name']", "E2E Onboard No-ICO Org");
    await noIcoPage.fill("input[name='slug']", noIcoSlug);
    await noIcoPage.check("input[value='no']");
    await noIcoPage.fill("input[name='legal_full_name']", "Jana Testovací");
    await noIcoPage.fill("input[name='address_line1']", "Testovací 1");
    await noIcoPage.fill("input[name='address_city']", "Olomouc");
    await noIcoPage.fill("input[name='address_postal_code']", "779 00");
    await noIcoPage.fill("input[name='bank_account']", "123456789/0800");
    await noIcoPage.check("input[name='commission_terms_accepted']");
    await noIcoPage.check("input[name='privacy_accepted']");
    await noIcoPage.check("input[name='terms_accepted']");
    await screenshot(noIcoPage, "30-05-noico-form-filled");
    await noIcoPage.locator("form.party-form button[type='submit']").click();
    await noIcoPage.waitForURL(/\/admin\/parties\/[0-9a-f-]+\?onboarding=1/, { timeout: 10000 });
    await screenshot(noIcoPage, "30-05-noico-created");

    noIcoPartyId = noIcoPage.url().split("/").pop()!.split("?")[0];
    await expect(noIcoPage.locator(".pending-banner")).toBeVisible();

    const out = psql(`SELECT status, seller_mode FROM public.parties WHERE slug = '${noIcoSlug}';`);
    expect(out).toContain("pending_approval");
    expect(out).toContain("smalljobs_commission");
    const agreement = psql(`SELECT legal_full_name FROM public.commissionaire_agreements WHERE party_id = '${noIcoPartyId}';`);
    expect(agreement).toContain("Jana Testovací");
  });

  test("30-06 pending org storefront is not publicly visible", async () => {
    const page = noIcoPage;
    await page.goto(`${BASE}/eshop-${noIcoSlug}`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(`${BASE}/eshop-${noIcoSlug}`);
  });

  test("30-07 creator cannot self-approve their own pending org", async () => {
    const resp = await noIcoPage.request.post(`${BASE}/admin/parties/${noIcoPartyId}`, {
      form: {
        action: "update_party",
        name: "E2E Onboard No-ICO Org",
        status: "active",
      },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.text();
    expect(body).toContain("alert-error");
    expect(body).toContain("vlastník systému");

    const out = psql(`SELECT status FROM public.parties WHERE id = '${noIcoPartyId}';`);
    expect(out).toContain("pending_approval");
  });

  test("30-08 owner sees pending org and approves it", async () => {
    const page = await icoPage.context().browser()!.newPage();
    page.on("dialog", (d) => d.accept());
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/parties/${noIcoPartyId}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "30-08-owner-pending-view");
    await expect(page.locator(".pending-banner")).toBeVisible();

    await page.locator("form:has(input[name='action'][value='approve_party']) button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await screenshot(page, "30-08-after-approve");
    await expect(page.locator(".alert-success")).toBeVisible();
    await page.close();

    const out = psql(`SELECT status FROM public.parties WHERE id = '${noIcoPartyId}';`);
    expect(out).toContain("active");
  });

  test("30-09 approved org storefront is now publicly visible", async () => {
    const page = noIcoPage;
    await page.goto(`${BASE}/eshop-${noIcoSlug}`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(`${BASE}/eshop-${noIcoSlug}`);
  });
});
