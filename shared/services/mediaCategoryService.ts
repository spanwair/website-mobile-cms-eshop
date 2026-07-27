import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { MediaCategory } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchMediaCategories(client: Client, partyId: string): Promise<MediaCategory[]> {
  const { data, error } = await client
    .from("media_categories")
    .select("*")
    .eq("party_id", partyId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MediaCategory[];
}

export async function createMediaCategory(
  client: Client,
  partyId: string,
  name: string
): Promise<{ data: MediaCategory | null; error: Error | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: new Error("Category name is required") };
  const { data, error } = await client
    .from("media_categories")
    .insert({ party_id: partyId, name: trimmed })
    .select()
    .single();
  return {
    data: error ? null : (data as MediaCategory),
    error: error ? new Error(error.message.includes("duplicate") ? "That category already exists" : error.message) : null,
  };
}

export async function deleteMediaCategory(client: Client, partyId: string, categoryId: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("media_categories").delete().eq("id", categoryId).eq("party_id", partyId);
  return { error: error ? new Error(error.message) : null };
}

// media_id -> category_id[] for every item in one round trip. media_category_assignments
// carries no party_id of its own, so scoping goes through the party's own category ids.
export async function fetchMediaCategoryAssignments(client: Client, partyId: string): Promise<Record<string, string[]>> {
  const categories = await fetchMediaCategories(client, partyId);
  if (categories.length === 0) return {};
  const { data, error } = await client
    .from("media_category_assignments")
    .select("media_id, category_id")
    .in("category_id", categories.map((c) => c.id));
  if (error) throw new Error(error.message);
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    (map[row.media_id] ??= []).push(row.category_id);
  }
  return map;
}

// Replaces the full category set for one media item — simplest correct semantics for a
// small per-item checklist UI (diffing insert/delete would just add complexity here).
export async function setMediaCategories(client: Client, mediaId: string, categoryIds: string[]): Promise<{ error: Error | null }> {
  const { error: delErr } = await client.from("media_category_assignments").delete().eq("media_id", mediaId);
  if (delErr) return { error: new Error(delErr.message) };
  if (categoryIds.length === 0) return { error: null };
  const { error: insErr } = await client
    .from("media_category_assignments")
    .insert(categoryIds.map((category_id) => ({ media_id: mediaId, category_id })));
  return { error: insErr ? new Error(insErr.message) : null };
}
