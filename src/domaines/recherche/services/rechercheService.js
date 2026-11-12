import { searchSpotify } from "@/domaines/statistiques/services/spotify";
import { LocalMusicProvider } from "@/domaines/bibliotheque/services/localMusicProvider";
import { dedupeTracks, normalizeText, searchScore } from "@/services/catalogue/normalisation";

export async function searchContent(query, { type = "all", localTracks = [], signal } = {}) {
  const genre = String(query || "").trim().match(/^genre:(.+)$/i)?.[1]?.trim();
  const requestedType = genre ? "tracks" : type;
  const remote = searchSpotify(query, { type: requestedType, signal }).then(results => ({ results, unavailable: false }));
  const local = Promise.resolve(genre
    ? localTracks.filter(track => normalizeText([track.genre, ...(Array.isArray(track.genres) ? track.genres : [])].join(" ")).includes(normalizeText(genre)))
      .map(track => ({ ...track, id: track.id || `local:${track.localId}`, provider: "local", providerId: track.localId || track.id, type: "tracks", image: track.cover || null }))
    : LocalMusicProvider.search(query, localTracks, type));
  const [remoteResult, localResult] = await Promise.allSettled([remote, local]);
  const payload = remoteResult.status === "fulfilled" ? remoteResult.value : { results: [], unavailable: true };
  const results = dedupeTracks([...payload.results, ...(localResult.status === "fulfilled" ? localResult.value : [])]).sort((a,b)=>Number(b.provider === "spotify")-Number(a.provider === "spotify") || searchScore(b,query)-searchScore(a,query));
  return { results, source: "spotify", message: remoteResult.status === "rejected" ? remoteResult.reason?.message || "La recherche dans le catalogue est momentanément indisponible." : "", unavailable: payload.unavailable || remoteResult.status === "rejected" };
}
