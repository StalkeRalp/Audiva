"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

const duration = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function ProviderDetailPage({ resourceId, type }) {
  const player = useLecteurStore(); const [state, setState] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    const [provider, id] = decodeURIComponent(resourceId).split(":"); const controller = new AbortController();
    fetch(`/api/catalogue/detail?provider=${encodeURIComponent(provider)}&id=${encodeURIComponent(id)}&type=${type}`, { signal: controller.signal }).then(async (response) => { if (!response.ok) throw new Error((await response.json()).error || "Indisponible"); return response.json(); }).then((data) => setState({ loading: false, data, error: "" })).catch((error) => { if (!controller.signal.aborted) setState({ loading: false, data: null, error: error.message }); });
    return () => controller.abort();
  }, [resourceId, type]);
  if (state.loading) return <main className="min-h-screen bg-[#060b18] p-10 text-white"><div className="h-72 animate-pulse bg-[#0b1426]" /></main>;
  if (state.error || !state.data) return <main className="min-h-screen bg-[#060b18] p-10 text-white"><h1 className="text-2xl font-black">Contenu indisponible</h1><p className="mt-3 text-sm text-[#aebad0]">{state.error || "Cette ressource n’est plus disponible chez son provider."}</p></main>;
  const { data } = state; const play = (track = data.tracks[0]) => { if (!track) return; player.setQueue(data.tracks, data.title); player.setCurrentTrack(track); player.play(); };
  return <main className="min-h-screen bg-[#060b18] pb-32 text-[#eff4ff]"><section className="relative overflow-hidden border-b border-white/[.08] bg-[#0a1324] px-5 py-10 sm:px-10"><div className="mx-auto flex max-w-[1500px] flex-col gap-6 sm:flex-row sm:items-end"><Image unoptimized src={data.image || "/placeholders/audio-cover.svg"} alt="" width={220} height={220} className="h-44 w-44 object-cover shadow-2xl sm:h-52 sm:w-52" /><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#72eee7]">{type === "artists" ? "Artiste" : type === "albums" ? "Album" : "Playlist"} · {data.provider}</p><h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">{data.title}</h1><p className="mt-3 text-sm font-bold text-[#c7d3e8]">{data.artist}</p>{data.description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-[#aebad0]">{data.description}</p> : null}<button type="button" onClick={() => play()} disabled={!data.tracks.length} className="mt-6 inline-flex items-center gap-2 bg-[#72eee7] px-5 py-3 text-sm font-extrabold text-[#061426] disabled:opacity-40"><HugeiconsIcon icon={PlayIcon} size={18} fill="currentColor" />Lire</button></div></div></section><section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7"><h2 className="text-2xl font-black">Morceaux</h2>{data.tracks.length ? <div className="mt-5 overflow-hidden border border-white/[.08] bg-[#0a1221]">{data.tracks.map((track, index) => <button type="button" key={track.id} onClick={() => play(track)} className="flex w-full items-center gap-4 border-b border-white/[.06] px-4 py-3 text-left hover:bg-white/[.05]"><span className="w-5 text-sm text-[#91a0bd]">{index + 1}</span><Image unoptimized src={track.image || data.image || "/placeholders/audio-cover.svg"} alt="" width={44} height={44} className="h-11 w-11 object-cover" /><span className="min-w-0 flex-1"><b className="block truncate text-sm">{track.title}</b><small className="block truncate text-xs text-[#91a0bd]">{track.artist} · {track.album}</small></span><span className="text-xs text-[#91a0bd]">{duration(track.duration)}</span></button>)}</div> : <p className="mt-5 text-sm text-[#91a0bd]">Aucun morceau disponible pour cette ressource.</p>}</section></main>;
}
