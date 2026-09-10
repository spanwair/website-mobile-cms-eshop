// Server-side re-validation of a pickup-point selection. The point is chosen entirely
// client-side (Packeta / PPL map widget) and can be tampered with, so it must be
// re-checked against the carrier before the id is trusted and stored on the order —
// per each carrier's own widget docs.
//
// verifyPickupPoint() is the single entry point used by checkout. It only enforces a
// check when a REAL widget produced the point (same condition the selector renders on:
// mock mode off AND the carrier's widget key present). In mock mode, or when the check
// API is not configured, the point is trusted — there is nothing authoritative to
// verify against, which keeps behaviour identical to before a key is provisioned.

import { getAccessToken, getConfig } from "./ppl";

export type ShippingProviderCode = "ppl" | "packeta";
export type PickupPointCheck = { ok: true } | { ok: false; reason: "invalid_pickup_point" };

// Packeta's widget-validate endpoint. Throws on transport/HTTP errors so the caller can
// fail open; returns false only when the API authoritatively reports the point invalid.
export async function validatePacketaPickupPoint(pointId: string): Promise<boolean> {
  const apiKey = import.meta.env.PUBLIC_PACKETA_WIDGET_API_KEY;
  if (!apiKey) throw new Error("PUBLIC_PACKETA_WIDGET_API_KEY not set");

  const res = await fetch("https://widget.packeta.com/v6/pps/api/widget/v1/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, point: { id: pointId } }),
  });
  if (!res.ok) throw new Error(`Packeta validate failed: ${res.status}`);
  const data = (await res.json()) as { isValid?: boolean };
  return data.isValid === true;
}

// PPL CPL API access-point lookup by exact code (GET /accessPoint?AccessPointCode=...).
// Uses the same OAuth credentials as ppl.ts (PPL_CLIENT_ID/SECRET) — a different, heavier
// credential than the widget key that renders the map. Throws on transport/HTTP errors so
// the caller can fail open; returns false only when the lookup returns no matching point.
export async function validatePplPickupPoint(code: string, countryCode = "CZ"): Promise<boolean> {
  const token = await getAccessToken();
  const { baseUrl } = getConfig();
  const params = new URLSearchParams({ CountryCode: countryCode, AccessPointCode: code, Limit: "1", Offset: "0" });
  const res = await fetch(`${baseUrl}/accessPoint?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`PPL accessPoint lookup failed: ${res.status}`);
  const data = await res.json();
  // The CPL spec was not fully readable without credentials; accept either a bare array
  // or an { items: [] } envelope (mirrors the same tolerance ppl.ts applies elsewhere).
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  return Array.isArray(items) && items.length > 0;
}

function realWidgetActive(provider: ShippingProviderCode): boolean {
  const mockMode = (import.meta.env.PUBLIC_SHIPPING_MOCK_MODE ?? "true") !== "false";
  if (mockMode) return false;
  const key = provider === "ppl" ? import.meta.env.PUBLIC_PPL_WIDGET_API_KEY : import.meta.env.PUBLIC_PACKETA_WIDGET_API_KEY;
  return Boolean(key);
}

export async function verifyPickupPoint(
  provider: ShippingProviderCode,
  code: string,
  countryCode = "CZ"
): Promise<PickupPointCheck> {
  if (!realWidgetActive(provider)) return { ok: true };

  try {
    if (provider === "packeta") {
      return (await validatePacketaPickupPoint(code)) ? { ok: true } : { ok: false, reason: "invalid_pickup_point" };
    }
    // PPL: the map widget key alone cannot validate a point — that needs the CPL API
    // credentials. Without them there is nothing to check against, so trust the point.
    if (!import.meta.env.PPL_CLIENT_ID || !import.meta.env.PPL_CLIENT_SECRET) return { ok: true };
    return (await validatePplPickupPoint(code, countryCode)) ? { ok: true } : { ok: false, reason: "invalid_pickup_point" };
  } catch {
    // Transport/HTTP failure — do not block a legitimately-selected point on a transient
    // carrier-API outage. Only an authoritative negative response rejects the checkout.
    return { ok: true };
  }
}
