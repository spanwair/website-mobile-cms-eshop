import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { FooterLink } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchFooterLinks(client: Client, partyId: string): Promise<FooterLink[]> {
  const { data, error } = await client
    .from("footer_links")
    .select("*")
    .eq("party_id", partyId)
    .order("column_key", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FooterLink[];
}

export async function fetchVisibleFooterLinks(client: Client, partyId: string): Promise<FooterLink[]> {
  const { data, error } = await client
    .from("footer_links")
    .select("*")
    .eq("party_id", partyId)
    .eq("is_visible", true)
    .order("column_key", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as FooterLink[];
}

export async function createFooterLink(
  client: Client,
  input: Database["public"]["Tables"]["footer_links"]["Insert"]
): Promise<{ data: FooterLink | null; error: Error | null }> {
  const { data, error } = await client.from("footer_links").insert(input).select().single();
  return { data: error ? null : (data as FooterLink), error: error ? new Error(error.message) : null };
}

export async function updateFooterLink(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["footer_links"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("footer_links").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteFooterLink(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("footer_links").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
