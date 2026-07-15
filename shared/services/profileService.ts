import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { User } from "../types";

type Client = SupabaseClient<Database>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function toUser(row: ProfileRow, email: string): User {
  return {
    id: row.id,
    email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    role: row.role,
    created_at: row.created_at,
  };
}

export async function fetchProfile(
  client: Client,
  userId: string,
  email: string
): Promise<User | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return toUser(data, email);
}

export async function updateProfile(
  client: Client,
  userId: string,
  updates: { display_name?: string; avatar_url?: string }
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  return { error: error ? new Error(error.message) : null };
}

export async function fetchAllUsers(client: Client): Promise<User[]> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row: ProfileRow) => toUser(row, ""));
}
