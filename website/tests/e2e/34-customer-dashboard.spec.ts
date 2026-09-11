import { test, expect } from "@playwright/test";
import {
  psql,
  replica,
  defaultRole,
  loginAs,
  createTestCustomer,
  deleteTestCustomer,
  BASE,
  USER,
  USER_ID,
  PARTY_ID,
  CUSTOMER_ID,
} from "./helpers";

// Fixed ids so each run cleans up its own rows before re-seeding.
const ORD_DELIVERED = "d0000000-0000-0000-0000-0000000000a1";
const ORD_SHIPPED = "d0000000-0000-0000-0000-0000000000b2";
const RET_ID = "d0000000-0000-0000-0000-0000000000c3";
const TRACKING = "TRK-999-XYZ";

function roleOf(email: string): string {
  return psql(`SELECT 'ROLE=' || role || ';SP=' || COALESCE(signup_party_id::text, 'none') FROM public.profiles WHERE email = '${email}';`);
}

function purgeUser(email: string) {
  psql(`${replica} DELETE FROM public.profiles WHERE email = '${email}'; DELETE FROM auth.users WHERE email = '${email}'; ${defaultRole}`);
}

test.describe("Customer account dashboard", () => {
  test.beforeAll(() => {
    // Home eshop + linked customer + contact info + orders/returns for the regular USER fixture.
    psql(`
      ${replica}
      UPDATE public.profiles SET signup_party_id = '${PARTY_ID}' WHERE id = '${USER_ID}';
      UPDATE public.customers SET user_id = '${USER_ID}' WHERE id = '${CUSTOMER_ID}';
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
        VALUES ('${RET_ID}', '${PARTY_ID}', '${ORD_DELIVERED}', '${CUSTOMER_ID}', 'RET-DASH-0001', 'requested', 'Damaged item');
      ${defaultRole}
    `);
  });

  test.afterAll(() => {
    psql(`${replica}
      DELETE FROM public.return_requests WHERE id = '${RET_ID}';
      DELETE FROM public.orders WHERE id IN ('${ORD_DELIVERED}', '${ORD_SHIPPED}');
      ${defaultRole}`);
  });

  test("storefront signup is classified as a customer (role=1) with a home eshop", async ({ page }) => {
    const email = `cust_${Date.now()}@dash.test`;
    purgeUser(email);
    await page.goto(`${BASE}/login?mode=signup&redirect=%2Feshop-test-organisation&sp=${PARTY_ID}`);
    await page.locator("#su-name").fill("Dash Customer");
    await page.locator("#su-email").fill(email);
    await page.locator("#su-password").fill("Passw0rd!");
    await page.locator("#su-confirm").fill("Passw0rd!");
    await page.locator("#signup-btn").click();
    // signUp fires handle_new_user immediately (unconfirmed user); we assert the DB classification.
    await page.waitForTimeout(1500);
    const row = roleOf(email);
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
    await page.locator("#su-password").fill("Passw0rd!");
    await page.locator("#su-confirm").fill("Passw0rd!");
    await page.locator("#signup-btn").click();
    await page.waitForTimeout(1500);
    const row = roleOf(email);
    expect(row).toContain("ROLE=4");
    expect(row).toContain("SP=none");
    purgeUser(email);
  });

  test("dashboard renders scoped to the home eshop with orders, tracking, returns and contact", async ({ page }) => {
    await loginAs(page, USER.email, USER.password);
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard$/);

    // Home eshop brand is highlighted in the header.
    await expect(page.locator(".dash-header")).toContainText("Test Organisation");

    // Orders scoped to this customer.
    await expect(page.locator(".orders-table")).toContainText("ORD-DASH-0001");
    await expect(page.locator(".orders-table")).toContainText("ORD-DASH-0002");

    // In-transit tracking.
    await expect(page.locator(".track-list")).toContainText(TRACKING);

    // Returns.
    await expect(page.locator(".ret-list")).toContainText("RET-DASH-0001");

    // Contact-the-shop block.
    await expect(page.locator(".contact-card")).toContainText("+420 555 111 222");
    await expect(page.locator(".contact-card")).toContainText("shop@testorg.com");

    // Seller CTA links to onboarding pitch, not an in-place role change.
    await expect(page.locator(".eshop-cta a")).toHaveAttribute("href", "/pricing");
  });

  test("a seller/staff account is redirected off /dashboard to /admin", async ({ page }) => {
    // ESHOP fixture is role=2 → belongs in admin.
    await loginAs(page, "eshop@test.com", "Eshop1234!");
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/admin/);
  });

  test("a customer visiting /admin is redirected to /dashboard", async ({ page }) => {
    await loginAs(page, USER.email, USER.password);
    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("empty state: a customer with no orders sees a friendly prompt", async ({ page }) => {
    const id = "e0000000-0000-0000-0000-0000000000e1";
    const email = `empty_${Date.now()}@dash.test`;
    createTestCustomer(id, email, "Passw0rd!");
    // Freshly created via admin API with no metadata → role 4; make it a customer of PARTY_ID.
    psql(`${replica} UPDATE public.profiles SET role = 1, signup_party_id = '${PARTY_ID}', display_name = 'Empty Customer' WHERE id = '${id}'; ${defaultRole}`);
    try {
      await loginAs(page, email, "Passw0rd!");
      await page.goto(`${BASE}/dashboard`);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.locator(".dash-empty")).toBeVisible();
    } finally {
      deleteTestCustomer(id);
    }
  });
});
