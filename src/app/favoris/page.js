"use client";

import Image from "next/image";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, FavouriteIcon, MoreHorizontalIcon, PlayIcon, Queue01Icon, Search01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import CreatePlaylistButton from "@/domaines/playlists/composants/CreatePlaylistButton";
import { demoQueue, useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";

const sortOptions = {
  recent: "Ajoutés récemment",
  title: "Titre : A à Z",
  artist: "Artiste : A à Z",
};

export default function FavorisPage() {
  const router = useRouter();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [menuId, setMenuId] = useState(null);
  const [notice, setNotice] = useState("");
  const { likedTrackIds, currentTrack, isPlaying, setCurrentTrack, setQueue, play, pause, toggleLike, addToQueue } = useLecteurStore(); const { tracks: localTracks } = useBibliothequeStore();

  const favorites = useMemo(() => {
    const collection = [...demoQueue, ...localTracks].filter((track) => likedTrackIds.includes(track.id));
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery ? collection.filter((track) => `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(normalizedQuery)) : collection;
    return [...filtered].sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "artist" ? a.artist.localeCompare(b.artist) : 0);
  }, [likedTrackIds, localTracks, query, sort]);
  const displayFavorites = mounted ? favorites : [];
  const totalDuration = displayFavorites.reduce((total, track) => total + (track.duration || 0), 0);
  const formatTime = (seconds) => `${Math.floor(seconds / 60)} min`;
  const notify = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 2400); };
  const launch = (track) => {
    if (currentTrack?.id === track.id && isPlaying) pause();
    else { setCurrentTrack(track); play(); }
  };
  const playAll = () => {
    if (!displayFavorites.length) return;
    setQueue(displayFavorites);
    setCurrentTrack(displayFavorites[0]);
    play();
    notify("Vos favoris sont chargés dans la file");
  };
  const shareFavorites = async () => {
    const shareData = { title: "Mes favoris Audiva", text: "Découvrez ma sélection de favoris sur Audiva.", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard?.writeText(`${shareData.text} ${shareData.url}`);
      notify("Lien de vos favoris copié");
    } catch (error) {
      if (error?.name !== "AbortError") notify("Partage indisponible pour le moment");
    }
  };

  return <main className="min-h-screen bg-[#060b18] pb-32 text-[#eff4ff] lg:flex">
    <div className="min-w-0 flex-1">
      <section className="relative isolate min-h-[390px] overflow-hidden border-b border-white/[.07] bg-[#080e1b] px-5 pb-12 pt-12 sm:px-10 lg:px-14">
        <div className="absolute inset-0 opacity-72"><Image src="/favoris2.jpg" alt="" fill priority className="scale-[1.06] object-cover object-[center_63%]" /></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(81,124,255,.28),transparent_38%),linear-gradient(90deg,rgba(6,11,24,.93)_4%,rgba(6,11,24,.68)_48%,rgba(6,11,24,.24))]" />
        <div className="absolute inset-x-0 bottom-0 h-[84%] bg-gradient-to-b from-transparent via-[#060b18]/38 to-[#060b18]" />
        <div className="relative mx-auto flex max-w-[1500px] flex-col justify-end gap-7 sm:min-h-[338px] sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5"><div className="grid h-28 w-28 shrink-0 place-items-center bg-[linear-gradient(145deg,#2e3a8e,#17254a_50%,#0d172c)] shadow-[0_18px_42px_rgba(0,0,0,.35)] sm:h-40 sm:w-40"><HugeiconsIcon icon={FavouriteIcon} size={55} strokeWidth={1.65} className="text-[#72eee7]" fill="rgba(114,238,231,.22)" /></div><div className="pb-1"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#83eee8]">Votre collection</p><h1 className="mt-2 text-4xl font-black tracking-[-.055em] text-white sm:text-6xl">Mes favoris</h1><p className="mt-3 text-sm font-medium text-[#bdc9e6]">Enoch · <b className="text-white">{displayFavorites.length} titre{displayFavorites.length !== 1 ? "s" : ""}</b>{displayFavorites.length ? ` · ${formatTime(totalDuration)}` : ""}</p></div></div>
          <div className="flex flex-wrap gap-2"><CreatePlaylistButton className="rounded-full" /><button type="button" onClick={shareFavorites} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[.08] px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:border-[#72eee7]/45 hover:bg-white/[.14]"><HugeiconsIcon icon={Share01Icon} size={18} strokeWidth={2.3} />Partager</button></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-7 xl:px-9">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-3"><button type="button" disabled={!displayFavorites.length} onClick={playAll} className="inline-flex h-12 items-center gap-2 bg-[#72eee7] px-5 text-sm font-extrabold text-[#051326] shadow-[0_8px_26px_rgba(114,238,231,.17)] transition hover:scale-[1.02] hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><HugeiconsIcon icon={PlayIcon} size={20} fill="currentColor" />Tout écouter</button><button type="button" disabled={!displayFavorites.length} onClick={() => { displayFavorites.forEach(addToQueue); notify("Favoris ajoutés à la file d’attente"); }} className="inline-flex h-12 items-center gap-2 border border-white/12 bg-white/[.035] px-4 text-sm font-bold text-[#d7e1f5] transition hover:border-[#72eee7]/35 hover:bg-white/[.08] disabled:cursor-not-allowed disabled:opacity-40"><HugeiconsIcon icon={Queue01Icon} size={19} strokeWidth={2.2} />Ajouter à la file</button></div><div className="flex w-full items-center gap-2 lg:w-auto"><label className="flex h-11 min-w-0 flex-1 items-center gap-2 border border-white/10 bg-[#0c1425] px-3 text-[#91a0bf] transition focus-within:border-[#72eee7]/50 lg:w-64"><HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={2.2} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans vos favoris" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#71809d]" /></label><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Trier les favoris" className="h-11 border border-white/10 bg-[#0c1425] px-3 text-xs font-bold text-[#c7d2e7] outline-none transition hover:border-[#72eee7]/40">{Object.entries(sortOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
        {displayFavorites.length ? <div className="overflow-hidden border border-white/[.08] bg-[#0a1221]"><div className="grid grid-cols-[32px_minmax(200px,1.5fr)_minmax(120px,1fr)_68px_34px] border-b border-white/[.08] px-4 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#72809d]"><span>#</span><span>Titre</span><span className="hidden sm:block">Album</span><span>Durée</span><span /></div>{displayFavorites.map((track, index) => <FavoriteRow key={track.id} track={track} index={index} active={currentTrack?.id === track.id && isPlaying} menuOpen={menuId === track.id} onPlay={() => launch(track)} onToggleLike={() => { toggleLike(track); notify("Titre retiré de vos favoris"); }} onQueue={() => { addToQueue(track); notify("Titre ajouté à la file"); }} onMenu={() => setMenuId(menuId === track.id ? null : track.id)} onArtist={() => router.push(`/recherche?q=${encodeURIComponent(track.artist)}`)} />)}</div> : <EmptyFavorites onDiscover={() => router.push("/decouverte")} />}
      </section>
    </div>
    {notice ? <p role="status" className="fixed bottom-24 right-5 z-[70] border border-[#72eee7]/30 bg-[#112139] px-4 py-3 text-sm font-bold text-[#c8fffb] shadow-2xl">{notice}</p> : null}
  </main>;
}

function FavoriteRow({ track, index, active, menuOpen, onPlay, onToggleLike, onQueue, onMenu, onArtist }) {
  const duration = `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, "0")}`;
  return <div className={`group grid grid-cols-[32px_minmax(200px,1.5fr)_minmax(120px,1fr)_68px_34px] items-center px-4 py-2.5 transition hover:bg-white/[.055] ${active ? "bg-[#11284a]/65" : ""}`}><span className={`text-sm font-bold ${active ? "text-[#72eee7]" : "text-[#7886a3]"}`}>{active ? <HugeiconsIcon icon={PlayIcon} size={15} fill="currentColor" /> : index + 1}</span><button type="button" onClick={onPlay} className="flex min-w-0 items-center gap-3 text-left"><span className="relative h-11 w-11 shrink-0 overflow-hidden"><Image src={track.cover} alt={`Pochette de ${track.title}`} fill sizes="44px" className="object-cover" /><span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100"><HugeiconsIcon icon={PlayIcon} size={18} fill="currentColor" /></span></span><span className="min-w-0"><span className={`block truncate text-sm font-bold ${active ? "text-[#72eee7]" : "text-white"}`}>{track.title}</span><span className="mt-0.5 block truncate text-xs text-[#91a0bd]">{track.artist}</span></span></button><button type="button" onClick={onArtist} className="hidden truncate text-left text-xs font-medium text-[#9caac4] transition hover:text-[#72eee7] sm:block">{track.album}</button><span className="text-xs font-medium text-[#8492ad]">{duration}</span><div className="relative flex justify-end"><button type="button" onClick={onMenu} aria-label={`Actions pour ${track.title}`} className="grid h-8 w-8 place-items-center text-[#94a2bd] opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100"><HugeiconsIcon icon={MoreHorizontalIcon} size={19} strokeWidth={2.3} /></button>{menuOpen ? <div className="absolute right-0 top-9 z-20 w-48 border border-white/12 bg-[#151d2d] py-1.5 shadow-2xl"><button type="button" onClick={onQueue} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-[#d8e0f0] hover:bg-white/[.07]"><HugeiconsIcon icon={Queue01Icon} size={17} />Ajouter à la file</button><button type="button" onClick={onToggleLike} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-rose-200 hover:bg-rose-400/10"><HugeiconsIcon icon={FavouriteIcon} size={17} fill="currentColor" />Retirer des favoris</button></div> : null}</div></div>;
}

function EmptyFavorites({ onDiscover }) {
  return <div className="border border-dashed border-white/15 bg-[#0a1221] px-6 py-20 text-center"><div className="mx-auto grid h-16 w-16 place-items-center bg-[#72eee7]/10 text-[#72eee7]"><HugeiconsIcon icon={FavouriteIcon} size={32} strokeWidth={1.8} /></div><h2 className="mt-5 text-xl font-extrabold text-white">Vos favoris vous attendent</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#91a0bd]">Ajoutez un morceau depuis une découverte, un album ou le lecteur pour construire votre collection personnelle.</p><button type="button" onClick={onDiscover} className="mt-6 inline-flex items-center gap-2 bg-[#72eee7] px-5 py-3 text-sm font-extrabold text-[#051326] transition hover:scale-[1.03] hover:bg-white"><HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2.5} />Découvrir des morceaux</button></div>;
}
