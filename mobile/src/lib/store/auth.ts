import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../../supabase/client";
import { createSelectors } from "./utils";

type AuthState = {
  session: Session | null;
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
};

const _useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  session: null,
  user: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? "authenticated" : "unauthenticated",
    }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, status: "unauthenticated" });
  },
  deleteAccount: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error) return { error: error.message };
    set({ session: null, user: null, status: "unauthenticated" });
    return { error: null };
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);
export const getAuthStore = () => _useAuthStore.getState();
