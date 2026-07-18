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

export async function fetchCoupons(client: Client, partyId: string): Promise<Coupon[]> {
  const { data, error } = await client
    .from("coupons")
    .select("*")
    .eq("party_id", partyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Coupon[];
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

export async function validateCoupon(
  client: Client,
  code: string
): Promise<{ coupon: Coupon | null; valid: boolean; reason?: string }> {
  const { data, error } = await client
    .from("coupons")
    .select("*, discount_rule:discount_rule_id(*)")
    .eq("code", code)
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
