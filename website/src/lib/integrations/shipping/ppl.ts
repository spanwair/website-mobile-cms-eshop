// PPL CPL API — verified against the real OpenAPI spec published (no auth required) at
// https://api-sandbox.dhl.com/ecs/ppl/sandbox/swagger/cpl/localizedSwagger.json, reached via
// PPL's public sandbox at https://sandbox.ppl.cz. Unlike Packeta, PPL requires a full
// `sender` address on every shipment (no account-level default sender) and keys tracking/
// cancel by the resolved `shipmentNumber`, not our batch id. Async batch model: POST
// returns a batchId via the Location header; the real shipment number and label are
// fetched by polling GET /shipment/batch/{batchId} until each item's importState leaves
// "Accepted"/"InProcess".

import type {
  ShippingProvider,
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentLabel,
  ShipmentStatusResult,
  ShipmentIdentity,
  CreateReturnShipmentInput,
  CreateReturnShipmentResult,
} from "./types";
import { toPplAddress, toCodVarSym } from "./pplHelpers";

function getConfig() {
  const clientId = import.meta.env.PPL_CLIENT_ID;
  const clientSecret = import.meta.env.PPL_CLIENT_SECRET;
  // Confirmed sandbox base via live network trace of sandbox.ppl.cz: api-sandbox.dhl.com/ecs/ppl/sandbox.
  const baseUrl = import.meta.env.PPL_API_BASE_URL ?? "https://api.dhl.com/ecs/ppl/myapi2";
  if (!clientId || !clientSecret) throw new Error("PPL_CLIENT_ID / PPL_CLIENT_SECRET not set — add them to .env.production");
  return { clientId, clientSecret, baseUrl };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, baseUrl } = getConfig();
  const res = await fetch(`${baseUrl}/login/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "myapi2",
    }),
  });
  if (!res.ok) throw new Error(`PPL token request failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token?: string; accessToken?: string };
  const token = data.access_token ?? data.accessToken;
  if (!token) throw new Error("PPL token response missing access_token");
  return token;
}

const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 1500;

