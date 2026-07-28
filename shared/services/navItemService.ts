import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { NavItem, NavItemWithChildren } from "../types";
import { fetchNavCategories } from "./categoryService";

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

// Merges the hand-curated nav_items tree with categories flagged show_in_nav — those
// carry no url of their own, so their href is built here from the shop's own
// ?category= filter (shopHref differs per store: /shop, /eshop-[partySlug], custom domain).
export async function fetchStorefrontNavTree(
  client: Client,
  partyId: string,
  shopHref: string
): Promise<NavItemWithChildren[]> {
  const [navTree, categories] = await Promise.all([
    fetchVisibleNavTree(client, partyId),
    fetchNavCategories(client, partyId),
  ]);
  const categoryItems: NavItemWithChildren[] = categories.map((c) => ({
    id: `category-${c.id}`,
    party_id: c.party_id,
    parent_id: null,
    label: c.name,
    url: `${shopHref}?category=${c.slug}`,
    category_id: c.id,
    column_label: null,
    is_mega: c.children.length > 0,
    sort_order: c.sort_order,
    is_visible: true,
    created_at: c.created_at,
    updated_at: c.updated_at,
    children: c.children.map((ch) => ({
      id: `category-${ch.id}`,
      party_id: ch.party_id,
      parent_id: c.id,
      label: ch.name,
      url: `${shopHref}?category=${ch.slug}`,
      category_id: ch.id,
      column_label: null,
      is_mega: false,
      sort_order: ch.sort_order,
      is_visible: true,
      created_at: ch.created_at,
      updated_at: ch.updated_at,
    })),
  }));
  return [...navTree, ...categoryItems].sort((a, b) => a.sort_order - b.sort_order);
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
