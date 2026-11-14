import { getSupabaseBrowserClient } from "@/services/supabase/client";

const client = () => getSupabaseBrowserClient();
const isUuid = value => /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(String(value));
async function digest(value) {
  const bytes = await (await fetch(value)).arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(part => part.toString(16).padStart(2, "0")).join("");
}

function musicRow(userId, track) {
  const provider = track.provider === "spotify" || track.source === "spotify" ? "spotify" : track.source === "external" ? "external" : "local";
  const itemId = String(track.providerId || track.id || track.localId || `${track.title}:${track.artist}`);
  return {
    user_id: userId, source: provider, source_item_id: itemId, media_type: track.mediaType === "video" ? "video" : "track",
    title: String(track.title || "Titre inconnu").slice(0, 500), artist: String(track.artist || "").slice(0, 500),
    album: String(track.album || "").slice(0, 500), duration_seconds: Number.isFinite(Number(track.duration)) ? Math.max(0, Math.floor(Number(track.duration))) : null,
    cover_url: provider === "local" ? null : /^https?:\/\//i.test(track.cover || track.image || "") ? (track.cover || track.image) : null,
    local_fingerprint: provider === "local" ? String(track.localId || track.id || itemId) : null,
    metadata: { genre: typeof track.genre === "string" ? track.genre.slice(0, 120) : null, year: Number.isFinite(Number(track.year)) ? Number(track.year) : null, track_number: Number.isFinite(Number(track.trackNumber)) ? Number(track.trackNumber) : null },
  };
}

function appTrack(row) {
  const provider = row.source;
  const id = provider === "spotify" ? `spotify:track:${row.source_item_id}` : row.source_item_id || row.id;
  return { id, provider, providerId: provider === "spotify" ? row.source_item_id : undefined, source: provider, title: row.title, artist: row.artist, album: row.album, duration: row.duration_seconds || 0, cover: row.cover_url || "/placeholders/audio-cover.svg", mediaType: row.media_type || "audio", cloudMetadataOnly: provider === "local" };
}

export async function loadCloudSyncPreferences(userId) {
  const { data, error } = await client().from("audiva_user_preferences").select("sync_library_metadata,sync_listening_history,sync_favorites,sync_playlists,sync_recommendations,allow_activity_sharing,time_zone").eq("user_id", userId).single();
  if (error) throw error;
  return data;
}

export async function clearCloudPersonalMusicData() {
  const db = client();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError) throw authError;
  if (!user) return false;

  const deletions = [
    db.from("audiva_favorites").delete().eq("user_id", user.id),
    db.from("audiva_playlist_saves").delete().eq("user_id", user.id),
    db.from("audiva_listening_events").delete().eq("user_id", user.id),
    db.from("audiva_recommendation_feedback").delete().eq("user_id", user.id),
    db.from("audiva_social_activities").delete().eq("actor_id", user.id).eq("activity_type", "listened"),
  ];
  const results = await Promise.all(deletions);
  const failed = results.find(result => result.error);
  if (failed?.error) throw failed.error;

  const { data: covers, error: coversError } = await db.from("audiva_playlists").select("cover_path").eq("owner_id", user.id).not("cover_path", "is", null);
  if (coversError) throw coversError;
  const { error: playlistError } = await db.from("audiva_playlists").delete().eq("owner_id", user.id);
  if (playlistError) throw playlistError;
  const coverPaths = (covers || []).map(row => row.cover_path).filter(Boolean);
  if (coverPaths.length) {
    const { error: coverDeleteError } = await db.storage.from("audiva-playlist-covers").remove(coverPaths);
    if (coverDeleteError) throw coverDeleteError;
  }
  const { error: musicError } = await db.from("audiva_music_items").delete().eq("user_id", user.id);
  if (musicError) throw musicError;
  return true;
}

