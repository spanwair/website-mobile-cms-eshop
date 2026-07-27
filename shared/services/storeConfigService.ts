import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { StoreConfig, StoreDomain } from "../types";

type Client = SupabaseClient<Database>;

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const FONT_NAME_RE = /^[A-Za-z0-9 '.-]{1,60}$/;
const CURRENCY_CODE_RE = /^[A-Z]{3}$/;
const COLOR_FIELDS = [
  "color_primary", "color_secondary", "color_background", "color_surface",
  "color_text_primary", "color_text_secondary", "color_border",
] as const;
const FONT_FIELDS = ["font_heading", "font_body"] as const;

export async function fetchStoreConfig(client: Client, partyId: string): Promise<StoreConfig | null> {
  const { data, error } = await client
    .from("store_configs")
    .select("*")
    .eq("party_id", partyId)
    .single();
  if (error || !data) return null;
  return data as unknown as StoreConfig;
}

// buildThemeCss (website/src/lib/themeEngine.ts) injects these fields into a <style set:html>
// block with zero escaping, rendered on every public storefront page. Without validating here —
// the single shared write path — a crafted value like `</style><script>...` in color_primary
// would be stored XSS against every visitor of that party's storefront.
export async function updateStoreConfig(
  client: Client,
  partyId: string,
  updates: Partial<Omit<StoreConfig, "id" | "party_id" | "created_at" | "updated_at">>
): Promise<{ error: Error | null }> {
  for (const field of COLOR_FIELDS) {
    const v = updates[field];
    if (v !== undefined && v !== null && !HEX_COLOR_RE.test(v)) {
      return { error: new Error(`${field} must be a hex color (e.g. #4F46E5)`) };
    }
  }
  for (const field of FONT_FIELDS) {
    const v = updates[field];
    if (v !== undefined && v !== null && !FONT_NAME_RE.test(v)) {
      return { error: new Error(`${field} may only contain letters, numbers, spaces and -.'`) };
    }
  }
  if (updates.currency_code !== undefined && !CURRENCY_CODE_RE.test(updates.currency_code)) {
    return { error: new Error("currency_code must be a 3-letter uppercase code (e.g. CZK)") };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await client.from("store_configs").update(updates as any).eq("party_id", partyId);
  return { error: error ? new Error(error.message) : null };
}

export async function resolvePartyIdByDomain(client: Client, domain: string): Promise<string | null> {
  const { data, error } = await client
    .from("store_domains")
    .select("party_id")
    .eq("domain", domain)
    .eq("verified", true)
    .single();
  if (error || !data) return null;
  return data.party_id;
}

// Used by /eshop-[partySlug] path-based storefront routing and the domain middleware's
// subdomain fallback. `parties` has no anon SELECT policy (the row carries vat_number and
// billing_email), so this goes through a SECURITY DEFINER function that returns only the id,
// scoped to active parties — never a raw table query, which anon can't read anyway.
export async function resolvePartyIdBySlug(client: Client, slug: string): Promise<string | null> {
  const { data, error } = await client.rpc("resolve_active_party_id_by_slug", { p_slug: slug });
  if (error || !data) return null;
  return data as string;
}

export async function fetchStoreDomains(client: Client, partyId: string): Promise<StoreDomain[]> {
  const { data, error } = await client
    .from("store_domains")
    .select("*")
    .eq("party_id", partyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as StoreDomain[];
}

// Scoped by party_id so a caller can never resolve (and then verify/remove) a domain
// belonging to another party by guessing/submitting its id.
export async function getStoreDomain(
  client: Client,
  partyId: string,
  domainId: string
): Promise<StoreDomain | null> {
  const { data, error } = await client
    .from("store_domains")
    .select("*")
    .eq("id", domainId)
    .eq("party_id", partyId)
    .maybeSingle();
  if (error || !data) return null;
  return data as StoreDomain;
}

export async function addStoreDomain(
  client: Client,
  partyId: string,
  domain: string
): Promise<{ data: StoreDomain | null; error: Error | null }> {
  const { data, error } = await client
    .from("store_domains")
    .insert({ party_id: partyId, domain })
    .select()
    .single();
  return {
    data: error ? null : (data as StoreDomain),
    error: error ? new Error(error.message) : null,
  };
}

export async function verifyStoreDomain(client: Client, domainId: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("store_domains").update({ verified: true }).eq("id", domainId);
  return { error: error ? new Error(error.message) : null };
}

export async function removeStoreDomain(client: Client, domainId: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("store_domains").delete().eq("id", domainId);
  return { error: error ? new Error(error.message) : null };
}

export interface ActiveStore {
  party_id: string;
  slug: string;
  brand_name: string | null;
  logo_url: string | null;
  tagline: string | null;
}

// Powers the /shop "Stores" directory and the cross-org product badge — same anon-read gap
// as resolvePartyIdBySlug, so this goes through the matching SECURITY DEFINER function rather
// than querying `parties` directly.
export async function listActiveStores(client: Client): Promise<ActiveStore[]> {
  const { data, error } = await client.rpc("list_active_stores");
  if (error || !data) return [];
  return data as ActiveStore[];
}
