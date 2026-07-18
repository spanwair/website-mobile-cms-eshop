import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Order, OrderWithDetails, OrderItem, PaginatedResult } from "../types";

type Client = SupabaseClient<Database>;
type OrderStatus = Order["status"];

export async function fetchOrders(
  client: Client,
  partyId: string,
  opts: {
    page?: number;
    pageSize?: number;
    status?: OrderStatus;
    payment_status?: Order["payment_status"];
    customer_id?: string;
    from?: string;
    to?: string;
  } = {}
): Promise<PaginatedResult<Order>> {
  const { page = 1, pageSize = 20, status, payment_status, customer_id, from, to } = opts;
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = client
    .from("orders")
    .select("*", { count: "exact" })
    .eq("party_id", partyId);

  if (status) query = query.eq("status", status);
  if (payment_status) query = query.eq("payment_status", payment_status);
  if (customer_id) query = query.eq("customer_id", customer_id);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as Order[], total: count ?? 0, page, pageSize };
}

export async function fetchOrder(
  client: Client,
  orderId: string
): Promise<OrderWithDetails | null> {
  const { data, error } = await client
    .from("orders")
    .select(`
      *,
      customer:customer_id(*),
      items:order_items(*),
      shipping_address:shipping_address_id(*)
    `)
    .eq("id", orderId)
    .single();
  if (error || !data) return null;
  const raw = data as Record<string, unknown>;
  return {
    ...(raw as unknown as Order),
    customer: raw.customer as OrderWithDetails["customer"],
    items: (raw.items as OrderItem[]) ?? [],
    shipping_address: (raw.shipping_address as OrderWithDetails["shipping_address"]) ?? null,
  };
}

export async function createOrder(
  client: Client,
  input: Database["public"]["Tables"]["orders"]["Insert"]
): Promise<{ data: Order | null; error: Error | null }> {
  const { data, error } = await client.from("orders").insert(input).select().single();
  return {
    data: error ? null : (data as Order),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateOrderStatus(
  client: Client,
  orderId: string,
  toStatus: OrderStatus,
  changedBy: string,
  note?: string
): Promise<{ error: Error | null }> {
  const { data: current, error: fetchErr } = await client
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();
  if (fetchErr) return { error: new Error(fetchErr.message) };

  const { error: updateErr } = await client
    .from("orders")
    .update({ status: toStatus })
    .eq("id", orderId);
  if (updateErr) return { error: new Error(updateErr.message) };

  const { error: histErr } = await client.from("order_status_history").insert({
    order_id: orderId,
    from_status: current?.status ?? null,
    to_status: toStatus,
    changed_by: changedBy,
    note: note ?? null,
  });
  return { error: histErr ? new Error(histErr.message) : null };
}

export async function updateOrder(
  client: Client,
  orderId: string,
  updates: Database["public"]["Tables"]["orders"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("orders").update(updates).eq("id", orderId);
  return { error: error ? new Error(error.message) : null };
}

export async function addOrderItem(
  client: Client,
  input: Database["public"]["Tables"]["order_items"]["Insert"]
): Promise<{ data: OrderItem | null; error: Error | null }> {
  const { data, error } = await client.from("order_items").insert(input).select().single();
  return {
    data: error ? null : (data as OrderItem),
    error: error ? new Error(error.message) : null,
  };
}

export async function removeOrderItem(
  client: Client,
  itemId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("order_items").delete().eq("id", itemId);
  return { error: error ? new Error(error.message) : null };
}
