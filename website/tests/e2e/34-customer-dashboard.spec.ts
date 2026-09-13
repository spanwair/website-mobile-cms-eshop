import { test, expect } from "@playwright/test";
import {
  psql,
  replica,
  defaultRole,
  loginAs,
  createTestCustomer,
  deleteTestCustomer,
  BASE,
  PARTY_ID,
  CUSTOMER_ID,
} from "./helpers";

// Self-contained: this spec creates its own auth identities instead of relying on the shared
// global-setup fixtures (user@/eshop@test.com), which can be absent in a DB shared across
// worktrees. The signup-classification and empty-state cases already mint their own users.

const DASH_CUST_ID = "d0000000-0000-0000-0000-0000000000f1";
const SELLER_ID = "d0000000-0000-0000-0000-0000000000f2";
const DASH_EMAIL = "dash_customer@dash.test";
const SELLER_EMAIL = "dash_seller@dash.test";
const PW = "Passw0rd!";

const ORD_DELIVERED = "d0000000-0000-0000-0000-0000000000a1";
const ORD_SHIPPED = "d0000000-0000-0000-0000-0000000000b2";
const RET_ID = "d0000000-0000-0000-0000-0000000000c3";
const TRACKING = "TRK-999-XYZ";

function roleOf(email: string): string {
  return psql(`SELECT 'ROLE=' || role || ';SP=' || COALESCE(signup_party_id::text, 'none') FROM public.profiles WHERE email = '${email}';`);
}

// handle_new_user() runs asynchronously relative to the signUp response; poll until the profile
// row exists rather than relying on a fixed sleep.
async function waitForRole(email: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const row = roleOf(email);
    if (row.includes("ROLE=")) return row;
    await new Promise((r) => setTimeout(r, 250));
  }
  return roleOf(email);
}

function purgeUser(email: string) {
  psql(`${replica} DELETE FROM public.profiles WHERE email = '${email}'; DELETE FROM auth.users WHERE email = '${email}'; ${defaultRole}`);
}

