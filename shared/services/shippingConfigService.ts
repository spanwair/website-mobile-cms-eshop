import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { ShippingProviderConfig } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchEnabledShippingConfigs(client: Client): Promise<ShippingProviderConfig[]> {
  const { data, error } = await client
    .from("shipping_provider_configs")
    .select("*")
    .eq("enabled", true)
    .order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as ShippingProviderConfig[];
}

export async function fetchAllShippingConfigs(client: Client): Promise<ShippingProviderConfig[]> {
  const { data, error } = await client.from("shipping_provider_configs").select("*").order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as ShippingProviderConfig[];
}

export async function updateShippingConfig(
  client: Client,
  code: "ppl" | "packeta",
  updates: Database["public"]["Tables"]["shipping_provider_configs"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("shipping_provider_configs").update(updates).eq("code", code);
  return { error: error ? new Error(error.message) : null };
}

export type DeliveryType = "home" | "pickup";

// base_price is the address (home) delivery price; pickup_price is the výdejní místo price.
// free_above_amount makes either delivery type free once the order subtotal reaches it.
export function computeShippingCost(
  config: ShippingProviderConfig,
  subtotal: number,
  deliveryType: DeliveryType = "home"
): number {
  if (config.free_above_amount != null && subtotal >= config.free_above_amount) return 0;
  return deliveryType === "pickup" ? config.pickup_price : config.base_price;
}
