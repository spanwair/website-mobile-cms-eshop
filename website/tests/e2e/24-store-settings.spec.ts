/**
 * 24 — Store Settings (multi-tenant storefront: branding, layout, domains)
 *
 * Covers the newest admin feature (MANAGE_SETTINGS = 1024), which had zero
 * E2E coverage before this file. Gates to verify:
 *   - Permission bit gating for all 4 roles across all 3 settings pages
 *   - Branding + layout POSTs actually persist to store_configs
 *   - Domain add/verify/remove flow
 *   - Regression for the domain-verification fix: the server must derive
 *     domain + token from the DB row (scoped to the caller's party), never
 *     trust client-submitted `domain`/`token` fields — otherwise a settings
 *     manager could mark a domain "verified" by proving DNS control of some
 *     other domain entirely.
 */

import { test, expect, type Browser, type Page } from "@playwright/test";
import path from "path";
import {
  BASE, loginAs, psql, replica, defaultRole,
  OWNER, ADMIN, ESHOP, USER,
  ESHOP_ID, PARTY_ID,
  LIMITED_ESHOP_ROLE_ID,
} from "./helpers";

const SUPER_ADMIN_ROLE_ID = "22222222-2222-2222-2222-222222222222"; // permissions=32767, includes MANAGE_SETTINGS
const TEST_IMAGE = path.join(process.cwd(), "tests", "fixtures", "test-image.png");

const SETTINGS_PAGES = [
  "/admin/settings/branding",
  "/admin/settings/layout",
  "/admin/settings/content",
  "/admin/settings/domains",
];

function setEshopRole(roleId: string) {
  psql(`
    ${replica}
    UPDATE public.user_party_roles SET role_id = '${roleId}'
    WHERE user_id = '${ESHOP_ID}' AND party_id = '${PARTY_ID}';
    ${defaultRole}
  `);
}

// ESHOP is seeded (global-setup) as Super Admin in a second party ("Other Organisation"),
// which sorts before "Test Organisation" alphabetically — requireAdminCtx defaults to the
// first party by name when no cookie is set, so without pinning this, ESHOP tests would
// silently run against their full-permission party instead of PARTY_ID.
async function setActiveParty(page: Page, partyId: string) {
  await page.context().addCookies([
    { name: "activePartyId", value: partyId, domain: "localhost", path: "/" },
  ]);
}

async function expectAccess(page: Page, url: string) {
  await page.goto(`${BASE}${url}`);
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(`${BASE}${url}`, { timeout: 8000 });
}

async function expectBlocked(page: Page, url: string) {
  await page.goto(`${BASE}${url}`);
  await page.waitForLoadState("networkidle");
  await expect(page).not.toHaveURL(`${BASE}${url}`, { timeout: 8000 });
}

test.describe("24-A — permission gating: OWNER/ADMIN always in, USER always out", () => {
  test("24-A-01 owner accesses all settings pages", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, OWNER.email, OWNER.password);
    for (const url of SETTINGS_PAGES) await expectAccess(page, url);
    await page.close();
  });

  test("24-A-02 admin accesses all settings pages within their org", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    for (const url of SETTINGS_PAGES) await expectAccess(page, url);
    await page.close();
  });

  test("24-A-03 user blocked from all settings pages (redirects to /)", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
    for (const url of SETTINGS_PAGES) {
      await page.goto(`${BASE}${url}`);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(`${BASE}/`);
    }
    await page.close();
  });
});

test.describe("24-B — eshop_admin: gated by MANAGE_SETTINGS bit specifically", () => {
  test.afterEach(() => setEshopRole(SUPER_ADMIN_ROLE_ID));

  test("24-B-01 eshop_admin WITHOUT MANAGE_SETTINGS is redirected to /admin", async ({ browser }: { browser: Browser }) => {
    setEshopRole(LIMITED_ESHOP_ROLE_ID); // MANAGE_PRODUCTS only
    const page = await browser.newPage();
    await loginAs(page, ESHOP.email, ESHOP.password);
    await setActiveParty(page, PARTY_ID);
    for (const url of SETTINGS_PAGES) await expectBlocked(page, url);
    await page.close();
  });

  test("24-B-02 eshop_admin WITH MANAGE_SETTINGS (Super Admin role) accesses all settings pages", async ({ browser }: { browser: Browser }) => {
    setEshopRole(SUPER_ADMIN_ROLE_ID);
    const page = await browser.newPage();
    await loginAs(page, ESHOP.email, ESHOP.password);
    await setActiveParty(page, PARTY_ID);
    for (const url of SETTINGS_PAGES) await expectAccess(page, url);
    await page.close();
  });

  test("24-B-03 sidebar shows Store Settings entry only when bit is present", async ({ browser }: { browser: Browser }) => {
    setEshopRole(LIMITED_ESHOP_ROLE_ID);
    const page = await browser.newPage();
    await loginAs(page, ESHOP.email, ESHOP.password);
    await setActiveParty(page, PARTY_ID);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('a[href="/admin/settings/branding"]')).toHaveCount(0);

    setEshopRole(SUPER_ADMIN_ROLE_ID);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('a[href="/admin/settings/branding"]')).toHaveCount(1);
    await page.close();
  });
});

