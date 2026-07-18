import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { Notification, NotificationWithMeta } from "../types";

type Client = SupabaseClient<Database>;

export async function createNotification(
  client: Client,
  input: Database["public"]["Tables"]["notifications"]["Insert"],
  userIds: string[]
): Promise<{ data: Notification | null; error: Error | null }> {
  const { data, error } = await client
    .from("notifications")
    .insert(input)
    .select()
    .single();

  if (error || !data) return { data: null, error: error ? new Error(error.message) : null };

  const notification = data as Notification;

  if (userIds.length > 0) {
    const fanout = userIds.map((user_id) => ({
      user_id,
      notification_id: notification.id,
    }));
    const { error: fanoutErr } = await client.from("user_notifications").insert(fanout);
    if (fanoutErr) return { data: null, error: new Error(fanoutErr.message) };
  }

  return { data: notification, error: null };
}

export async function fetchUserNotifications(
  client: Client,
  userId: string
): Promise<NotificationWithMeta[]> {
  const { data, error } = await client
    .from("user_notifications")
    .select("read_at, notifications(*)")
    .eq("user_id", userId)
    .order("read_at", { ascending: true, nullsFirst: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<{
    read_at: string | null;
    notifications: Notification | null;
  }>)
    .filter((row) => row.notifications !== null)
    .map((row) => ({
      ...(row.notifications as Notification),
      read_at: row.read_at,
    }));
}

export async function markAsRead(
  client: Client,
  userId: string,
  notificationId: string
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
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  return { error: error ? new Error(error.message) : null };
}

export async function getUnreadCount(client: Client, userId: string): Promise<number> {
  const { count, error } = await client
    .from("user_notifications")
    .select("notification_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
