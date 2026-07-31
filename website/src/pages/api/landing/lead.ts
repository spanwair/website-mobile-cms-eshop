import type { APIRoute } from "astro";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: "invalid_email" }), { status: 400 });
  }

  const key = import.meta.env.RESEND_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500 });
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: import.meta.env.EMAIL_FROM ?? "noreply@mamtodoma.cz",
    to: import.meta.env.LEADS_INBOX ?? "founders@mamtodoma.cz",
    subject: "New landing page lead",
    html: `<p>New store signup interest: ${email}</p>`,
  });
  if (error) {
    return new Response(JSON.stringify({ error: "send_failed" }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
