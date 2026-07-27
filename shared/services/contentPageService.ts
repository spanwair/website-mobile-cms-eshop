import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { ContentPage } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchContentPages(client: Client, partyId: string): Promise<ContentPage[]> {
  const { data, error } = await client
    .from("content_pages")
    .select("*")
    .eq("party_id", partyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContentPage[];
}

export async function fetchContentPage(client: Client, id: string): Promise<ContentPage | null> {
  const { data, error } = await client.from("content_pages").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as ContentPage;
}

export async function fetchContentPageBySlug(
  client: Client,
  partyId: string,
  slug: string
): Promise<ContentPage | null> {
  const { data, error } = await client
    .from("content_pages")
    .select("*")
    .eq("party_id", partyId)
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as ContentPage;
}

export async function createContentPage(
  client: Client,
  input: Database["public"]["Tables"]["content_pages"]["Insert"]
): Promise<{ data: ContentPage | null; error: Error | null }> {
  const { data, error } = await client.from("content_pages").insert(input).select().single();
  return { data: error ? null : (data as ContentPage), error: error ? new Error(error.message) : null };
}

export async function updateContentPage(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["content_pages"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("content_pages").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteContentPage(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("content_pages").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
