"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Album01Icon, ArrowRight01Icon, Cancel01Icon, CompassIcon, FavouriteIcon, LibraryIcon, MusicNote01Icon, PlayIcon, Queue01Icon, Search01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { topAlbums, topArtists, topPlaylists } from "@/domaines/accueil/donnees/accueilMock";
import { demoQueue, useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";

const categories = [
  { name: "Afro fusion", query: "Afro", image: "/hero-tendances.jpg", color: "from-[#d86a38]/80 to-[#17213e]" },
  { name: "Indie nocturne", query: "Afterglow", image: "/hero-recommandation.jpg", color: "from-[#4f3ac8]/75 to-[#071427]" },
  { name: "Électronique", query: "Nuit", image: "/hero-playlist.jpg", color: "from-[#15789b]/70 to-[#061a2b]" },
  { name: "Découvertes Jamendo", query: "Lila", image: "/hero-decouverte.jpg", color: "from-[#0f8c78]/70 to-[#061827]" },
];
const filters = ["Tout", "Titres", "Artistes", "Albums", "Playlists"];

export default function RecherchePage() {
  return <Suspense fallback={<SearchFallback />}><RechercheRoute /></Suspense>;
}

function RechercheRoute() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  return <RechercheContent key={initialQuery} initialQuery={initialQuery} />;
}

function RechercheContent({ initialQuery }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState("Tout");
  const [recent, setRecent] = useState(["Maya K.", "Afro Future", "Lila Sun"]);
  const [notice, setNotice] = useState("");
  const { currentTrack, isPlaying, setCurrentTrack, play, pause, toggleLike, likedTrackIds, addToQueue } = useLecteurStore();
  const localTracks = useBibliothequeStore((state) => state.tracks);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const catalog = useMemo(() => [
    ...demoQueue.map((item) => ({ ...item, type: "Titres", image: item.cover })),
    ...localTracks.map((item) => ({ ...item, type: "Titres", image: item.cover, query: `${item.title} ${item.artist} ${item.album || ""} fichier local importé` })),
    ...topArtists.map((item) => ({ id: `artist-${item.id}`, type: "Artistes", title: item.name, artist: `${item.listeners} auditeurs mensuels`, image: item.image, query: item.name })),
    ...topAlbums.map((item) => ({ id: `album-${item.id}`, type: "Albums", title: item.title, artist: item.artist, image: item.cover, query: `${item.title} ${item.artist}` })),
    ...topPlaylists.map((item) => ({ id: `playlist-${item.id}`, type: "Playlists", title: item.title, artist: `${item.tracks} morceaux · ${item.updatedAt}`, image: item.cover, query: `${item.title} ${item.description}` })),
  ], [localTracks]);
  const results = useMemo(() => catalog.filter((item) => {
    const haystack = `${item.title} ${item.artist} ${item.album || ""} ${item.query || ""}`.toLowerCase();
    return (!normalizedQuery || haystack.includes(normalizedQuery)) && (filter === "Tout" || item.type === filter);
  }), [catalog, filter, normalizedQuery]);
  const searching = normalizedQuery.length > 0;
  const notify = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 2200); };
  const submit = (event) => { event.preventDefault(); if (!normalizedQuery) return; setRecent((items) => [query.trim(), ...items.filter((item) => item.toLowerCase() !== normalizedQuery)].slice(0, 4)); router.replace(`/recherche?q=${encodeURIComponent(query.trim())}`); };
  const playTrack = (track) => { if (currentTrack?.id === track.id && isPlaying) pause(); else { setCurrentTrack(track); play(); } };

  return <main className="min-h-screen bg-[#060b18] pb-32 text-[#eff4ff] lg:flex">
    <div className="min-w-0 flex-1">
      <section className="relative isolate overflow-hidden border-b border-white/[.07] bg-[#080f20] px-5 pb-11 pt-10 sm:px-10 lg:px-14">
        <Image src="/recherche2.jpg" alt="" fill priority className="-z-20 object-cover object-[65%_44%] opacity-30" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#060b18_4%,rgba(6,11,24,.88)_42%,rgba(6,11,24,.32)),linear-gradient(180deg,transparent_45%,#060b18_100%)]" />
        <div className="mx-auto max-w-[1500px]"><span className="inline-flex items-center gap-2 border border-[#72eee7]/35 bg-[#06192c]/65 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#86f0ff] backdrop-blur"><HugeiconsIcon icon={CompassIcon} size={15} strokeWidth={2.3} />Explorer Audiva</span><h1 className="mt-5 text-4xl font-black tracking-[-.055em] text-white sm:text-6xl">Trouve le son<br />qui te ressemble.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#c1cce3] sm:text-base">Explore ta bibliothèque, les artistes indépendants, Jamendo et les playlists partagées par la communauté.</p><p className="mt-6 hidden items-center gap-2 text-sm font-semibold text-[#b9c7e2] md:flex"><HugeiconsIcon icon={Search01Icon} size={18} className="text-[#72eee7]" />Utilisez la recherche dans la barre de navigation pour explorer Audiva.</p><form onSubmit={submit} className="mt-7 flex max-w-2xl items-center border border-white/14 bg-[#07111f]/80 p-1.5 shadow-2xl backdrop-blur-xl transition focus-within:border-[#72eee7]/55 md:hidden"><HugeiconsIcon icon={Search01Icon} size={22} strokeWidth={2.25} className="ml-3 text-[#91a2c2]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, artiste, album, playlist…" className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-white outline-none placeholder:text-[#8694af]" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche" className="grid h-9 w-9 place-items-center text-[#95a2bb] transition hover:bg-white/10 hover:text-white"><HugeiconsIcon icon={Cancel01Icon} size={19} strokeWidth={2.3} /></button> : null}<button type="submit" className="bg-[#72eee7] px-4 py-3 text-sm font-extrabold text-[#061426] transition hover:bg-white">OK</button></form></div>
      </section>

      <section className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-7 xl:px-9">
        {searching ? <SearchResults results={results} filter={filter} setFilter={setFilter} onPlay={playTrack} onLike={(track) => { toggleLike(track); notify(likedTrackIds.includes(track.id) ? "Retiré des favoris" : "Ajouté aux favoris"); }} onQueue={(track) => { addToQueue(track); notify("Ajouté à la file d’attente"); }} onNavigate={(item) => router.push(`/recherche?q=${encodeURIComponent(item.title)}`)} currentTrack={currentTrack} isPlaying={isPlaying} /> : <BrowseView recent={recent} setQuery={setQuery} setRecent={setRecent} onExplore={(category) => { setQuery(category); setFilter("Tout"); }} />}
      </section>
    </div>
    {notice ? <p role="status" className="fixed bottom-24 right-5 z-[70] border border-[#72eee7]/30 bg-[#112139] px-4 py-3 text-sm font-bold text-[#c8fffb] shadow-2xl">{notice}</p> : null}
  </main>;
}

