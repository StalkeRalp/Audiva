import { searchSpotify } from "@/domaines/statistiques/services/spotify";
import { LocalMusicProvider } from "@/domaines/bibliotheque/services/localMusicProvider";
import { dedupeTracks, searchScore } from "@/services/catalogue/normalisation";

export async function searchContent(query, { type = "all", localTracks = [], signal } = {}) {
  const remote = searchSpotify(query,{type,signal}).then(results=>({results,unavailable:false}));
  const local = Promise.resolve(LocalMusicProvider.search(query, localTracks, type));
  const [remoteResult, localResult] = await Promise.allSettled([remote, local]);
  const payload = remoteResult.status === "fulfilled" ? remoteResult.value : { results: [], unavailable: true };
  const results = dedupeTracks([...payload.results, ...(localResult.status === "fulfilled" ? localResult.value : [])]).sort((a,b)=>Number(b.provider === "spotify")-Number(a.provider === "spotify") || searchScore(b,query)-searchScore(a,query));
  return { results, source: "spotify", message: remoteResult.status === "rejected" ? remoteResult.reason?.message || "Recherche Spotify indisponible" : "", unavailable: payload.unavailable || remoteResult.status === "rejected" };
}
