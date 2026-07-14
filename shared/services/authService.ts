import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import { AUTH_REDIRECT } from "../constants/routes";

type Client = SupabaseClient<Database>;

export async function signInWithMagicLink(
  client: Client,
  email: string,
  platform: "mobile" | "web"
): Promise<{ error: Error | null }> {
  const redirectTo = platform === "mobile"
    ? AUTH_REDIRECT.mobileProd
    : AUTH_REDIRECT.websiteProd;

  const { error } = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
  });

  return { error: error ? new Error(error.message) : null };
}

export async function signInWithGoogle(
  client: Client
): Promise<{ error: Error | null }> {
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: AUTH_REDIRECT.websiteProd },
  });

  return { error: error ? new Error(error.message) : null };
}

export async function signOut(client: Client): Promise<void> {
  await client.auth.signOut();
}

export async function getSession(client: Client) {
  const { data } = await client.auth.getSession();
  return data.session;
}
