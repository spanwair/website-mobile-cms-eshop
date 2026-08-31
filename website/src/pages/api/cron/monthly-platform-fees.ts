import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { computeMonthlyFeesForPeriod } from "@shared/services/monthlyFeeService";
import { sendMonthlyFeeNotice } from "@/lib/integrations/email";

// Called monthly by Supabase pg_cron (see supabase/migrations/20260103000073_monthly_fee_cron.sql)
// on the 1st of each month to bill own_company parties for the previous month's platform fee.
// Protected by a shared secret rather than a user session — this has no logged-in caller.
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const adminClient = createAdminClient();
  const { error, created } = await computeMonthlyFeesForPeriod(adminClient, previousMonth);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const notified: string[] = [];
  const skipped: string[] = [];
  for (const fee of created) {
    if (!fee.billingEmail) {
      skipped.push(fee.partyId);
      continue;
    }
    try {
      await sendMonthlyFeeNotice({
        to: fee.billingEmail,
        partyName: fee.partyName,
        periodMonth: fee.periodMonth,
        turnoverAmount: fee.turnoverAmount,
        feeAmount: fee.feeAmount,
        currency: fee.currency,
        lang: fee.lang,
      });
      await adminClient.from("monthly_platform_fees").update({ notified_at: new Date().toISOString() }).eq("id", fee.id);
      notified.push(fee.partyId);
    } catch {
      // A failed email send shouldn't roll back the fee row or block the rest of the batch —
      // the admin panel still shows the unpaid fee even if the notice never arrived.
      skipped.push(fee.partyId);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, period: previousMonth.toISOString().slice(0, 10), created: created.length, notified: notified.length, skipped: skipped.length }),
    { headers: { "Content-Type": "application/json" } }
  );
};
