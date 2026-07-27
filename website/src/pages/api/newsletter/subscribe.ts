import type { APIRoute } from "astro";
import { createSupabase } from "../../../lib/supabase";
import { subscribeToNewsletter } from "@shared/services/newsletterService";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const partyId = typeof body?.party_id === "string" ? body.party_id : context.locals.storeParty?.id;

  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: "Please enter a valid email address." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!partyId) {
    return new Response(JSON.stringify({ error: "No store context found." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabase(context);
  const { error } = await subscribeToNewsletter(supabase, partyId, email);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ message: "Subscribed!" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
