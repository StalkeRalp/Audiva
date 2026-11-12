import { getSupabaseBrowserClient } from "@/services/supabase/client";

export async function getHistorique(limit = 500) {
  const client = getSupabaseBrowserClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) return [];
  const { data, error } = await client.from("audiva_listening_events").select("*").eq("user_id", user.id).order("played_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function addHistoriqueTrack(track, listenedSeconds = 0) {
  const client = getSupabaseBrowserClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Connectez-vous pour synchroniser votre historique.");
  if (!track?.title) throw new Error("Il faut un titre pour enregistrer l’écoute.");
  const playedAt = new Date();
  const payload = { user_id: user.id, source: track.provider === "spotify" ? "spotify" : track.source === "external" ? "external" : "local", title: String(track.title), artist: String(track.artist || ""), played_at: playedAt.toISOString(), listened_seconds: Math.max(0, Math.floor(listenedSeconds)), qualified: listenedSeconds >= 30, local_day: playedAt.toLocaleDateString("en-CA"), metadata: {} };
  const { data, error } = await client.from("audiva_listening_events").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}
