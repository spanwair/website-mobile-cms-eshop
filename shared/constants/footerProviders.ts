import type { FooterBadgeKind } from "../types";

// Shipping carriers and payment methods that are actually integrated and administered through the
// platform. These are the ONLY providers an org may advertise as a shipping/payment footer badge —
// the badges editor offers them as fixed toggles, never free-form text. Keep in sync with the
// seed_integrated_footer_badges() DB function (migration 20260103000186).

export interface FooterProvider {
  key: string;
  kind: FooterBadgeKind;
  label: string;
  icon: string;
  url: string | null;
}

export const INTEGRATED_FOOTER_PROVIDERS: FooterProvider[] = [
  { key: "ppl", kind: "shipping", label: "PPL", icon: "🚚", url: null },
  { key: "zasilkovna", kind: "shipping", label: "Zásilkovna", icon: "📦", url: null },
  { key: "stripe", kind: "payment", label: "Platba kartou", icon: "💳", url: null },
];

export const RESTRICTED_BADGE_KINDS: FooterBadgeKind[] = ["shipping", "payment"];
export const FREEFORM_BADGE_KINDS: FooterBadgeKind[] = ["social", "store_feature"];

export function isRestrictedBadgeKind(kind: FooterBadgeKind): boolean {
  return RESTRICTED_BADGE_KINDS.includes(kind);
}

export function providersForKind(kind: FooterBadgeKind): FooterProvider[] {
  return INTEGRATED_FOOTER_PROVIDERS.filter((p) => p.kind === kind);
}
