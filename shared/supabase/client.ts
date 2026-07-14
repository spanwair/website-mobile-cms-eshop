import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(
  storage?: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> }
): SupabaseClient<Database> {
  if (_client) return _client;

  const url = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_SUPABASE_URL)
    ?? (typeof import.meta !== "undefined" && (import.meta as any).env?.PUBLIC_SUPABASE_URL)
    ?? "";

  const anonKey = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY)
    ?? (typeof import.meta !== "undefined" && (import.meta as any).env?.PUBLIC_SUPABASE_ANON_KEY)
    ?? "";

  _client = createClient<Database>(url, anonKey, {
    auth: {
      storage: storage ?? undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return _client;
}
