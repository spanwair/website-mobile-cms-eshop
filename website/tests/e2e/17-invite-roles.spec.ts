/**
 * 17 — Full invite-to-login role verification
 *
 * Covers:
 *   17-01  New user invited as ADMIN (role=4) → accept link → set-password → login
 *          → admin panel visible, DB role=4, email/password re-login works
 *   17-02  New user invited as ESHOP_ADMIN (role=2) with custom party role (permissions=25)
 *          → accept link → set-password → login → admin panel visible, DB role=2,
 *          user_party_roles entry present, /admin accessible
 *   17-03  Existing admin user (simulates Gmail OAuth: profile already exists, isNewUser=false)
 *          → magic link callback → / (never /auth/set-password)
 *          → admin panel visible
 *   17-04  Regular user invited as ESHOP_ADMIN via admin party UI (existing user path)
 *          → no invite email, role updated immediately → login → admin panel visible
 */

import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import { BASE, OWNER, ADMIN, ADMIN_ID, PARTY_ID, DASHBOARD_PROD_CAT_ROLE_ID, screenshot, loginAs } from "./helpers";

// ── constants ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const MAILPIT_URL = "http://127.0.0.1:54324";
const SUPER_ADMIN_ROLE_ID = "22222222-2222-2222-2222-222222222222";

const ADMIN_INVITE_EMAIL = "admin-role-e2e@testdomain.invalid";
const ADMIN_INVITE_PASSWORD = "AdminRoleE2E!99";
const ESHOP_INVITE_EMAIL = "eshop-role-e2e@testdomain.invalid";
const ESHOP_INVITE_PASSWORD = "EshopRoleE2E!99";
const EXISTING_INVITE_EMAIL = "existing-role-e2e@testdomain.invalid";
const EXISTING_INVITE_PASSWORD = "ExistingRoleE2E!99";

const AUTH_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function psql(sql: string): string {
  return execSync(
    `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres --tuples-only -c "${sql.replace(/"/g, '\\"')}"`,
    { stdio: "pipe" }
  ).toString().trim();
}

async function deleteUserByEmail(email: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: AUTH_HEADERS,
  });
  const { users } = (await res.json()) as { users: Array<{ id: string; email: string }> };
  for (const u of users.filter((u) => u.email === email)) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
      method: "DELETE",
      headers: AUTH_HEADERS,
    });
  }
}

async function generateInviteCallbackUrl(
  email: string,
  data: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      type: "invite",
      email,
      data: { ...data, lang: "cs" },
      redirect_to: `${BASE}/auth/callback`,
    }),
  });
  if (!res.ok) throw new Error(`generate_link failed: ${await res.text()}`);
  const body = (await res.json()) as { hashed_token?: string };
  if (!body.hashed_token) throw new Error("No hashed_token in generate_link response");
  return `${BASE}/auth/callback?token_hash=${body.hashed_token}&type=invite`;
}

async function generateMagicLinkCallbackUrl(email: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      type: "magiclink",
      email,
      redirect_to: `${BASE}/auth/callback`,
    }),
  });
  if (!res.ok) throw new Error(`generate_link (magiclink) failed: ${await res.text()}`);
  const body = (await res.json()) as { hashed_token?: string };
  if (!body.hashed_token) throw new Error("No hashed_token in magiclink generate_link response");
  return `${BASE}/auth/callback?token_hash=${body.hashed_token}&type=magiclink`;
}

async function clearMailbox() {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
}

async function createConfirmedUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const body = (await res.json()) as { id?: string };
  if (!body.id) throw new Error(`Failed to create user ${email}: ${JSON.stringify(body)}`);
  return body.id;
}

async function getProfileRole(userId: string): Promise<number> {
  const row = psql(`SELECT role FROM public.profiles WHERE id = '${userId}'`);
  return Number(row.trim());
}

async function getUserId(email: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: AUTH_HEADERS,
  });
  const { users } = (await res.json()) as { users: Array<{ id: string; email: string }> };
  return users.find((u) => u.email === email)?.id ?? null;
}

async function hasPartyRole(userId: string, partyId: string, roleId: string): Promise<boolean> {
  const row = psql(
    `SELECT 1 FROM public.user_party_roles WHERE user_id = '${userId}' AND party_id = '${partyId}' AND role_id = '${roleId}'`
  );
  return row.trim() !== "";
}

// ── set-password flow helper ───────────────────────────────────────────────────

