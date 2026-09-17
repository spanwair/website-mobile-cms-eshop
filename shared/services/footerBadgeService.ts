import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { FooterBadge, FooterBadgeKind } from "../types";
import type { FooterProvider } from "../constants/footerProviders";

type Client = SupabaseClient<Database>;

export async function fetchFooterBadges(client: Client, partyId: string): Promise<FooterBadge[]> {
  const { data, error } = await client
    .from("footer_badges")
    .select("*")
    .eq("party_id", partyId)
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FooterBadge[];
}

export async function fetchVisibleFooterBadges(
  client: Client,
  partyId: string,
  kind?: FooterBadgeKind
): Promise<FooterBadge[]> {
  let query = client
    .from("footer_badges")
    .select("*")
    .eq("party_id", partyId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as FooterBadge[];
}

export async function createFooterBadge(
  client: Client,
  input: Database["public"]["Tables"]["footer_badges"]["Insert"]
): Promise<{ data: FooterBadge | null; error: Error | null }> {
  const { data, error } = await client.from("footer_badges").insert(input).select().single();
  return { data: error ? null : (data as FooterBadge), error: error ? new Error(error.message) : null };
}

export async function updateFooterBadge(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["footer_badges"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("footer_badges").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteFooterBadge(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("footer_badges").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

// Toggle/reorder an integrated provider badge. Self-heals: if the row is missing (e.g. a provider
// added after this party was seeded) it is created from the provider constant.
export async function upsertProviderBadge(
  client: Client,
  partyId: string,
  provider: FooterProvider,
  state: { is_visible: boolean; sort_order: number }
): Promise<{ error: Error | null }> {
  const { data: existing } = await client
    .from("footer_badges")
    .select("id")
    .eq("party_id", partyId)
    .eq("provider_key", provider.key)
    .maybeSingle();
  if (existing) {
    return updateFooterBadge(client, existing.id, state);
  }
  const { error } = await createFooterBadge(client, {
    party_id: partyId,
    kind: provider.kind,
    provider_key: provider.key,
    label: provider.label,
    icon: provider.icon,
    url: provider.url,
    is_visible: state.is_visible,
    sort_order: state.sort_order,
  });
  return { error };
}
