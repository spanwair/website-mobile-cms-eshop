import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { HeroSlide } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchHeroSlides(client: Client, partyId: string): Promise<HeroSlide[]> {
  const { data, error } = await client
    .from("hero_slides")
    .select("*")
    .eq("party_id", partyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as HeroSlide[];
}

export async function fetchVisibleHeroSlides(client: Client, partyId: string): Promise<HeroSlide[]> {
  const { data, error } = await client
    .from("hero_slides")
    .select("*")
    .eq("party_id", partyId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as HeroSlide[];
}

export async function createHeroSlide(
  client: Client,
  input: Database["public"]["Tables"]["hero_slides"]["Insert"]
): Promise<{ data: HeroSlide | null; error: Error | null }> {
  const { data, error } = await client.from("hero_slides").insert(input).select().single();
  return { data: error ? null : (data as HeroSlide), error: error ? new Error(error.message) : null };
}

export async function updateHeroSlide(
  client: Client,
  id: string,
  updates: Database["public"]["Tables"]["hero_slides"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("hero_slides").update(updates).eq("id", id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteHeroSlide(client: Client, id: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("hero_slides").delete().eq("id", id);
  return { error: error ? new Error(error.message) : null };
}