async function acceptInviteAndSetPassword(
  page: import("@playwright/test").Page,
  callbackUrl: string,
  name: string,
  password: string,
  testId: string
) {
  await page.goto(callbackUrl);
  await page.waitForURL(`${BASE}/auth/set-password`, { timeout: 20000 });
  await screenshot(page, `${testId}-set-password-page`);
  await page.fill("#sp-name", name);
  await page.fill("#sp-password", password);
  await page.fill("#sp-confirm", password);
  await page.click("#setpw-btn");
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  await screenshot(page, `${testId}-home-after-set-password`);
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe("17 — Invite → role → login verification", () => {
  test.beforeEach(async ({ page }) => {
    await clearMailbox();
    await deleteUserByEmail(ADMIN_INVITE_EMAIL);
    await deleteUserByEmail(ESHOP_INVITE_EMAIL);
    await deleteUserByEmail(EXISTING_INVITE_EMAIL);
    // Sign out any leftover session
    await page.goto(`${BASE}/auth/signout`);
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 });
  });

  // ── 17-01 ──────────────────────────────────────────────────────────────────

  test("17-01 admin invite → correct role=4 in DB → email/password login → admin panel visible", async ({ page }) => {
    // Invite a brand-new user as ADMIN (system role=4).
    // pending_system_role is set but NO pending_party_id — admin-only invite.
    const callbackUrl = await generateInviteCallbackUrl(ADMIN_INVITE_EMAIL, {
      pending_system_role: 4,
      invited_by: ADMIN_ID,
    });
    expect(callbackUrl).toContain("token_hash=");
    expect(callbackUrl).toContain("type=invite");

    // Accept invite → set-password page → fill and submit
    await acceptInviteAndSetPassword(page, callbackUrl, "Invited Admin", ADMIN_INVITE_PASSWORD, "17-01");

    // After set-password, should be on the homepage and admin link visible in the dropdown
    await page.locator("#profile-toggle").click();
    await expect(page.locator(".dropdown-item[href='/admin']")).toBeVisible({ timeout: 5000 });
    await screenshot(page, "17-01-admin-link-visible");

    // DB assertion: profile.role must be 4
    const userId = await getUserId(ADMIN_INVITE_EMAIL);
    expect(userId).toBeTruthy();
    const role = await getProfileRole(userId!);
    expect(role).toBe(4);

    // Sign out
    await page.goto(`${BASE}/auth/signout`);
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 });

    // Re-login with email/password
    await page.fill("#si-email", ADMIN_INVITE_EMAIL);
    await page.fill("#si-password", ADMIN_INVITE_PASSWORD);
    await page.click("#signin-btn");
    await page.waitForURL(`${BASE}/`, { timeout: 20000 });
    await screenshot(page, "17-01-relogin-home");

    // Admin panel still visible after re-login
    await page.locator("#profile-toggle").click();
    await expect(page.locator(".dropdown-item[href='/admin']")).toBeVisible({ timeout: 5000 });
    await screenshot(page, "17-01-relogin-admin-link");
  });

  // ── 17-02 ──────────────────────────────────────────────────────────────────

  test("17-02 eshop-admin invite with party role (permissions=25) → role=2 in DB + party role → admin panel + /admin accessible", async ({ page }) => {
    // Invite new user as ESHOP_ADMIN with the Dashboard+Products+Categories party role (permissions=25).
    const callbackUrl = await generateInviteCallbackUrl(ESHOP_INVITE_EMAIL, {
      pending_system_role: 2,
      pending_party_id: PARTY_ID,
      pending_role_id: DASHBOARD_PROD_CAT_ROLE_ID,
      invited_by: ADMIN_ID,
    });

    // Accept invite → set-password
    await acceptInviteAndSetPassword(page, callbackUrl, "Invited Eshop", ESHOP_INVITE_PASSWORD, "17-02");

    // Admin link must be visible (role=2, has party membership)
    await page.locator("#profile-toggle").click();
    await expect(page.locator(".dropdown-item[href='/admin']")).toBeVisible({ timeout: 5000 });
    await screenshot(page, "17-02-admin-link-visible");

    // DB assertions
    const userId = await getUserId(ESHOP_INVITE_EMAIL);
    expect(userId).toBeTruthy();

    const role = await getProfileRole(userId!);
    expect(role).toBe(2);

    const hasRole = await hasPartyRole(userId!, PARTY_ID, DASHBOARD_PROD_CAT_ROLE_ID);
    expect(hasRole).toBe(true);

    // Navigate to /admin — must load (not redirect to /login or /403)
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "17-02-admin-page");
    expect(page.url()).not.toContain("/login");
    expect(page.url()).not.toContain("/403");
    expect(page.url()).toMatch(/\/admin/);

    // Sign out
    await page.goto(`${BASE}/auth/signout`);
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 });

    // Re-login with email/password → admin panel still accessible
    await page.fill("#si-email", ESHOP_INVITE_EMAIL);
    await page.fill("#si-password", ESHOP_INVITE_PASSWORD);
    await page.click("#signin-btn");
    await page.waitForURL(`${BASE}/`, { timeout: 20000 });
    await screenshot(page, "17-02-relogin-home");
    await page.locator("#profile-toggle").click();
    await expect(page.locator(".dropdown-item[href='/admin']")).toBeVisible({ timeout: 5000 });
    await screenshot(page, "17-02-relogin-admin-link");
  });

  // ── 17-03 ──────────────────────────────────────────────────────────────────

  test("17-03 existing user with profile (Gmail simulation) → magic link callback → / not /auth/set-password → admin panel visible", async ({ page }) => {
    // Simulate Google OAuth behavior: an existing user with an admin profile logs in via a link.
    // Since isNewUser=false and type=magiclink, callback.astro must redirect to /.
    // The seeded ADMIN user (admin@test.com) has role=4 and a profile row.

    const magicLinkUrl = await generateMagicLinkCallbackUrl(ADMIN.email);
    expect(magicLinkUrl).toContain("token_hash=");
    expect(magicLinkUrl).toContain("type=magiclink");

    // Navigate to magic link callback — must NOT go to /auth/set-password
    await page.goto(magicLinkUrl);
    await page.waitForURL(`${BASE}/`, { timeout: 20000 });
    await screenshot(page, "17-03-existing-user-home");

    // Admin panel visible (ADMIN user has role=4)
    await page.locator("#profile-toggle").click();
    await expect(page.locator(".dropdown-item[href='/admin']")).toBeVisible({ timeout: 5000 });
    await screenshot(page, "17-03-admin-link-visible");

    // Explicitly assert NOT on set-password
    expect(page.url()).not.toContain("/auth/set-password");
    expect(page.url()).toBe(`${BASE}/`);
  });

  // ── 17-04 ──────────────────────────────────────────────────────────────────

  test("17-04 existing confirmed user invited via admin UI → immediate role update (no email) → login → admin panel visible", async ({ page }) => {
    // Create a fresh confirmed user with role=1 (no invite — simulates a regular sign-up).
    const existingUserId = await createConfirmedUser(EXISTING_INVITE_EMAIL, EXISTING_INVITE_PASSWORD);

    // Confirm they start with role=1
    const initialRole = await getProfileRole(existingUserId);
    expect(initialRole).toBe(1);

    // Owner logs in and invites the existing user via the admin party UI.
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "17-04-owner-on-party-page");

    // Fill the invite form — select ESHOP_ADMIN (2) and a party role
    await page.fill('input[name="email"]', EXISTING_INVITE_EMAIL);

    // Select system role = eshop_admin (value "2")
    const systemRoleSelect = page.locator('select[name="system_role"]');
    if (await systemRoleSelect.isVisible()) {
      await systemRoleSelect.selectOption("2");
    }

    // Select party role = DASHBOARD_PROD_CAT_ROLE_ID
    const roleSelect = page.locator('select[name="role_id"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption(DASHBOARD_PROD_CAT_ROLE_ID);
    }

    await screenshot(page, "17-04-invite-form-filled");
    await page.click('form.invite-form button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await screenshot(page, "17-04-after-invite-submit");

    // For existing users the page redirects back to the party page immediately (no invite email)
    expect(page.url()).toContain(`/admin/parties/${PARTY_ID}`);

    // DB assertions: role updated to 2, party role assigned
    const updatedRole = await getProfileRole(existingUserId);
    expect(updatedRole).toBe(2);

    const hasRole = await hasPartyRole(existingUserId, PARTY_ID, DASHBOARD_PROD_CAT_ROLE_ID);
    expect(hasRole).toBe(true);

    // Sign out owner, log in as the invited existing user
    await page.goto(`${BASE}/auth/signout`);
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 });

    await page.fill("#si-email", EXISTING_INVITE_EMAIL);
    await page.fill("#si-password", EXISTING_INVITE_PASSWORD);
    await page.click("#signin-btn");
    await page.waitForURL(`${BASE}/`, { timeout: 20000 });
    await screenshot(page, "17-04-existing-user-home");

    // Admin panel visible
    await page.locator("#profile-toggle").click();
    await expect(page.locator(".dropdown-item[href='/admin']")).toBeVisible({ timeout: 5000 });
    await screenshot(page, "17-04-admin-link-visible");
  });
});
