import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { ProductOverviewStats, ProductActivityEvent } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchProductOverview(
  client: Client,
  partyId: string,
  days = 30
): Promise<ProductOverviewStats> {
  const { data, error } = await client.rpc("get_product_overview_stats", {
    p_party_id: partyId,
    p_days: days,
  });
  if (error) throw new Error(error.message);
  return data as unknown as ProductOverviewStats;
}

export async function fetchProductActivityLog(
  client: Client,
  partyId: string,
  limit = 40
): Promise<ProductActivityEvent[]> {
  const { data, error } = await client.rpc("get_product_activity_log", {
    p_party_id: partyId,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductActivityEvent[];
}
