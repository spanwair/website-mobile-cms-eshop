import type { ShippingProviderCode } from "@shared/constants/shipping";

export interface ShipmentRecipient {
  name: string;
  phone?: string;
  email?: string;
  street: string;
  city: string;
  zip: string;
  countryCode: string;
}

export interface CreateShipmentInput {
  referenceNumber: string;
  recipient: ShipmentRecipient;
  // PPL's CPL API requires a full sender address per shipment (no account-level default
  // like Packeta's eshop label) — sourced from shipping_provider_configs.sender_*. Ignored
  // by Packeta/mock.
  sender?: ShipmentRecipient;
  pickupPointId?: string | null;
  codAmount?: number;
  weightKg: number;
  valueAmount: number;
  currency: string;
}

export interface CreateShipmentResult {
  providerShipmentId: string;
  trackingNumber: string;
  isMock: boolean;
  raw: unknown;
}

export interface ShipmentLabel {
  pdfBytes: Uint8Array;
}

export interface ShipmentStatusResult {
  status: string;
  raw: unknown;
}

// Identifies an existing shipment for actions (like cancel) that operate on it.
// Carriers key off different fields — Packeta uses the packet id, PPL's cancel
// endpoint needs the carrier-assigned shipment number — so both are passed through.
export interface ShipmentIdentity {
  providerShipmentId: string;
  trackingNumber: string | null;
}

export interface CreateReturnShipmentInput {
  referenceNumber: string;
  recipient: ShipmentRecipient; // the customer — becomes the sender of the return parcel
  // Our own address, receiving the return. Required by PPL (sender/recipient are both
  // mandatory on every CPL API shipment — there's no implicit account sender like
  // Packeta). Ignored by Packeta, whose return-via-password flow has no address fields.
  returnToAddress?: ShipmentRecipient;
  weightKg: number;
  valueAmount: number;
  currency: string;
  sendLabelToEmail?: boolean;
}

export interface CreateReturnShipmentResult {
  providerShipmentId: string;
  trackingNumber: string;
  returnPassword?: string; // Packeta-only: password the customer gives at the drop-off point
  isMock: boolean;
  raw: unknown;
}

export interface ShippingProvider {
  code: ShippingProviderCode;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  getLabel(providerShipmentId: string): Promise<ShipmentLabel>;
  // Takes the full identity, not just providerShipmentId — PPL's tracking endpoint
  // (GET /shipment) is keyed by the carrier shipment number, not our batch id.
  getStatus(shipment: ShipmentIdentity): Promise<ShipmentStatusResult>;
  cancelShipment(shipment: ShipmentIdentity): Promise<void>;
  createReturnShipment(input: CreateReturnShipmentInput): Promise<CreateReturnShipmentResult>;
  // Code for dropping a labeled parcel directly into a Z-BOX keypad, bypassing a staffed
  // pick-up point. Packeta-only (packetInfo's consignPassword) — other carriers return null
  // rather than throwing, so callers can request it unconditionally after every shipment.
  getConsignmentCode(providerShipmentId: string): Promise<string | null>;
}
