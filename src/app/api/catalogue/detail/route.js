export const runtime = "nodejs";

const typeToResource = { artists: "artists", albums: "albums", playlists: "playlists" };

async function jamendo(path, params) {
  if (!process.env.JAMENDO_CLIENT_ID) throw new Error("Jamendo non configuré");
  const url = new URL(`https://api.jamendo.com/v3.0/${path}/`);
  url.searchParams.set("client_id", process.env.JAMENDO_CLIENT_ID); url.searchParams.set("format", "json");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Jamendo ${response.status}`);
  return (await response.json()).results || [];
}

async function audius(path) {
  const apiKey = process.env.AUDIUS_API_KEY;
  const url = new URL(`https://api.audius.co/v1/${path}`);
  if (apiKey) url.searchParams.set("api_key", apiKey);
  const headers = process.env.AUDIUS_BEARER_TOKEN ? { Authorization: `Bearer ${process.env.AUDIUS_BEARER_TOKEN}` } : {};
  const response = await fetch(url, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Audius ${response.status}`);
  return (await response.json()).data;
}

const fromAudiusTrack = (item) => ({ id: `audius:track:${item.id}`, provider: "audius", providerId: String(item.id), title: item.title, artist: item.user?.name || "Artiste inconnu", album: item.album?.album_name || "", duration: Number(item.duration) || 0, image: item.artwork?._480x480 || item.artwork?.["480x480"] || null, streamUrl: `/api/catalogue/stream?provider=audius&id=${encodeURIComponent(item.id)}` });
const fromJamendoTrack = (item) => ({ id: `jamendo:track:${item.id}`, provider: "jamendo", providerId: String(item.id), title: item.name, artist: item.artist_name || "Artiste inconnu", album: item.album_name || "", duration: Number(item.duration) || 0, image: item.image || null, streamUrl: item.audio || null });

export async function GET(request) {
  const { searchParams } = new URL(request.url); const provider = searchParams.get("provider"); const id = searchParams.get("id"); const type = searchParams.get("type");
  if (!id || !typeToResource[type] || !["audius", "jamendo"].includes(provider)) return Response.json({ error: "Ressource invalide" }, { status: 400 });
  try {
    if (provider === "audius") {
      const path = type === "artists" ? `users/${id}` : `${typeToResource[type]}/${id}`;
      const [item, tracks] = await Promise.all([audius(path), audius(type === "artists" ? `users/${id}/tracks` : `${typeToResource[type]}/${id}/tracks`)]);
      return Response.json({ provider, type, title: item.name || item.playlist_name || item.album_name, artist: item.user?.name || item.name || "Audius", image: item.profile_picture?._480x480 || item.artwork?._480x480 || item.artwork?.["480x480"] || null, description: item.bio || item.description || "", genres: item.tags ? item.tags.split(",") : item.genre ? [item.genre] : [], tracks: (tracks || []).map(fromAudiusTrack) });
    }
    const tracksEndpoint = type === "artists" ? "artists/tracks" : type === "albums" ? "albums/tracks" : "playlists/tracks";
    const [items, tracks] = await Promise.all([jamendo(typeToResource[type], { id }), jamendo(tracksEndpoint, { id, limit: "100" })]);
    // Jamendo exposes artist biography and musical tags separately from the
    // public artist record. A missing bio must not make the whole page fail.
    const musicInfo = type === "artists" ? await jamendo("artists/musicinfo", { id }).catch(() => []) : [];
    const item = items[0];
    if (!item) return Response.json({ error: "Ressource introuvable" }, { status: 404 });
    const artistInfo = musicInfo?.[0] || {};
    return Response.json({ provider, type, title: item.name, artist: item.artist_name || item.user_name || item.name || "Jamendo", image: item.image || null, description: item.description || item.short_description || artistInfo.description || artistInfo.bio || "", genres: item.genres || item.musicinfo?.tags?.genres || artistInfo.tags || artistInfo.genres || [], tracks: tracks.map(fromJamendoTrack) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Ressource indisponible" }, { status: 502 });
  }
}
