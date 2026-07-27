import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { StoreMedia } from "../types";

type Client = SupabaseClient<Database>;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function fetchStoreMedia(client: Client, partyId: string): Promise<StoreMedia[]> {
  const { data, error } = await client
    .from("store_media")
    .select("*")
    .eq("party_id", partyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as StoreMedia[];
}

export async function createStoreMedia(
  client: Client,
  partyId: string,
  input: { slug: string; media_type: "image" | "video"; url: string; alt: string | null }
): Promise<{ data: StoreMedia | null; error: Error | null }> {
  if (!SLUG_RE.test(input.slug)) {
    return { data: null, error: new Error("Slug may only contain lowercase letters, numbers and hyphens") };
  }
  const { data, error } = await client
    .from("store_media")
    .insert({ party_id: partyId, ...input })
    .select()
    .single();
  return {
    data: error ? null : (data as StoreMedia),
    error: error ? new Error(error.message.includes("duplicate") ? "That slug is already used" : error.message) : null,
  };
}

// Scoped by party_id so a caller can never delete another party's media by guessing its id.
export async function deleteStoreMedia(client: Client, partyId: string, mediaId: string): Promise<{ error: Error | null }> {
  const { error } = await client.from("store_media").delete().eq("id", mediaId).eq("party_id", partyId);
  return { error: error ? new Error(error.message) : null };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "media";
}

// Single upload path shared by the manual-slug settings form and the drag-and-drop media
// picker modal — storage upload + DB row insert always happen together, so this is the only
// place either caller needs to know the storage bucket name or path shape.
export async function uploadStoreMedia(
  client: Client,
  partyId: string,
  file: File,
  input: { slug?: string; alt?: string | null } = {}
): Promise<{ data: StoreMedia | null; error: Error | null }> {
  const ext = file.name.split(".").pop() ?? "bin";
  let slug = input.slug?.trim() || slugify(file.name.replace(/\.[^.]+$/, ""));
  if (!SLUG_RE.test(slug)) slug = slugify(slug);

  const path = `${partyId}/${slug}-${Date.now()}.${ext}`;
  const buf = await file.arrayBuffer();
  const { error: upErr } = await client.storage
    .from("store-media")
    .upload(path, buf, { contentType: file.type || "application/octet-stream" });
  if (upErr) return { data: null, error: new Error(upErr.message) };

  const { data: { publicUrl } } = client.storage.from("store-media").getPublicUrl(path);
  const mediaType = file.type.startsWith("video/") ? "video" : "image";
  const result = await createStoreMedia(client, partyId, { slug, media_type: mediaType, url: publicUrl, alt: input.alt ?? null });
  if (result.error?.message === "That slug is already used") {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    return createStoreMedia(client, partyId, { slug, media_type: mediaType, url: publicUrl, alt: input.alt ?? null });
  }
  return result;
}
