import type { SupabaseClient } from "@supabase/supabase-js";

export interface MonthlyPoint {
  month: string; // ISO date of month start
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string | null;
  title: string;
  units: number;
  revenue: number;
}

export async function fetchMonthlySeries(
  client: SupabaseClient,
  partyId: string,
  months = 12
): Promise<MonthlyPoint[]> {
  const { data, error } = await client.rpc("report_monthly_series", { p_party_id: partyId, p_months: months });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { month: string; revenue: number | string; orders: number | string }) => ({
    month: r.month,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
}

export interface CustomerStats {
  total: number;
  registered: number;
  guests: number;
  monthly: { month: string; count: number }[];
}

export async function fetchCustomerStats(
  client: SupabaseClient,
  partyId: string,
  months = 12
): Promise<CustomerStats> {
  const { data, error } = await client.rpc("report_customer_stats", { p_party_id: partyId, p_months: months });
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as { total?: number; registered?: number; guests?: number; monthly?: { month: string; count: number }[] };
  return {
    total: Number(d.total ?? 0),
    registered: Number(d.registered ?? 0),
    guests: Number(d.guests ?? 0),
    monthly: (d.monthly ?? []).map((m) => ({ month: m.month, count: Number(m.count) })),
  };
}

export async function fetchTopProducts(
  client: SupabaseClient,
  partyId: string,
  months = 12,
  limit = 5
): Promise<TopProduct[]> {
  const { data, error } = await client.rpc("report_top_products", {
    p_party_id: partyId,
    p_months: months,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { product_id: string | null; title: string; units: number | string; revenue: number | string }) => ({
    productId: r.product_id,
    title: r.title,
    units: Number(r.units),
    revenue: Number(r.revenue),
  }));
}
