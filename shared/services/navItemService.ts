import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { NavItem, NavItemWithChildren } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchNavItemsFlat(client: Client, partyId: string): Promise<NavItem[]> {
  const { data, error } = await client
    .from("nav_items")
    .select("*")
    .eq("party_id", partyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as NavItem[];
}

export async function fetchVisibleNavTree(client: Client, partyId: string): Promise<NavItemWithChildren[]> {
  const { data, error } = await client
    .from("nav_items")
    .select("*")
    .eq("party_id", partyId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  const flat = (data ?? []) as NavItem[];
  const top = flat.filter((n) => !n.parent_id);
  return top.map((n) => ({ ...n, children: flat.filter((c) => c.parent_id === n.id) }));
}

export async function createNavItem(
  client: Client,
  input: Database["public"]["Tables"]["nav_items"]["Insert"]
): Promise<{ data: NavItem | null; error: Error | null }> {
  const { data, error } = await client.from("nav_items").insert(input).select().single();
  return { data: error ? null : (data as NavItem), error: error ? new Error(error.message) : null };
}

export async function updateNavItem(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["nav_items"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("nav_items").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteNavItem(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("nav_items").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
