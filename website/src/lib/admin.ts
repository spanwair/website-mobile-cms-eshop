import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import { ROLE } from "@shared/constants/permissions";
import { getUserPermissions } from "@shared/services/permissionsService";

type Client = SupabaseClient<Database>;

export const FULL_PERMISSIONS = 0xffff;

export interface AdminCtx {
  role: number;
  permissions: number;
  partyId: string | null;
}

export async function requireAdminCtx(client: Client, userId: string): Promise<AdminCtx | null> {
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const systemRole = (profile?.role ?? 0) as number;
  let partyId: string | null = null;
  let permissions = 0;

  try {
    const { data: membership } = await client
      .from("user_party_roles")
      .select("party_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    partyId = membership?.party_id ?? null;

    // Admins/Owners without explicit party membership fall back to the first active party.
    if (!partyId && systemRole >= ROLE.ADMIN) {
      const { data: firstParty } = await client
        .from("parties")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      partyId = firstParty?.id ?? null;
    }

    if (systemRole >= ROLE.ADMIN) {
      permissions = FULL_PERMISSIONS;
    } else if (partyId) {
      permissions = await getUserPermissions(client, userId, partyId);
    }
  } catch { /* party tables not yet migrated */ }

  // Allow entry: high system role OR explicit party membership (invited users).
  // A regular user with no party membership has no reason to be in admin.
  if (systemRole < ROLE.ESHOP_ADMIN && !partyId) return null;

  return { role: systemRole, permissions, partyId };
}
