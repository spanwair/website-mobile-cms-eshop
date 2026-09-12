import type { AstroGlobal } from "astro";
import { createSupabase, createAdminClient } from "./supabase";
import { fetchParty } from "@shared/services/partyService";
import { fetchStoreConfig } from "@shared/services/storeConfigService";
import { fetchCustomerAccount, type CustomerAccount } from "@shared/services/customerDashboardService";
import { ROLE } from "@shared/constants/permissions";
import type { Party, StoreConfig } from "@shared/types";

export interface DashboardView {
  redirect: null;
  displayName: string;
  brandName: string;
  shopHref: string;
  logoUrl: string | null;
  storeConfig: StoreConfig | null;
  party: Party | null;
  account: CustomerAccount;
}

// Shared by the top-level /dashboard (generic chrome) and /eshop-[slug]/dashboard (storefront
// chrome). Both resolve the same customer data; they only differ in which party scopes the view
// and which layout wraps it. Pass `partyId` to force a party (the storefront route uses the eshop
// in context); omit it to fall back to the customer's registered home eshop.
export async function loadDashboardView(
  Astro: AstroGlobal,
  opts: { partyId?: string | null } = {}
): Promise<DashboardView | { redirect: string }> {
  const supabase = createSupabase(Astro);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { redirect: `/login?redirect=${encodeURIComponent(Astro.url.pathname)}` };

  const userId = session.user.id;
  const userEmail = session.user.email ?? "";
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role, display_name, signup_party_id")
    .eq("id", userId)
    .single();

  // Sellers/staff belong in the admin panel, not the customer account dashboard.
  if ((profile?.role ?? ROLE.USER) >= ROLE.ESHOP_ADMIN) return { redirect: "/admin" };

  let homePartyId = opts.partyId ?? profile?.signup_party_id ?? null;
  if (!homePartyId) {
    const { data: recent } = await admin
      .from("customers")
      .select("party_id, created_at")
      .or(`user_id.eq.${userId},email.eq.${userEmail}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    homePartyId = recent?.party_id ?? null;
  }

  const party = homePartyId ? await fetchParty(admin, homePartyId) : null;
  const storeConfig = homePartyId ? await fetchStoreConfig(admin, homePartyId) : null;
  const account = await fetchCustomerAccount(admin, { userId, email: userEmail, partyId: homePartyId ?? "" });

  return {
    redirect: null,
    displayName: profile?.display_name ?? userEmail.split("@")[0] ?? "",
    brandName: storeConfig?.brand_name ?? party?.name ?? "",
    shopHref: party ? `/eshop-${party.slug}` : "/shop",
    logoUrl: storeConfig?.logo_url ?? party?.logo_url ?? null,
    storeConfig,
    party,
    account,
  };
}
