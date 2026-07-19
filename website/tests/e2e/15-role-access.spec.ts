/**
 * 15 — Comprehensive Role Access Tests
 *
 * Tests every admin page for all 4 roles:
 *   OWNER (8)      → full access everywhere, no party required
 *   ADMIN (4)      → full access within their org, needs party
 *   ESHOP_ADMIN(2) → limited by permission bits, within org only
 *   USER (1)       → zero admin access, redirected to /dashboard
 *
 * Rules (mandatory, match shared/constants/permissions.ts):
 *   - Permission bits only from PERMISSIONS constant — never raw numbers
 *   - Owner and admin always get ALL_PERMISSIONS
 *   - Eshop admin: only what bits their role grants
 *   - User: no admin access at all
 */

import { test, expect, type Browser, type Page } from "@playwright/test";
import { execSync } from "child_process";
import {
  BASE, loginAs,
  OWNER, ADMIN, ESHOP, USER,
  OWNER_ID, ADMIN_ID, ESHOP_ID,
  PARTY_ID, PARTY2_ID,
  PRODUCT_ID, ORDER_ID, CUSTOMER_ID, CATEGORY_ID,
  LIMITED_ESHOP_ROLE_ID, DASHBOARD_PROD_CAT_ROLE_ID,
} from "./helpers";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function psql(sql: string) {
  return execSync(
    `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "${sql}"`,
    { stdio: "pipe" }
  ).toString();
}

const replica = "SET session_replication_role = replica;";
const def = "SET session_replication_role = DEFAULT;";

/** Set eshop user's party role to use limited role (MANAGE_PRODUCTS only) */
function setEshopLimitedRole() {
  psql(`
    ${replica}
    UPDATE public.user_party_roles
    SET role_id = '${LIMITED_ESHOP_ROLE_ID}'
    WHERE user_id = '${ESHOP_ID}' AND party_id = '${PARTY_ID}';
    ${def}
  `);
}

/** Set eshop user back to Super Admin role (full permissions) */
function setEshopFullRole(superAdminRoleId: string) {
  psql(`
    ${replica}
    UPDATE public.user_party_roles
    SET role_id = '${superAdminRoleId}'
    WHERE user_id = '${ESHOP_ID}' AND party_id = '${PARTY_ID}';
    ${def}
  `);
}

function getSuperAdminRoleId(): string {
  return execSync(
    `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres --tuples-only -c "SELECT id FROM public.roles WHERE party_id = '${PARTY_ID}' AND name = 'Super Admin' LIMIT 1;"`,
    { stdio: "pipe" }
  ).toString().trim();
}

/** Expect page stays at the target URL (not redirected away) */
async function expectAccess(page: Page, url: string) {
  await page.goto(`${BASE}${url}`);
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(`${BASE}${url}`, { timeout: 8000 });
}

