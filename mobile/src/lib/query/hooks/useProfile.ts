import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../supabase/client";
import {
  fetchProfile,
  updateProfile,
} from "../../../../../shared/services/profileService";

export const PROFILE_KEY = ["profile"] as const;

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: [...PROFILE_KEY, userId],
    queryFn: () => fetchProfile(supabase, userId!, "").then((p) => p ?? null),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { display_name?: string; avatar_url?: string };
    }) => updateProfile(supabase, userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}
