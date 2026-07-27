import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

type Client = SupabaseClient<Database>;

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export async function subscribeToNewsletter(
  client: Client,
  partyId: string,
  email: string
): Promise<{ error: Error | null }> {
  const { error } = await client.rpc("subscribe_to_newsletter", { p_party_id: partyId, p_email: email });
  return { error: error ? new Error(error.message) : null };
}

export async function countNewsletterSubscribers(client: Client, partyId: string): Promise<number> {
  const { count } = await client
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })
    .eq("party_id", partyId)
    .is("unsubscribed_at", null);
  return count ?? 0;
}

export async function fetchNewsletterSubscribers(client: Client, partyId: string): Promise<NewsletterSubscriber[]> {
  const { data, error } = await client
    .from("newsletter_subscribers")
    .select("id, email, subscribed_at, unsubscribed_at")
    .eq("party_id", partyId)
    .order("subscribed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setNewsletterSubscriberStatus(
  client: Client,
  subscriberId: string,
  unsubscribed: boolean
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: unsubscribed ? new Date().toISOString() : null })
    .eq("id", subscriberId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteNewsletterSubscriber(client: Client, subscriberId: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("newsletter_subscribers").delete().eq("id", subscriberId);
  return { error: error ? new Error(error.message) : null };
}
