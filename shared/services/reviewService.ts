import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

type Client = SupabaseClient<Database>;

export type Review = {
  id: string;
  product_id: string;
  customer_id: string | null;
  order_id: string | null;
  author_name: string;
  author_email: string;
  rating: number;
  pros: string[];
  cons: string[];
  body: string | null;
  status: string;
  is_verified: boolean;
  helpful_count: number;
  image_urls: string[];
  created_at: string;
};

export async function fetchReviews(
  client: Client,
  partyId: string,
  opts: { productId?: string; status?: string; page?: number; pageSize?: number } = {}
): Promise<{ data: Review[]; total: number }> {
  const { productId, status, page = 1, pageSize = 20 } = opts;
  const from = (page - 1) * pageSize;

  let q = client
    .from("product_reviews")
    .select("*", { count: "exact" })
    .eq("party_id", partyId);

  if (productId) q = q.eq("product_id", productId);
  if (status) q = q.eq("status", status);

  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as Review[], total: count ?? 0 };
}

export async function fetchProductReviews(
  client: Client,
  productId: string,
  opts: { page?: number; pageSize?: number } = {}
): Promise<{ data: Review[]; total: number; averageRating: number }> {
  const { page = 1, pageSize = 10 } = opts;
  const from = (page - 1) * pageSize;

  const { data, error, count } = await client
    .from("product_reviews")
    .select("*", { count: "exact" })
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);
  const reviews = (data ?? []) as Review[];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return { data: reviews, total: count ?? 0, averageRating };
}

export async function submitReview(
  client: Client,
  input: {
    party_id: string;
    product_id: string;
    customer_id?: string | null;
    author_name: string;
    author_email: string;
    rating: number;
    pros?: string[];
    cons?: string[];
    body?: string;
    is_verified?: boolean;
  }
): Promise<{ error: Error | null }> {
  const { error } = await client.from("product_reviews").insert({
    ...input,
    pros: input.pros ?? [],
    cons: input.cons ?? [],
    status: "pending",
    is_verified: input.is_verified ?? false,
  });
  return { error: error ? new Error(error.message) : null };
}

// Resolves the reviewer's customer_id (per party) and whether they've purchased
// this product, so is_verified reflects a real order instead of always being false.
export async function resolveReviewIdentity(
  client: Client,
  partyId: string,
  productId: string,
  userId: string
): Promise<{ customer_id: string | null; is_verified: boolean }> {
  const { data: customer } = await client
    .from("customers")
    .select("id")
    .eq("party_id", partyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!customer) return { customer_id: null, is_verified: false };

  const { data: purchase } = await client
    .from("order_items")
    .select("id, orders!inner(customer_id)")
    .eq("product_id", productId)
    .eq("orders.customer_id", customer.id)
    .limit(1)
    .maybeSingle();

  return { customer_id: customer.id, is_verified: !!purchase };
}

export async function updateReviewStatus(
  client: Client,
  reviewId: string,
  status: "approved" | "rejected" | "hidden"
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from("product_reviews")
    .update({ status })
    .eq("id", reviewId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteReview(
  client: Client,
  reviewId: string
): Promise<{ error: Error | null }> {
  const { error } = await client.from("product_reviews").delete().eq("id", reviewId);
  return { error: error ? new Error(error.message) : null };
}
