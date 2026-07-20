import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Role } from "../types";

type Client = SupabaseClient<Database>;

export async function getUserPermissions(
  client: Client,
  userId: string,
  partyId: string
): Promise<number> {
  const { data, error } = await client.rpc("get_user_permissions", {
    p_user_id: userId,
    p_party_id: partyId,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export async function fetchRoles(client: Client): Promise<Role[]> {
  const { data, error } = await client
    .from("roles")
    .select("*")
    .is("party_id", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Role[];
}

export async function createRole(
  client: Client,
  name: string,
  permissions: number,
  description?: string
): Promise<{ data: Role | null; error: Error | null }> {
  const { data, error } = await client
    .from("roles")
    .insert({ name, permissions, description: description ?? null })
    .select()
    .single();

  return {
    data: error ? null : (data as Role),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateRole(
  client: Client,
  roleId: string,
  updates: { name?: string; permissions?: number; description?: string }
): Promise<{ error: Error | null }> {
  const { error } = await client.from("roles").update(updates).eq("id", roleId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteRole(
  client: Client,
  roleId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("roles").delete().eq("id", roleId);
  return { error: error ? new Error(error.message) : null };
}

export async function assignRole(
  client: Client,
  userId: string,
  partyId: string,
  roleId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("user_party_roles")
    .insert({ user_id: userId, party_id: partyId, role_id: roleId });
  return { error: error ? new Error(error.message) : null };
}

export async function removeRole(
  client: Client,
  userId: string,
  partyId: string,
  roleId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("user_party_roles")
    .delete()
    .eq("user_id", userId)
    .eq("party_id", partyId)
    .eq("role_id", roleId);
  return { error: error ? new Error(error.message) : null };
}
