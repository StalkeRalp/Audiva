import { dedupeTracks, searchScore, normalizeText } from "@/services/catalogue/normalisation";

/** Private browser-only provider: it never makes a network request. */
export const LocalMusicProvider = {
  id: "local",
  search(query, tracks, type = "all") {
    const needle = normalizeText(query);
    const matching = tracks.filter((track) => normalizeText([track.title, track.artist, track.album, track.genre].join(" ")).includes(needle));
    const results = [];
    if (["all", "tracks"].includes(type)) results.push(...dedupeTracks(matching).map((track) => ({
      ...track, id: track.id || `local:${track.localId}`, provider: "local", providerId: track.localId || track.id, localId: track.localId || track.id, filePath: track.filePath || null, type: "tracks", image: track.cover || null, artwork: track.cover ? { small: track.cover, medium: track.cover, large: track.cover } : null, searchScore: searchScore(track, query),
    })));
    if (["all", "artists"].includes(type)) results.push(...[...new Map(matching.map((track) => [normalizeText(track.artist), track])).values()].map((track) => ({ id: `local:artist:${normalizeText(track.artist)}`, provider: "local", providerId: normalizeText(track.artist), type: "artists", title: track.artist, artist: track.artist, image: track.cover || null, genres: track.genre ? [track.genre] : [], searchScore: searchScore({ artist: track.artist }, query) })));
    if (["all", "albums"].includes(type)) results.push(...[...new Map(matching.filter((track) => track.album).map((track) => [`${normalizeText(track.album)}|${normalizeText(track.artist)}`, track])).values()].map((track) => ({ id: `local:album:${normalizeText(track.album)}:${normalizeText(track.artist)}`, provider: "local", providerId: `${track.album}:${track.artist}`, type: "albums", title: track.album, artist: track.artist, image: track.cover || null, genre: track.genre || "", searchScore: searchScore({ album: track.album }, query) })));
    return results;
  },
};
