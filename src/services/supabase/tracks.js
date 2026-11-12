import { supabase } from "./client";

export async function fetchTracks(userId, limit = 500) {
  if (!userId) return [];
  const { data, error } = await supabase.from("audiva_music_items").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}
