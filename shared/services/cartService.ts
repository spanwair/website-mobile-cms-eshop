import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

type Client = SupabaseClient<Database>;

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  product?: { title: string; slug: string; product_images: { url: string }[] };
};

export type Cart = {
  id: string;
  party_id: string;
  user_id: string | null;
  session_id: string | null;
  coupon_code: string | null;
  coupon_id: string | null;
  items: CartItem[];
};

export async function getOrCreateCart(
  client: Client,
  partyId: string,
  userId: string
): Promise<Cart> {
  const { data: existing } = await client
    .from("carts")
    .select("*, cart_items(*, product:products(title, slug, product_images(url)))")
    .eq("party_id", partyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing as unknown as Cart;

  const { data, error } = await client
    .from("carts")
    .insert({ party_id: partyId, user_id: userId })
    .select("*, cart_items(*)")
    .single();

  if (error) throw new Error(error.message);
  return { ...data, items: [] } as unknown as Cart;
}

async function getAvailableStock(
  client: Client,
  productId: string,
  variantId: string | null
): Promise<number | null> {
  let query = client
    .from("inventory_items")
    .select("qty_on_hand, qty_reserved")
    .eq("product_id", productId);

  query = variantId ? query.eq("variant_id", variantId) : query.is("variant_id", null);

  const { data } = await query.maybeSingle();
  if (!data) return null;
  return data.qty_on_hand - data.qty_reserved;
}

export async function addToCart(
  client: Client,
  cartId: string,
  productId: string,
  quantity: number,
  unitPrice: number,
  variantId?: string | null
): Promise<{ error: Error | null }> {
  const available = await getAvailableStock(client, productId, variantId ?? null);

  let existingQuery = client
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId);

  existingQuery = variantId
    ? existingQuery.eq("variant_id", variantId)
    : existingQuery.is("variant_id", null);

  const { data: existing } = await existingQuery.maybeSingle();
  const requestedTotal = (existing?.quantity ?? 0) + quantity;

  if (available !== null && requestedTotal > available) {
    return { error: new Error(`Only ${available} left in stock`) };
  }

  if (existing) {
    const { error } = await client
      .from("cart_items")
      .update({ quantity: requestedTotal })
      .eq("id", existing.id);
    return { error: error ? new Error(error.message) : null };
  }

  const { error } = await client.from("cart_items").insert({
    cart_id: cartId,
    product_id: productId,
    variant_id: variantId ?? null,
    quantity,
    unit_price: unitPrice,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function updateCartItemQty(
  client: Client,
  itemId: string,
  quantity: number
): Promise<{ error: Error | null }> {
  if (quantity <= 0) {
    const { error } = await client.from("cart_items").delete().eq("id", itemId);
    return { error: error ? new Error(error.message) : null };
  }

  const { data: item } = await client
    .from("cart_items")
    .select("product_id, variant_id")
    .eq("id", itemId)
    .maybeSingle();

  if (item) {
    const available = await getAvailableStock(client, item.product_id, item.variant_id);
    if (available !== null && quantity > available) {
      return { error: new Error(`Only ${available} left in stock`) };
    }
  }

  const { error } = await client
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId);
  return { error: error ? new Error(error.message) : null };
}

export async function removeFromCart(
  client: Client,
  itemId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("cart_items").delete().eq("id", itemId);
  return { error: error ? new Error(error.message) : null };
}

export async function clearCart(
  client: Client,
  cartId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("cart_items").delete().eq("cart_id", cartId);
  return { error: error ? new Error(error.message) : null };
}

export async function applyCoupon(
  client: Client,
  cartId: string,
  partyId: string,
  code: string
): Promise<{ discount: number; error: string | null }> {
  const { data: coupon } = await client
    .from("coupons")
    .select("*, discount_rule:discount_rules(*)")
    .eq("party_id", partyId)
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) return { discount: 0, error: "Coupon not found or expired" };

  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return { discount: 0, error: "Coupon has reached its usage limit" };
  }

  await client
    .from("carts")
    .update({ coupon_code: code.toUpperCase(), coupon_id: coupon.id })
    .eq("id", cartId);

  return { discount: 0, error: null };
}

export async function fetchCartItemCount(client: Client, userId: string, partyId: string): Promise<number> {
  const { data: cart } = await client
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("party_id", partyId)
    .maybeSingle();
  if (!cart) return 0;

  const { data } = await client
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cart.id);
  return (data ?? []).reduce((sum, i) => sum + i.quantity, 0);
}

export function calcCartTotal(items: CartItem[]): {
  subtotal: number;
  itemCount: number;
} {
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  return { subtotal, itemCount };
}
