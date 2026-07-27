import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { BlogPost } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchBlogPosts(client: Client, partyId: string): Promise<BlogPost[]> {
  const { data, error } = await client
    .from("blog_posts")
    .select("*")
    .eq("party_id", partyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BlogPost[];
}

export async function fetchPublishedBlogPosts(
  client: Client,
  partyId: string,
  opts: { page?: number; pageSize?: number } = {}
): Promise<{ posts: BlogPost[]; count: number }> {
  const { page = 1, pageSize = 9 } = opts;
  const from = (page - 1) * pageSize;
  const { data, error, count } = await client
    .from("blog_posts")
    .select("*", { count: "exact" })
    .eq("party_id", partyId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) return { posts: [], count: 0 };
  return { posts: (data ?? []) as BlogPost[], count: count ?? 0 };
}

export async function fetchBlogPost(client: Client, id: string): Promise<BlogPost | null> {
  const { data, error } = await client.from("blog_posts").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as BlogPost;
}

export async function fetchBlogPostBySlug(client: Client, partyId: string, slug: string): Promise<BlogPost | null> {
  const { data, error } = await client
    .from("blog_posts")
    .select("*")
    .eq("party_id", partyId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return data as BlogPost;
}

export async function createBlogPost(
  client: Client,
  input: Database["public"]["Tables"]["blog_posts"]["Insert"]
): Promise<{ data: BlogPost | null; error: Error | null }> {
  const { data, error } = await client.from("blog_posts").insert(input).select().single();
  return { data: error ? null : (data as BlogPost), error: error ? new Error(error.message) : null };
}

export async function updateBlogPost(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["blog_posts"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("blog_posts").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteBlogPost(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("blog_posts").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
