import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../supabase/client";
import { fetchItems } from "@shared/services/itemService";

export const ITEMS_KEY = ["items"] as const;

export function useItems() {
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => fetchItems(supabase).then((r) => r.data),
  });
}
