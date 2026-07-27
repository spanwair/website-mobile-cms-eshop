import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { FooterBadge, FooterBadgeKind } from "../types";

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
