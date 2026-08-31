import { supabase } from "@mobile/supabase/client";
import { fetchItems } from "@shared/services/itemService";
import { useQuery } from "@tanstack/react-query";

export const ITEMS_KEY = ["items"] as const;

export function useItems() {
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => fetchItems(supabase).then((r) => r.data),
  });
}
