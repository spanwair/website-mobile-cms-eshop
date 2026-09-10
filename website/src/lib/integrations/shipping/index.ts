import type { ShippingProviderCode } from "@shared/constants/shipping";
import type { ShippingProvider } from "./types";
import { createPplProvider } from "./ppl";
import { createPacketaProvider } from "./packeta";
import { createMockProvider } from "./mock";

// Real credentials aren't self-serve for either carrier (see .env.production.example),
// so this factory falls back to the mock provider whenever the required secret is
// missing. The mock path is never silent — CreateShipmentResult.isMock is persisted
// on order_shipments.is_mock and surfaced as a "TEST MODE" badge in admin.
//
// PPL_LIVE_BOOKING gates REAL, billable shipment creation separately from having the
// CPL API creds. The creds are also used read-only (pickup-point map/validation via
// GET /accessPoint), which is free and safe, so dev can hold real creds for the map
// while booking stays on the mock provider. Only when PPL_LIVE_BOOKING="true" does
// createShipment/getLabel/cancel/return hit the live carrier — set that in prod only.
export function getShippingProvider(code: ShippingProviderCode): ShippingProvider {
  if (code === "ppl") {
    const hasCreds = Boolean(import.meta.env.PPL_CLIENT_ID && import.meta.env.PPL_CLIENT_SECRET);
    const liveBooking = import.meta.env.PPL_LIVE_BOOKING === "true";
    return hasCreds && liveBooking ? createPplProvider() : createMockProvider("ppl");
  }
  return import.meta.env.PACKETA_API_PASSWORD ? createPacketaProvider() : createMockProvider("packeta");
}

export type {
  ShippingProvider,
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentLabel,
  ShipmentStatusResult,
  ShipmentIdentity,
  CreateReturnShipmentInput,
  CreateReturnShipmentResult,
} from "./types";
