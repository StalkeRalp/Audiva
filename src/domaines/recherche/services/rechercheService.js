import { LocalMusicProvider } from "@/domaines/bibliotheque/services/localMusicProvider";
import { dedupeTracks } from "@/services/catalogue/normalisation";

export async function searchContent(query, { type = "all", localTracks = [], signal } = {}) {
  const remote = fetch(`/api/catalogue/search?q=${encodeURIComponent(query)}&type=${type}`, { signal }).then(async (response) => {
    if (!response.ok) throw new Error("Recherche distante indisponible");
    return response.json();
  });
  const local = Promise.resolve(LocalMusicProvider.search(query, localTracks, type));
  const [remoteResult, localResult] = await Promise.allSettled([remote, local]);
  const payload = remoteResult.status === "fulfilled" ? remoteResult.value : { results: [], unavailable: true };
  const results = dedupeTracks([...payload.results, ...(localResult.status === "fulfilled" ? localResult.value : [])]).sort((a, b) => b.searchScore - a.searchScore);
  return { results, unavailable: payload.unavailable || remoteResult.status === "rejected" };
}
