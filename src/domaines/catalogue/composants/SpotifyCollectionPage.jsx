"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PlayIcon, Album01Icon } from "@hugeicons/core-free-icons";
import { PochetteImage } from "@/composants/ui/PochetteImage";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { spotifyItem, spotifyRequest } from "@/domaines/statistiques/services/spotify";

const formatDuration = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function SpotifyCollectionPage({ kind, resourceId }) {
  const [state, setState] = useState({ loading: true, collection: null, tracks: [], error: "" });
  const setQueue = useLecteurStore(player => player.setQueue);
  const setCurrentTrack = useLecteurStore(player => player.setCurrentTrack);
  const startPlayback = useLecteurStore(player => player.play);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const album = kind === "albums";
        const endpoint = album ? `albums/${encodeURIComponent(resourceId)}` : `playlists/${encodeURIComponent(resourceId)}`;
        const collection = await spotifyRequest(`${endpoint}?market=from_token`, { signal: controller.signal });
        const itemsEndpoint = album
          ? `${endpoint}/tracks?limit=50&market=from_token`
          : `${endpoint}/items?limit=50&market=from_token`;
        const page = await spotifyRequest(itemsEndpoint, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const tracks = (page.items || []).map(row => row.item || row.track || row).filter(item => item?.type === "track" && item.id).map(item => spotifyItem(album ? {
          ...item,
          album: { name: collection.name, images: collection.images, external_urls: collection.external_urls },
        } : item));
        setState({ loading: false, collection, tracks, error: tracks.length ? "" : "Aucun morceau lisible n’est disponible pour cette collection." });
      } catch (error) {
        if (!controller.signal.aborted) setState({ loading: false, collection: null, tracks: [], error: error?.message || "Cette collection Spotify n’est pas accessible avec votre compte." });
      }
    };
    load();
    return () => controller.abort();
  }, [kind, resourceId]);

  const play = (track) => {
    if (!state.tracks.length) return;
    setQueue(state.tracks, state.collection?.name || "Collection Spotify");
    if (track) setCurrentTrack(track);
    startPlayback();
  };
  const collection = state.collection;
  const image = collection?.images?.[0]?.url || "/placeholders/audio-cover.svg";

  return <main className="min-h-screen bg-[#060b18] px-4 pb-36 pt-8 text-[#eff4ff] sm:px-8 lg:px-12">
    <Link href={kind === "albums" ? "/albums" : "/playlists"} className="inline-flex items-center gap-2 text-sm font-bold text-[#aab8d2] hover:text-[#a6f6ef]"><HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Retour aux collections</Link>
    {state.loading ? <p className="mt-12" role="status">Chargement de la collection Spotify…</p> : collection ? <>
      <header className="mt-8 flex flex-col items-start gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
        <PochetteImage unoptimized src={image} alt="" width={240} height={240} className="h-48 w-48 rounded-2xl object-cover shadow-2xl sm:h-60 sm:w-60" />
        <div className="min-w-0"><span className="text-xs font-extrabold uppercase tracking-[.16em] text-[#a6f6ef]">{kind === "albums" ? "ALBUM SPOTIFY" : "PLAYLIST SPOTIFY"}</span><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{collection.name}</h1><p className="mt-3 text-sm text-[#abb9d2]">{kind === "albums" ? (collection.artists || []).map(artist => artist.name).join(", ") : collection.description || collection.owner?.display_name || "Spotify"}</p><p className="mt-2 text-sm text-[#abb9d2]">{state.tracks.length} titres · lecture dans Audiva</p><button type="button" disabled={!state.tracks.length} onClick={() => play()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#76eee9] px-5 py-3 text-sm font-extrabold text-[#071523] disabled:opacity-50"><HugeiconsIcon icon={PlayIcon} size={17} fill="currentColor" /> Tout écouter</button></div>
      </header>
      {state.error && <p className="mt-6 rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm text-[#c5d0e4]" role="status">{state.error}</p>}
      <section className="mt-8" aria-label="Morceaux de la collection">
        {state.tracks.map((track, index) => <article key={track.id} className="group flex items-center gap-3 border-b border-white/[.06] px-2 py-3 hover:bg-white/[.04] sm:gap-4 sm:px-4">
          <span className="w-7 text-center text-xs font-bold text-[#7f8da8]">{index + 1}</span><PochetteImage unoptimized src={track.cover} alt="" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
          <button type="button" onClick={() => play(track)} className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm text-white group-hover:text-[#a6f6ef]">{track.title}</strong><span className="mt-1 block truncate text-xs text-[#9aa8c0]">{track.artist}</span></button>
          <span className="hidden text-xs text-[#8694ad] sm:block">{track.album}</span><span className="w-12 text-right text-xs tabular-nums text-[#9aa8c0]">{formatDuration(track.duration)}</span>
        </article>)}
      </section>
      <a className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#90a0ba] hover:text-[#a6f6ef]" href={collection.external_urls?.spotify} target="_blank" rel="noreferrer"><HugeiconsIcon icon={Album01Icon} size={15} /> Source Spotify ↗</a>
    </> : <section className="mt-12 max-w-2xl rounded-2xl border border-white/10 bg-[#0b1426] p-6"><h1 className="text-2xl font-bold">Collection indisponible</h1><p className="mt-3 text-sm leading-6 text-[#aab8d2]">{state.error}</p><p className="mt-3 text-sm text-[#8392ad]">Vérifiez que Spotify est connecté et que cette playlist est accessible à votre compte.</p></section>}
  </main>;
}
