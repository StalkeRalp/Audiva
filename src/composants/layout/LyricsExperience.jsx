"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, MusicNote01Icon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

export function LyricsExperience() {
  const { lyricsOpen, currentTrack: track, currentTime, toggleLyrics, seek, setTrackLyrics } = useLecteurStore();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [lookup, setLookup] = useState({ trackId: null, status: "idle", lyrics: null });
  const lyricContainer = useRef(null);

  useEffect(() => {
    if (!lyricsOpen || !track || track.lyrics) return undefined;
    const controller = new AbortController();
    fetch(`/api/lyrics/track?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { lyrics: [] })
      .then((data) => {
        if (controller.signal.aborted) return;
        const lyrics = Array.isArray(data.lyrics) ? data.lyrics : [];
        setLookup({ trackId: track.id, status: lyrics.length ? "ready" : "empty", lyrics });
        if (lyrics.length) setTrackLyrics(track.id, lyrics);
      })
      .catch(() => { if (!controller.signal.aborted) setLookup({ trackId: track.id, status: "empty", lyrics: [] }); });
    return () => controller.abort();
  }, [lyricsOpen, setTrackLyrics, track]);

  useEffect(() => {
    if (!lyricsOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [lyricsOpen]);

  const lyrics = track?.lyrics || (lookup.trackId === track?.id ? lookup.lyrics : null);
  const activeTime = lyrics?.reduce((result, line) => currentTime >= line.time ? line.time : result, 0);

  useEffect(() => {
    if (!lyricsOpen || activeTime === undefined) return;
    lyricContainer.current?.querySelector(`[data-lyric-time="${activeTime}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeTime, lyricsOpen]);

  if (!mounted || !lyricsOpen || !track) return null;
  const goTo = (time) => { const audio = document.querySelector("audio"); if (audio) audio.currentTime = time; seek(time); };

  return createPortal(
    <section role="dialog" aria-label="Paroles synchronisées" className="fixed bottom-0 left-0 right-0 top-[72px] z-40 grid bg-[#060b18] text-[#eff4ff] lg:left-64 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div ref={lyricContainer} className="relative overflow-y-auto bg-[linear-gradient(135deg,#071a36,#0b1430_66%,#060b18)] px-8 py-10 sm:px-16 lg:px-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_8%,rgba(80,128,255,.22),transparent_36%)]" />
        <div className="relative mx-auto max-w-4xl">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#83eee8]">Paroles synchronisées</p><p className="mt-2 text-sm font-semibold text-[#c1cce3]">{track.title} · {track.artist}</p></div><button type="button" onClick={toggleLyrics} aria-label="Fermer les paroles" className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-[#07101e]/70 transition hover:scale-105 hover:bg-white/10"><HugeiconsIcon icon={Cancel01Icon} size={22} /></button></div>
          {lyrics?.length ? <div className="mt-14 space-y-8 pb-20">{lyrics.map((line) => <button type="button" key={line.time} data-lyric-time={line.time} onClick={() => goTo(line.time)} className={`block w-full text-left text-3xl font-black leading-tight tracking-[-.04em] transition sm:text-5xl ${line.time === activeTime ? "scale-[1.02] text-white underline decoration-[#72eee7] underline-offset-8" : "text-[#7d8ba8] hover:text-[#c6d7ef]"}`}>{line.text}</button>)}</div> : <LyricState loading={lookup.trackId !== track.id || lookup.status === "loading"} />}
        </div>
      </div>
      <aside className="hidden overflow-y-auto border-l border-white/8 bg-[#0a1221] p-4 lg:block"><p className="text-sm font-extrabold">Lecture en cours</p><div className="relative mt-7 aspect-square overflow-hidden rounded-2xl"><Image src={track.cover} alt={`Pochette de ${track.title}`} fill sizes="360px" className="object-cover" /></div><div className="mt-5"><p className="text-xl font-black">{track.title}</p><p className="mt-1 text-sm text-[#aab7d0]">{track.artist} · {track.album}</p></div><div className="mt-7 overflow-hidden rounded-2xl border border-white/7 bg-[#0d1728]"><Image src="/hero-decouverte.jpg" alt="" width={400} height={210} className="h-44 w-full object-cover opacity-80" /><div className="p-4"><p className="font-extrabold">À propos de l’artiste</p><p className="mt-2 text-xs leading-5 text-[#9ba9c2]">Découvrez les univers qui inspirent cette sélection et poursuivez votre écoute.</p></div></div></aside>
    </section>,
    document.body,
  );
}

function LyricState({ loading }) {
  return <div className="mt-20 grid min-h-72 place-items-center border border-white/10 bg-[#07101e]/45 p-8 text-center"><div><HugeiconsIcon icon={MusicNote01Icon} size={34} className={`mx-auto text-[#72eee7] ${loading ? "animate-pulse" : ""}`} /><p className="mt-4 text-lg font-extrabold">{loading ? "Recherche des paroles…" : "Paroles indisponibles"}</p><p className="mt-2 text-sm text-[#91a0bd]">{loading ? "Audiva cherche une version synchronisée pour ce morceau." : "Aucune parole synchronisée n’est disponible pour ce morceau."}</p></div></div>;
}
