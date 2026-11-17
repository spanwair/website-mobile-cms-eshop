import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { recomputeBillingPeriod } from "@shared/services/billingPeriodService";
import { sendMonthlyStatementNotice } from "@/lib/integrations/email";

// Called monthly by Supabase pg_cron (see supabase/migrations/20260103000073_monthly_fee_cron.sql)
// on the 1st of each month to generate every active party's previous-month statement — gross
// earned, commission deducted, net payable, and how much of that is already paid vs still
// outstanding as of generation time (shared/services/billingPeriodService.ts). This used to
// only bill own_company parties for a fee they owed the platform; now every seller_mode pays
// per-order via order_commission_ledger, so this is a read-only earnings statement for
// everyone, not a remittance request. Protected by a shared secret — no logged-in caller here.
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex0 = now.getUTCMonth() - 1 < 0 ? 11 : now.getUTCMonth() - 1;
  const prevYear = now.getUTCMonth() - 1 < 0 ? year - 1 : year;

  const adminClient = createAdminClient();
  const { data: parties, error: partiesErr } = await adminClient
    .from("parties")
    .select("id, name, billing_email, lang")
    .eq("status", "active");
  if (partiesErr) {
    return new Response(JSON.stringify({ ok: false, error: partiesErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const notified: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const party of parties ?? []) {
    try {
      const { error, row } = await recomputeBillingPeriod(adminClient, party.id, prevYear, monthIndex0, { forceRecompute: true });
      if (error || !row || row.grossRevenue <= 0) {
        skipped.push(party.id);
        continue;
      }
      if (!party.billing_email) {
        skipped.push(party.id);
        continue;
      }
      await sendMonthlyStatementNotice({
        to: party.billing_email,
        partyName: party.name,
        periodMonth: row.periodStart,
        grossRevenue: row.grossRevenue,
        feeAmount: row.feeAmount,
        netPayout: row.netPayout,
        paidAmount: row.paidAmount,
        outstandingAmount: row.outstandingAmount,
        currency: row.currency,
        lang: party.lang === "en" ? "en" : "cs",
      });
      notified.push(party.id);
    } catch {
      failed.push(party.id);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      period: `${prevYear}-${String(monthIndex0 + 1).padStart(2, "0")}-01`,
      notified: notified.length,
      skipped: skipped.length,
      failed: failed.length,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
