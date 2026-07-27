import type { APIRoute } from "astro";
import { createSupabase } from "../../../../lib/supabase";
import { requireAdminCtx } from "../../../../lib/admin";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import { fetchNewsletterSubscribers } from "@shared/services/newsletterService";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export const GET: APIRoute = async (context) => {
  const supabase = createSupabase(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const activePartyId = context.cookies.get("activePartyId")?.value ?? null;
  const ctx = await requireAdminCtx(supabase, session.user.id, activePartyId);
  if (!ctx || !ctx.partyId || !hasPermission(ctx.permissions, PERMISSIONS.MANAGE_SETTINGS)) {
    return new Response("Forbidden", { status: 403 });
  }

  const subscribers = await fetchNewsletterSubscribers(supabase, ctx.partyId);
  const rows = [
    ["email", "subscribed_at", "status"],
    ...subscribers.map((s) => [
      s.email,
      s.subscribed_at,
      s.unsubscribed_at ? "unsubscribed" : "subscribed",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers.csv"`,
    },
  });
};
