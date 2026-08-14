// Server-side re-validation of a Packeta Widget pickup-point selection. Point selection
// happens entirely client-side and can be tampered with, so this must run before the
// point id is trusted and passed to createPacket — per Packeta's own widget docs.

export async function validatePacketaPickupPoint(pointId: string): Promise<boolean> {
  const apiKey = import.meta.env.PUBLIC_PACKETA_WIDGET_API_KEY;
  if (!apiKey) return false;

  const res = await fetch("https://widget.packeta.com/v6/pps/api/widget/v1/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, point: { id: pointId } }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { isValid?: boolean };
  return data.isValid === true;
}
