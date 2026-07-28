import { test, expect } from "@playwright/test";
import { BASE, screenshot } from "./helpers";
import { execSync } from "child_process";

const MAILPIT_URL = "http://127.0.0.1:54324";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const SUPABASE_URL = "http://127.0.0.1:54321";

const INVITE_EMAIL = "invite-e2e@testdomain.invalid";
const INVITE_PASSWORD = "InviteE2E!99x";
const INVITE_NAME = "Invited E2E User";
const PARTY_ID = "11111111-1111-1111-1111-111111111111";
// Super Admin role seeded in global-setup for PARTY_ID
const SUPER_ADMIN_ROLE_ID = "22222222-2222-2222-2222-222222222222";

const AUTH_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

interface MailpitMessage {
  ID: string;
  Subject: string;
}

async function clearMailbox() {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
}

async function waitForEmail(toEmail: string, subjectFragment: string, timeoutMs = 15000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages?query=${encodeURIComponent(`to:${toEmail}`)}`);
    if (res.ok) {
      const data: { messages: MailpitMessage[] } = await res.json();
      const msg = (data.messages ?? []).find((m) =>
        m.Subject.toLowerCase().includes(subjectFragment.toLowerCase())
      );
      if (msg) {
        const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${msg.ID}`);
        const body: { HTML: string } = await detail.json();
        return body.HTML;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No email to ${toEmail} matching "${subjectFragment}" in ${timeoutMs}ms`);
}

function extractCallbackLink(html: string): string {
  const decoded = html.replace(/&amp;/g, "&");
  // Match our callback URL with token_hash (from email templates using {{ .TokenHash }})
  const match = decoded.match(/href="(http[^"]*\/auth\/callback\?token_hash=[^"]*)"/);
  if (!match) throw new Error("No callback link found in email HTML");
  return match[1];
}

function deleteInviteUser() {
  try {
    const raw = execSync(
      `curl -s "${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200" \
        -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"`,
      { stdio: "pipe" }
    ).toString();
    const parsed = JSON.parse(raw);
    const users: Array<{ id: string; email: string }> = parsed.users ?? [];
    for (const u of users) {
      if (u.email === INVITE_EMAIL) {
        execSync(
          `curl -s -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/${u.id}" \
            -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"`,
          { stdio: "pipe" }
        );
      }
    }
  } catch {
    // user may not exist
  }
}

async function generateInviteCallbackUrl(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      type: "invite",
      email: INVITE_EMAIL,
      data: {
        pending_party_id: PARTY_ID,
        pending_role_id: SUPER_ADMIN_ROLE_ID,
        lang: "cs",
      },
      redirect_to: `${BASE}/auth/callback`,
    }),
  });
  if (!res.ok) throw new Error(`generate_link failed: ${await res.text()}`);
  const data: { hashed_token?: string } = await res.json();
  if (!data.hashed_token) throw new Error("No hashed_token in generate_link response");
  // Use token_hash format — our callback.astro handles this via verifyOtp
  return `${BASE}/auth/callback?token_hash=${data.hashed_token}&type=invite`;
}

async function confirmInviteUser() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: AUTH_HEADERS,
  });
  const { users } = (await res.json()) as { users: Array<{ id: string; email: string }> };
  const user = users.find((u) => u.email === INVITE_EMAIL);
  if (!user) throw new Error("Invite user not found for confirmation");
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: "PUT",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ email_confirm: true }),
  });
}

async function sendInviteEmail() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      email: INVITE_EMAIL,
      data: {
        pending_party_id: PARTY_ID,
        pending_role_id: SUPER_ADMIN_ROLE_ID,
        lang: "cs",
        party_name: "Test Organisation",
        role_name: "Super Admin",
        system_role_label: "",
        permissions_text: "",
        is_admin_only: "false",
      },
      redirect_to: `${BASE}/auth/callback`,
    }),
  });
  if (!res.ok) throw new Error(`invite failed: ${await res.text()}`);
}