test.describe("Customer account dashboard", () => {
  test.beforeAll(() => {
    purgeUser(DASH_EMAIL);
    purgeUser(SELLER_EMAIL);
    createTestCustomer(DASH_CUST_ID, DASH_EMAIL, PW);
    createTestCustomer(SELLER_ID, SELLER_EMAIL, PW);

    psql(`
      ${replica}
      -- Dashboard customer: a plain USER whose home eshop is PARTY_ID, linked to its seeded customer.
      UPDATE public.profiles SET role = 1, signup_party_id = '${PARTY_ID}', display_name = 'Dash Customer' WHERE id = '${DASH_CUST_ID}';
      UPDATE public.customers SET user_id = '${DASH_CUST_ID}' WHERE id = '${CUSTOMER_ID}';
      -- A seller/staff account (admin) that must be bounced off /dashboard.
      UPDATE public.profiles SET role = 4, display_name = 'Dash Seller' WHERE id = '${SELLER_ID}';

      UPDATE public.store_configs
        SET contact_phone = '+420 555 111 222', contact_email = 'shop@testorg.com', business_hours = 'Po-Pá 9-17'
        WHERE party_id = '${PARTY_ID}';

      DELETE FROM public.return_requests WHERE id = '${RET_ID}';
      DELETE FROM public.orders WHERE id IN ('${ORD_DELIVERED}', '${ORD_SHIPPED}');
      INSERT INTO public.orders (id, party_id, customer_id, order_number, status, payment_status, subtotal, total_amount, currency, delivered_at)
        VALUES ('${ORD_DELIVERED}', '${PARTY_ID}', '${CUSTOMER_ID}', 'ORD-DASH-0001', 'delivered', 'paid', 500, 500, 'CZK', now());
      INSERT INTO public.orders (id, party_id, customer_id, order_number, status, payment_status, subtotal, total_amount, currency, shipped_at, tracking_number)
        VALUES ('${ORD_SHIPPED}', '${PARTY_ID}', '${CUSTOMER_ID}', 'ORD-DASH-0002', 'shipped', 'paid', 300, 300, 'CZK', now(), '${TRACKING}');
      INSERT INTO public.return_requests (id, party_id, order_id, customer_id, return_number, status, reason)
        VALUES ('${RET_ID}', '${PARTY_ID}', '${ORD_DELIVERED}', '${CUSTOMER_ID}', 'RET-DASH-0001', 'pending', 'damaged');
      ${defaultRole}
    `);
  });

  test.afterAll(() => {
    psql(`${replica}
      DELETE FROM public.return_requests WHERE id = '${RET_ID}';
      DELETE FROM public.orders WHERE id IN ('${ORD_DELIVERED}', '${ORD_SHIPPED}');
      ${defaultRole}`);
    deleteTestCustomer(DASH_CUST_ID);
    deleteTestCustomer(SELLER_ID);
  });

  test("storefront signup is classified as a customer (role=1) with a home eshop", async ({ page }) => {
    const email = `cust_${Date.now()}@dash.test`;
    purgeUser(email);
    await page.goto(`${BASE}/login?mode=signup&redirect=%2Feshop-test-organisation&sp=${PARTY_ID}`);
    await page.locator("#su-name").fill("Dash Customer");
    await page.locator("#su-email").fill(email);
    await page.locator("#su-password").fill(PW);
    await page.locator("#su-confirm").fill(PW);
    await page.locator("#signup-btn").click();
    // signUp fires handle_new_user immediately (unconfirmed user); we assert the DB classification.
    const row = await waitForRole(email);
    expect(row).toContain("ROLE=1");
    expect(row).toContain(`SP=${PARTY_ID}`);
    purgeUser(email);
  });

  test("main-site signup is still a seller (role=4) — regression guard", async ({ page }) => {
    const email = `seller_${Date.now()}@dash.test`;
    purgeUser(email);
    await page.goto(`${BASE}/login?mode=signup`);
    await page.locator("#su-name").fill("Seller Person");
    await page.locator("#su-email").fill(email);
    await page.locator("#su-password").fill(PW);
    await page.locator("#su-confirm").fill(PW);
    await page.locator("#signup-btn").click();
    const row = await waitForRole(email);
    expect(row).toContain("ROLE=4");
    expect(row).toContain("SP=none");
    purgeUser(email);
  });

  test("dashboard renders scoped to the home eshop with orders, tracking, returns and contact", async ({ page }) => {
    await loginAs(page, DASH_EMAIL, PW);
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.locator(".dash-header")).toContainText("Test Organisation");
    await expect(page.locator(".orders-table")).toContainText("ORD-DASH-0001");
    await expect(page.locator(".orders-table")).toContainText("ORD-DASH-0002");
    await expect(page.locator(".track-list")).toContainText(TRACKING);
    await expect(page.locator(".ret-list")).toContainText("RET-DASH-0001");
    await expect(page.locator(".contact-card")).toContainText("+420 555 111 222");
    await expect(page.locator(".contact-card")).toContainText("shop@testorg.com");
    await expect(page.locator(".eshop-cta a")).toHaveAttribute("href", "/");
  });

  test("storefront nav links account pages into the eshop route family (storefront chrome)", async ({ page }) => {
    await loginAs(page, DASH_EMAIL, PW);
    await page.goto(`${BASE}/eshop-test-organisation`);
    await expect(page.locator("#profile-dropdown a", { hasText: /account|účet/i }).first())
      .toHaveAttribute("href", "/eshop-test-organisation/dashboard");

    // The eshop-scoped dashboard renders inside the store's own chrome (storefront topbar), not
    // the generic marketing layout, and still shows this customer's orders.
    await page.goto(`${BASE}/eshop-test-organisation/dashboard`);
    await expect(page).toHaveURL(/\/eshop-test-organisation\/dashboard$/);
    await expect(page.locator(".storefront-topbar")).toBeVisible();
    await expect(page.locator(".orders-table")).toContainText("ORD-DASH-0001");

    // Profile and settings are also served under the eshop with storefront chrome.
    for (const sub of ["profile", "settings"]) {
      await page.goto(`${BASE}/eshop-test-organisation/${sub}`);
      await expect(page.locator(".storefront-topbar")).toBeVisible();
    }
  });

  test("top-level account pages still render with generic chrome (other navigators)", async ({ page }) => {
    await loginAs(page, DASH_EMAIL, PW);
    await page.goto(`${BASE}/dashboard`);
    await expect(page.locator(".dash-header")).toBeVisible();
    await expect(page.locator(".storefront-topbar")).toHaveCount(0);
    await page.goto(`${BASE}/profile`);
    await expect(page.locator(".profile-content")).toBeVisible();
    // The "sell too?" CTA (pointing to the platform root) also appears on profile and settings.
    await expect(page.locator(".eshop-cta a")).toHaveAttribute("href", "/");
    await page.goto(`${BASE}/settings`);
    await expect(page.locator(".settings-page")).toBeVisible();
    await expect(page.locator(".eshop-cta a")).toHaveAttribute("href", "/");
  });

  test("a seller/staff account is redirected off /dashboard to /admin", async ({ page }) => {
    await loginAs(page, SELLER_EMAIL, PW);
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/admin/);
  });

  test("a customer visiting /admin is redirected to /dashboard", async ({ page }) => {
    await loginAs(page, DASH_EMAIL, PW);
    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("empty state: a customer with no orders sees a friendly prompt", async ({ page }) => {
    const id = "e0000000-0000-0000-0000-0000000000e1";
    const email = `empty_${Date.now()}@dash.test`;
    purgeUser(email);
    createTestCustomer(id, email, PW);
    psql(`${replica} UPDATE public.profiles SET role = 1, signup_party_id = '${PARTY_ID}', display_name = 'Empty Customer' WHERE id = '${id}'; ${defaultRole}`);
    try {
      await loginAs(page, email, PW);
      await page.goto(`${BASE}/dashboard`);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.locator(".dash-empty")).toBeVisible();
    } finally {
      deleteTestCustomer(id);
    }
  });
});
