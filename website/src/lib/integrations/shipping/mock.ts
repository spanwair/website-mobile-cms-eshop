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
import type { ShippingProviderCode } from "@shared/constants/shipping";

// Builds a small, structurally valid single-page PDF with correct xref offsets
// (computed here rather than hand-typed, since PDF readers are strict about them).
function buildMockLabelPdf(text: string): Uint8Array {
  const objects = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 288 432]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>",
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
  ];
  const stream = `BT /F1 14 Tf 20 400 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const streamObj = `<</Length ${stream.length}>>\nstream\n${stream}\nendstream`;

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj${obj}endobj\n`;
  });
  offsets.push(body.length);
  body += `5 0 obj${streamObj}\nendobj\n`;

  const xrefStart = body.length;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer<</Size ${offsets.length}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(body);
}

let mockCounter = 0;

export function createMockProvider(code: ShippingProviderCode): ShippingProvider {
  return {
    code,
    async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
      mockCounter += 1;
      const providerShipmentId = `MOCK-${code.toUpperCase()}-${Date.now()}-${mockCounter}`;
      const trackingNumber = `${code === "ppl" ? "PPL" : "Z"}${String(Date.now()).slice(-10)}`;
      return {
        providerShipmentId,
        trackingNumber,
        isMock: true,
        raw: { mock: true, referenceNumber: input.referenceNumber, pickupPointId: input.pickupPointId ?? null },
      };
    },
    async getLabel(providerShipmentId: string): Promise<ShipmentLabel> {
      return { pdfBytes: buildMockLabelPdf(`MOCK LABEL ${providerShipmentId}`) };
    },
    async getStatus(shipment: ShipmentIdentity): Promise<ShipmentStatusResult> {
      return { status: "created", raw: { mock: true, ...shipment } };
    },
    async cancelShipment(shipment: ShipmentIdentity): Promise<void> {
      // No real carrier to cancel against in mock mode.
      void shipment;
    },
    async createReturnShipment(input: CreateReturnShipmentInput): Promise<CreateReturnShipmentResult> {
      mockCounter += 1;
      const providerShipmentId = `MOCK-RET-${code.toUpperCase()}-${Date.now()}-${mockCounter}`;
      const trackingNumber = `${code === "ppl" ? "PPL" : "Z"}R${String(Date.now()).slice(-9)}`;
      return {
        providerShipmentId,
        trackingNumber,
        returnPassword: code === "packeta" ? String(100000 + Math.floor(Math.random() * 900000)) : undefined,
        isMock: true,
        raw: { mock: true, referenceNumber: input.referenceNumber },
      };
    },
    async getConsignmentCode(): Promise<string | null> {
      return code === "packeta" ? String(100000000 + Math.floor(Math.random() * 900000000)) : null;
    },
  };
}
