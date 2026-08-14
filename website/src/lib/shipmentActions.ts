import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/supabase/types";
import { getShippingProvider } from "./integrations/shipping";
import { fetchShipmentByOrderId, updateShipmentRecord } from "@shared/services/shipmentService";
import type { ShippingProviderCode } from "@shared/constants/shipping";

type AdminClient = SupabaseClient<Database>;

// Manual "Refresh status" action in admin — both carriers are poll-only (no webhooks
// in either official doc set), so this is the only way status ever updates post-creation.
export async function refreshShipmentStatus(adminClient: AdminClient, orderId: string): Promise<{ error: string | null }> {
  const shipment = await fetchShipmentByOrderId(adminClient, orderId);
  if (!shipment?.provider_shipment_id) return { error: "No shipment to refresh" };
  try {
    const provider = getShippingProvider(shipment.provider as ShippingProviderCode);
    const result = await provider.getStatus({ providerShipmentId: shipment.provider_shipment_id, trackingNumber: shipment.tracking_number });
    await updateShipmentRecord(adminClient, orderId, { last_status_raw: { fetchedAt: new Date().toISOString(), ...result } as any });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// Both carriers only allow cancelling before the parcel is physically handed over,
// so we block it client-side too rather than relying solely on the carrier's error.
export async function cancelShipmentForOrder(adminClient: AdminClient, orderId: string): Promise<{ error: string | null }> {
  const shipment = await fetchShipmentByOrderId(adminClient, orderId);
  if (!shipment?.provider_shipment_id) return { error: "No shipment to cancel" };
  if (shipment.status === "in_transit" || shipment.status === "delivered" || shipment.status === "returned") {
    return { error: "Shipment already handed to the carrier — it can no longer be cancelled" };
  }
  try {
    const provider = getShippingProvider(shipment.provider as ShippingProviderCode);
    await provider.cancelShipment({ providerShipmentId: shipment.provider_shipment_id, trackingNumber: shipment.tracking_number });
    await updateShipmentRecord(adminClient, orderId, { status: "cancelled", cancelled_at: new Date().toISOString(), error_message: null });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// Creates a reverse-direction return shipment for an order. This is independent of the
// forward shipment's status/id — the return gets its own provider id, tracking number,
// and (Packeta only) drop-off password, stored in the return_* columns.
export async function createReturnShipmentForOrder(adminClient: AdminClient, orderId: string): Promise<{ error: string | null }> {
  const shipment = await fetchShipmentByOrderId(adminClient, orderId);
  if (!shipment) return { error: "No shipment on this order" };

  try {
    const { data: order } = await adminClient
      .from("orders")
      .select("order_number, total_amount, currency, customer_id, shipping_address:shipping_address_id(*)")
      .eq("id", orderId)
      .single();
    const address = (order as any)?.shipping_address;
    if (!order || !address) throw new Error("Order or shipping address missing");

    const { data: customer } = await adminClient.from("customers").select("email, phone").eq("id", order.customer_id).maybeSingle();

    // PPL needs our own address as the return's recipient (the parcel routes customer ->
    // us); Packeta's return-via-password flow ignores this entirely.
    const { data: senderConfig } = await adminClient
      .from("shipping_provider_configs")
      .select("sender_name, sender_street, sender_city, sender_postal_code, sender_country_code, sender_phone, sender_email")
      .eq("code", shipment.provider)
      .single();

    const provider = getShippingProvider(shipment.provider as ShippingProviderCode);
    const result = await provider.createReturnShipment({
      referenceNumber: `RET-${order.order_number}`,
      recipient: {
        name: `${address.first_name} ${address.last_name}`,
        phone: customer?.phone ?? undefined,
        email: customer?.email ?? undefined,
        street: address.line1,
        city: address.city,
        zip: address.postal_code,
        countryCode: address.country_code,
      },
      returnToAddress: senderConfig
        ? {
            name: senderConfig.sender_name,
            phone: senderConfig.sender_phone ?? undefined,
            email: senderConfig.sender_email ?? undefined,
            street: senderConfig.sender_street,
            city: senderConfig.sender_city,
            zip: senderConfig.sender_postal_code,
            countryCode: senderConfig.sender_country_code,
          }
        : undefined,
      weightKg: shipment.weight_kg,
      valueAmount: Number(order.total_amount),
      currency: order.currency,
    });

    // Packeta's return-via-password flow has no label until the customer submits the
    // packet at a drop-off point, so a getLabel() failure here is expected, not an error.
    let returnLabelPath: string | null = null;
    try {
      const label = await provider.getLabel(result.providerShipmentId);
      returnLabelPath = `${shipment.party_id}/${orderId}/return-label.pdf`;
      await adminClient.storage
        .from("shipping-labels")
        .upload(returnLabelPath, label.pdfBytes, { contentType: "application/pdf", upsert: true });
    } catch {
      returnLabelPath = null;
    }

    await updateShipmentRecord(adminClient, orderId, {
      return_provider_shipment_id: result.providerShipmentId,
      return_tracking_number: result.trackingNumber,
      return_password: result.returnPassword ?? null,
      return_label_storage_path: returnLabelPath,
      return_created_at: new Date().toISOString(),
    });
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
