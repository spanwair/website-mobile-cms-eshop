import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { User, UserWithRoles } from "../types";
import { getUserPermissions, fetchRoles } from "./permissionsService";
import { ROLE } from "../constants/permissions";

type Client = SupabaseClient<Database>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function toUser(row: ProfileRow, email: string): User {
  return {
    id: row.id,
    email: row.email ?? email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    role: row.role,
    admin_assigned_by: row.admin_assigned_by ?? null,
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
  updates: { display_name?: string; avatar_url?: string; full_name?: string; phone?: string }
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  return { error: error ? new Error(error.message) : null };
}

export async function findUserByEmail(client: Client, email: string): Promise<User | null> {
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (!data) return null;
  return toUser(data, email);
}

export async function fetchAllUsers(client: Client): Promise<User[]> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row: ProfileRow) => toUser(row, ""));
}

export async function fetchUsersForAdmin(
  client: Client,
  viewerRole: number,
  partyId: string | null
): Promise<User[]> {
  if (viewerRole >= ROLE.OWNER) {
    const { data } = await client.from("profiles").select("*").order("created_at", { ascending: false });
    return (data ?? []).map((row: ProfileRow) => toUser(row, ""));
  }

  if (!partyId) return [];

  const { data: partyMembers } = await client
    .from("user_party_roles")
    .select("user_id")
    .eq("party_id", partyId);
  const memberIds = (partyMembers ?? []).map((m) => m.user_id);
  if (memberIds.length === 0) return [];

  let query = client.from("profiles").select("*").in("id", memberIds);

  if (viewerRole >= ROLE.ADMIN) {
    query = query.lt("role", ROLE.OWNER);
  } else {
    query = query.lte("role", ROLE.ESHOP_ADMIN);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []).map((row: ProfileRow) => toUser(row, ""));
}

export async function fetchProfileWithRoles(
  client: Client,
  userId: string,
  email: string,
  partyId: string
): Promise<UserWithRoles | null> {
  const profile = await fetchProfile(client, userId, email);
  if (!profile) return null;

  const [permissions, roles] = await Promise.all([
    getUserPermissions(client, userId, partyId),
    fetchRoles(client, partyId),
  ]);

  const { data: memberRows } = await client
    .from("user_party_roles")
    .select("role_id")
    .eq("user_id", userId)
    .eq("party_id", partyId);

  const userRoleIds = new Set((memberRows ?? []).map((r) => r.role_id));
  const userRoles = roles.filter((r) => userRoleIds.has(r.id));

  return {
    ...profile,
    party_id: partyId,
    permissions,
    roles: userRoles,
  };
}

export async function updateLastLogin(
  client: Client,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);
  return { error: error ? new Error(error.message) : null };
}
