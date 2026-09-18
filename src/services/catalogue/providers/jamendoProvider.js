import { searchScore } from "@/services/catalogue/normalisation";

const BASE_URL = "https://api.jamendo.com/v3.0";
const artwork = (url) => url ? { small: url, medium: url, large: url } : null;

export async function searchJamendo(query, { signal, type = "all" } = {}) {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) throw new Error("Jamendo non configuré");
  const endpoint = type === "artists" ? "artists" : type === "albums" ? "albums" : type === "playlists" ? "playlists" : "tracks";
  const url = new URL(`${BASE_URL}/${endpoint}/`);
  url.searchParams.set("client_id", clientId); url.searchParams.set("format", "json"); url.searchParams.set("limit", "20");
  url.searchParams.set("namesearch", query);
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Jamendo ${response.status}`);
  const { results = [] } = await response.json();
  return results.map((item) => {
    if (type === "artists") return { id: `jamendo:artist:${item.id}`, provider: "jamendo", providerId: String(item.id), type: "artists", title: item.name, artist: item.name, image: item.image || null, genres: item.genres || [] };
    if (type === "albums") return { id: `jamendo:album:${item.id}`, provider: "jamendo", providerId: String(item.id), type: "albums", title: item.name, artist: item.artist_name || "Artiste inconnu", image: item.image || null, genre: item.genre || "", artwork: artwork(item.image) };
    if (type === "playlists") return { id: `jamendo:playlist:${item.id}`, provider: "jamendo", providerId: String(item.id), type: "playlists", title: item.name, artist: item.user_name || "Jamendo", image: item.image || null, description: item.description || "" };
    return { id: `jamendo:track:${item.id}`, provider: "jamendo", providerId: String(item.id), type: "tracks", title: item.name, artist: item.artist_name || "Artiste inconnu", artistId: item.artist_id ? String(item.artist_id) : null, album: item.album_name || "", duration: Number(item.duration) || 0, genre: item.musicinfo?.tags?.genres?.[0] || "", genres: item.musicinfo?.tags?.genres || [], artwork: artwork(item.image), image: item.image || null, streamUrl: item.audio || item.audiodownload || null };
  }).map((item) => ({ ...item, searchScore: searchScore(item, query) }));
}
