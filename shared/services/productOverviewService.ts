import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { ProductOverviewStats, ProductActivityEvent, TopProduct, PaginatedResult } from "../types";

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

export interface ActivityLogOptions {
  limit?: number;
  from?: string | null;
  offset?: number;
}

export async function fetchProductActivityLog(
  client: Client,
  partyId: string,
  opts: ActivityLogOptions = {}
): Promise<PaginatedResult<ProductActivityEvent>> {
  const { limit = 40, from = null, offset = 0 } = opts;
  const { data, error } = await client.rpc("get_product_activity_log", {
    p_party_id: partyId,
    p_limit: limit,
    p_from: from ?? undefined,
    p_offset: offset,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as (ProductActivityEvent & { total_count: number })[];
  return {
    data: rows as ProductActivityEvent[],
    total: rows[0]?.total_count ?? 0,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
  };
}

export interface TopProductsOptions {
  limit?: number;
  from?: string | null;
  offset?: number;
}

export async function fetchTopProductsPaged(
  client: Client,
  partyId: string,
  opts: TopProductsOptions = {}
): Promise<PaginatedResult<TopProduct>> {
  const { limit = 10, from = null, offset = 0 } = opts;
  const { data, error } = await client.rpc("get_top_products_paged", {
    p_party_id: partyId,
    p_from: from ?? undefined,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as (TopProduct & { total_count: number })[];
  return {
    data: rows.map(({ total_count: _t, ...p }) => p),
    total: rows[0]?.total_count ?? 0,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
  };
}
