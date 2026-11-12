import { getSupabaseBrowserClient } from "@/services/supabase/client";

export async function getFavoris(userId) {
  if (!userId) return [];
  const { data, error } = await getSupabaseBrowserClient().from("audiva_favorites").select("created_at,music_item:audiva_music_items(*)").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(row => row.music_item).filter(Boolean);
}

export async function addFavori(trackId) {
  const client = getSupabaseBrowserClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Connectez-vous pour synchroniser vos favoris.");
  const { error } = await client.from("audiva_favorites").insert({ user_id: user.id, music_item_id: trackId });
  if (error) throw error;
  return { trackId, ok: true };
}
