import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { SELLER_MODE, COMMISSION_BREAK_EVEN_CZK } from "@shared/constants/sellerMode";
import { previousCalendarMonth } from "@shared/utils/billingPeriod";
import { evaluateFeeTierForClosedPeriod, markFeeTierEventNotified } from "@shared/services/feeTierService";
import { createNotification, resolvePartyNotificationRecipients } from "@shared/services/notificationService";
import { sendFeeTierChangeNotice } from "@/lib/integrations/email";
import { getT } from "@shared/i18n/getT";

// Called monthly by Supabase pg_cron (see supabase/migrations/20260103000079_auto_fee_tier.sql)
// on the 1st of each month, 15 minutes after monthly-platform-fees, to evaluate each
// own_company party's just-closed calendar month and auto-switch fee_mode between
// 'percentage' and 'fixed' (shared/services/feeTierService.ts). Protected by the same shared
// secret as the other cron routes -- no logged-in caller here.
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const { year, monthIndex0 } = previousCalendarMonth(now);

  const adminClient = createAdminClient();
  const { data: parties, error: partiesErr } = await adminClient
    .from("parties")
    .select("id, name, billing_email, lang, seller_mode")
    .eq("seller_mode", SELLER_MODE.OWN_COMPANY)
    .eq("status", "active");
  if (partiesErr) {
    return new Response(JSON.stringify({ ok: false, error: partiesErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const changed: string[] = [];
  const unchanged: string[] = [];
  const failed: string[] = [];

  for (const party of parties ?? []) {
    try {
      const evalResult = await evaluateFeeTierForClosedPeriod(adminClient, party, year, monthIndex0);
      if (!evalResult || evalResult.alreadyEvaluated || !evalResult.changed) {
        unchanged.push(party.id);
        continue;
      }

      changed.push(party.id);
      const t = getT(evalResult.lang);
      const ft = t.email.feeTierChange;
      const toFixed = evalResult.newFeeMode === "fixed";

      try {
        const recipients = await resolvePartyNotificationRecipients(adminClient, party.id);
        await createNotification(
          adminClient,
          {
            party_id: party.id,
            type: "fee_tier_change",
            title: toFixed ? ft.notifTitleToFixed : ft.notifTitleToPercentage,
            body: toFixed ? ft.notifBodyToFixed : ft.notifBodyToPercentage,
            metadata: {
              period_start: evalResult.periodStart,
              previous_fee_mode: evalResult.previousFeeMode,
              new_fee_mode: evalResult.newFeeMode,
              gross_revenue: evalResult.grossRevenueKc,
            },
          },
          recipients
        );
        await markFeeTierEventNotified(adminClient, party.id, evalResult.periodStart, "notified_in_app");
      } catch {
        // Never fail the whole party's evaluation just because the in-app notification fanout
        // failed -- the fee_mode switch itself (recomputeBillingPeriod) already succeeded.
      }

      if (evalResult.billingEmail) {
        try {
          await sendFeeTierChangeNotice({
            to: evalResult.billingEmail,
            partyName: evalResult.partyName,
            periodStart: evalResult.periodStart,
            previousFeeMode: evalResult.previousFeeMode as "percentage" | "fixed",
            newFeeMode: evalResult.newFeeMode as "percentage" | "fixed",
            grossRevenueAmount: evalResult.grossRevenueKc,
            thresholdAmount: COMMISSION_BREAK_EVEN_CZK,
            lang: evalResult.lang,
          });
          await markFeeTierEventNotified(adminClient, party.id, evalResult.periodStart, "notified_email");
        } catch {
          // Same as above -- a failed email send must not roll back the tier switch itself.
        }
      }
    } catch {
      failed.push(party.id);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      period: `${year}-${String(monthIndex0 + 1).padStart(2, "0")}-01`,
      changed: changed.length,
      unchanged: unchanged.length,
      failed: failed.length,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
