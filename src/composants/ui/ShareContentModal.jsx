"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, MusicNote01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { demoQueue, useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { usePlaylistsStore } from "@/domaines/playlists/stores/playlistsStore";

export default function ShareContentModal({ isOpen, onClose, initialKind = "track", onShare }) {
  const currentTrack = useLecteurStore((state) => state.currentTrack);
  const playlists = usePlaylistsStore((state) => state.playlists);
  const [kindOverride, setKindOverride] = useState(null);
  const kind = kindOverride || initialKind;
  const close = () => { setKindOverride(null); onClose(); };
  const tracks = useMemo(() => {
    const byId = new Map(demoQueue.map((track) => [track.id, track]));
    if (currentTrack) byId.set(currentTrack.id, currentTrack);
    return [...byId.values()];
  }, [currentTrack]);

  if (!isOpen) return null;
  const choose = (item) => {
    const shared = kind === "track"
      ? { kind: "morceau", id: item.id, title: item.title, subtitle: `${item.artist} · ${item.album || "Audiva"}`, cover: item.cover }
      : { kind: "playlist", id: item.id, title: item.title, subtitle: `${item.tracks?.length || 0} morceau${(item.tracks?.length || 0) > 1 ? "x" : ""} · ${item.description || "Playlist Audiva"}`, cover: item.cover || "/hero-playlist.jpg" };
    onShare(shared);
    close();
  };
  const items = kind === "track" ? tracks : playlists;

  return <div role="dialog" aria-modal="true" aria-labelledby="share-content-title" className="fixed inset-0 z-[100] grid place-items-center bg-[#02050d]/80 p-4 backdrop-blur-sm" onMouseDown={close}>
    <section onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl border border-white/12 bg-[#0d1527] p-5 shadow-2xl sm:p-6">
      <header className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#72eee7]">Partage Audiva</p><h2 id="share-content-title" className="mt-2 text-2xl font-black text-white">Que voulez-vous partager ?</h2><p className="mt-2 text-sm text-[#aebbd7]">Choisissez un morceau ou une playlist avant l’envoi.</p></div><button type="button" onClick={close} className="grid h-9 w-9 place-items-center text-[#b9c5d9] hover:bg-white/5" aria-label="Fermer"><HugeiconsIcon icon={Cancel01Icon} size={20} /></button></header>
      <div className="mt-6 grid grid-cols-2 gap-2"><button type="button" onClick={() => setKindOverride("track")} className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-extrabold transition ${kind === "track" ? "bg-[#72eee7] text-[#061426]" : "border border-white/12 text-[#cbd6ea] hover:bg-white/5"}`}><HugeiconsIcon icon={MusicNote01Icon} size={18} />Un morceau</button><button type="button" onClick={() => setKindOverride("playlist")} className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-extrabold transition ${kind === "playlist" ? "bg-[#72eee7] text-[#061426]" : "border border-white/12 text-[#cbd6ea] hover:bg-white/5"}`}><HugeiconsIcon icon={Share01Icon} size={18} />Une playlist</button></div>
      <div className="mt-4 max-h-[45dvh] space-y-2 overflow-y-auto pr-1">{items.length ? items.map((item) => <button type="button" key={item.id} onClick={() => choose(item)} className="flex w-full items-center gap-3 border border-transparent bg-[#07101e] p-3 text-left transition hover:border-[#72eee7]/45 hover:bg-[#10203a]"><span className="relative h-12 w-12 shrink-0 overflow-hidden bg-[#152444]"><Image src={item.cover || "/hero-playlist.jpg"} alt="" fill sizes="48px" className="object-cover" /></span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-white">{item.title}</b><span className="mt-1 block truncate text-xs text-[#91a0bd]">{kind === "track" ? `${item.artist} · ${item.album || "Audiva"}` : `${item.tracks?.length || 0} morceau${(item.tracks?.length || 0) > 1 ? "x" : ""}`}</span></span><HugeiconsIcon icon={Share01Icon} size={18} className="text-[#72eee7]" /></button>) : <p className="border border-dashed border-white/15 px-4 py-10 text-center text-sm text-[#91a0bd]">Aucune playlist créée pour le moment.</p>}</div>
    </section>
  </div>;
}
