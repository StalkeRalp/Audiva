import { getSupabaseBrowserClient } from "@/services/supabase/client";
import { fetchTracks } from "@/services/supabase/tracks";

export async function getBibliothequeTracks(userId) {
  return fetchTracks(userId);
}

export async function toggleLikeTrack(trackId) {
  const client = getSupabaseBrowserClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Connectez-vous pour synchroniser vos favoris.");
  let query = client.from("audiva_music_items").select("id").eq("user_id", user.id);
  query = /^[0-9a-f-]{36}$/i.test(String(trackId)) ? query.eq("id", trackId) : query.eq("source_item_id", String(trackId));
  const { data: item, error } = await query.maybeSingle();
  if (error) throw error;
  if (!item) throw new Error("Activez la synchronisation des métadonnées et ajoutez ce titre à votre bibliothèque.");
  const { data: favorite, error: favoriteError } = await client.from("audiva_favorites").select("music_item_id").eq("user_id", user.id).eq("music_item_id", item.id).maybeSingle();
  if (favoriteError) throw favoriteError;
  if (favorite) {
    const result = await client.from("audiva_favorites").delete().eq("user_id", user.id).eq("music_item_id", item.id);
    if (result.error) throw result.error;
    return { trackId, isLiked: false };
  }
  const result = await client.from("audiva_favorites").insert({ user_id: user.id, music_item_id: item.id });
  if (result.error) throw result.error;
  return { trackId, isLiked: true };
}