test.describe("16 — Invite flow: invite → accept → set-password → login", () => {
  test.beforeEach(async ({ page }) => {
    deleteInviteUser();
    await clearMailbox();
    // Clear any leftover browser session from a previous test
    await page.goto(`${BASE}/auth/signout`);
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 });
  });

  test("16-01 invite link (generate_link) → set-password page → login with password", async ({ page }) => {
    // generate_link creates the invite + returns a direct callback URL (no email needed)
    const inviteLink = await generateInviteCallbackUrl();
    expect(inviteLink).toContain("/auth/callback");
    expect(inviteLink).toContain("type=invite");
    expect(inviteLink).toContain("token_hash=");

    // Navigate to callback URL → should land on /auth/set-password
    await page.goto(inviteLink);
    await page.waitForURL(`${BASE}/auth/set-password`, { timeout: 20000 });
    await screenshot(page, "16-01-set-password-page");
    await expect(page).toHaveURL(`${BASE}/auth/set-password`);

    // Fill in set-password form
    await page.fill("#sp-name", INVITE_NAME);
    await page.fill("#sp-password", INVITE_PASSWORD);
    await page.fill("#sp-confirm", INVITE_PASSWORD);
    await screenshot(page, "16-01-set-password-filled");
    await page.click("#setpw-btn");

    // Should redirect to / after setting password
    await page.waitForURL(`${BASE}/`, { timeout: 20000 });
    await screenshot(page, "16-01-home-after-invite");

    // Sign out
    await page.goto(`${BASE}/auth/signout`);
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 });

    // Log in with the password just set
    await page.fill("#si-email", INVITE_EMAIL);
    await page.fill("#si-password", INVITE_PASSWORD);
    await page.click("#signin-btn");
    await page.waitForURL(`${BASE}/`, { timeout: 20000 });
    await screenshot(page, "16-01-login-with-password-success");
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test("16-02 confirmed user uses signup form → magic link email → logs in", async ({ page }) => {
    // When an invited user tries the signup form with their invited email:
    //   signUp → user_already_exists → signInWithOtp sends a magic link.
    // The invite trigger already created a profile row, so isNewUser=false on the callback
    // and the magic link goes straight to / (no set-password needed).

    // Step 1: Invite the user (trigger creates their profile), then confirm email via admin API.
    // Local Supabase has enable_confirmations=false, so signUp only returns user_already_exists
    // for *confirmed* users (not for invited/unconfirmed ones).
    await sendInviteEmail();
    await waitForEmail(INVITE_EMAIL, "invited");
    await clearMailbox();
    await confirmInviteUser();

    // Step 2: Submit the signup form with the confirmed email → user_already_exists → magic link sent
    await page.waitForLoadState("networkidle");
    await page.click("#to-signup");
    await page.fill("#su-name", INVITE_NAME);
    await page.fill("#su-email", INVITE_EMAIL);
    await page.fill("#su-password", INVITE_PASSWORD);
    await page.fill("#su-confirm", INVITE_PASSWORD);
    await screenshot(page, "16-02-signup-form-filled");
    await page.click("#signup-btn");

    await page.waitForTimeout(3000);
    await screenshot(page, "16-02-magic-link-sent-success");
    await expect(page.locator("#success-su")).toBeVisible();

    // Step 3: Get magic link from email
    const html = await waitForEmail(INVITE_EMAIL, "sign-in");
    const magicLink = extractCallbackLink(html);
    expect(magicLink).toContain("type=magiclink");

    // Step 4: Click magic link → profile already exists (isNewUser=false) → /
    await page.goto(magicLink);
    await page.waitForURL(`${BASE}/`, { timeout: 20000 });
    await screenshot(page, "16-02-home-via-magic-link");
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test("16-03 invite email is styled HTML in Czech", async () => {
    await sendInviteEmail();
    const html = await waitForEmail(INVITE_EMAIL, "invited");

    // Must use styled template (not plain text)
    expect(html).toContain("4f46e5"); // brand purple
    expect(html).toContain("border-radius");
    expect(html).toContain("linear-gradient");
    // Must be Czech (lang=cs)
    expect(html).toContain("Přijmout pozvánku");
    expect(html).toContain("Obdrželi jste pozvánku");
  });
});
