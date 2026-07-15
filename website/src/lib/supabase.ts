import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "@shared/supabase/types";

const url = import.meta.env.PUBLIC_SUPABASE_URL ?? "";
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createSupabase(context: { request: Request; cookies: AstroCookies }) {
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        const raw = parseCookieHeader(context.request.headers.get("cookie") ?? "");
        return raw.filter((c): c is { name: string; value: string } => c.value !== undefined);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });
}

export async function signInWithGoogle(context: { request: Request; cookies: AstroCookies }) {
  const supabase = createSupabase(context);
  const origin = new URL(context.request.url).origin;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
}
