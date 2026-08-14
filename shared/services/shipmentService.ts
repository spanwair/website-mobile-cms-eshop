import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { OrderShipment } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchShipmentByOrderId(client: Client, orderId: string): Promise<OrderShipment | null> {
  const { data, error } = await client.from("order_shipments").select("*").eq("order_id", orderId).maybeSingle();
  if (error || !data) return null;
  return data as OrderShipment;
}

export async function createShipmentRecord(
  client: Client,
  input: Database["public"]["Tables"]["order_shipments"]["Insert"]
): Promise<{ data: OrderShipment | null; error: Error | null }> {
  const { data, error } = await client.from("order_shipments").insert(input).select().single();
  return {
    data: error ? null : (data as OrderShipment),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateShipmentRecord(
  client: Client,
  orderId: string,
  updates: Database["public"]["Tables"]["order_shipments"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("order_shipments").update(updates).eq("order_id", orderId);
  return { error: error ? new Error(error.message) : null };
}
