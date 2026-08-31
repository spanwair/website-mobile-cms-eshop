import { SHIPMENT_STATUS, type ShipmentStatus } from "../constants/shipping";

// PPL's CPL API and Packeta's REST API both return free-text status strings (PPL:
// shipmentState / trackAndTrace.lastEventName; Packeta: statusText / codeText) rather than
// a fixed, publicly documented enum — confirmed by checking both providers' published docs
// (Packeta's own example shows codeText="delivered" for statusCode 7; PPL's codelist/status
// endpoint requires live credentials to enumerate and isn't reproduced in their public docs).
// Matching by keyword rather than exact string is therefore the robust choice: it survives
// casing differences ("Delivered" vs "delivered") and wording PPL/Packeta haven't published.
export function classifyCarrierStatus(rawStatusText: string | null | undefined): ShipmentStatus | null {
  if (!rawStatusText) return null;
  const text = rawStatusText.toLowerCase();
  if (/deliver|dorucen|vydan/.test(text)) return SHIPMENT_STATUS.DELIVERED;
  if (/return|vraceno|vratk/.test(text)) return SHIPMENT_STATUS.RETURNED;
  if (/cancel|zrušen|zrusen/.test(text)) return SHIPMENT_STATUS.CANCELLED;
  if (/transit|shipped|dispatch|out for delivery|collected|přeprav|preprav/.test(text)) return SHIPMENT_STATUS.IN_TRANSIT;
  return null;
}