// Shared by forward and return shipments: POST into /shipment/batch, then poll the batch
// until PPL resolves the item's importState out of Accepted/InProcess. batchExtra carries
// batch-level (not per-shipment) fields like returnChannel.
async function submitBatchAndPoll(baseUrl: string, token: string, shipment: Record<string, unknown>, batchExtra: Record<string, unknown> = {}) {
  const createRes = await fetch(`${baseUrl}/shipment/batch`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ shipments: [shipment], ...batchExtra }),
  });
  if (!createRes.ok) throw new Error(`PPL shipment/batch failed: ${createRes.status} ${await createRes.text()}`);

  const location = createRes.headers.get("Location") ?? createRes.headers.get("location");
  const batchId = location?.split("/").pop();
  if (!batchId) throw new Error("PPL shipment/batch response missing batchId (Location header)");

  let item: any = null;
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
    const statusRes = await fetch(`${baseUrl}/shipment/batch/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!statusRes.ok) continue;
    const raw = await statusRes.json();
    // ShipmentBatchResultModel.items[] (ShipmentResultItemModel), not `.shipments[]`.
    const candidate = raw?.items?.[0];
    if (candidate && candidate.importState !== "Accepted" && candidate.importState !== "InProcess") {
      item = candidate;
      break;
    }
  }
  if (!item) throw new Error("PPL batch status polling timed out");
  if (item.importState === "Error") throw new Error(`PPL shipment import failed: ${item.errorCode ?? ""} ${item.errorMessage ?? ""}`.trim());

  const trackingNumber = item.shipmentNumber ?? batchId;
  return { batchId, trackingNumber, raw: item };
}

export function createPplProvider(): ShippingProvider {
  return {
    code: "ppl",
    async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
      if (!input.sender) throw new Error("PPL createShipment requires a sender address (shipping_provider_configs sender_* fields)");
      const { baseUrl } = getConfig();
      const token = await getAccessToken();

      // Real productType codes (verified: BUSS/BUSD are the official request examples;
      // the SBOX/SBOD pickup-point pair and the D-suffix=COD pattern are consistent with
      // PPL's documented codelist naming — confirm against GET /codelist/product once
      // real credentials are available).
      const productType = input.pickupPointId ? (input.codAmount ? "SBOD" : "SBOX") : input.codAmount ? "BUSD" : "BUSS";

      const shipment = {
        referenceId: input.referenceNumber,
        productType,
        sender: toPplAddress(input.sender),
        recipient: toPplAddress(input.recipient),
        specificDelivery: input.pickupPointId ? { parcelShopCode: input.pickupPointId } : undefined,
        shipmentSet: { numberOfShipments: 1, shipmentSetItems: [{ weighedShipmentInfo: { weight: input.weightKg } }] },
        ...(input.codAmount
          ? { cashOnDelivery: { codPrice: input.codAmount, codCurrency: input.currency, codVarSym: toCodVarSym(input.referenceNumber) } }
          : {}),
      };

      const { batchId, trackingNumber, raw } = await submitBatchAndPoll(baseUrl, token, shipment);
      return { providerShipmentId: batchId, trackingNumber, isMock: false, raw: { batchId, ...raw } };
    },

    // GET /shipment/batch/{batchId}/label — limit/offset are required query params.
    async getLabel(providerShipmentId: string): Promise<ShipmentLabel> {
      const { baseUrl } = getConfig();
      const token = await getAccessToken();
      const res = await fetch(`${baseUrl}/shipment/batch/${providerShipmentId}/label?PageSize=Default&limit=1&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`PPL label fetch failed: ${res.status} ${await res.text()}`);
      const buf = await res.arrayBuffer();
      return { pdfBytes: new Uint8Array(buf) };
    },

    // GET /shipment?ShipmentNumbers=X — "Used to obtain information (tracking) about a
    // shipment", keyed by shipmentNumber (our trackingNumber), not the batch id.
    async getStatus(shipment: ShipmentIdentity): Promise<ShipmentStatusResult> {
      const { baseUrl } = getConfig();
      const token = await getAccessToken();
      if (!shipment.trackingNumber) throw new Error("PPL getStatus requires a resolved shipment number");
      const params = new URLSearchParams({ Limit: "1", Offset: "0" });
      params.append("ShipmentNumbers", shipment.trackingNumber);
      const res = await fetch(`${baseUrl}/shipment?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`PPL status fetch failed: ${res.status} ${await res.text()}`);
      const raw = await res.json();
      const status = raw?.[0]?.shipmentState ?? raw?.[0]?.trackAndTrace?.lastEventName ?? "unknown";
      return { status, raw };
    },

    // POST /shipment/{shipmentNumber}/cancel — keyed by the carrier shipment number
    // (not our batchId), so this needs the shipment to have already resolved via polling.
    async cancelShipment(shipment: ShipmentIdentity): Promise<void> {
      const { baseUrl } = getConfig();
      const token = await getAccessToken();
      if (!shipment.trackingNumber) throw new Error("PPL cancelShipment requires a resolved shipment number");
      const res = await fetch(`${baseUrl}/shipment/${shipment.trackingNumber}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 202) throw new Error(`PPL shipment cancel failed: ${res.status} ${await res.text()}`);
    },

    // productType RETD on the same /shipment/batch endpoint, with sender/recipient
    // reversed (the customer ships back to returnToAddress, our own address). returnChannel
    // (to email the label straight to the customer) is a BATCH-level field, not per-shipment
    // — confirmed via CreateShipmentBatchModel/ShipmentModel schemas.
    async createReturnShipment(input: CreateReturnShipmentInput): Promise<CreateReturnShipmentResult> {
      if (!input.returnToAddress) throw new Error("PPL createReturnShipment requires returnToAddress (our own address)");
      const { baseUrl } = getConfig();
      const token = await getAccessToken();

      const shipment = {
        referenceId: input.referenceNumber,
        productType: "RETD",
        sender: toPplAddress(input.recipient),
        recipient: toPplAddress(input.returnToAddress),
        shipmentSet: { numberOfShipments: 1, shipmentSetItems: [{ weighedShipmentInfo: { weight: input.weightKg } }] },
      };
      const batchExtra =
        input.sendLabelToEmail && input.recipient.email ? { returnChannel: { type: "Email", address: input.recipient.email } } : {};

      const { batchId, trackingNumber, raw } = await submitBatchAndPoll(baseUrl, token, shipment, batchExtra);
      return { providerShipmentId: batchId, trackingNumber, isMock: false, raw: { batchId, ...raw } };
    },

    // Verified against the real CPL API surface: ParcelBox is only a delivery destination
    // type (AccessPointType enum), not a self-service drop-off code flow like Packeta's
    // Z-BOX consignment — no equivalent endpoint exists, so this stays null rather than
    // pretending to support it.
    async getConsignmentCode(): Promise<string | null> {
      return null;
    },
  };
}