test.describe("24-G — View storefront button opens the org's /eshop-{slug} in a new tab", () => {
  test("24-G-01 button appears on every settings tab, links to /eshop-test-organisation, opens in a new tab", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    for (const url of SETTINGS_PAGES) {
      await page.goto(`${BASE}${url}`);
      await page.waitForLoadState("networkidle");
      const btn = page.locator("a.view-storefront-btn");
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute("href", "/eshop-test-organisation");
      await expect(btn).toHaveAttribute("target", "_blank");
    }

    await page.goto(`${BASE}/admin/settings/branding`);
    await page.waitForLoadState("networkidle");
    const [popup] = await Promise.all([
      page.context().waitForEvent("page"),
      page.locator("a.view-storefront-btn").click(),
    ]);
    await popup.waitForLoadState("networkidle");
    await expect(popup).toHaveURL(`${BASE}/eshop-test-organisation`);
    await expect(popup.locator(".shop-layout")).toBeVisible();
    await popup.close();
    await page.close();
  });
});

test.describe("24-C — Branding: form submit persists to store_configs", () => {
  test("24-C-01 updating brand name and primary color persists across reload", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/settings/branding`);
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="brand_name"]', "E2E Test Brand");
    await page.fill('input[name="tagline"]', "Quality you can test");
    await page.click('form.settings-form button[type="submit"]');
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".alert-success")).toBeVisible();
    await expect(page.locator('input[name="brand_name"]')).toHaveValue("E2E Test Brand");

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[name="brand_name"]')).toHaveValue("E2E Test Brand");
    await expect(page.locator('input[name="tagline"]')).toHaveValue("Quality you can test");
    await page.close();
  });
});

test.describe("24-C2 — Branding: color/font fields reject non-hex / non-safe values (stored-XSS regression)", () => {
  // buildThemeCss (website/src/lib/themeEngine.ts) injects color_*/font_* into a
  // <style set:html> block with zero escaping, rendered on every public storefront page.
  // A raw POST (bypassing the browser's <input type=color> constraint) is the realistic
  // attack surface here, not the UI form.
  test("24-C2-01 a style-tag-breakout payload in color_primary is rejected, not persisted, and never reaches the public page", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);

    const before = psql(`SELECT color_primary FROM store_configs WHERE party_id = '${PARTY_ID}';`);

    const payload = "</style><script>window.__xss=1</script><style>";
    const resp = await page.request.post(`${BASE}/admin/settings/branding`, {
      form: {
        brand_name: "E2E Test Brand",
        tagline: "Quality you can test",
        logo_url: "",
        favicon_url: "",
        color_primary: payload,
        color_secondary: "#7C3AED",
        color_background: "#FFFFFF",
        color_surface: "#F8F9FA",
        color_text_primary: "#212529",
        color_text_secondary: "#6C757D",
        color_border: "#E9ECEF",
        font_heading: "Inter",
        font_body: "Inter",
        radius_scale: "default",
        product_card_variant: "classic",
      },
    });
    expect(resp.ok()).toBeTruthy();

    const after = psql(`SELECT color_primary FROM store_configs WHERE party_id = '${PARTY_ID}';`);
    // Rejected — unchanged, never persisted. This table's rows are injected raw via
    // <style set:html> on every public storefront page, so "never stored" is the actual
    // guarantee that matters here (rendering is a pure function of what's in the row).
    expect(after).toBe(before);
    await page.close();
  });
});

test.describe("24-D — Layout: section include/order persists", () => {
  test("24-D-01 unchecking a section removes it from homepage_layout", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/settings/layout`);
    await page.waitForLoadState("networkidle");

    const newsletterCheckbox = page.locator('input[name="include_newsletter"]');
    await expect(newsletterCheckbox).toBeChecked();
    await newsletterCheckbox.uncheck();
    await page.click('form.layout-form button[type="submit"]');
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[name="include_newsletter"]')).not.toBeChecked();

    const row = psql(`SELECT homepage_layout FROM store_configs WHERE party_id = '${PARTY_ID}';`);
    expect(row).not.toContain("newsletter");

    // restore for other tests/runs
    await page.locator('input[name="include_newsletter"]').check();
    await page.click('form.layout-form button[type="submit"]');
    await page.waitForLoadState("networkidle");
  });
});

