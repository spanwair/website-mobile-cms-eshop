import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

type Client = SupabaseClient<Database>;

export type WishlistItem = {
  id: string;
  wishlist_id: string;
  product_id: string;
  variant_id: string | null;
  added_at: string;
  product?: { title: string; slug: string; price: number; discount_price: number | null; product_images: { url: string; is_primary: boolean; media_type?: string }[] };
};

export async function getOrCreateWishlist(client: Client, partyId: string, userId: string): Promise<string> {
  const { data: existing } = await client
    .from("wishlists")
    .select("id")
    .eq("party_id", partyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await client
    .from("wishlists")
    .insert({ party_id: partyId, user_id: userId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function fetchWishlistItems(client: Client, partyId: string, userId: string): Promise<WishlistItem[]> {
  const { data: wishlist } = await client
    .from("wishlists")
    .select("id")
    .eq("party_id", partyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!wishlist) return [];

  const { data } = await client
    .from("wishlist_items")
    .select("*, product:products(title, slug, price, discount_price, product_images(url, is_primary, media_type))")
    .eq("wishlist_id", wishlist.id)
    .order("added_at", { ascending: false });

  return (data ?? []) as unknown as WishlistItem[];
}

export async function isInWishlist(client: Client, partyId: string, userId: string, productId: string): Promise<boolean> {
  const { data: wishlist } = await client
    .from("wishlists")
    .select("id")
    .eq("party_id", partyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!wishlist) return false;

  const { data } = await client
    .from("wishlist_items")
    .select("id")
    .eq("wishlist_id", wishlist.id)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

export async function addToWishlist(
  client: Client,
  partyId: string,
  userId: string,
  productId: string,
  variantId?: string | null
): Promise<{ error: Error | null }> {
  const wishlistId = await getOrCreateWishlist(client, partyId, userId);
  const { error } = await client
    .from("wishlist_items")
    .insert({ wishlist_id: wishlistId, product_id: productId, variant_id: variantId ?? null });
  return { error: error ? new Error(error.message) : null };
}

export async function removeFromWishlist(
  client: Client,
  partyId: string,
  userId: string,
  productId: string
): Promise<{ error: Error | null }> {
  const { data: wishlist } = await client
    .from("wishlists")
    .select("id")
    .eq("party_id", partyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!wishlist) return { error: null };

  const { error } = await client
    .from("wishlist_items")
    .delete()
    .eq("wishlist_id", wishlist.id)
    .eq("product_id", productId);
  return { error: error ? new Error(error.message) : null };
}

export async function countWishlistItems(client: Client, partyId: string, userId: string): Promise<number> {
  const { data: wishlist } = await client
    .from("wishlists")
    .select("id")
    .eq("party_id", partyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!wishlist) return 0;

  const { count } = await client
    .from("wishlist_items")
    .select("*", { count: "exact", head: true })
    .eq("wishlist_id", wishlist.id);
  return count ?? 0;
}
