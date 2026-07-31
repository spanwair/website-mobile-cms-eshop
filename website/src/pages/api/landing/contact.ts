import type { APIRoute } from "astro";
import { Resend } from "resend";
import sanitizeHtml from "sanitize-html";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 5000) : "";

  if (!name || !email || !EMAIL_RE.test(email) || !message) {
    return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 });
  }

  const key = import.meta.env.RESEND_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500 });
  }
  const resend = new Resend(key);
  const safeMessage = sanitizeHtml(message, { allowedTags: [], allowedAttributes: {} });
  const { error } = await resend.emails.send({
    from: import.meta.env.EMAIL_FROM ?? "noreply@mamtodoma.cz",
    to: import.meta.env.LEADS_INBOX ?? "founders@mamtodoma.cz",
    replyTo: email,
    subject: `Contact form: ${name}`,
    html: `<p><strong>${sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} })}</strong> (${email})</p><p>${safeMessage.replace(/\n/g, "<br/>")}</p>`,
  });
  if (error) {
    return new Response(JSON.stringify({ error: "send_failed" }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
