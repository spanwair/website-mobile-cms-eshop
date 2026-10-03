// SINGLE SOURCE OF TRUTH for integration provider logo image paths.
// Never redefine these paths inline in a component or page - import from here.
// Covers shipping carriers (see shipping.ts) and payment providers (see payment.ts),
// plus the Czech brand alias Zasilkovna -> Packeta (same logo file).

import { PAYMENT_METHOD } from "./payment";
import { SHIPPING_PROVIDERS } from "./shipping";

export const PROVIDER_LOGO_SRCS: Record<string, string> = {
  [SHIPPING_PROVIDERS.PPL]: "/logo-delivery-providers/ppl.jpg",
  [SHIPPING_PROVIDERS.PACKETA]: "/logo-delivery-providers/packeta.png",
  [PAYMENT_METHOD.STRIPE]: "/logo-delivery-providers/stripe.png",
  // Czech brand name for Packeta - same logo file, kept as alias so display
  // names ("Zasilkovna", "Zasilkovna") resolve without extra mapping.
  zasilkovna: "/logo-delivery-providers/packeta.png",
};

export interface ProviderLogo {
  name: string;
  src: string;
}

// Strip diacritics so "Zasilkovna" matches the "zasilkovna" alias.
function normalizeKey(codeOrName: string): string {
  return codeOrName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function getProviderLogoSrc(codeOrName: string): string | undefined {
  if (!codeOrName) return undefined;
  return PROVIDER_LOGO_SRCS[normalizeKey(codeOrName)];
}

// Landing marquee content - display names paired with the shared logo paths above.
export const LANDING_PROVIDER_LOGOS: ProviderLogo[] = [
  { name: "PPL", src: PROVIDER_LOGO_SRCS[SHIPPING_PROVIDERS.PPL] },
  { name: "Zásilkovna", src: PROVIDER_LOGO_SRCS[SHIPPING_PROVIDERS.PACKETA] },
  { name: "Stripe", src: PROVIDER_LOGO_SRCS[PAYMENT_METHOD.STRIPE] },
];
