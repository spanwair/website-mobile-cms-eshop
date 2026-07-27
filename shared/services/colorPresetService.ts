import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { PartyColorPreset } from "../types";

type Client = SupabaseClient<Database>;

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const COLOR_FIELDS = [
  "color_primary", "color_secondary", "color_background", "color_surface",
  "color_text_primary", "color_text_secondary", "color_border",
] as const;

export type ColorPresetColors = Pick<PartyColorPreset, typeof COLOR_FIELDS[number]>;

export async function fetchColorPresets(client: Client, partyId: string): Promise<PartyColorPreset[]> {
  const { data, error } = await client
    .from("party_color_presets")
    .select("*")
    .eq("party_id", partyId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PartyColorPreset[];
}

// Same hex validation as updateStoreConfig (shared/services/storeConfigService.ts) — these
// values feed the same unescaped <style set:html> theme block, so a bad value here is stored
// XSS just like a bad value on the config row itself.
export async function createColorPreset(
  client: Client,
  partyId: string,
  userId: string,
  name: string,
  colors: ColorPresetColors
): Promise<{ data: PartyColorPreset | null; error: Error | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: new Error("Template name is required") };
  for (const field of COLOR_FIELDS) {
    if (!HEX_COLOR_RE.test(colors[field])) {
      return { data: null, error: new Error(`${field} must be a hex color (e.g. #4F46E5)`) };
    }
  }
  const { data, error } = await client
    .from("party_color_presets")
    .insert({ party_id: partyId, name: trimmed, created_by: userId, ...colors })
    .select()
    .single();
  return {
    data: error ? null : (data as PartyColorPreset),
    error: error ? new Error(error.message.includes("duplicate") ? "A template with that name already exists" : error.message) : null,
  };
}

export async function deleteColorPreset(client: Client, partyId: string, presetId: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("party_color_presets").delete().eq("id", presetId).eq("party_id", partyId);
  return { error: error ? new Error(error.message) : null };
}
