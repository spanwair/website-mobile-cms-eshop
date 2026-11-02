// Cloudflare runtime vars/secrets are exposed at request time via process.env
// (nodejs_compat) — NOT via import.meta.env, which only carries what Vite inlined at
// build time (empty for dashboard/[vars] values, e.g. SHOP_URL reads undefined there).
// Read process.env first, falling back to import.meta.env for local dev / build-inlined
// values. Call only inside a request (never at module top level).
export function shipEnv(key: string): string | undefined {
  const fromProcess =
    typeof process !== "undefined" && process.env ? process.env[key] : undefined;
  return (fromProcess ?? (import.meta.env as Record<string, string | undefined>)[key]) as
    | string
    | undefined;
}
