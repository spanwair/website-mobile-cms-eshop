import type { SupabaseClient } from "@supabase/supabase-js";

import { ROLE } from "../constants/permissions";
import type { Database } from "../supabase/types";
import type {
  Notification,
  NotificationType,
  NotificationWithMeta,
} from "../types";

type Client = SupabaseClient<Database>;

// Deliberately NOT Database["public"]["Tables"]["notifications"]["Insert"] -- that generated
// type is pinned to whatever notification_type values existed the last time
// `supabase gen types` ran, so a freshly added enum value (e.g. 'fee_tier_change', added by a
// migration this branch could not push to the shared dev DB -- see
// _project_specs/session/reviews/5-auto-fee-tier.md) would fail to typecheck here even though
// it is valid at runtime. createNotification has no other caller yet, so widening this is safe.
export interface NewNotificationInput {
  party_id: string | null;
  type: NotificationType;
  title?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createNotification(
  client: Client,
  input: NewNotificationInput,
  userIds: string[],
): Promise<{ data: Notification | null; error: Error | null }> {
  const { data, error } = await client
    .from("notifications")
    .insert(input as Database["public"]["Tables"]["notifications"]["Insert"])
    .select()
    .single();

  if (error || !data)
    return { data: null, error: error ? new Error(error.message) : null };

  const notification = data as Notification;

  if (userIds.length > 0) {
    const fanout = userIds.map((user_id) => ({
      user_id,
      notification_id: notification.id,
    }));
    const { error: fanoutErr } = await client
      .from("user_notifications")
      .insert(fanout);
    if (fanoutErr) return { data: null, error: new Error(fanoutErr.message) };
  }

  return { data: notification, error: null };
}

export async function fetchUserNotifications(
  client: Client,
  userId: string,
): Promise<NotificationWithMeta[]> {
  const { data, error } = await client
    .from("user_notifications")
    .select("read_at, notifications(*)")
    .eq("user_id", userId)
    .order("read_at", { ascending: true, nullsFirst: true });

  if (error) throw new Error(error.message);

  return (
    (data ?? []) as {
      read_at: string | null;
      notifications: Notification | null;
    }[]
  )
    .filter((row) => row.notifications !== null)
    .map((row) => ({
      ...(row.notifications as Notification),
      read_at: row.read_at,
    }));
}

export async function markAsRead(
  client: Client,
  userId: string,
  notificationId: string,
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("notification_id", notificationId)
    .is("read_at", null);
  return { error: error ? new Error(error.message) : null };
}

export async function markAllAsRead(
  client: Client,
  userId: string,
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  return { error: error ? new Error(error.message) : null };
}

export async function getUnreadCount(
  client: Client,
  userId: string,
): Promise<number> {
  const { count, error } = await client
    .from("user_notifications")
    .select("notification_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// Same fan-out target as the notify_low_stock() DB trigger (supabase/migrations/
// 20260103000020_notify_low_stock.sql): every global owner, plus every member of this specific
// party with at least eshop_admin. That trigger runs inside Postgres and can express it as one
// UNION query; this one is called from a service-role (cron) context in application code, where
// RLS is already bypassed, so it is just two plain selects instead of a second SQL function.
// user_party_roles has no direct FK to profiles (both reference auth.users separately), so
// PostgREST can't embed profiles(role) in one request -- hence the two-step lookup.
export async function resolvePartyNotificationRecipients(
  client: Client,
  partyId: string,
): Promise<string[]> {
  const [
    { data: owners, error: ownersErr },
    { data: memberRows, error: memberErr },
  ] = await Promise.all([
    client.from("profiles").select("id").eq("role", ROLE.OWNER),
    client.from("user_party_roles").select("user_id").eq("party_id", partyId),
  ]);
  if (ownersErr) throw new Error(ownersErr.message);
  if (memberErr) throw new Error(memberErr.message);

  const ids = new Set<string>((owners ?? []).map((o) => o.id));
  const memberIds = [...new Set((memberRows ?? []).map((m) => m.user_id))];
  if (memberIds.length > 0) {
    const { data: memberProfiles, error: profilesErr } = await client
      .from("profiles")
      .select("id, role")
      .in("id", memberIds)
      .gte("role", ROLE.ESHOP_ADMIN);
    if (profilesErr) throw new Error(profilesErr.message);
    for (const p of memberProfiles ?? []) ids.add(p.id);
  }
  return [...ids];
}
