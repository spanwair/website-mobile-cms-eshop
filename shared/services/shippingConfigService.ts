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

export function computeShippingCost(config: ShippingProviderConfig, subtotal: number): number {
  if (config.free_above_amount != null && subtotal >= config.free_above_amount) return 0;
  return config.base_price;
}
