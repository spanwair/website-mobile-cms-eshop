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

// A cart belongs to either a logged-in user or an anonymous guest (identified by a
// cookie-backed session id) — never both. Guest reads/writes always go through a
// service-role client (see website/src/lib/guestCart.ts for why there's no anon RLS
// policy) so callers passing a sessionId must also pass an admin-privileged client.
export type CartIdentity = { userId: string; sessionId?: undefined } | { userId?: undefined; sessionId: string };

export async function getOrCreateCart(
  client: Client,
  partyId: string,
  identity: CartIdentity
): Promise<Cart> {
  let query = client
    .from("carts")
    .select("*, cart_items(*, product:products(title, slug, product_images(url)))")
    .eq("party_id", partyId);
  query = identity.userId !== undefined ? query.eq("user_id", identity.userId) : query.eq("session_id", identity.sessionId);

  const { data: existing } = await query.maybeSingle();
  if (existing) return existing as unknown as Cart;

  const { data, error } = await client
    .from("carts")
    .insert(identity.userId !== undefined ? { party_id: partyId, user_id: identity.userId } : { party_id: partyId, session_id: identity.sessionId })
    .select("*, cart_items(*)")
    .single();

  if (error) throw new Error(error.message);
  return { ...data, items: [] } as unknown as Cart;
}

// Only needed on the service-role (guest) path — RLS already enforces this for authenticated
// users. Re-verifies a cart_id/item_id taken from a form field actually belongs to the
// requesting guest before any mutation, so one guest can't pass another guest's id.
export async function cartBelongsToIdentity(
  client: Client,
  cartId: string,
  identity: CartIdentity
): Promise<boolean> {
  const { data } = await client.from("carts").select("user_id, session_id").eq("id", cartId).maybeSingle();
  if (!data) return false;
  return identity.userId !== undefined ? data.user_id === identity.userId : data.session_id === identity.sessionId;
}

export async function cartItemBelongsToIdentity(
  client: Client,
  itemId: string,
  identity: CartIdentity
): Promise<boolean> {
  const { data } = await client
    .from("cart_items")
    .select("cart:carts!inner(user_id, session_id)")
    .eq("id", itemId)
    .maybeSingle();
  const cart = (data as unknown as { cart: { user_id: string | null; session_id: string | null } } | null)?.cart;
  if (!cart) return false;
  return identity.userId !== undefined ? cart.user_id === identity.userId : cart.session_id === identity.sessionId;
}

// Folds a guest cart into the user's cart right after login, so browsing before signing in
// doesn't lose the items. Reuses addToCart's existing-item merge/stock logic instead of
// duplicating it; a guest item that fails the stock check is simply skipped.
export async function mergeGuestCartIntoUser(client: Client, sessionId: string, userId: string): Promise<void> {
  const { data: guestCarts } = await client
    .from("carts")
    .select("id, party_id, cart_items(product_id, variant_id, quantity, unit_price)")
    .eq("session_id", sessionId);

  for (const guestCart of guestCarts ?? []) {
    const cart = await getOrCreateCart(client, guestCart.party_id, { userId });
    for (const item of (guestCart as unknown as { cart_items: CartItem[] }).cart_items ?? []) {
      await addToCart(client, cart.id, item.product_id, item.quantity, Number(item.unit_price), item.variant_id);
    }
    await client.from("carts").delete().eq("id", guestCart.id);
  }
}

async function getAvailableStock(
  client: Client,
  productId: string,
  variantId: string | null
): Promise<number | null> {
  let query = client
    .from("inventory_items")
    .select("qty_on_hand, qty_reserved, track_inventory")
    .eq("product_id", productId);

  query = variantId ? query.eq("variant_id", variantId) : query.is("variant_id", null);

  const { data } = await query.maybeSingle();
  if (!data) return null;
  if (!data.track_inventory) return null;
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

export async function fetchCartItemCount(client: Client, identity: CartIdentity, partyId: string): Promise<number> {
  let query = client.from("carts").select("id").eq("party_id", partyId);
  query = identity.userId !== undefined ? query.eq("user_id", identity.userId) : query.eq("session_id", identity.sessionId);
  const { data: cart } = await query.maybeSingle();
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