function SearchFallback() {
  return <main className="min-h-screen bg-[#060b18] pb-32 text-[#eff4ff] lg:flex"><div className="min-w-0 flex-1 px-5 pt-10 sm:px-10 lg:px-14"><div className="h-72 animate-pulse bg-[#0b1426]" /></div></main>;
}

function SearchResults({ results, filter, setFilter, onPlay, onLike, onQueue, onNavigate, currentTrack, isPlaying }) {
  return <><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#72eee7]">Résultats Audiva</p><h2 className="mt-2 text-2xl font-extrabold text-white">{results.length} résultat{results.length !== 1 ? "s" : ""}</h2></div><div className="flex flex-wrap gap-2">{filters.map((name) => <button type="button" key={name} onClick={() => setFilter(name)} className={`px-3 py-2 text-xs font-bold transition ${filter === name ? "bg-[#72eee7] text-[#061426]" : "border border-white/10 bg-white/[.035] text-[#aebad0] hover:border-[#72eee7]/40 hover:text-white"}`}>{name}</button>)}</div></div>{results.length ? <div className="mt-6 grid gap-2">{results.map((item) => <SearchResult key={item.id} item={item} onPlay={onPlay} onLike={onLike} onQueue={onQueue} onNavigate={onNavigate} active={currentTrack?.id === item.id && isPlaying} />)}</div> : <div className="mt-7 border border-dashed border-white/15 bg-[#0a1221] px-6 py-16 text-center"><HugeiconsIcon icon={Search01Icon} size={31} className="mx-auto text-[#72eee7]" /><h3 className="mt-4 text-lg font-extrabold text-white">Aucun résultat trouvé</h3><p className="mt-2 text-sm text-[#91a0bd]">Essaie avec un autre mot-clé, un artiste ou un genre.</p></div>}</>;
}

