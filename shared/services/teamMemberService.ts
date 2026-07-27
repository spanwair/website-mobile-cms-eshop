import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { TeamMember } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchTeamMembers(client: Client, partyId: string): Promise<TeamMember[]> {
  const { data, error } = await client
    .from("team_members")
    .select("*")
    .eq("party_id", partyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMember[];
}

export async function fetchActiveTeamMembers(client: Client, partyId: string): Promise<TeamMember[]> {
  const { data, error } = await client
    .from("team_members")
    .select("*")
    .eq("party_id", partyId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as TeamMember[];
}

export async function createTeamMember(
  client: Client,
  input: Database["public"]["Tables"]["team_members"]["Insert"]
): Promise<{ data: TeamMember | null; error: Error | null }> {
  const { data, error } = await client.from("team_members").insert(input).select().single();
  return { data: error ? null : (data as TeamMember), error: error ? new Error(error.message) : null };
}

export async function updateTeamMember(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["team_members"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("team_members").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteTeamMember(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("team_members").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
