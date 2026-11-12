import { supabase } from "./client";

export async function fetchPlaylists(ownerId) {
  let query = supabase.from("audiva_playlists").select("*").order("updated_at", { ascending: false });
  if (ownerId) query = query.eq("owner_id", ownerId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
