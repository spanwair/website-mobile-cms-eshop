import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPayoutLimitReached } from "./integrations/email";
import { NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK, NO_ICO_WITHHOLDING_EXPIRY_YEARS } from "@shared/constants/sellerMode";

// Shared by both "order became paid" call sites (stripe webhook + checkoutFlow) so the
// payout-limit-reached email composition (party lookup, currency) isn't duplicated between
// them. Only relevant to smalljobs_commission (no-IČO) parties — own_company parties never
// have a payout withheld, they're billed monthly instead (see monthlyFeeService.ts).
// The recipient is the party's own billing_email, so the email must go out in the party's
// own language — never the language of whichever customer's order triggered the limit.
export async function notifyPayoutLimitReachedIfNeeded(
  adminClient: SupabaseClient,
  partyId: string
): Promise<void> {
  const { data: party } = await adminClient.from("parties").select("name, billing_email, lang").eq("id", partyId).single();
  if (!party?.billing_email) return;
  try {
    await sendPayoutLimitReached({
      to: party.billing_email,
      partyName: party.name,
      payoutLimit: NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK,
      expiryYears: NO_ICO_WITHHOLDING_EXPIRY_YEARS,
      currency: "CZK",
      lang: party.lang === "en" ? "en" : "cs",
    });
  } catch {
    // Informational-only email — never block order processing on a failed send.
  }
}
