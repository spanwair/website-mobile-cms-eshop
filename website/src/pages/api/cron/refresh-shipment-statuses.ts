import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase";
import { refreshShipmentStatus } from "@/lib/shipmentActions";
import { updateOrderStatus } from "@shared/services/orderService";
import { recordCommissionForOrder } from "@shared/services/commissionLedgerService";
import { PAYMENT_METHOD } from "@shared/constants/payment";
import { SHIPMENT_STATUS } from "@shared/constants/shipping";

// Called periodically by Supabase pg_cron (see
// supabase/migrations/20260103000076_shipment_status_cron.sql) to poll PPL and Packeta for
// every shipment that hasn't reached a terminal state yet — neither carrier offers webhooks
// (see comments on refreshShipmentStatus / getStatus), so polling is the only way delivery
// ever gets noticed automatically. For 'cod' orders this is also what settles payment_status:
// there is no online payment event to react to, so "the carrier confirms delivered" IS the
// "the customer paid" signal for cash-on-delivery.
// Protected by a shared secret rather than a user session — this has no logged-in caller.
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const adminClient = createAdminClient();

  const { data: shipments, error: fetchError } = await adminClient
    .from("order_shipments")
    .select("order_id")
    .not("provider_shipment_id", "is", null)
    .in("status", [SHIPMENT_STATUS.CREATED, SHIPMENT_STATUS.LABEL_READY, SHIPMENT_STATUS.IN_TRANSIT]);

  if (fetchError) {
    return new Response(JSON.stringify({ ok: false, error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const checked: string[] = [];
  const delivered: string[] = [];
  const codSettled: string[] = [];
  const failed: { orderId: string; error: string }[] = [];

  for (const { order_id: orderId } of shipments ?? []) {
    checked.push(orderId);
    const { error, classifiedStatus } = await refreshShipmentStatus(adminClient, orderId);
    if (error) {
      failed.push({ orderId, error });
      continue;
    }
    if (classifiedStatus !== SHIPMENT_STATUS.DELIVERED) continue;

    const { data: order } = await adminClient
      .from("orders")
      .select("id, status, payment_method, payment_status")
      .eq("id", orderId)
      .single();
    if (!order) continue;

    if (order.status !== "cancelled" && order.status !== "refunded" && order.status !== "delivered") {
      await updateOrderStatus(adminClient, order.id, "delivered", null, "Auto-updated: carrier confirmed delivery");
      delivered.push(order.id);
    }

    if (order.payment_method === PAYMENT_METHOD.COD && order.payment_status === "unpaid") {
      const { data: updated } = await adminClient
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", order.id)
        .eq("payment_status", "unpaid")
        .select("id")
        .maybeSingle();
      if (updated) {
        await recordCommissionForOrder(adminClient, order.id);
        codSettled.push(order.id);
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, checked: checked.length, delivered: delivered.length, codSettled: codSettled.length, failed }),
    { headers: { "Content-Type": "application/json" } }
  );
};
