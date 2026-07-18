import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Customer, Address, PaginatedResult } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchCustomers(
  client: Client,
  partyId: string,
  opts: { page?: number; pageSize?: number; search?: string } = {}
): Promise<PaginatedResult<Customer>> {
  const { page = 1, pageSize = 20, search } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("customers")
    .select("*", { count: "exact" })
    .eq("party_id", partyId);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as Customer[], total: count ?? 0, page, pageSize };
}

export async function fetchCustomer(
  client: Client,
  customerId: string
): Promise<(Customer & { addresses: Address[]; order_count: number }) | null> {
  const { data, error } = await client
    .from("customers")
    .select("*, addresses(*)")
    .eq("id", customerId)
    .single();
  if (error || !data) return null;

  const { count } = await client
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId);

  const raw = data as Record<string, unknown>;
  return {
    ...(raw as unknown as Customer),
    addresses: (raw.addresses as Address[]) ?? [],
    order_count: count ?? 0,
  };
}

export async function createCustomer(
  client: Client,
  input: Database["public"]["Tables"]["customers"]["Insert"]
): Promise<{ data: Customer | null; error: Error | null }> {
  const { data, error } = await client.from("customers").insert(input).select().single();
  return {
    data: error ? null : (data as Customer),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateCustomer(
  client: Client,
  customerId: string,
  updates: Database["public"]["Tables"]["customers"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("customers").update(updates).eq("id", customerId);
  return { error: error ? new Error(error.message) : null };
}

export async function addAddress(
  client: Client,
  input: Database["public"]["Tables"]["addresses"]["Insert"]
): Promise<{ data: Address | null; error: Error | null }> {
  const { data, error } = await client.from("addresses").insert(input).select().single();
  return {
    data: error ? null : (data as Address),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateAddress(
  client: Client,
  addressId: string,
  updates: Database["public"]["Tables"]["addresses"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("addresses").update(updates).eq("id", addressId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteAddress(
  client: Client,
  addressId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("addresses").delete().eq("id", addressId);
  return { error: error ? new Error(error.message) : null };
}
