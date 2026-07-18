import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Category, CategoryTree } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchCategories(client: Client, partyId: string): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("party_id", partyId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

function buildTree(flat: Category[], parentId: string | null = null): CategoryTree[] {
  return flat
    .filter((c) => c.parent_id === parentId)
    .map((c) => ({ ...c, children: buildTree(flat, c.id) }));
}

export async function fetchCategoryTree(
  client: Client,
  partyId: string
): Promise<CategoryTree[]> {
  const flat = await fetchCategories(client, partyId);
  return buildTree(flat);
}

export async function fetchCategory(
  client: Client,
  categoryId: string
): Promise<Category | null> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();
  if (error || !data) return null;
  return data as Category;
}

export async function createCategory(
  client: Client,
  input: Database["public"]["Tables"]["categories"]["Insert"]
): Promise<{ data: Category | null; error: Error | null }> {
  const { data, error } = await client
    .from("categories")
    .insert(input)
    .select()
    .single();
  return {
    data: error ? null : (data as Category),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateCategory(
  client: Client,
  categoryId: string,
  updates: Database["public"]["Tables"]["categories"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("categories").update(updates).eq("id", categoryId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteCategory(
  client: Client,
  categoryId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("categories").delete().eq("id", categoryId);
  return { error: error ? new Error(error.message) : null };
}
