import { searchAudius } from "@/services/catalogue/providers/audiusProvider";
import { searchJamendo } from "@/services/catalogue/providers/jamendoProvider";
import { dedupeTracks } from "@/services/catalogue/normalisation";

export const runtime = "nodejs";
const TYPES = new Set(["all", "tracks", "artists", "albums", "playlists"]);

function withTimeout(task, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return task(controller.signal).finally(() => clearTimeout(timer));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const type = TYPES.has(searchParams.get("type")) ? searchParams.get("type") : "all";
  if (!query) return Response.json({ results: [], unavailable: false });
  const requestedTypes = type === "all" ? ["tracks", "artists", "albums", "playlists"] : [type];
  const settled = await Promise.allSettled(requestedTypes.flatMap((providerType) => [
    withTimeout((signal) => searchAudius(query, { signal, type: providerType })),
    withTimeout((signal) => searchJamendo(query, { signal, type: providerType })),
  ]));
  const results = dedupeTracks(settled.flatMap((result) => result.status === "fulfilled" ? result.value : [])).sort((a, b) => b.searchScore - a.searchScore);
  return Response.json({ results, unavailable: settled.some((result) => result.status === "rejected") });
}
