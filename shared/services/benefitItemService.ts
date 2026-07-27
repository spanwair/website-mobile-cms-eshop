import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { BenefitItem } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchBenefitItems(client: Client, partyId: string): Promise<BenefitItem[]> {
  const { data, error } = await client
    .from("benefit_items")
    .select("*")
    .eq("party_id", partyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BenefitItem[];
}

export async function fetchVisibleBenefitItems(client: Client, partyId: string): Promise<BenefitItem[]> {
  const { data, error } = await client
    .from("benefit_items")
    .select("*")
    .eq("party_id", partyId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as BenefitItem[];
}

export async function createBenefitItem(
  client: Client,
  input: Database["public"]["Tables"]["benefit_items"]["Insert"]
): Promise<{ data: BenefitItem | null; error: Error | null }> {
  const { data, error } = await client.from("benefit_items").insert(input).select().single();
  return { data: error ? null : (data as BenefitItem), error: error ? new Error(error.message) : null };
}

export async function updateBenefitItem(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["benefit_items"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("benefit_items").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteBenefitItem(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("benefit_items").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