export async function syncPersonalData(userId) {
  const db = client();
  const prefs = await loadCloudSyncPreferences(userId);
  const state = await import("@/domaines/bibliotheque/stores/bibliothequeStore").then(module => module.useBibliothequeStore.getState());
  const player = await import("@/domaines/lecteur/stores/lecteurStore").then(module => module.useLecteurStore.getState());
  const playlistState = await import("@/domaines/playlists/stores/playlistsStore").then(module => module.usePlaylistsStore.getState());
  const intelligence = await import("@/domaines/statistiques/stores/intelligenceStore").then(module => module.useIntelligenceStore.getState());
  const allTracks = [...state.tracks, ...player.likedTracks, ...player.recentTracks, ...playlistState.playlists.flatMap(list => list.tracks || [])];
  const uniqueTracks = [...new Map(allTracks.filter(track => track?.id && track.title).map(track => [`${track.provider || track.source || "local"}:${track.providerId || track.id}`, track])).values()];
  let itemMap = new Map();
  if (prefs.sync_library_metadata && uniqueTracks.length) {
    const rows = uniqueTracks.map(track => musicRow(userId, track));
    const { error } = await db.from("audiva_music_items").upsert(rows, { onConflict: "user_id,source,source_item_id" });
    if (error) throw error;
    const { data, error: mapError } = await db.from("audiva_music_items").select("id,source,source_item_id").eq("user_id", userId);
    if (mapError) throw mapError;
    itemMap = new Map((data || []).map(row => [`${row.source}:${row.source_item_id}`, row.id]));
  }

  if (prefs.sync_favorites) {
    if (!prefs.sync_library_metadata) throw new Error("Pour synchroniser les favoris, activez aussi les métadonnées de la bibliothèque.");
    const rows = player.likedTracks.map(track => itemMap.get(`${track.provider === "spotify" ? "spotify" : track.source === "external" ? "external" : "local"}:${track.providerId || track.id}`)).filter(Boolean).map(music_item_id => ({ user_id: userId, music_item_id }));
    if (rows.length) { const { error } = await db.from("audiva_favorites").upsert(rows, { onConflict: "user_id,music_item_id" }); if (error) throw error; }
    const keep = rows.map(row => row.music_item_id);
    const remove = keep.length ? db.from("audiva_favorites").delete().eq("user_id", userId).not("music_item_id", "in", `(${keep.join(",")})`) : db.from("audiva_favorites").delete().eq("user_id", userId);
    const { error: removeError } = await remove; if (removeError) throw removeError;
  }

  if (prefs.sync_playlists) {
    const keptCloudIds = [];
    for (const playlist of playlistState.playlists) {
      const payload = { owner_id: userId, title: String(playlist.title || "Playlist").slice(0, 160), description: String(playlist.description || ""), visibility: playlist.visibility === "publique" ? "public" : playlist.visibility === "amis" ? "friends" : "private", source: "audiva", source_playlist_id: String(playlist.id), metadata: { local_id: String(playlist.id), ...(typeof playlist.cover === "string" && /^https?:\/\//.test(playlist.cover) ? { cover_url: playlist.cover } : {}) } };
      let cloud;
      if (isUuid(playlist.id)) {
        const { data, error } = await db.from("audiva_playlists").upsert({ id: playlist.id, ...payload }, { onConflict: "id" }).select("id,cover_path,metadata").single();
        if (error) throw error; cloud = data;
      } else {
        const { data: found, error: findError } = await db.from("audiva_playlists").select("id,cover_path,metadata").eq("owner_id", userId).eq("source_playlist_id", String(playlist.id)).maybeSingle();
        if (findError) throw findError;
        const query = found ? db.from("audiva_playlists").update(payload).eq("id", found.id) : db.from("audiva_playlists").insert(payload);
        const { data, error } = await query.select("id,cover_path,metadata").single(); if (error) throw error; cloud = data;
      }
      keptCloudIds.push(cloud.id);
      if (typeof playlist.cover === "string" && playlist.cover.startsWith("data:image/")) {
        const signature = await digest(playlist.cover);
        if (cloud.metadata?.cover_signature !== signature) {
          const blob = await (await fetch(playlist.cover)).blob();
          const extension = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
          const newPath = `${cloud.id}/${userId}/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await db.storage.from("audiva-playlist-covers").upload(newPath, blob, { contentType: blob.type, upsert: false });
          if (uploadError) throw uploadError;
          const { error: coverError } = await db.from("audiva_playlists").update({ cover_path: newPath, metadata: { ...payload.metadata, cover_signature: signature } }).eq("id", cloud.id);
          if (coverError) throw coverError;
          if (cloud.cover_path) await db.storage.from("audiva-playlist-covers").remove([cloud.cover_path]);
        }
      }
      if (prefs.sync_library_metadata) {
        const { error: clearError } = await db.from("audiva_playlist_items").delete().eq("playlist_id", cloud.id);
        if (clearError) throw clearError;
        const items = (playlist.tracks || []).map((track, position) => ({ playlist_id: cloud.id, music_item_id: itemMap.get(`${track.provider === "spotify" ? "spotify" : track.source === "external" ? "external" : "local"}:${track.providerId || track.id}`), position, added_by: userId })).filter(row => row.music_item_id);
        if (items.length) { const { error } = await db.from("audiva_playlist_items").upsert(items, { onConflict: "playlist_id,music_item_id" }); if (error) throw error; }
      }
    }
    const existing = await db.from("audiva_playlists").select("id").eq("owner_id", userId).eq("source", "audiva");
    if (existing.error) throw existing.error;
    const removedIds = (existing.data || []).map(row => row.id).filter(id => !keptCloudIds.includes(id));
    if (removedIds.length) { const { error } = await db.from("audiva_playlists").delete().in("id", removedIds); if (error) throw error; }
  }

  if (prefs.sync_listening_history && intelligence.plays.length) {
    const events = intelligence.plays.filter(play => play?.id && play.track).map(play => {
      const track = play.track; const source = track.provider === "spotify" || track.source === "spotify" ? "spotify" : track.source === "external" ? "external" : "local";
      const playedAt = new Date(play.start || play.lastObserved || Date.now());
      const listened = Math.max(0, Math.floor(play.seconds || 0));
      return { id: play.id, user_id: userId, music_item_id: itemMap.get(`${source}:${track.providerId || track.id}`) || null, source, title: String(track.title || "Titre inconnu").slice(0, 500), artist: String(track.artist || "").slice(0, 500), played_at: playedAt.toISOString(), listened_seconds: listened, qualified: listened >= Math.min(30, Math.max(1, (Number(play.duration) || Number(track.duration) || 0) * 0.3)), local_day: playedAt.toLocaleDateString("en-CA", { timeZone: prefs.time_zone || "UTC" }), metadata: { completed: Boolean(play.completed), session_id: play.sessionId || null } };
    });
    if (events.length) { const { error } = await db.from("audiva_listening_events").upsert(events, { onConflict: "id" }); if (error) throw error; }
  }
  if (prefs.allow_activity_sharing && intelligence.plays.length) {
    const sharedPlays = intelligence.plays.filter(play => play?.id && play.track && (play.seconds || 0) >= Math.min(30, Math.max(1, (Number(play.duration) || Number(play.track.duration) || 0) * 0.3)));
    if (sharedPlays.length) {
      const { data: existing, error: existingError } = await db.from("audiva_social_activities").select("id").in("id", sharedPlays.map(play => play.id));
      if (existingError) throw existingError;
      const known = new Set((existing || []).map(row => row.id));
      const newActivities = sharedPlays.filter(play => !known.has(play.id)).map(play => {
        const track = play.track;
        const source = track.provider === "spotify" || track.source === "spotify" ? "spotify" : track.source === "external" ? "external" : "local";
        return { id: play.id, actor_id: userId, activity_type: "listened", music_item_id: itemMap.get(`${source}:${track.providerId || track.id}`) || null, summary: { title: String(track.title || "Titre écouté").slice(0, 500), artist: String(track.artist || "").slice(0, 500) } };
      });
      if (newActivities.length) { const { error } = await db.from("audiva_social_activities").insert(newActivities); if (error) throw error; }
    }
  }
  return { tracks: uniqueTracks.length, playlists: prefs.sync_playlists ? playlistState.playlists.length : 0 };
}

export async function restoreCloudPersonalData(userId) {
  const db = client();
  const prefs = await loadCloudSyncPreferences(userId);
  const restored = { playlists: [], favorites: [], plays: [] };
  if (prefs.sync_library_metadata || prefs.sync_favorites || prefs.sync_playlists) {
    const { data: items, error } = await db.from("audiva_music_items").select("*").eq("user_id", userId);
    if (error) throw error;
    const byId = new Map((items || []).map(row => [row.id, appTrack(row)]));
    if (prefs.sync_favorites) {
      const { data, error: favoriteError } = await db.from("audiva_favorites").select("music_item_id").eq("user_id", userId);
      if (favoriteError) throw favoriteError;
      restored.favorites = (data || []).map(row => byId.get(row.music_item_id)).filter(Boolean);
    }
    if (prefs.sync_playlists) {
      const { data: lists, error: playlistError } = await db.from("audiva_playlists").select("id,title,description,visibility,cover_path,source_playlist_id,metadata,updated_at").eq("owner_id", userId).order("updated_at", { ascending: false });
      if (playlistError) throw playlistError;
      const { data: entries, error: itemError } = lists?.length ? await db.from("audiva_playlist_items").select("playlist_id,music_item_id,position").in("playlist_id", lists.map(row => row.id)).order("position") : { data: [], error: null };
      if (itemError) throw itemError;
      restored.playlists = await Promise.all((lists || []).map(async list => {
        let cover = list.metadata?.cover_url || "/hero-playlist.jpg";
        if (list.cover_path) { const { data } = await db.storage.from("audiva-playlist-covers").createSignedUrl(list.cover_path, 3600); cover = data?.signedUrl || cover; }
        return { id: list.source_playlist_id || list.id, cloudId: list.id, title: list.title, description: list.description, visibility: list.visibility === "public" ? "publique" : list.visibility === "friends" ? "amis" : "privée", cover, tracks: (entries || []).filter(row => row.playlist_id === list.id).map(row => byId.get(row.music_item_id)).filter(Boolean), updatedAt: list.updated_at, cloudSynced: true };
      }));
    }
  }
  if (prefs.sync_listening_history) {
    const { data, error } = await db.from("audiva_listening_events").select("id,source,title,artist,played_at,listened_seconds,qualified,metadata").eq("user_id", userId).order("played_at", { ascending: false }).limit(5000);
    if (error) throw error;
    restored.plays = (data || []).map(event => ({ id: event.id, start: new Date(event.played_at).getTime(), seconds: event.listened_seconds, completed: Boolean(event.metadata?.completed), track: { id: event.id, title: event.title, artist: event.artist, source: event.source, provider: event.source } }));
  }
  return restored;
}
