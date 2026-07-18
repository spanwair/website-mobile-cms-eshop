import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import type { ProductImage, ProductVariant } from "../types";

type Client = SupabaseClient<Database>;

export async function fetchProductImages(client: Client, productId: string): Promise<ProductImage[]> {
  const { data } = await client
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order");
  return (data ?? []) as ProductImage[];
}

export async function addProductImage(
  client: Client,
  input: Database["public"]["Tables"]["product_images"]["Insert"] & { media_type?: "image" | "video" }
): Promise<{ data: ProductImage | null; error: Error | null }> {
  if (input.is_primary) {
    await client.from("product_images").update({ is_primary: false }).eq("product_id", input.product_id);
  }
  const { data, error } = await client
    .from("product_images")
    .insert(input as Database["public"]["Tables"]["product_images"]["Insert"])
    .select()
    .single();
  return {
    data: error ? null : (data as ProductImage),
    error: error ? new Error(error.message) : null,
  };
}

export async function setPrimaryImage(
  client: Client,
  productId: string,
  imageId: string
): Promise<{ error: Error | null }> {
  await client.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  const { error } = await client.from("product_images").update({ is_primary: true }).eq("id", imageId);
  return { error: error ? new Error(error.message) : null };
}

export async function updateProductImage(
  client: Client,
  imageId: string,
  updates: Database["public"]["Tables"]["product_images"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client.from("product_images").update(updates).eq("id", imageId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteProductImage(
  client: Client,
  imageId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("product_images").delete().eq("id", imageId);
  return { error: error ? new Error(error.message) : null };
}

export async function reorderProductImages(
  client: Client,
  updates: Array<{ id: string; sort_order: number }>
): Promise<{ error: Error | null }> {
  for (const { id, sort_order } of updates) {
    const { error } = await client
      .from("product_images")
      .update({ sort_order })
      .eq("id", id);
    if (error) return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function addProductVariant(
  client: Client,
  input: Database["public"]["Tables"]["product_variants"]["Insert"]
): Promise<{ data: ProductVariant | null; error: Error | null }> {
  const { data, error } = await client
    .from("product_variants")
    .insert(input)
    .select()
    .single();
  return {
    data: error ? null : (data as ProductVariant),
    error: error ? new Error(error.message) : null,
  };
}

export async function updateProductVariant(
  client: Client,
  variantId: string,
  updates: Database["public"]["Tables"]["product_variants"]["Update"]
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("product_variants")
    .update(updates)
    .eq("id", variantId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteProductVariant(
  client: Client,
  variantId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("product_variants").delete().eq("id", variantId);
  return { error: error ? new Error(error.message) : null };
}
