import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

type Client = SupabaseClient<Database>;

export async function signInWithPassword(
  client: Client,
  email: string,
  password: string
): Promise<{ error: Error | null }> {
  const { error } = await client.auth.signInWithPassword({ email, password });
  return { error: error ? new Error(error.message) : null };
}

export async function signUpWithPassword(
  client: Client,
  email: string,
  password: string,
  displayName?: string
): Promise<{ error: Error | null; needsConfirmation: boolean }> {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  });
  return {
    error: error ? new Error(error.message) : null,
    needsConfirmation: !error && !data.session,
  };
}

export async function signInWithGoogle(
  client: Client,
  redirectUrl: string
): Promise<{ url: string | null; error: Error | null }> {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });
  return { url: data?.url ?? null, error: error ? new Error(error.message) : null };
}

export async function signOut(client: Client): Promise<void> {
  await client.auth.signOut();
}

export async function getSession(client: Client) {
  const { data } = await client.auth.getSession();
  return data.session;
}
