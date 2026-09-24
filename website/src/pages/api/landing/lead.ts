import type { APIRoute } from "astro";
import { sendEmail, ociConfigured } from "@/lib/integrations/oci-email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: "invalid_email" }), { status: 400 });
  }

  if (!ociConfigured()) {
    return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500 });
  }
  try {
    await sendEmail({
      to: import.meta.env.LEADS_INBOX ?? "founders@mamtodoma.cz",
      replyTo: email,
      subject: "New landing page lead",
      html: `<p>New store signup interest: ${email}</p>`,
    });
  } catch {
    return new Response(JSON.stringify({ error: "send_failed" }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
