import { SHIPMENT_STATUS, type ShipmentStatus } from "../constants/shipping";

// PPL's CPL API and Packeta's REST API both return free-text status strings (PPL:
// shipmentState / trackAndTrace.lastEventName; Packeta: statusText / codeText) rather than
// a fixed, publicly documented enum — confirmed by checking both providers' published docs
// (Packeta's own example shows codeText="delivered" for statusCode 7; PPL's codelist/status
// endpoint requires live credentials to enumerate and isn't reproduced in their public docs).
// Matching by keyword rather than exact string is therefore the robust choice: it survives
// casing differences ("Delivered" vs "delivered") and wording PPL/Packeta haven't published.
//
// CRITICAL: the negated/failed-delivery forms must be excluded first. PPL's pre-handover
// shipmentState is the composite "Undelivered, DataShipment, Active"; carriers also emit
// "not delivered" / "could not be delivered" and the Czech "nedoručeno" — all of which share
// the "deliver"/"doručen" substring with a genuine delivery, so a naive keyword match reads a
// freshly created, still-cancellable parcel as DELIVERED and hides the cancel action. "deliver"
// is also matched with a word boundary so "out for delivery" falls through to in-transit.
export function classifyCarrierStatus(rawStatusText: string | null | undefined): ShipmentStatus | null {
  if (!rawStatusText) return null;
  const text = rawStatusText.toLowerCase();
  const isNotDelivered =
    /\bun[-\s]?delivered\b|\bnot\s+delivered\b|\b(?:could|can)\s*not\b[^.]*deliver|nedoruč|nedorucen/.test(text);
  if (!isNotDelivered && /\bdelivered\b|doručen|dorucen|vydán|vydan/.test(text)) return SHIPMENT_STATUS.DELIVERED;
  if (/cancel|storno|zrušen|zrusen/.test(text)) return SHIPMENT_STATUS.CANCELLED;
  if (/return|vráceno|vraceno|vrátk|vratk/.test(text)) return SHIPMENT_STATUS.RETURNED;
  if (/transit|shipped|dispatch|out for delivery|collected|on\s*road|přeprav|preprav/.test(text)) return SHIPMENT_STATUS.IN_TRANSIT;
  return null;
}
