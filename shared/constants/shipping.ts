// SINGLE SOURCE OF TRUTH for shipping carrier codes and shipment status values.
// Never redefine these strings inline — import from here.

export const SHIPPING_PROVIDERS = {
  PPL: "ppl",
  PACKETA: "packeta",
} as const;

export type ShippingProviderCode = (typeof SHIPPING_PROVIDERS)[keyof typeof SHIPPING_PROVIDERS];

export const SHIPMENT_STATUS = {
  PENDING: "pending",
  CREATED: "created",
  LABEL_READY: "label_ready",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  RETURNED: "returned",
  CANCELLED: "cancelled",
  FAILED: "failed",
} as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUS)[keyof typeof SHIPMENT_STATUS];
