import type { ShipmentRecipient } from "./types";

// Matches SenderAddressModel/RecipientAddressModel: name/street/city/zipCode/country
// required-shaped, phone/email optional. Both schemas are identical in the real spec.
export function toPplAddress(r: ShipmentRecipient) {
  return { name: r.name, street: r.street, city: r.city, zipCode: r.zip, country: r.countryCode, phone: r.phone, email: r.email };
}

// CashOnDeliveryFeatureModel.codVarSym is required, numeric-only (pattern ^\d+, max 10
// digits) — order/return reference numbers aren't guaranteed numeric, so this strips to
// digits and falls back to a timestamp if that leaves nothing.
export function toCodVarSym(referenceNumber: string): string {
  const digits = referenceNumber.replace(/\D/g, "").slice(-10);
  return digits || String(Date.now()).slice(-10);
}
