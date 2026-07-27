import { resolveTxt } from "node:dns/promises";

export const VERIFICATION_SUBDOMAIN = "_storefront-verification";

// Checks for a TXT record at _storefront-verification.<domain> containing the token.
// DNS-only path so mobile (which shares services/ with the browser) never imports node:dns.
export async function verifyDomainTxtRecord(domain: string, token: string): Promise<boolean> {
  try {
    const records = await resolveTxt(`${VERIFICATION_SUBDOMAIN}.${domain}`);
    return records.some((chunks) => chunks.join("").trim() === token);
  } catch {
    return false;
  }
}
