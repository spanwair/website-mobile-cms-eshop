import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { PriceList, DiscountRule, Coupon } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchPriceLists(client: Client, partyId: string): Promise<PriceList[]> {
  const { data, error } = await client
    .from("price_lists")
    .select("*")
    .eq("party_id", partyId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PriceList[];
}

export async function fetchPriceList(
  client: Client,
  priceListId: string
): Promise<PriceList | null> {
  const { data, error } = await client
    .from("price_lists")
    .select("*")
    .eq("id", priceListId)
    .single();
  if (error) throw new Error(error.message);
  return data as PriceList;
}

export async function createPriceList(
  client: Client,
  input: Database["public"]["Tables"]["price_lists"]["Insert"]
): Promise<{ data: PriceList | null; error: Error | null }> {
  const { data, error } = await client
    .from("price_lists")
    .insert(input)
    .select()
    .single();
  return {
    data: error ? null : (data as PriceList),
    error: error ? new Error(error.message) : null,
  };
}

export async function updatePriceList(
  client: Client,
  priceListId: string,
  updates: Database["public"]["Tables"]["price_lists"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("price_lists").update(updates).eq("id", priceListId);
  return { error: error ? new Error(error.message) : null };
}

export async function deletePriceList(
  client: Client,
  priceListId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("price_lists").delete().eq("id", priceListId);
  return { error: error ? new Error(error.message) : null };
}

export async function fetchDiscountRules(
  client: Client,
  partyId: string
): Promise<DiscountRule[]> {
  const { data, error } = await client
    .from("discount_rules")
    .select("*")
    .eq("party_id", partyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DiscountRule[];
}

export async function fetchDiscountRule(
  client: Client,
  ruleId: string
): Promise<DiscountRule | null> {
  const { data, error } = await client
    .from("discount_rules")
    .select("*")
    .eq("id", ruleId)
    .single();
  if (error) throw new Error(error.message);
  return data as DiscountRule;
}

export async function createDiscountRule(
  client: Client,
  input: Database["public"]["Tables"]["discount_rules"]["Insert"]
): Promise<{ data: DiscountRule | null; error: Error | null }> {
  const { data, error } = await client
    .from("discount_rules")
    .insert(input)
    .select()
    .single();
  return {
    data: error ? null : (data as DiscountRule),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateDiscountRule(
  client: Client,
  ruleId: string,
  updates: Database["public"]["Tables"]["discount_rules"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("discount_rules").update(updates).eq("id", ruleId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteDiscountRule(
  client: Client,
  ruleId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("discount_rules").delete().eq("id", ruleId);
  return { error: error ? new Error(error.message) : null };
}

export async function fetchCoupons(client: Client, partyId: string): Promise<Coupon[]> {
  const { data, error } = await client
    .from("coupons")
    .select("*")
    .eq("party_id", partyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Coupon[];
}

export async function fetchCoupon(
  client: Client,
  couponId: string
): Promise<Coupon | null> {
  const { data, error } = await client
    .from("coupons")
    .select("*")
    .eq("id", couponId)
    .single();
  if (error) throw new Error(error.message);
  return data as Coupon;
}

export async function createCoupon(
  client: Client,
  input: Database["public"]["Tables"]["coupons"]["Insert"]
): Promise<{ data: Coupon | null; error: Error | null }> {
  const { data, error } = await client.from("coupons").insert(input).select().single();
  return {
    data: error ? null : (data as Coupon),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateCoupon(
  client: Client,
  couponId: string,
  updates: Database["public"]["Tables"]["coupons"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("coupons").update(updates).eq("id", couponId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteCoupon(
  client: Client,
  couponId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("coupons").delete().eq("id", couponId);
  return { error: error ? new Error(error.message) : null };
}

export async function validateCoupon(
  client: Client,
  code: string,
  partyId: string
): Promise<{ coupon: Coupon | null; valid: boolean; reason?: string }> {
  const { data, error } = await client
    .from("coupons")
    .select("*, discount_rule:discount_rule_id(*)")
    .eq("code", code)
    .eq("party_id", partyId)
    .single();

  if (error || !data) return { coupon: null, valid: false, reason: "Coupon not found" };

  const coupon = data as Coupon & { discount_rule: DiscountRule };

  if (!coupon.is_active) return { coupon, valid: false, reason: "Coupon is inactive" };

  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return { coupon, valid: false, reason: "Coupon usage limit reached" };
  }

  const now = new Date().toISOString();
  const rule = coupon.discount_rule;

  if (rule.starts_at && rule.starts_at > now) {
    return { coupon, valid: false, reason: "Coupon not yet active" };
  }
  if (rule.ends_at && rule.ends_at < now) {
    return { coupon, valid: false, reason: "Coupon has expired" };
  }

  return { coupon, valid: true };
}

export async function fetchPriceListItems(
  client: Client,
  priceListId: string
): Promise<any[]> {
  const { data, error } = await client
    .from("price_list_items")
    .select("*, product:product_id(id, title, sku)")
    .eq("price_list_id", priceListId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertPriceListItem(
  client: Client,
  input: Database["public"]["Tables"]["price_list_items"]["Insert"]
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("price_list_items")
    .upsert(input, { onConflict: "price_list_id,product_id,variant_id" });
  return { error: error ? new Error(error.message) : null };
}

export async function deletePriceListItem(
  client: Client,
  itemId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("price_list_items").delete().eq("id", itemId);
  return { error: error ? new Error(error.message) : null };
}
