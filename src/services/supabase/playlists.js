import { supabase } from "./client";

export async function getPlaylists() {
  const { data, error } = await supabase.from("playlists").select("*");
  if (error) throw error;
  return data;
}
