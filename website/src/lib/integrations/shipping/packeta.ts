// Packeta / Zásilkovna REST API — https://docs.packeta.com (github.com/Packeta/api-documentation).
// XML-only, POST to a single endpoint with the method name as the root element.
// Requires PACKETA_API_PASSWORD (server secret) — no sandbox exists; test packets on the
// real account incur no charge until physically dispatched, per Packeta's own docs.

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

const REST_URL = "https://www.zasilkovna.cz/api/rest";

function getConfig() {
  const apiPassword = import.meta.env.PACKETA_API_PASSWORD;
  const senderLabel = import.meta.env.PACKETA_SENDER_LABEL ?? "";
  if (!apiPassword) throw new Error("PACKETA_API_PASSWORD not set — add it to .env.production");
  return { apiPassword, senderLabel };
}

function xmlEscape(value: string | number): string {
  return String(value).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function tag(name: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function extractTag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return match ? match[1] : null;
}

async function callXmlMethod(method: string, bodyXml: string): Promise<string> {
  const res = await fetch(REST_URL, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: `<${method}>${bodyXml}</${method}>`,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Packeta ${method} failed: ${res.status} ${text}`);
  const status = extractTag(text, "status");
  if (status === "fault") {
    const fault = extractTag(text, "fault") ?? "unknown fault";
    throw new Error(`Packeta ${method} returned fault: ${fault} — ${text}`);
  }
  return text;
}

export function createPacketaProvider(): ShippingProvider {
  return {
    code: "packeta",
    async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
      const { apiPassword, senderLabel } = getConfig();

      const [street = "", houseNumber = ""] = input.recipient.street.split(/\s+(?=\d)/);
      const attributes = [
        tag("number", input.referenceNumber),
        tag("name", input.recipient.name.split(" ")[0] ?? input.recipient.name),
        tag("surname", input.recipient.name.split(" ").slice(1).join(" ") || input.recipient.name),
        tag("email", input.recipient.email),
        tag("phone", input.recipient.phone),
        input.pickupPointId
          ? tag("addressId", input.pickupPointId)
          : tag("street", street) + tag("houseNumber", houseNumber) + tag("city", input.recipient.city) + tag("zip", input.recipient.zip),
        tag("value", input.valueAmount),
        tag("currency", input.currency),
        tag("weight", input.weightKg),
        tag("eshop", senderLabel),
        input.codAmount ? tag("cod", input.codAmount) : "",
      ].join("");

      const bodyXml = tag("apiPassword", apiPassword) + `<packetAttributes>${attributes}</packetAttributes>`;
      const responseXml = await callXmlMethod("createPacket", bodyXml);

      const providerShipmentId = extractTag(responseXml, "id");
      const trackingNumber = extractTag(responseXml, "barcode") ?? providerShipmentId;
      if (!providerShipmentId || !trackingNumber) throw new Error(`Packeta createPacket response missing id/barcode: ${responseXml}`);

      return { providerShipmentId, trackingNumber, isMock: false, raw: responseXml };
    },

    async getLabel(providerShipmentId: string): Promise<ShipmentLabel> {
      const { apiPassword } = getConfig();
      const bodyXml = tag("apiPassword", apiPassword) + tag("packetId", providerShipmentId) + tag("format", "A6 on A4") + tag("offset", 0);
      const res = await fetch(REST_URL, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: `<packetLabelPdf>${bodyXml}</packetLabelPdf>`,
      });
      if (!res.ok) throw new Error(`Packeta packetLabelPdf failed: ${res.status} ${await res.text()}`);
      const buf = await res.arrayBuffer();
      return { pdfBytes: new Uint8Array(buf) };
    },

    async getStatus(shipment: ShipmentIdentity): Promise<ShipmentStatusResult> {
      const { apiPassword } = getConfig();
      const bodyXml = tag("apiPassword", apiPassword) + tag("packetId", shipment.providerShipmentId);
      const responseXml = await callXmlMethod("packetStatus", bodyXml);
      const status = extractTag(responseXml, "statusText") ?? extractTag(responseXml, "codeText") ?? "unknown";
      return { status, raw: responseXml };
    },

    // cancelPacket() only works before the packet is physically handed to Packeta —
    // raises CancelNotAllowedFault otherwise, surfaced as a normal thrown error.
    async cancelShipment(shipment: ShipmentIdentity): Promise<void> {
      const { apiPassword } = getConfig();
      const bodyXml = tag("apiPassword", apiPassword) + tag("packetId", shipment.providerShipmentId);
      await callXmlMethod("cancelPacket", bodyXml);
    },

    // createPacketClaimWithPassword() — the "Return via API" flow: creates a standalone
    // return packet (not linked by id to the original forward packet) and gives back a
    // password the customer states at any Packeta drop-off point or Z-BOX. eshop and
    // value are required fields per the ClaimWithPasswordAttributes reference.
    async createReturnShipment(input: CreateReturnShipmentInput): Promise<CreateReturnShipmentResult> {
      const { apiPassword, senderLabel } = getConfig();

      const attributes = [
        tag("number", input.referenceNumber),
        tag("email", input.recipient.email),
        tag("phone", input.recipient.phone),
        tag("value", input.valueAmount),
        tag("currency", input.currency),
        tag("eshop", senderLabel),
        tag("consignCountry", input.recipient.countryCode?.toLowerCase()),
        input.sendLabelToEmail ? tag("sendEmailToCustomer", "true") : "",
      ].join("");

      const bodyXml = tag("apiPassword", apiPassword) + `<claimWithPasswordAttributes>${attributes}</claimWithPasswordAttributes>`;
      const responseXml = await callXmlMethod("createPacketClaimWithPassword", bodyXml);

      const providerShipmentId = extractTag(responseXml, "id");
      const trackingNumber = extractTag(responseXml, "barcode") ?? providerShipmentId;
      const returnPassword = extractTag(responseXml, "password") ?? undefined;
      if (!providerShipmentId || !trackingNumber) {
        throw new Error(`Packeta createPacketClaimWithPassword response missing id/barcode: ${responseXml}`);
      }

      return { providerShipmentId, trackingNumber, returnPassword, isMock: false, raw: responseXml };
    },

    // packetInfo() → consignPassword: a 9-digit code entered on a Z-BOX keypad (then pick
    // box size S/M/L) to drop the labeled parcel off without visiting a staffed pick-up
    // point. Best-effort: a failure here shouldn't fail shipment creation, so it swallows
    // errors and returns null rather than throwing.
    async getConsignmentCode(providerShipmentId: string): Promise<string | null> {
      try {
        const { apiPassword } = getConfig();
        const bodyXml = tag("apiPassword", apiPassword) + tag("packetId", providerShipmentId);
        const responseXml = await callXmlMethod("packetInfo", bodyXml);
        return extractTag(responseXml, "consignPassword");
      } catch {
        return null;
      }
    },
  };
}
