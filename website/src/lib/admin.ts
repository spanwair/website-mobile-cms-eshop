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

  if ((profile?.role ?? 0) < ROLE.ESHOP_ADMIN) return null;

  let partyId: string | null = null;
  let permissions = FULL_PERMISSIONS;

  try {
    const { data: membership } = await client
      .from("user_party_roles")
      .select("party_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    partyId = membership?.party_id ?? null;

    if (profile!.role < ROLE.ADMIN && partyId) {
      permissions = await getUserPermissions(client, userId, partyId);
    }
  } catch { /* party tables not yet migrated */ }

  return { role: profile!.role, permissions, partyId };
}
