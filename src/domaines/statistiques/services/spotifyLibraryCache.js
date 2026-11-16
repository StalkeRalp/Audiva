const STORAGE_KEY = "audiva-spotify-followed-playlists";
const MAX_CACHED_PLAYLISTS = 40;
const MAX_CACHED_TRACKS = 300;

function readAll() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(item => item?.providerId && item?.title) : [];
  } catch { return []; }
}

function writeAll(items) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_CACHED_PLAYLISTS)));
    return true;
  } catch { return false; }
}

function compactTrack(track) {
  if (!track?.providerId && !track?.id) return null;
  return {
    id: track.id,
    provider: "spotify",
    providerId: track.providerId,
    type: "tracks",
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: Number(track.duration) || 0,
    cover: track.cover || track.image || "",
    image: track.image || track.cover || "",
    uri: track.uri,
  };
}

export function readFollowedSpotifyPlaylists() {
  return readAll();
}

export function rememberFollowedSpotifyPlaylist(playlist) {
  const items = readAll();
  const entry = {
    provider: "spotify",
    providerId: playlist.providerId,
    id: playlist.providerId,
    type: "playlists",
    title: playlist.title,
    artist: playlist.artist || playlist.owner || "Spotify",
    owner: playlist.owner || playlist.artist || "Spotify",
    description: playlist.description || "",
    trackCount: Number(playlist.trackCount) || 0,
    cover: playlist.cover || playlist.image || "",
    image: playlist.image || playlist.cover || "",
    uri: `spotify:playlist:${playlist.providerId}`,
    externalUrl: playlist.externalUrl || `https://open.spotify.com/playlist/${playlist.providerId}`,
    followedAt: new Date().toISOString(),
    cachedAt: new Date().toISOString(),
    tracks: Array.isArray(playlist.tracks) ? playlist.tracks.slice(0, MAX_CACHED_TRACKS).map(compactTrack).filter(Boolean) : [],
  };
  return writeAll([entry, ...items.filter(item => item.providerId !== entry.providerId)]);
}

export function cacheFollowedSpotifyPlaylistSnapshot(playlistId, collection, tracks) {
  const items = readAll();
  const index = items.findIndex(item => item.providerId === playlistId);
  if (index < 0) return false;
  const previous = items[index];
  const next = [...items];
  next[index] = {
    ...previous,
    title: collection?.name || previous.title,
    description: collection?.description || previous.description,
    owner: collection?.owner?.display_name || previous.owner,
    artist: collection?.owner?.display_name || previous.artist,
    cover: collection?.images?.[0]?.url || previous.cover,
    image: collection?.images?.[0]?.url || previous.image,
    trackCount: Number(collection?.items?.total ?? collection?.tracks?.total) || previous.trackCount,
    tracks: Array.isArray(tracks) && tracks.length ? tracks.slice(0, MAX_CACHED_TRACKS).map(compactTrack).filter(Boolean) : previous.tracks,
    cachedAt: new Date().toISOString(),
  };
  return writeAll(next);
}

export function getCachedSpotifyPlaylist(playlistId) {
  return readAll().find(item => item.providerId === playlistId) || null;
}
