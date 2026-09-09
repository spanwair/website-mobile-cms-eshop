import type { APIRoute } from "astro";
import { createSupabase } from "@/lib/supabase";
import { requireAdminCtx } from "@/lib/admin";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import { fetchMonthlySeries, fetchTopProducts, fetchCustomerStats } from "@shared/services/reportsAnalytics";

// One CSV endpoint for every /admin/reports KPI card, selected by ?type=. Data comes through
// the viewer's own session client, so RLS keeps it scoped to their party.
function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((v) => csvEscape(String(v))).join(",")).join("\n");
}

export const GET: APIRoute = async (context) => {
  const supabase = createSupabase(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const activePartyId = context.cookies.get("activePartyId")?.value ?? null;
  const ctx = await requireAdminCtx(supabase, session.user.id, activePartyId);
  if (!ctx || !ctx.partyId || !hasPermission(ctx.permissions, PERMISSIONS.MANAGE_REPORTS)) {
    return new Response("Forbidden", { status: 403 });
  }

  const type = new URL(context.request.url).searchParams.get("type") ?? "revenue";
  const partyId = ctx.partyId;
  let rows: (string | number)[][];

  if (type === "revenue" || type === "orders") {
    const monthly = await fetchMonthlySeries(supabase, partyId, 12);
    const header = type === "revenue" ? ["month", "revenue"] : ["month", "orders"];
    rows = [header, ...monthly.map((m) => [m.month, type === "revenue" ? m.revenue.toFixed(2) : m.orders])];
  } else if (type === "products") {
    const top = await fetchTopProducts(supabase, partyId, 12, 50);
    rows = [["title", "units", "revenue"], ...top.map((p) => [p.title, p.units, p.revenue.toFixed(2)])];
  } else if (type === "customers") {
    const s = await fetchCustomerStats(supabase, partyId, 12);
    rows = [
      ["total", "registered", "guests"],
      [s.total, s.registered, s.guests],
      [],
      ["month", "new_customers"],
      ...s.monthly.map((m) => [m.month, m.count]),
    ];
  } else {
    return new Response("Unknown export type", { status: 400 });
  }

  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reports-${type}.csv"`,
    },
  });
};
