import { supabase } from "./client";

export async function getTracks(limit = 50) {
  const { data, error } = await supabase.from("tracks").select("*").limit(limit);
  if (error) throw error;
  return data;
}
