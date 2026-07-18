import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { AuditLog, PaginatedResult } from "../types";

type Client = SupabaseClient<Database>;

export async function log(
  client: Client,
  action: string,
  tableName: string,
  recordId: string,
  partyId: string,
  oldVal?: unknown,
  newVal?: unknown
): Promise<void> {
  const { error } = await client.rpc("audit_log", {
    p_action: action,
    p_table_name: tableName,
    p_record_id: recordId,
    p_party_id: partyId,
    p_old_val: (oldVal ?? null) as import("../supabase/types").Json,
    p_new_val: (newVal ?? null) as import("../supabase/types").Json,
  });
  if (error) throw new Error(error.message);
}

export async function fetchAuditLogs(
  client: Client,
  opts: {
    party_id?: string;
    user_id?: string;
    table_name?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PaginatedResult<AuditLog>> {
  const { party_id, user_id, table_name, from, to, page = 1, pageSize = 50 } = opts;
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = client
    .from("audit_logs")
    .select("*", { count: "exact" });

  if (party_id) query = query.eq("party_id", party_id);
  if (user_id) query = query.eq("user_id", user_id);
  if (table_name) query = query.eq("table_name", table_name);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as AuditLog[], total: count ?? 0, page, pageSize };
}
