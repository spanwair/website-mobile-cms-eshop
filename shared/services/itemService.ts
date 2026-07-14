import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Item, PaginatedResult } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchItems(
  client: Client,
  page = 1,
  pageSize = 20,
  status?: Item["status"]
): Promise<PaginatedResult<Item>> {
  let query = client
    .from("items")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error || !data) return { data: [], total: 0, page, pageSize };
  return { data: data as Item[], total: count ?? 0, page, pageSize };
}

export async function fetchItem(client: Client, id: string): Promise<Item | null> {
  const { data, error } = await client
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Item;
}

export async function createItem(
  client: Client,
  payload: { title: string; description?: string; created_by: string }
): Promise<{ data: Item | null; error: Error | null }> {
  const { data, error } = await client
    .from("items")
    .insert({ ...payload, status: "draft" })
    .select()
    .single();

  return {
    data: data as Item | null,
    error: error ? new Error(error.message) : null,
  };
}

export async function updateItem(
  client: Client,
  id: string,
  updates: Partial<Pick<Item, "title" | "description" | "status">>
): Promise<{ error: Error | null }> {
  const { error } = await client.from("items").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteItem(
  client: Client,
  id: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("items").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
