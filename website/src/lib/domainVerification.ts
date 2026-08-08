export const VERIFICATION_SUBDOMAIN = "_storefront-verification";

// Checks for a TXT record at _storefront-verification.<domain> containing the token.
// Cloudflare Workers has no raw DNS socket API, so this resolves over DNS-over-HTTPS
// (fetch) instead of node:dns — works identically on the Node adapter too.
export async function verifyDomainTxtRecord(domain: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${VERIFICATION_SUBDOMAIN}.${domain}&type=TXT`,
      { headers: { accept: "application/dns-json" } }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { Answer?: Array<{ data: string }> };
    return (data.Answer ?? []).some((record) => record.data.replace(/"/g, "").trim() === token);
  } catch {
    return false;
  }
}