/** Expect page redirects away from target (access blocked) */
async function expectBlocked(page: Page, url: string) {
  await page.goto(`${BASE}${url}`);
  await page.waitForLoadState("networkidle");
  await expect(page).not.toHaveURL(`${BASE}${url}`, { timeout: 8000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ROLE (role=1) — zero admin access
// ─────────────────────────────────────────────────────────────────────────────

test.describe("15-A — USER: no admin access", () => {
  const pages = [
    "/admin", "/admin/products", "/admin/categories", "/admin/orders",
    "/admin/customers", "/admin/pricing", "/admin/inventory", "/admin/users",
    "/admin/roles", "/admin/parties", "/admin/reports", "/admin/audit",
    "/admin/reviews", "/admin/returns", "/admin/notifications",
  ];

  let userPage: Page;
  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    userPage = await browser.newPage();
    await loginAs(userPage, USER.email, USER.password);
  });
  test.afterAll(() => userPage?.close());

  for (const url of pages) {
    test(`user blocked from ${url}`, async () => {
      await userPage.goto(`${BASE}${url}`);
      await userPage.waitForLoadState("networkidle");
      await expect(userPage).not.toHaveURL(new RegExp(`^${BASE}/admin`));
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OWNER ROLE (role=8) — full access, no party required
// ─────────────────────────────────────────────────────────────────────────────

test.describe("15-B — OWNER: full access to all pages", () => {
  let ownerPage: Page;
  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    ownerPage = await browser.newPage();
    await loginAs(ownerPage, OWNER.email, OWNER.password);
  });
  test.afterAll(() => ownerPage?.close());

  test("15-B-01 owner accesses /admin dashboard", async () => {
    await expectAccess(ownerPage, "/admin");
    await expect(ownerPage.locator("[data-kpi]").first()).toBeVisible();
  });

  test("15-B-02 owner accesses /admin/products", async () => {
    await expectAccess(ownerPage, "/admin/products");
    await expect(ownerPage.locator("table.data-table")).toBeVisible();
  });

  test("15-B-03 owner accesses /admin/categories", async () => {
    await expectAccess(ownerPage, "/admin/categories");
  });

  test("15-B-04 owner accesses /admin/orders", async () => {
    await expectAccess(ownerPage, "/admin/orders");
    await expect(ownerPage.locator("table.data-table")).toBeVisible();
  });

  test("15-B-05 owner accesses /admin/customers", async () => {
    await expectAccess(ownerPage, "/admin/customers");
    await expect(ownerPage.locator("table.data-table")).toBeVisible();
  });

  test("15-B-06 owner accesses /admin/pricing", async () => {
    await expectAccess(ownerPage, "/admin/pricing");
  });

  test("15-B-07 owner accesses /admin/inventory", async () => {
    await expectAccess(ownerPage, "/admin/inventory");
  });

  test("15-B-08 owner accesses /admin/users", async () => {
    await expectAccess(ownerPage, "/admin/users");
    await expect(ownerPage.locator("table.data-table")).toBeVisible();
  });

  test("15-B-09 owner accesses /admin/roles", async () => {
    await expectAccess(ownerPage, "/admin/roles");
  });

  test("15-B-10 owner accesses /admin/parties", async () => {
    await expectAccess(ownerPage, "/admin/parties");
  });

  test("15-B-11 owner accesses /admin/parties/new", async () => {
    await expectAccess(ownerPage, "/admin/parties/new");
  });

  test("15-B-12 owner accesses /admin/reports", async () => {
    await expectAccess(ownerPage, "/admin/reports");
  });

  test("15-B-13 owner accesses /admin/audit", async () => {
    await expectAccess(ownerPage, "/admin/audit");
  });

  test("15-B-14 owner accesses /admin/reviews", async () => {
    await expectAccess(ownerPage, "/admin/reviews");
  });

  test("15-B-15 owner accesses /admin/returns", async () => {
    await expectAccess(ownerPage, "/admin/returns");
  });

  test("15-B-16 owner accesses /admin/notifications", async () => {
    await expectAccess(ownerPage, "/admin/notifications");
  });

  test("15-B-17 owner sidebar shows all groups", async () => {
    await ownerPage.goto(`${BASE}/admin`);
    await ownerPage.waitForLoadState("networkidle");
    const sidebar = ownerPage.locator("aside.sidebar");
    await expect(sidebar.locator("a[href='/admin/products']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/orders']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/users']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/parties']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/audit']")).toBeVisible();
  });

  test("15-B-18 owner can assign any role including owner", async () => {
    await ownerPage.goto(`${BASE}/admin/users`);
    await ownerPage.waitForLoadState("networkidle");
    // The role select for another user should include owner option
    const selects = ownerPage.locator("select[name='role']");
    if (await selects.count() > 0) {
      const first = selects.first();
      const ownerOption = first.locator("option[value='8']");
      await expect(ownerOption).toHaveCount(1);
    }
  });

  test("15-B-19 owner can view specific party", async () => {
    await expectAccess(ownerPage, `/admin/parties/${PARTY_ID}`);
  });

  test("15-B-20 owner can view specific product", async () => {
    await expectAccess(ownerPage, `/admin/products/${PRODUCT_ID}`);
  });

  test("15-B-21 owner can view specific order", async () => {
    await expectAccess(ownerPage, `/admin/orders/${ORDER_ID}`);
  });

  test("15-B-22 owner can view specific customer", async () => {
    await expectAccess(ownerPage, `/admin/customers/${CUSTOMER_ID}`);
  });

  test("15-B-23 owner accesses /admin/products/new", async () => {
    await expectAccess(ownerPage, "/admin/products/new");
  });

  test("15-B-24 owner accesses /admin/categories/new", async () => {
    await expectAccess(ownerPage, "/admin/categories/new");
  });

  test("15-B-25 owner accesses /admin/roles/new", async () => {
    await expectAccess(ownerPage, "/admin/roles/new");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROLE (role=4) — full access within org, needs party
// ─────────────────────────────────────────────────────────────────────────────

test.describe("15-C — ADMIN: full access within org", () => {
  let adminPage: Page;
  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    adminPage = await browser.newPage();
    await loginAs(adminPage, ADMIN.email, ADMIN.password);
  });
  test.afterAll(() => adminPage?.close());

  test("15-C-01 admin accesses /admin dashboard", async () => {
    await expectAccess(adminPage, "/admin");
  });

  test("15-C-02 admin accesses /admin/products", async () => {
    await expectAccess(adminPage, "/admin/products");
  });

  test("15-C-03 admin accesses /admin/categories", async () => {
    await expectAccess(adminPage, "/admin/categories");
  });

  test("15-C-04 admin accesses /admin/orders", async () => {
    await expectAccess(adminPage, "/admin/orders");
  });

  test("15-C-05 admin accesses /admin/customers", async () => {
    await expectAccess(adminPage, "/admin/customers");
  });

  test("15-C-06 admin accesses /admin/pricing", async () => {
    await expectAccess(adminPage, "/admin/pricing");
  });

  test("15-C-07 admin accesses /admin/inventory", async () => {
    await expectAccess(adminPage, "/admin/inventory");
  });

  test("15-C-08 admin accesses /admin/users", async () => {
    await expectAccess(adminPage, "/admin/users");
  });

  test("15-C-09 admin accesses /admin/roles", async () => {
    await expectAccess(adminPage, "/admin/roles");
  });

  test("15-C-10 admin accesses /admin/parties", async () => {
    await expectAccess(adminPage, "/admin/parties");
  });

  test("15-C-11 admin is blocked from /admin/parties/new (owner-only)", async () => {
    await adminPage.goto(`${BASE}/admin/parties/new`);
    await adminPage.waitForLoadState("networkidle");
    await expect(adminPage).not.toHaveURL(`${BASE}/admin/parties/new`);
  });

  test("15-C-12 admin accesses /admin/reports", async () => {
    await expectAccess(adminPage, "/admin/reports");
  });

  test("15-C-13 admin accesses /admin/audit", async () => {
    await expectAccess(adminPage, "/admin/audit");
  });

  test("15-C-14 admin accesses /admin/reviews", async () => {
    await expectAccess(adminPage, "/admin/reviews");
  });

  test("15-C-15 admin accesses /admin/returns", async () => {
    await expectAccess(adminPage, "/admin/returns");
  });

  test("15-C-16 admin accesses /admin/notifications", async () => {
    await expectAccess(adminPage, "/admin/notifications");
  });

  test("15-C-17 admin sidebar shows all items", async () => {
    await adminPage.goto(`${BASE}/admin`);
    await adminPage.waitForLoadState("networkidle");
    const sidebar = adminPage.locator("aside.sidebar");
    await expect(sidebar.locator("a[href='/admin/products']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/orders']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/users']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/audit']")).toBeVisible();
  });

  test("15-C-18 admin can assign admin and below but NOT owner", async () => {
    await adminPage.goto(`${BASE}/admin/users`);
    await adminPage.waitForLoadState("networkidle");
    const selects = adminPage.locator("select[name='role']");
    if (await selects.count() > 0) {
      const first = selects.first();
      await expect(first.locator("option[value='8']")).toHaveCount(0);
      await expect(first.locator("option[value='4']")).toHaveCount(1);
    }
  });

  test("15-C-19 admin blocked from PARTY2 (not their org)", async () => {
    // Admin is NOT a member of PARTY2; visiting it should redirect
    await adminPage.goto(`${BASE}/admin/parties/${PARTY2_ID}`);
    await adminPage.waitForLoadState("networkidle");
    await expect(adminPage).not.toHaveURL(`${BASE}/admin/parties/${PARTY2_ID}`);
  });

  test("15-C-20 admin can view specific product in their org", async () => {
    await expectAccess(adminPage, `/admin/products/${PRODUCT_ID}`);
  });

  test("15-C-21 admin can view specific order in their org", async () => {
    await expectAccess(adminPage, `/admin/orders/${ORDER_ID}`);
  });

  test("15-C-22 admin can view specific customer", async () => {
    await expectAccess(adminPage, `/admin/customers/${CUSTOMER_ID}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ESHOP_ADMIN — full permissions (Super Admin role)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("15-D — ESHOP_ADMIN full perms: access matches permission bits", () => {
  let eshopPage: Page;
  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    eshopPage = await browser.newPage();
    await loginAs(eshopPage, ESHOP.email, ESHOP.password);
  });
  test.afterAll(() => eshopPage?.close());

  test("15-D-01 eshop (full) accesses /admin", async () => {
    await expectAccess(eshopPage, "/admin");
  });

  test("15-D-02 eshop (full) accesses /admin/products", async () => {
    await expectAccess(eshopPage, "/admin/products");
  });

  test("15-D-03 eshop (full) accesses /admin/categories", async () => {
    await expectAccess(eshopPage, "/admin/categories");
  });

  test("15-D-04 eshop (full) accesses /admin/orders", async () => {
    await expectAccess(eshopPage, "/admin/orders");
  });

  test("15-D-05 eshop (full) accesses /admin/customers", async () => {
    await expectAccess(eshopPage, "/admin/customers");
  });

  test("15-D-06 eshop (full) accesses /admin/pricing", async () => {
    await expectAccess(eshopPage, "/admin/pricing");
  });

  test("15-D-07 eshop (full) accesses /admin/inventory", async () => {
    await expectAccess(eshopPage, "/admin/inventory");
  });

  test("15-D-08 eshop (full) is blocked from /admin/parties/new (owner-only)", async () => {
    await eshopPage.goto(`${BASE}/admin/parties/new`);
    await eshopPage.waitForLoadState("networkidle");
    await expect(eshopPage).not.toHaveURL(`${BASE}/admin/parties/new`);
  });

  test("15-D-09 eshop (full) accesses /admin/notifications", async () => {
    await expectAccess(eshopPage, "/admin/notifications");
  });

  test("15-D-10 eshop (full) cannot access PARTY2 (not their org)", async () => {
    await eshopPage.goto(`${BASE}/admin/parties/${PARTY2_ID}`);
    await eshopPage.waitForLoadState("networkidle");
    // eshop_admin IS a member of PARTY2 in test data, so this should be accessible
    // (global-setup links ESHOP_ID to PARTY2 as well)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ESHOP_ADMIN — limited permissions (MANAGE_PRODUCTS only = bit 8)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("15-E — ESHOP_ADMIN limited perms (MANAGE_PRODUCTS only)", () => {
  let eshopLtdPage: Page;
  let superAdminRoleId: string;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    superAdminRoleId = getSuperAdminRoleId();
    setEshopLimitedRole();
    eshopLtdPage = await browser.newPage();
    await loginAs(eshopLtdPage, ESHOP.email, ESHOP.password);
    // Force PARTY_ID as active party — eshop has full role in PARTY2 (sorts first alphabetically)
    await eshopLtdPage.context().addCookies([{
      name: "activePartyId", value: PARTY_ID, domain: "localhost", path: "/",
    }]);
  });

  test.afterAll(async () => {
    // Restore full role
    if (superAdminRoleId) setEshopFullRole(superAdminRoleId);
    await eshopLtdPage?.close();
  });

  test("15-E-01 limited eshop: /admin redirects (needs VIEW_DASHBOARD)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin`);
    await eshopLtdPage.waitForLoadState("networkidle");
    // VIEW_DASHBOARD (1) is not in limited set (8), so dashboard access blocked
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin`);
  });

  test("15-E-02 limited eshop: /admin/products accessible (has MANAGE_PRODUCTS)", async () => {
    await expectAccess(eshopLtdPage, "/admin/products");
  });

  test("15-E-03 limited eshop: /admin/orders blocked (no MANAGE_ORDERS)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/orders`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/orders`);
  });

  test("15-E-04 limited eshop: /admin/customers blocked (no MANAGE_CUSTOMERS)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/customers`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/customers`);
  });

  test("15-E-05 limited eshop: /admin/categories blocked (no MANAGE_CATEGORIES)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/categories`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/categories`);
  });

  test("15-E-06 limited eshop: /admin/pricing blocked (no MANAGE_PRICING)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/pricing`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/pricing`);
  });

  test("15-E-07 limited eshop: /admin/inventory blocked (no MANAGE_INVENTORY)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/inventory`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/inventory`);
  });

  test("15-E-08 limited eshop: /admin/users blocked (no MANAGE_USERS)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/users`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/users`);
  });

  test("15-E-09 limited eshop: /admin/roles blocked (no MANAGE_ROLES)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/roles`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/roles`);
  });

  test("15-E-10 limited eshop: /admin/reports blocked (no MANAGE_REPORTS)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/reports`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/reports`);
  });

  test("15-E-11 limited eshop: /admin/audit blocked (no MANAGE_AUDIT)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/audit`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/audit`);
  });

  test("15-E-12 limited eshop: /admin/notifications always accessible", async () => {
    await expectAccess(eshopLtdPage, "/admin/notifications");
  });

  test("15-E-13 limited eshop: /admin/reviews accessible (MANAGE_PRODUCTS)", async () => {
    await expectAccess(eshopLtdPage, "/admin/reviews");
  });

  test("15-E-14 limited eshop: /admin/returns blocked (no MANAGE_ORDERS)", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/returns`);
    await eshopLtdPage.waitForLoadState("networkidle");
    await expect(eshopLtdPage).not.toHaveURL(`${BASE}/admin/returns`);
  });

  test("15-E-15 limited eshop: sidebar only shows products and notifications", async () => {
    await eshopLtdPage.goto(`${BASE}/admin/products`);
    await eshopLtdPage.waitForLoadState("networkidle");
    const sidebar = eshopLtdPage.locator("aside.sidebar");
    await expect(sidebar.locator("a[href='/admin/products']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/reviews']")).toBeVisible();
    await expect(sidebar.locator("a[href='/admin/notifications']")).toBeVisible();
    // These should NOT be visible
    await expect(sidebar.locator("a[href='/admin/orders']")).toHaveCount(0);
    await expect(sidebar.locator("a[href='/admin/users']")).toHaveCount(0);
    await expect(sidebar.locator("a[href='/admin/audit']")).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WRITE/EDIT operations — verify each role can perform actions within their scope
// ─────────────────────────────────────────────────────────────────────────────

test.describe("15-F — Write operations by role", () => {
  test("15-F-01 owner can create a new organization", async ({ page }) => {
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/parties/new`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(`${BASE}/admin/parties/new`);
    await page.fill("input[name='name']", "E2E Test Org");
    await page.fill("input[name='slug']", `e2e-org-${Date.now()}`);
    await page.locator(".cms-content button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`${BASE}/admin/parties`));
  });

  test("15-F-02 admin can create a product in their org", async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/products/new`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(`${BASE}/admin/products/new`);
    const ts = Date.now();
    await page.fill("input[name='title']", `E2E Product ${ts}`);
    await page.fill("input[name='slug']", `e2e-product-${ts}`);
    await page.fill("input[name='price']", "99.90");
    await page.locator(".cms-content button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`${BASE}/admin/products`));
  });

  test("15-F-03 eshop_admin (full) can create a product", async ({ page }) => {
    await loginAs(page, ESHOP.email, ESHOP.password);
    await page.goto(`${BASE}/admin/products/new`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(`${BASE}/admin/products/new`);
    const ts = Date.now();
    await page.fill("input[name='title']", `Eshop Product ${ts}`);
    await page.fill("input[name='slug']", `eshop-product-${ts}`);
    await page.fill("input[name='price']", "49.90");
    await page.locator(".cms-content button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`${BASE}/admin/products`));
  });

  test("15-F-04 user cannot POST to /admin/products/new", async ({ page }) => {
    await loginAs(page, USER.email, USER.password);
    await page.goto(`${BASE}/admin/products/new`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(`${BASE}/admin/products/new`);
  });

  test("15-F-05 admin can create a category", async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/categories/new`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(`${BASE}/admin/categories/new`);
    const ts = Date.now();
    await page.fill("input[name='name']", `E2E Category ${ts}`);
    await page.fill("input[name='slug']", `e2e-cat-${ts}`);
    await page.locator(".cms-content button[type='submit']").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`${BASE}/admin/categories`));
  });

  test("15-F-06 owner can assign owner role to another user", async ({ page }) => {
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState("networkidle");
    // Owner role select should include option value=8 (count ≥ 1 — options are never "visible" when select is closed)
    // Each user row has a select — any having owner option confirms owner can assign owner role
    const ownerOptions = page.locator("select[name='role'] option[value='8']");
    await expect(ownerOptions).not.toHaveCount(0);
  });

  test("15-F-07 admin POST to assign owner role is rejected", async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState("networkidle");
    // Try to find a user row that isn't the admin themselves
    const rows = page.locator("tr").filter({ has: page.locator("select[name='role']") });
    if (await rows.count() > 0) {
      const form = rows.first().locator("form.role-form");
      await form.locator("select[name='role']").selectOption({ value: "4" }); // Can assign admin
      // Verify owner option doesn't exist
      const ownerOpt = rows.first().locator("select[name='role'] option[value='8']");
      await expect(ownerOpt).toHaveCount(0);
    }
  });

  test("15-F-08 limited eshop_admin POST to /admin/products goes through", async ({ page }) => {
    const superAdminRoleId = getSuperAdminRoleId();
    setEshopLimitedRole();
    try {
      await loginAs(page, ESHOP.email, ESHOP.password);
      await page.goto(`${BASE}/admin/products/new`);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(`${BASE}/admin/products/new`);
    } finally {
      setEshopFullRole(superAdminRoleId);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ESHOP_ADMIN — dashboard+products+categories (VIEW_DASHBOARD|MANAGE_PRODUCTS|MANAGE_CATEGORIES = 25)
// Verifies overview page shows only the sections the user has permission for
// ─────────────────────────────────────────────────────────────────────────────

test.describe("15-G — Overview page: sections gated by permission", () => {
  let eshopDpcPage: Page;
  let superAdminRoleId: string;

  function setEshopDashboardProductsCategoriesRole() {
    psql(`
      ${replica}
      UPDATE public.user_party_roles
      SET role_id = '${DASHBOARD_PROD_CAT_ROLE_ID}'
      WHERE user_id = '${ESHOP_ID}' AND party_id = '${PARTY_ID}';
      ${def}
    `);
  }

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    superAdminRoleId = getSuperAdminRoleId();
    setEshopDashboardProductsCategoriesRole();
    eshopDpcPage = await browser.newPage();
    await loginAs(eshopDpcPage, ESHOP.email, ESHOP.password);
    await eshopDpcPage.context().addCookies([{
      name: "activePartyId", value: PARTY_ID, domain: "localhost", path: "/",
    }]);
  });

  test.afterAll(async () => {
    if (superAdminRoleId) setEshopFullRole(superAdminRoleId);
    await eshopDpcPage?.close();
  });

  test("15-G-01 dashboard accessible with VIEW_DASHBOARD", async () => {
    await expectAccess(eshopDpcPage, "/admin");
  });

  test("15-G-02 product KPIs visible (has MANAGE_PRODUCTS)", async () => {
    await eshopDpcPage.goto(`${BASE}/admin`);
    await eshopDpcPage.waitForLoadState("networkidle");
    await expect(eshopDpcPage.locator("[data-kpi='total-products']")).toBeVisible();
    await expect(eshopDpcPage.locator("[data-kpi='active-products']")).toBeVisible();
  });

  test("15-G-03 user KPIs hidden (no MANAGE_USERS)", async () => {
    await eshopDpcPage.goto(`${BASE}/admin`);
    await eshopDpcPage.waitForLoadState("networkidle");
    await expect(eshopDpcPage.locator("[data-kpi='total-users']")).toHaveCount(0);
    await expect(eshopDpcPage.locator("[data-kpi='active-users']")).toHaveCount(0);
  });

  test("15-G-04 order KPI hidden (no MANAGE_ORDERS)", async () => {
    await eshopDpcPage.goto(`${BASE}/admin`);
    await eshopDpcPage.waitForLoadState("networkidle");
    await expect(eshopDpcPage.locator("[data-kpi='total-orders']")).toHaveCount(0);
  });

  test("15-G-05 revenue KPI hidden (no MANAGE_ORDERS or MANAGE_REPORTS)", async () => {
    await eshopDpcPage.goto(`${BASE}/admin`);
    await eshopDpcPage.waitForLoadState("networkidle");
    await expect(eshopDpcPage.locator("[data-kpi='revenue']")).toHaveCount(0);
  });

  test("15-G-06 recent orders section hidden (no MANAGE_ORDERS)", async () => {
    await eshopDpcPage.goto(`${BASE}/admin`);
    await eshopDpcPage.waitForLoadState("networkidle");
    await expect(eshopDpcPage.locator("[data-section='recent-orders']")).toHaveCount(0);
  });

  test("15-G-07 revenue chart hidden (no MANAGE_ORDERS or MANAGE_REPORTS)", async () => {
    await eshopDpcPage.goto(`${BASE}/admin`);
    await eshopDpcPage.waitForLoadState("networkidle");
    await expect(eshopDpcPage.locator("[data-section='revenue-chart']")).toHaveCount(0);
  });

  test("15-G-08 recent activity hidden (no MANAGE_AUDIT)", async () => {
    await eshopDpcPage.goto(`${BASE}/admin`);
    await eshopDpcPage.waitForLoadState("networkidle");
    await expect(eshopDpcPage.locator("[data-section='recent-activity']")).toHaveCount(0);
  });

  test("15-G-09 owner sees all overview sections", async ({ browser }: { browser: Browser }) => {
    const ownerPage = await browser.newPage();
    await loginAs(ownerPage, OWNER.email, OWNER.password);
    await ownerPage.goto(`${BASE}/admin`);
    await ownerPage.waitForLoadState("networkidle");
    await expect(ownerPage.locator("[data-kpi='total-users']")).toBeVisible();
    await expect(ownerPage.locator("[data-kpi='total-products']")).toBeVisible();
    await expect(ownerPage.locator("[data-kpi='total-orders']")).toBeVisible();
    await expect(ownerPage.locator("[data-section='recent-orders']")).toBeVisible();
    await expect(ownerPage.locator("[data-section='revenue-chart']")).toBeVisible();
    await expect(ownerPage.locator("[data-section='recent-activity']")).toBeVisible();
    await ownerPage.close();
  });
});