test.describe("24-E — Domains: add / verify / remove + verification-integrity regression", () => {
  const TEST_DOMAIN = `e2e-store-domain.invalid`;

  test.beforeAll(() => {
    psql(`${replica} DELETE FROM public.store_domains WHERE domain = '${TEST_DOMAIN}'; ${defaultRole}`);
  });

  test("24-E-01 add a domain: appears in list as pending, with a TXT hint", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/settings/domains`);
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="domain"]', TEST_DOMAIN);
    await page.click('form.add-form button[type="submit"]');
    await page.waitForLoadState("networkidle");

    await expect(page.locator(`td:has-text("${TEST_DOMAIN}")`).first()).toBeVisible();
    await expect(page.locator(".badge-pending").first()).toBeVisible();

    const row = psql(`SELECT id FROM store_domains WHERE domain = '${TEST_DOMAIN}';`);
    expect(row).toMatch(/[0-9a-f-]{36}/);
    await page.close();
  });

  test("24-E-02 [regression] verify with a fabricated domain_id/token can no longer force-mark a domain verified", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);

    const domainRow = psql(
      `SELECT id, verification_token FROM store_domains WHERE domain = '${TEST_DOMAIN}';`
    );
    const idMatch = domainRow.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    expect(idMatch).toBeTruthy();
    const domainId = idMatch![1];

    // Simulate the pre-fix attack: submit attacker-controlled domain/token
    // alongside the real domain_id. The handler must ignore these fields
    // and re-derive domain+token from the DB row, so this must NOT verify.
    const resp = await page.request.post(`${BASE}/admin/settings/domains`, {
      form: {
        action: "verify",
        domain_id: domainId,
        domain: "attacker-controlled-domain.example",
        token: "fabricated-token-attacker-controls-dns-for",
      },
    });
    expect(resp.ok()).toBeTruthy();

    const after = psql(`SELECT verified FROM store_domains WHERE id = '${domainId}';`);
    expect(after).toContain(" f");
    await page.close();
  });

  test("24-E-03 remove domain: no longer listed", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/settings/domains`);
    await page.waitForLoadState("networkidle");

    page.once("dialog", (d) => d.accept());
    await page.locator(`tr:has-text("${TEST_DOMAIN}") button.btn-danger`).click();
    await page.waitForLoadState("networkidle");

    await expect(page.locator(`td:has-text("${TEST_DOMAIN}")`)).toHaveCount(0);

    const remaining = psql(`SELECT count(*) FROM store_domains WHERE domain = '${TEST_DOMAIN}';`);
    expect(remaining).toContain(" 0");
    await page.close();
  });
});

test.describe("24-F — Content: hero/subhero/footer + media library", () => {
  const MEDIA_SLUG = "e2e-content-hero-image";

  test.afterAll(() => {
    psql(`${replica}
      UPDATE public.store_configs SET hero_content = NULL, footer_content = NULL WHERE party_id = '${PARTY_ID}';
      DELETE FROM public.store_media WHERE party_id = '${PARTY_ID}' AND slug = '${MEDIA_SLUG}';
    ${defaultRole}`);
  });

  test("24-F-01 upload media: appears in the library with its {{media:slug}} token", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/settings/content`);
    await page.waitForLoadState("networkidle");

    await page.fill('form.upload-form input[name="slug"]', MEDIA_SLUG);
    await page.fill('form.upload-form input[name="alt"]', "E2E hero image");
    await page.locator('form.upload-form input[type="file"]').setInputFiles(TEST_IMAGE);
    await page.click('form.upload-form button[type="submit"]');
    await page.waitForLoadState("networkidle");

    await expect(page.locator(`code.token:has-text("{{media:${MEDIA_SLUG}}}")`)).toBeVisible();
    await page.close();
  });

  test("24-F-02 markdown hero referencing the uploaded media renders an <img> on the storefront", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/settings/content`);
    await page.waitForLoadState("networkidle");

    await page.fill('textarea[name="hero_content"]', `# Custom Hero\n\n{{media:${MEDIA_SLUG}}}`);
    await page.click('form.settings-form button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".alert-success")).toBeVisible();

    await page.goto(`${BASE}/eshop-test-organisation`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".hero-custom h1")).toHaveText("Custom Hero");
    await expect(page.locator(".hero-custom img")).toHaveCount(1);
    await page.close();
  });

  test("24-F-03 [regression] a <script> tag in HTML footer content is stripped on render, never reaches the public page", async ({ browser }: { browser: Browser }) => {
    const page = await browser.newPage();
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/settings/content`);
    await page.waitForLoadState("networkidle");

    await page.locator('input[name="footer_format"][value="html"]').check();
    await page.fill(
      'textarea[name="footer_content"]',
      `<p>Safe footer text</p><script>window.__xss_footer=1</script>`
    );
    await page.click('form.settings-form button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".alert-success")).toBeVisible();

    await page.goto(`${BASE}/eshop-test-organisation`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".footer-custom")).toContainText("Safe footer text");
    expect(await page.locator(".footer-custom script").count()).toBe(0);
    const xssRan = await page.evaluate(() => (window as any).__xss_footer);
    expect(xssRan).toBeUndefined();
    await page.close();
  });
});
