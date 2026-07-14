import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabaseClient } from "../../shared/supabase/client";

export const supabase = getSupabaseClient({
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
});
