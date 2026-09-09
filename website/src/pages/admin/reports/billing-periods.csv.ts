import type { APIRoute } from "astro";
import { createSupabase } from "@/lib/supabase";
import { requireAdminCtx } from "@/lib/admin";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import { listBillingPeriods } from "@shared/services/billingPeriodService";

// Income-tax export: both gross (hrubý obrat) and real, after-cost, after-fee (čistý výdělek)
// figures in the same file, so the party never has to reconcile two separate downloads.
function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
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

  const periods = await listBillingPeriods(supabase, ctx.partyId, 60);
  const rows = [
    [
      "period_start", "period_end", "seller_mode",
      "gross_revenue", "real_costs", "net_revenue",
      "fee_mode", "fee_rate", "fee_amount", "net_payout",
      "currency", "status",
    ],
    ...periods.map((p) => [
      p.periodStart,
      p.periodEnd,
      p.sellerMode,
      p.grossRevenue.toFixed(2),
      p.realCosts.toFixed(2),
      p.netRevenue.toFixed(2),
      p.feeMode,
      p.feeRate === null ? "" : p.feeRate.toFixed(4),
      p.feeAmount.toFixed(2),
      p.netPayout.toFixed(2),
      p.currency,
      p.status,
    ]),
  ];
  const csv = rows.map((row) => row.map((v) => csvEscape(String(v))).join(",")).join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="billing-periods.csv"`,
    },
  });
};
