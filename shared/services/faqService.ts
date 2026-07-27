import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { FaqItem } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchFaqItems(client: Client, partyId: string): Promise<FaqItem[]> {
  const { data, error } = await client
    .from("faq_items")
    .select("*")
    .eq("party_id", partyId)
    .order("context", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FaqItem[];
}

export async function fetchVisibleFaqItems(
  client: Client,
  partyId: string,
  context?: string
): Promise<FaqItem[]> {
  let query = client
    .from("faq_items")
    .select("*")
    .eq("party_id", partyId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (context) query = query.eq("context", context);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as FaqItem[];
}

export async function createFaqItem(
  client: Client,
  input: Database["public"]["Tables"]["faq_items"]["Insert"]
): Promise<{ data: FaqItem | null; error: Error | null }> {
  const { data, error } = await client.from("faq_items").insert(input).select().single();
  return { data: error ? null : (data as FaqItem), error: error ? new Error(error.message) : null };
}

export async function updateFaqItem(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["faq_items"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("faq_items").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteFaqItem(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("faq_items").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
