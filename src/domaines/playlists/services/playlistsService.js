import { getSupabaseBrowserClient } from "@/services/supabase/client";
import { fetchPlaylists } from "@/services/supabase/playlists";

export async function getPlaylists(ownerId) {
  return fetchPlaylists(ownerId);
}

export async function createPlaylist(payload) {
  const client = getSupabaseBrowserClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Connectez-vous pour créer une playlist synchronisée.");
  const { data, error } = await client.from("audiva_playlists").insert({ owner_id: user.id, title: String(payload.title || "").trim(), description: String(payload.description || ""), visibility: payload.visibility === "publique" ? "public" : payload.visibility === "amis" ? "friends" : "private", source: "audiva", metadata: {} }).select("*").single();
  if (error) throw error;
  return data;
}
