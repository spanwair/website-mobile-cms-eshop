import type { APIRoute } from "astro";
import { sendEmail, ociConfigured, ociEnvStatus } from "@/lib/integrations/oci-email";
import { renderAuthEmail, type AuthEmailAction } from "@/lib/integrations/authEmailTemplates";
import type { AppLanguage } from "@shared/i18n/getT";

// Supabase Auth "Send Email Hook" — GoTrue delegates every auth email (signup confirmation,
// magic link, recovery, invite, email change) to this endpoint instead of sending it itself,
// so Supabase's own email delivery is never used. We render the same bilingual templates and
// send through OCI Email Delivery. Configure in the Supabase dashboard (Auth → Hooks) with the
// shared secret in SEND_EMAIL_HOOK_SECRET.

function fail(status: number, message: string): Response {
  // Logged so prod delivery failures are visible in Cloudflare Workers logs — GoTrue
  // surfaces a generic error to the user, so this is the only place the real reason shows.
  console.error(`[send-email-hook] fail ${status}: ${message}`);
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function parseUrl(value: string | undefined | null): URL | null {
  if (!value) return null;
  try { return new URL(value); } catch { return null; }
}

// Standard Webhooks verification (Supabase signs with v1,whsec_<base64secret>).
async function verify(secretRaw: string, headers: Headers, body: string): Promise<boolean> {
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;

  const secretKey = secretRaw.startsWith("v1,whsec_")
    ? secretRaw.slice("v1,whsec_".length)
    : secretRaw.replace(/^whsec_/, "");
  const key = await crypto.subtle.importKey(
    "raw", b64ToBytes(secretKey) as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return sigHeader.split(" ").some((part) => part.split(",")[1] === expected);
}

interface HookPayload {
  user?: { email?: string; new_email?: string; user_metadata?: { lang?: string } };
  email_data?: {
    email_action_type?: string;
    token_hash?: string;
    token_hash_new?: string;
    redirect_to?: string;
    site_url?: string;
  };
}

const ACTION_MAP: Record<string, AuthEmailAction> = {
  signup: "signup",
  magiclink: "magiclink",
  recovery: "recovery",
  invite: "invite",
  email_change: "email_change",
  email_change_new: "email_change",
  email_change_current: "email_change",
};

// Health check — curl this URL in prod to confirm config without triggering a signup.
// Reports only booleans, never secret values.
export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify({
      ok: true,
      ociConfigured: ociConfigured(),
      hookSecretPresent: Boolean(import.meta.env.SEND_EMAIL_HOOK_SECRET),
      shopUrl: import.meta.env.SHOP_URL || null,
      ociEnv: ociEnvStatus(),
      ociMissing: Object.entries(ociEnvStatus())
        .filter(([, present]) => !present)
        .map(([k]) => k),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

export const POST: APIRoute = async ({ request }) => {
  console.log("[send-email-hook] received POST");
  if (!ociConfigured()) return fail(500, "email_not_configured");

  const secret = import.meta.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) return fail(500, "hook_secret_not_configured");

  const raw = await request.text();
  const hasSigHeaders = Boolean(
    request.headers.get("webhook-id") &&
      request.headers.get("webhook-timestamp") &&
      request.headers.get("webhook-signature"),
  );
  if (!(await verify(secret, request.headers, raw))) {
    console.error(`[send-email-hook] signature check failed (sig headers present=${hasSigHeaders})`);
    return fail(401, "invalid_signature");
  }

  let payload: HookPayload;
  try { payload = JSON.parse(raw) as HookPayload; } catch { return fail(400, "invalid_json"); }

  const user = payload?.user ?? {};
  const data = payload?.email_data ?? {};
  const rawType: string = data.email_action_type ?? "";
  const action = ACTION_MAP[rawType];
  if (!action) return fail(200, "ignored"); // unknown/unsupported type — nothing to send

  const lang: AppLanguage = user?.user_metadata?.lang === "en" ? "en" : "cs";

  // email_change with double-confirm carries a second token for the new address.
  const useNew = rawType === "email_change_new";
  const tokenHash = useNew ? (data.token_hash_new ?? data.token_hash) : data.token_hash;
  const recipient = useNew ? (user.new_email ?? user.email) : user.email;
  if (!recipient || !tokenHash) return fail(400, "missing_recipient_or_token");

  // Build the callback link on the ORIGIN GoTrue actually received in redirect_to — the domain the
  // user is on. It is always an absolute app URL (GoTrue defaults it to the project Site URL when the
  // client sends none), so this is correct for every storefront domain and can't be broken by an env
  // or dashboard misconfig. SHOP_URL (wrangler [vars]) is only a last-resort origin.
  const redirectUrl = parseUrl(data.redirect_to);
  const siteUrl = redirectUrl?.origin ?? parseUrl(import.meta.env.SHOP_URL)?.origin ?? "";
  if (!siteUrl) return fail(500, "no_callback_origin");

  const verifyType = action === "email_change" ? "email_change" : action;
  const params = new URLSearchParams({ token_hash: tokenHash, type: verifyType });
  // Preserve a post-verify destination only when the client asked for a real page beyond the bare
  // callback (not "/" or the callback itself — those carry no intent and would override the default).
  const dest = redirectUrl ? redirectUrl.pathname + redirectUrl.search : "";
  if (dest.startsWith("/") && dest !== "/" && dest !== "/auth/callback") params.set("redirect", dest);

  const actionUrl = `${siteUrl}/auth/callback?${params.toString()}`;

  const { subject, html } = renderAuthEmail({ action, lang, actionUrl, siteUrl });

  console.log(`[send-email-hook] sending action=${action} type=${rawType} to=${recipient} lang=${lang}`);
  try {
    await sendEmail({ to: recipient, subject, html });
  } catch (e) {
    return fail(500, `send_failed: ${(e as Error).message}`);
  }
  console.log(`[send-email-hook] sent action=${action} to=${recipient}`);
  return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
};
