import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { ProductCondition } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchProductConditions(client: Client, partyId: string): Promise<ProductCondition[]> {
  const { data, error } = await client
    .from("product_conditions")
    .select("*")
    .eq("party_id", partyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductCondition[];
}

export async function fetchProductCondition(client: Client, id: string): Promise<ProductCondition | null> {
  const { data, error } = await client.from("product_conditions").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as ProductCondition;
}

export async function createProductCondition(
  client: Client,
  input: Database["public"]["Tables"]["product_conditions"]["Insert"]
): Promise<{ data: ProductCondition | null; error: Error | null }> {
  const { data, error } = await client.from("product_conditions").insert(input).select().single();
  return { data: error ? null : (data as ProductCondition), error: error ? new Error(error.message) : null };
}

export async function updateProductCondition(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["product_conditions"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("product_conditions").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteProductCondition(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("product_conditions").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
