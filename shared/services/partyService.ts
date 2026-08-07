import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Party, UserPartyRole } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchParty(client: Client, partyId: string): Promise<Party | null> {
  const { data, error } = await client
    .from("parties")
    .select("*")
    .eq("id", partyId)
    .single();
  if (error || !data) return null;
  return data as Party;
}

export async function fetchParties(client: Client): Promise<Party[]> {
  const { data, error } = await client
    .from("parties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Party[];
}

export async function createParty(
  client: Client,
  input: {
    name: string;
    slug: string;
    company_name?: string;
    company_ico?: string;
    vat_number?: string;
    billing_email?: string;
    logo_url?: string;
    seller_mode?: "own_company" | "smalljobs_commission";
    status?: "active" | "pending_approval";
    terms_accepted_at?: string;
    terms_version?: string;
  }
): Promise<{ data: Party | null; error: Error | null }> {
  const { error: insertError } = await client
    .from("parties")
    .insert(input);
  if (insertError) return { data: null, error: new Error(insertError.message) };

  // Fetch back via slug after insert: avoids INSERT ... RETURNING which is blocked by RLS
  // SELECT policies until the AFTER trigger assigns the admin to user_party_roles.
  const { data, error: selectError } = await client
    .from("parties")
    .select()
    .eq("slug", input.slug)
    .single();
  return {
    data: selectError ? null : (data as Party),
    error: selectError ? new Error(selectError.message) : null,
  };
}

export async function updateParty(
  client: Client,
  partyId: string,
  updates: Partial<Pick<Party, "name" | "slug" | "company_name" | "company_ico" | "vat_number" | "billing_email" | "logo_url" | "settings" | "status">>
): Promise<{ error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await client.from("parties").update(updates as any).eq("id", partyId);
  return { error: error ? new Error(error.message) : null };
}

type MemberWithProfile = UserPartyRole & {
  profile: { display_name: string | null; email: string | null; avatar_url: string | null } | null;
};

export async function fetchPartyMembers(client: Client, partyId: string): Promise<MemberWithProfile[]> {
  const { data: memberships, error } = await client
    .from("user_party_roles")
    .select("*")
    .eq("party_id", partyId)
    .order("joined_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!memberships?.length) return [];

  const userIds = memberships.map((m) => m.user_id);
  const { data: profiles } = await client
    .from("profiles")
    .select("id, display_name, email, avatar_url")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return memberships.map((m) => ({
    ...(m as UserPartyRole),
    profile: profileMap.get(m.user_id) ?? null,
  }));
}

export async function inviteUserToParty(
  client: Client,
  userId: string,
  partyId: string,
  roleId: string,
  invitedBy: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("user_party_roles").insert({
    user_id: userId,
    party_id: partyId,
    role_id: roleId,
    invited_by: invitedBy,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function removeUserFromParty(
  client: Client,
  userId: string,
  partyId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("user_party_roles")
    .delete()
    .eq("user_id", userId)
    .eq("party_id", partyId);
  return { error: error ? new Error(error.message) : null };
}
