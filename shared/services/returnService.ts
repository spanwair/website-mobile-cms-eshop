import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

type Client = SupabaseClient<Database>;

export type ReturnRequest = {
  id: string;
  party_id: string;
  order_id: string;
  customer_id: string;
  return_number: string;
  status: string;
  reason: string;
  resolution: string | null;
  notes: string | null;
  customer_notes: string | null;
  refund_amount: number | null;
  refund_method: string | null;
  received_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export async function fetchReturns(
  client: Client,
  partyId: string,
  opts: { status?: string; page?: number; pageSize?: number } = {}
): Promise<{ data: ReturnRequest[]; total: number }> {
  const { status, page = 1, pageSize = 20 } = opts;
  const from = (page - 1) * pageSize;

  let q = client
    .from("return_requests")
    .select(
      "*, customer:customers(first_name,last_name,email), order:orders(order_number)",
      { count: "exact" }
    )
    .eq("party_id", partyId);

  if (status) q = q.eq("status", status);

  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as unknown as ReturnRequest[], total: count ?? 0 };
}

export async function fetchReturn(
  client: Client,
  returnId: string
): Promise<ReturnRequest & { items: unknown[] } | null> {
  const { data, error } = await client
    .from("return_requests")
    .select("*, return_items(*, order_item:order_items(title, sku, quantity, unit_price))")
    .eq("id", returnId)
    .single();

  if (error || !data) return null;
  const raw = data as Record<string, unknown>;
  return {
    ...(raw as unknown as ReturnRequest),
    items: (raw.return_items as unknown[]) ?? [],
  };
}

export async function createReturn(
  client: Client,
  input: {
    party_id: string;
    order_id: string;
    customer_id: string;
    reason: string;
    customer_notes?: string;
    items: { order_item_id: string; quantity: number }[];
  }
): Promise<{ data: ReturnRequest | null; error: Error | null }> {
  const { items, ...returnData } = input;

  const { data: rma, error: rmaError } = await client
    .from("return_requests")
    .insert({ ...returnData, return_number: "" })
    .select()
    .single();

  if (rmaError || !rma) return { data: null, error: new Error(rmaError?.message ?? "Failed") };

  if (items.length > 0) {
    const { error: itemsError } = await client.from("return_items").insert(
      items.map((i) => ({ return_request_id: rma.id, ...i }))
    );
    if (itemsError) return { data: null, error: new Error(itemsError.message) };
  }

  return { data: rma as ReturnRequest, error: null };
}

export async function updateReturnStatus(
  client: Client,
  returnId: string,
  updates: {
    status?: string;
    resolution?: string;
    refund_amount?: number;
    refund_method?: string;
    notes?: string;
    received_at?: string;
    completed_at?: string;
  }
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("return_requests")
    .update(updates)
    .eq("id", returnId);
  return { error: error ? new Error(error.message) : null };
}
