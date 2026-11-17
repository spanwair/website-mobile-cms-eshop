import type { APIRoute } from "astro";
import { createSupabase, createAdminClient } from "@/lib/supabase";
import { requireAdminCtx } from "@/lib/admin";
import { createNotification, resolvePartyNotificationRecipients } from "@shared/services/notificationService";
import { ROLE } from "@shared/constants/permissions";

// One-off, owner-triggered announcement — not a cron, not automatic. Fulfils the Terms of
// Service's own clause 13 commitment ("in-admin notification... at least 14 days before taking
// effect") for the v2.1 change disclosing the own_company 14-day payout hold
// (shared/i18n/locales/{cs,en}.ts termsPage.sections[5]). Run this once, when Jan is ready to
// start that 14-day clock — POST while logged in as owner, no body needed.
const COPY = {
  cs: {
    title: "Aktualizace obchodních podmínek (v2.1)",
    body: "Upřesnili jsme čl. 6 Obchodních podmínek: u prodeje pod vlastní firmou se čistý výnos vyplácí 14 dní po zaplacení objednávky, bankovním převodem, kdykoli poté — nečeká se na konec měsíce. Změna je účinná za 14 dní od tohoto oznámení. Plné znění najdete na stránce Obchodní podmínky (/terms).",
  },
  en: {
    title: "Terms of Service update (v2.1)",
    body: "We clarified clause 6 of the Terms of Service: for own-company stores, net proceeds are paid out 14 days after an order is paid, by bank transfer, any time after that — not gated on month end. This takes effect 14 days from this notice. Full text on the Terms of Service page (/terms).",
  },
} as const;

export const POST: APIRoute = async (context) => {
  const supabase = createSupabase(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const ctx = await requireAdminCtx(supabase, session.user.id);
  if (!ctx?.isOwner) return new Response("Forbidden — owner only", { status: 403 });

  const adminClient = createAdminClient();

  const { data: parties, error: partiesErr } = await adminClient
    .from("parties")
    .select("id, lang")
    .eq("status", "active");
  if (partiesErr) return new Response(JSON.stringify({ ok: false, error: partiesErr.message }), { status: 500 });

  const { data: ownerProfiles, error: ownersErr } = await adminClient.from("profiles").select("id").eq("role", ROLE.OWNER);
  if (ownersErr) return new Response(JSON.stringify({ ok: false, error: ownersErr.message }), { status: 500 });
  const ownerIds = new Set((ownerProfiles ?? []).map((o) => o.id));

  let partiesNotified = 0;
  for (const party of parties ?? []) {
    const recipients = (await resolvePartyNotificationRecipients(adminClient, party.id)).filter((id) => !ownerIds.has(id));
    if (recipients.length === 0) continue;
    const lang = party.lang === "en" ? "en" : "cs";
    const { error } = await createNotification(
      adminClient,
      { party_id: party.id, type: "system_alert", title: COPY[lang].title, body: COPY[lang].body },
      recipients
    );
    if (!error) partiesNotified += 1;
  }

  if (ownerIds.size > 0) {
    await createNotification(
      adminClient,
      { party_id: null, type: "system_alert", title: COPY.cs.title, body: COPY.cs.body },
      [...ownerIds]
    );
  }

  return new Response(JSON.stringify({ ok: true, partiesNotified, ownersNotified: ownerIds.size }), {
    headers: { "Content-Type": "application/json" },
  });
};
