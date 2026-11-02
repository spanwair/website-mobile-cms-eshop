import { classifyCarrierStatus } from "@shared/utils/shipmentStatus";
import { SHIPMENT_STATUS } from "@shared/constants/shipping";

describe("classifyCarrierStatus", () => {
  it("returns null for empty input", () => {
    expect(classifyCarrierStatus(null)).toBeNull();
    expect(classifyCarrierStatus(undefined)).toBeNull();
    expect(classifyCarrierStatus("")).toBeNull();
  });

  it("classifies a delivered shipment", () => {
    expect(classifyCarrierStatus("Delivered")).toBe(SHIPMENT_STATUS.DELIVERED);
    expect(classifyCarrierStatus("Delivered, Inactive")).toBe(SHIPMENT_STATUS.DELIVERED);
    expect(classifyCarrierStatus("doručeno")).toBe(SHIPMENT_STATUS.DELIVERED);
    expect(classifyCarrierStatus("vydáno na výdejním místě")).toBe(SHIPMENT_STATUS.DELIVERED);
  });

  // Regression: PPL's real pre-handover shipmentState is the composite
  // "Undelivered, DataShipment, Active" — it must NOT read as delivered, or the still-valid
  // cancel action is hidden on a freshly created parcel (found in prod on ORD-00618076).
  it("does not misclassify PPL 'Undelivered, ...' as delivered", () => {
    expect(classifyCarrierStatus("Undelivered, DataShipment, Active")).toBeNull();
    expect(
      classifyCarrierStatus("Parcel data. Sender has not yet hand over the parcel to PPL.")
    ).toBeNull();
    expect(classifyCarrierStatus("nedoručeno")).toBeNull();
  });

  // Generic failed-delivery phrasings share the "deliver" substring but must not read as
  // delivered either. A failed delivery that is also being returned should still classify
  // as RETURNED (the negation only suppresses the false DELIVERED).
  it("does not misclassify generic 'not delivered' phrasings as delivered", () => {
    expect(classifyCarrierStatus("not delivered")).toBeNull();
    expect(classifyCarrierStatus("Could not be delivered")).toBeNull();
    expect(classifyCarrierStatus("un-delivered")).toBeNull();
    expect(classifyCarrierStatus("Cannot be delivered, returned to sender")).toBe(
      SHIPMENT_STATUS.RETURNED
    );
  });

  it("classifies in-transit states, including negated-but-moving PPL composites", () => {
    expect(classifyCarrierStatus("In transit")).toBe(SHIPMENT_STATUS.IN_TRANSIT);
    expect(classifyCarrierStatus("out for delivery")).toBe(SHIPMENT_STATUS.IN_TRANSIT);
    expect(classifyCarrierStatus("Undelivered, OnRoad, Active")).toBe(SHIPMENT_STATUS.IN_TRANSIT);
    expect(classifyCarrierStatus("přeprava")).toBe(SHIPMENT_STATUS.IN_TRANSIT);
  });

  it("classifies cancelled and returned states", () => {
    expect(classifyCarrierStatus("Shipment cancelled")).toBe(SHIPMENT_STATUS.CANCELLED);
    expect(classifyCarrierStatus("Zásilka zrušena")).toBe(SHIPMENT_STATUS.CANCELLED);
    expect(classifyCarrierStatus("Returned to sender")).toBe(SHIPMENT_STATUS.RETURNED);
  });
});
