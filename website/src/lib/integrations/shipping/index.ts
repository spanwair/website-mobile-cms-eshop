import type { ShippingProviderCode } from "@shared/constants/shipping";
import type { ShippingProvider } from "./types";
import { createPplProvider } from "./ppl";
import { createPacketaProvider } from "./packeta";
import { createMockProvider } from "./mock";

// Real credentials aren't self-serve for either carrier (see .env.production.example),
// so this factory falls back to the mock provider whenever the required secret is
// missing. The mock path is never silent — CreateShipmentResult.isMock is persisted
// on order_shipments.is_mock and surfaced as a "TEST MODE" badge in admin.
export function getShippingProvider(code: ShippingProviderCode): ShippingProvider {
  if (code === "ppl") {
    return import.meta.env.PPL_CLIENT_ID && import.meta.env.PPL_CLIENT_SECRET ? createPplProvider() : createMockProvider("ppl");
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
