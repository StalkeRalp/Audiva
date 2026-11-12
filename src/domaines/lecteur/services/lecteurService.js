import { getSupabaseBrowserClient } from "@/services/supabase/client";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

export async function getTrackById(trackId) {
  const client = getSupabaseBrowserClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;
  const { data, error } = await client.from("audiva_music_items").select("*").eq("user_id", user.id).eq("id", trackId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getQueue() {
  return useLecteurStore.getState().queue;
}
