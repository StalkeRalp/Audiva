import { searchScore } from "@/services/catalogue/normalisation";

const BASE_URL = "https://api.audius.co/v1";

function artwork(value) {
  if (!value) return null;
  return { small: value._150x150 || value["150x150"], medium: value._480x480 || value["480x480"], large: value._1000x1000 || value["1000x1000"] };
}

function headers() {
  return process.env.AUDIUS_BEARER_TOKEN ? { Authorization: `Bearer ${process.env.AUDIUS_BEARER_TOKEN}` } : {};
}

export async function searchAudius(query, { signal, type = "all" } = {}) {
  const apiKey = process.env.AUDIUS_API_KEY;
  if (!apiKey && !process.env.AUDIUS_BEARER_TOKEN) throw new Error("Audius non configuré");
  const resource = type === "artists" ? "users/search" : type === "albums" ? "albums/search" : type === "playlists" ? "playlists/search" : "tracks/search";
  const url = new URL(`${BASE_URL}/${resource}`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "20");
  if (apiKey) url.searchParams.set("api_key", apiKey);
  const response = await fetch(url, { headers: headers(), signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Audius ${response.status}`);
  const { data = [] } = await response.json();
  return data.map((item) => {
    if (type === "artists") return { id: `audius:artist:${item.id}`, provider: "audius", providerId: String(item.id), type: "artists", title: item.name, artist: item.name, image: artwork(item.profile_picture)?.medium, genres: item.tags ? item.tags.split(",") : [], bio: item.bio || "" };
    if (type === "albums") return { id: `audius:album:${item.id}`, provider: "audius", providerId: String(item.id), type: "albums", title: item.album_name || item.playlist_name, artist: item.user?.name || "Artiste inconnu", image: artwork(item.artwork)?.medium, genre: item.genre || "", artwork: artwork(item.artwork) };
    if (type === "playlists") return { id: `audius:playlist:${item.id}`, provider: "audius", providerId: String(item.id), type: "playlists", title: item.playlist_name, artist: item.user?.name || "Audius", image: artwork(item.artwork)?.medium, description: item.description || "" };
    return { id: `audius:track:${item.id}`, provider: "audius", providerId: String(item.id), type: "tracks", title: item.title, artist: item.user?.name || "Artiste inconnu", artistId: item.user?.id ? String(item.user.id) : null, album: item.album?.album_name || "", duration: Number(item.duration) || 0, genre: item.genre || "", genres: item.tags ? item.tags.split(",") : [], artwork: artwork(item.artwork), image: artwork(item.artwork)?.medium, streamUrl: `/api/catalogue/stream?provider=audius&id=${encodeURIComponent(item.id)}` };
  }).map((item) => ({ ...item, searchScore: searchScore(item, query) }));
}
