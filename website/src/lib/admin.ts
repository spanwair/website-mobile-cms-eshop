import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import { ROLE, ALL_PERMISSIONS } from "@shared/constants/permissions";
import { getUserPermissions } from "@shared/services/permissionsService";

type Client = SupabaseClient<Database>;

export interface PartyRef {
  id: string;
  name: string;
}

export interface AdminCtx {
  role: number;
  permissions: number;    // effective permission bits for the current party
  partyId: string | null; // currently selected organization
  parties: PartyRef[];    // all accessible organizations
  isOwner: boolean;       // true for ROLE.OWNER — global access, no party required
  isGlobal: boolean;      // true for ROLE.OWNER only — no party restriction
}

// Returns null when the user has no admin access at all (pure customers).
// For eshop_admin with no party assigned, still returns ctx so /admin/setup can render.
// Every admin page must call this and redirect to /dashboard on null.
// Pages requiring a party (products, orders, etc.) must additionally check ctx.partyId.
export async function requireAdminCtx(
  client: Client,
  userId: string,
  activePartyId?: string | null
): Promise<AdminCtx | null> {
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = (profile?.role ?? 0) as number;
  if (role < ROLE.ESHOP_ADMIN) return null;

  const isOwner = role >= ROLE.OWNER;
  // isGlobal = no party restriction (owner only). Admin has full perms per party but still needs one.
  const isGlobal = role >= ROLE.OWNER;
  const isAdmin  = role >= ROLE.ADMIN;

  const { data: partyRows, error: partyErr } = await client
    .from("parties")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (partyErr && partyErr.code !== "PGRST116" && !partyErr.message.includes("does not exist")) {
    console.error("[requireAdminCtx] parties query failed:", partyErr.message);
  }

  const parties = (partyRows ?? []) as PartyRef[];
  const partyIds = parties.map((p) => p.id);

  const partyId =
    activePartyId && partyIds.includes(activePartyId)
      ? activePartyId
      : partyIds[0] ?? null;

  const permissions = (isOwner || isAdmin)
    ? ALL_PERMISSIONS
    : partyId
      ? await getUserPermissions(client, userId, partyId)
      : 0;

  return { role, permissions, partyId, parties, isOwner, isGlobal };
}
