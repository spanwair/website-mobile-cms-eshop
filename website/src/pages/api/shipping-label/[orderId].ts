import type { APIRoute } from "astro";
import { createSupabase, createAdminClient } from "../../../lib/supabase";

// The shipping-labels bucket is private with no storage.objects SELECT policy at all —
// every read goes through a signed URL minted here, after the order_shipments RLS read
// below (staff via MANAGE_ORDERS, or the owning customer) has already proven access.
export const GET: APIRoute = async (context) => {
  const orderId = context.params.orderId;
  if (!orderId) return new Response("Not found", { status: 404 });

  const supabase = createSupabase(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isReturn = new URL(context.request.url).searchParams.get("type") === "return";

  const { data: shipment } = await supabase
    .from("order_shipments")
    .select("label_storage_path, return_label_storage_path")
    .eq("order_id", orderId)
    .maybeSingle();

  const labelPath = isReturn ? shipment?.return_label_storage_path : shipment?.label_storage_path;
  if (!labelPath) return new Response("Label not available", { status: 404 });

  const adminClient = createAdminClient();
  const { data: signed, error } = await adminClient.storage.from("shipping-labels").createSignedUrl(labelPath, 60);
  if (error || !signed) return new Response("Could not generate label link", { status: 500 });

  return context.redirect(signed.signedUrl);
};
