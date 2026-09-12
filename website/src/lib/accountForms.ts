import type { AstroGlobal } from "astro";
import { createSupabase, createAdminClient } from "./supabase";
import { fetchProfile, updateProfile } from "@shared/services/profileService";
import { useT } from "./i18n";
import type { User } from "@shared/types";

export interface ProfileView {
  redirect: null;
  profile: User | null;
  email: string;
  saved: boolean;
  saveError: string | null;
}

// Shared by top-level /profile and /eshop-[slug]/profile — identical behaviour, different chrome.
export async function runProfilePage(Astro: AstroGlobal): Promise<ProfileView | { redirect: string }> {
  const supabase = createSupabase(Astro);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { redirect: "/login" };

  const email = session.user.email ?? "";
  let profile = await fetchProfile(supabase, session.user.id, email);
  let saved = false;
  let saveError: string | null = null;

  if (Astro.request.method === "POST") {
    const form = await Astro.request.formData();
    const action = form.get("_action") as string | null;
    if (action === "delete_account") {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.deleteUser(session.user.id);
      if (error) saveError = error.message;
      else {
        await supabase.auth.signOut();
        return { redirect: "/login" };
      }
    } else {
      const displayName = form.get("display_name") as string;
      const { error } = await updateProfile(supabase, session.user.id, { display_name: displayName });
      if (error) saveError = error.message;
      else { saved = true; profile = await fetchProfile(supabase, session.user.id, email); }
    }
  }

  return { redirect: null, profile, email, saved, saveError };
}

export interface SettingsView {
  redirect: null;
  displayName: string;
  email: string;
  currentLang: "cs" | "en";
  hasEmailAuth: boolean;
  success: string;
  error: string;
}

// `basePath` scopes the language-change redirect back to the current route family (top-level "" or
// "/eshop-<slug>"), so a storefront settings page reloads itself rather than bouncing to the root.
export async function runSettingsPage(
  Astro: AstroGlobal,
  basePath = ""
): Promise<SettingsView | { redirect: string }> {
  const supabase = createSupabase(Astro);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { redirect: "/login" };

  const t = useT(Astro);
  const lang = (Astro.cookies.get("lang")?.value === "en" ? "en" : "cs") as "cs" | "en";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, lang")
    .eq("id", session.user.id)
    .single();

  const identityProviders = session.user.identities?.map((i) => i.provider) ?? [];
  const hasEmailAuth = identityProviders.includes("email");

  let error = "";
  let success = "";

  if (Astro.request.method === "POST") {
    const form = await Astro.request.formData();
    const action = form.get("action") as string;

    if (action === "profile") {
      const displayName = (form.get("display_name") as string).trim();
      const { error: e } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", session.user.id);
      if (e) error = e.message;
      else success = t.settings.saved;
    }

    if (action === "language") {
      const newLang = form.get("lang") as "cs" | "en";
      if (newLang === "cs" || newLang === "en") {
        await supabase.from("profiles").update({ lang: newLang }).eq("id", session.user.id);
        Astro.cookies.set("lang", newLang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
        return { redirect: `${basePath}/settings` };
      }
    }

    if (action === "password" && hasEmailAuth) {
      const newPassword = form.get("new_password") as string;
      const confirmPassword = form.get("confirm_password") as string;
      if (newPassword !== confirmPassword) error = t.settings.errorMismatch;
      else {
        const { error: e } = await supabase.auth.updateUser({ password: newPassword });
        if (e) error = e.message;
        else success = t.settings.saved;
      }
    }
  }

  return {
    redirect: null,
    displayName: profile?.display_name ?? session.user.email?.split("@")[0] ?? "",
    email: session.user.email ?? "",
    currentLang: (profile?.lang as "cs" | "en") ?? lang,
    hasEmailAuth,
    success,
    error,
  };
}