function SearchResult({ item, onPlay, onLike, onQueue, onNavigate, active }) {
  const isTrack = item.type === "Titres";
  const typeIcon = item.type === "Artistes" ? UserIcon : item.type === "Albums" ? Album01Icon : item.type === "Playlists" ? LibraryIcon : MusicNote01Icon;
  return <article className={`group flex items-center gap-3 border border-transparent px-3 py-2.5 transition hover:border-white/[.08] hover:bg-white/[.045] ${active ? "bg-[#11284a]/65" : ""}`}><button type="button" onClick={() => isTrack ? onPlay(item) : onNavigate(item)} className="relative h-14 w-14 shrink-0 overflow-hidden"><Image src={item.image} alt="" fill sizes="56px" className={`object-cover ${item.type === "Artistes" ? "rounded-full" : ""}`} /><span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100"><HugeiconsIcon icon={isTrack ? PlayIcon : ArrowRight01Icon} size={20} fill={isTrack ? "currentColor" : "none"} /></span></button><button type="button" onClick={() => isTrack ? onPlay(item) : onNavigate(item)} className="min-w-0 flex-1 text-left"><p className={`truncate text-sm font-extrabold ${active ? "text-[#72eee7]" : "text-white"}`}>{item.title}</p><p className="mt-1 truncate text-xs text-[#96a5c0]">{item.artist}</p></button><span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#7f8da8] sm:flex"><HugeiconsIcon icon={typeIcon} size={14} />{item.type}</span>{isTrack ? <div className="flex items-center gap-1"><button type="button" onClick={() => onLike(item)} aria-label="Favori" className="grid h-9 w-9 place-items-center text-[#9eabc3] transition hover:bg-white/10 hover:text-[#72eee7]"><HugeiconsIcon icon={FavouriteIcon} size={19} strokeWidth={2.1} /></button><button type="button" onClick={() => onQueue(item)} aria-label="Ajouter à la file" className="grid h-9 w-9 place-items-center text-[#9eabc3] transition hover:bg-white/10 hover:text-[#72eee7]"><HugeiconsIcon icon={Queue01Icon} size={19} strokeWidth={2.1} /></button></div> : <button type="button" onClick={() => onNavigate(item)} className="grid h-9 w-9 place-items-center text-[#9eabc3] transition hover:bg-white/10 hover:text-[#72eee7]"><HugeiconsIcon icon={ArrowRight01Icon} size={19} strokeWidth={2.3} /></button>}</article>;
}

function BrowseView({ recent, setQuery, setRecent, onExplore }) {
  return <div className="space-y-12"><section><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#72eee7]">Continue l&apos;exploration</p><h2 className="mt-2 text-2xl font-extrabold text-white">Recherches récentes</h2></div><button type="button" onClick={() => setRecent([])} className="text-xs font-bold text-[#91a0bd] transition hover:text-[#72eee7]">Effacer</button></div>{recent.length ? <div className="mt-5 flex gap-3 overflow-x-auto pb-1 audiva-carousel">{recent.map((item, index) => <button type="button" key={item} onClick={() => setQuery(item)} className="group relative h-32 w-40 shrink-0 overflow-hidden border border-white/[.08] bg-[#0b1426] p-4 text-left transition hover:-translate-y-1 hover:border-[#72eee7]/45"><Image src={["/hero-recommandation.jpg", "/hero-tendances.jpg", "/hero-decouverte.jpg", "/hero-playlist.jpg"][index % 4]} alt="" fill className="object-cover opacity-40 transition group-hover:scale-105 group-hover:opacity-60" /><span className="relative"><HugeiconsIcon icon={Search01Icon} size={18} className="text-[#72eee7]" /><span className="mt-7 block truncate text-sm font-extrabold text-white">{item}</span><span className="mt-1 block text-xs text-[#c1cce3]">Recherche récente</span></span></button>)}</div> : <p className="mt-5 text-sm text-[#91a0bd]">Vos prochaines recherches apparaîtront ici.</p>}</section><section><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#72eee7]">Pour vous</p><h2 className="mt-2 text-2xl font-extrabold text-white">Explorez par ambiance</h2></div><Link href="/decouverte" className="inline-flex items-center gap-1 text-xs font-bold text-[#91a0bd] hover:text-[#72eee7]">Voir tout <HugeiconsIcon icon={ArrowRight01Icon} size={15} /></Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{categories.map((category) => <button type="button" key={category.name} onClick={() => onExplore(category.query)} className={`group relative min-h-[170px] overflow-hidden bg-gradient-to-br ${category.color} p-5 text-left transition hover:-translate-y-1`}><Image src={category.image} alt="" fill className="object-cover opacity-35 transition duration-500 group-hover:scale-110 group-hover:opacity-55" /><div className="absolute inset-0 bg-gradient-to-t from-[#050b18]/85 to-transparent" /><span className="relative flex h-full flex-col justify-end"><HugeiconsIcon icon={CompassIcon} size={20} className="mb-auto text-[#b7fffb]" /><span className="text-xl font-extrabold text-white">{category.name}</span><span className="mt-1 text-xs font-medium text-[#d1dcf3]">Lancer l&apos;exploration</span></span></button>)}</div></section></div>;
}
