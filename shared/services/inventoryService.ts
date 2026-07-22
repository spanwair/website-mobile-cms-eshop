import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { InventoryItem, Warehouse, StockMovement, PaginatedResult, StockMovementType } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchInventory(
  client: Client,
  partyId: string,
  opts: { page?: number; pageSize?: number; lowStockOnly?: boolean } = {}
): Promise<PaginatedResult<InventoryItem>> {
  const { page = 1, pageSize = 20, lowStockOnly } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("inventory_items")
    .select("*", { count: "exact" })
    .eq("party_id", partyId);

  if (lowStockOnly) {
    query = query.eq("is_low_stock", true);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const items = ((data ?? []) as Database["public"]["Tables"]["inventory_items"]["Row"][]).map(
    (row) => ({
      ...row,
      qty_available: row.qty_on_hand - row.qty_reserved,
    }) as InventoryItem
  );

  return { data: items, total: count ?? 0, page, pageSize };
}

export async function fetchWarehouses(client: Client, partyId: string): Promise<Warehouse[]> {
  const { data, error } = await client
    .from("warehouses")
    .select("*")
    .eq("party_id", partyId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Warehouse[];
}

export async function fetchWarehouse(
  client: Client,
  warehouseId: string
): Promise<Warehouse | null> {
  const { data, error } = await client
    .from("warehouses")
    .select("*")
    .eq("id", warehouseId)
    .single();
  if (error || !data) return null;
  return data as Warehouse;
}

export async function createWarehouse(
  client: Client,
  input: Database["public"]["Tables"]["warehouses"]["Insert"]
): Promise<{ data: Warehouse | null; error: Error | null }> {
  const { data, error } = await client.from("warehouses").insert(input).select().single();
  return {
    data: error ? null : (data as Warehouse),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateWarehouse(
  client: Client,
  warehouseId: string,
  updates: Database["public"]["Tables"]["warehouses"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("warehouses").update(updates).eq("id", warehouseId);
  return { error: error ? new Error(error.message) : null };
}

export async function updateThresholds(
  client: Client,
  updates: Array<{ id: string; low_stock_threshold?: number | null; max_threshold?: number | null }>
): Promise<{ data: InventoryItem[] | null; error: Error | null }> {
  const results = await Promise.all(
    updates.map(async ({ id, low_stock_threshold, max_threshold }) => {
      const updateData: any = {};

      if (low_stock_threshold !== undefined) {
        if (low_stock_threshold !== null && low_stock_threshold < 0) {
          return { error: new Error(`Low stock threshold cannot be negative: ${low_stock_threshold}`), data: null };
        }
        updateData.low_stock_threshold = low_stock_threshold;
      }

      if (max_threshold !== undefined) {
        if (max_threshold !== null && max_threshold < 0) {
          return { error: new Error(`Max threshold cannot be negative: ${max_threshold}`), data: null };
        }
        updateData.max_threshold = max_threshold;
      }

      if (Object.keys(updateData).length === 0) {
        return { data: null, error: null };
      }

      const { data, error } = await client
        .from("inventory_items")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) {
        return { error: new Error(error.message), data: null };
      }

      if (data && data.length > 0) {
        const row = data[0] as Database["public"]["Tables"]["inventory_items"]["Row"];
        return { data: { ...row, qty_available: row.qty_on_hand - row.qty_reserved }, error: null };
      }

      return { data: null, error: null };
    })
  );

  const updatedItems: InventoryItem[] = [];
  const errors: Error[] = [];

  for (const result of results) {
    if (!result) continue;

    if (result.error) {
      errors.push(result.error);
      continue;
    }

    if (result.data) {
      updatedItems.push(result.data);
    }
  }

  if (errors.length > 0) {
    const errorMessages = errors.map(e => e.message).join(', ');
    return { data: null, error: new Error(errorMessages) };
  }

  return { data: updatedItems.length > 0 ? updatedItems : null, error: null };
}

export async function fetchInventoryByProduct(
  client: Client,
  productId: string
): Promise<InventoryItem | null> {
  const { data } = await client
    .from("inventory_items")
    .select("*")
    .eq("product_id", productId)
    .is("variant_id", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as Database["public"]["Tables"]["inventory_items"]["Row"];
  return { ...row, qty_available: row.qty_on_hand - row.qty_reserved } as InventoryItem;
}

export async function updateStock(
  client: Client,
  input: {
    inventory_item_id: string;
    party_id: string;
    quantity: number;
    type: StockMovementType;
    note?: string | null;
    created_by: string;
  }
): Promise<{ error: Error | null }> {
  const { error } = await client.from("stock_movements").insert({
    inventory_item_id: input.inventory_item_id,
    party_id: input.party_id,
    quantity: input.quantity,
    type: input.type,
    note: input.note ?? null,
    created_by: input.created_by,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function fetchStockMovements(
  client: Client,
  opts: {
    inventory_item_id?: string;
    party_id?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<PaginatedResult<StockMovement>> {
  const { inventory_item_id, party_id, page = 1, pageSize = 20 } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("stock_movements")
    .select("*", { count: "exact" });

  if (inventory_item_id) query = query.eq("inventory_item_id", inventory_item_id);
  if (party_id) query = query.eq("party_id", party_id);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as StockMovement[], total: count ?? 0, page, pageSize };
}
