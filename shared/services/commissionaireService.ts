import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommissionaireAgreement } from "../types";
import { SELLER_MODE } from "../constants/sellerMode";
import { buildSmalljobsSaleNoticeMarkdown, SMALLJOBS_SALE_NOTICE_SLUG, SMALLJOBS_SALE_NOTICE_TITLE_CS } from "./legalTemplates";

// Creates or refreshes the public consumer notice page for this party, generated from live
// config so it can never go stale relative to SMALLJOBS_COMPANY / VAT_ENABLED.
async function upsertSaleNoticePage(client: SupabaseClient, partyId: string, partyName: string, visible: boolean) {
  const { data: existing } = await client
    .from("content_pages")
    .select("id")
    .eq("party_id", partyId)
    .eq("slug", SMALLJOBS_SALE_NOTICE_SLUG)
    .maybeSingle();

  const body = buildSmalljobsSaleNoticeMarkdown("cs", partyName);
  if (existing) {
    await client.from("content_pages").update({ body, is_visible: visible }).eq("id", existing.id);
  } else if (visible) {
    await client.from("content_pages").insert({
      party_id: partyId,
      slug: SMALLJOBS_SALE_NOTICE_SLUG,
      title: SMALLJOBS_SALE_NOTICE_TITLE_CS,
      template: "default",
      body,
      body_format: "markdown",
      is_visible: true,
      show_in_footer_column: "information",
    });
  }
}

// Bump when the commissionaire agreement text changes materially — re-acceptance is only
// required going forward for new agreements, existing ones keep the version they accepted.
export const CURRENT_COMMISSIONAIRE_TERMS_VERSION = "2026-08-06";

export async function fetchCommissionaireAgreement(
  client: SupabaseClient,
  partyId: string
): Promise<CommissionaireAgreement | null> {
  const { data } = await client
    .from("commissionaire_agreements")
    .select("*")
    .eq("party_id", partyId)
    .maybeSingle();
  return (data as CommissionaireAgreement | null) ?? null;
}

export type AcceptCommissionaireAgreementInput = {
  legal_full_name: string;
  address_line1: string;
  address_city: string;
  address_postal_code: string;
  address_country_code?: string;
  bank_account: string;
  personal_id_note?: string;
  accepted_by: string;
};

// Records consent to the komisionářská smlouva and switches the party into commission mode
// in the same call — a party must never sit in smalljobs_commission mode without a matching
// active agreement on file.
export async function acceptCommissionaireAgreement(
  client: SupabaseClient,
  partyId: string,
  input: AcceptCommissionaireAgreementInput
): Promise<{ error: Error | null }> {
  const { error: agreementError } = await client
    .from("commissionaire_agreements")
    .upsert(
      {
        party_id: partyId,
        legal_full_name: input.legal_full_name,
        address_line1: input.address_line1,
        address_city: input.address_city,
        address_postal_code: input.address_postal_code,
        address_country_code: input.address_country_code ?? "CZ",
        bank_account: input.bank_account,
        personal_id_note: input.personal_id_note || null,
        terms_version: CURRENT_COMMISSIONAIRE_TERMS_VERSION,
        accepted_at: new Date().toISOString(),
        accepted_by: input.accepted_by,
        status: "active",
        revoked_at: null,
      },
      { onConflict: "party_id" }
    );
  if (agreementError) return { error: agreementError };

  const { data: party, error: partyError } = await client
    .from("parties")
    .update({ seller_mode: SELLER_MODE.SMALLJOBS_COMMISSION })
    .eq("id", partyId)
    .select("name")
    .single();
  if (partyError) return { error: partyError };

  await upsertSaleNoticePage(client, partyId, party.name, true);
  return { error: null };
}

// Refuses to revert while the creator still has an unpaid held balance — reverting would
// orphan a payout obligation that the ledger/admin payout screen can no longer surface
// against an own_company party.
export async function revokeCommissionaireAgreement(
  client: SupabaseClient,
  partyId: string
): Promise<{ error: Error | null }> {
  const { count } = await client
    .from("order_commission_ledger")
    .select("id", { count: "exact", head: true })
    .eq("party_id", partyId)
    .eq("status", "held");
  if (count && count > 0) {
    return {
      error: new Error(
        "Nelze ukončit prodej přes Smalljobs s.r.o. — existují nevyplacené provize v ochranné lhůtě."
      ),
    };
  }

  const { error: agreementError } = await client
    .from("commissionaire_agreements")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("party_id", partyId);
  if (agreementError) return { error: agreementError };

  const { data: party, error: partyError } = await client
    .from("parties")
    .update({ seller_mode: SELLER_MODE.OWN_COMPANY })
    .eq("id", partyId)
    .select("name")
    .single();
  if (partyError) return { error: partyError };

  await upsertSaleNoticePage(client, partyId, party.name, false);
  return { error: null };
}
