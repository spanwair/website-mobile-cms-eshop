import type { APIRoute } from "astro";
import { sendEmail, ociConfigured } from "@/lib/integrations/oci-email";
import { renderAuthEmail, type AuthEmailAction } from "@/lib/integrations/authEmailTemplates";
import type { AppLanguage } from "@shared/i18n/getT";

// Supabase Auth "Send Email Hook" — GoTrue delegates every auth email (signup confirmation,
// magic link, recovery, invite, email change) to this endpoint instead of sending it itself,
// so Supabase's own email delivery is never used. We render the same bilingual templates and
// send through OCI Email Delivery. Configure in the Supabase dashboard (Auth → Hooks) with the
// shared secret in SEND_EMAIL_HOOK_SECRET.

function fail(status: number, message: string): Response {
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

export const POST: APIRoute = async ({ request }) => {
  if (!ociConfigured()) return fail(500, "email_not_configured");

  const secret = import.meta.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) return fail(500, "hook_secret_not_configured");

  const raw = await request.text();
  if (!(await verify(secret, request.headers, raw))) return fail(401, "invalid_signature");

  let payload: HookPayload;
  try { payload = JSON.parse(raw) as HookPayload; } catch { return fail(400, "invalid_json"); }

  const user = payload?.user ?? {};
  const data = payload?.email_data ?? {};
  const rawType: string = data.email_action_type ?? "";
  const action = ACTION_MAP[rawType];
  if (!action) return fail(200, "ignored"); // unknown/unsupported type — nothing to send

  const lang: AppLanguage = user?.user_metadata?.lang === "en" ? "en" : "cs";
  const siteUrl: string = data.site_url || import.meta.env.PUBLIC_SHOP_URL || "";

  // email_change with double-confirm carries a second token for the new address.
  const useNew = rawType === "email_change_new";
  const tokenHash = useNew ? (data.token_hash_new ?? data.token_hash) : data.token_hash;
  const recipient = useNew ? (user.new_email ?? user.email) : user.email;
  if (!recipient || !tokenHash) return fail(400, "missing_recipient_or_token");

  const verifyType = action === "email_change" ? "email_change" : action;
  const params = new URLSearchParams({ token_hash: tokenHash, type: verifyType });
  if (typeof data.redirect_to === "string" && data.redirect_to.startsWith(siteUrl) && siteUrl) {
    const rest = data.redirect_to.slice(siteUrl.length);
    if (rest.startsWith("/")) params.set("redirect", rest);
  }
  const actionUrl = `${siteUrl}/auth/callback?${params.toString()}`;

  const { subject, html } = renderAuthEmail({ action, lang, actionUrl, siteUrl });

  try {
    await sendEmail({ to: recipient, subject, html });
  } catch (e) {
    return fail(500, `send_failed: ${(e as Error).message}`);
  }
  return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
};
