import Link from "next/link";

const albums = [
  { id: "blue-hour", title: "Blue Hour", artist: "Maya K.", cover: "/hero-recommandation.jpg", year: "2025" },
  { id: "nuit-electrique", title: "Pour votre soirée", artist: "Audiva Sessions", cover: "/hero-playlist.jpg", year: "2025" },
  { id: "jamendo-discovery", title: "Jamendo Discovery", artist: "Lila Sun", cover: "/hero-decouverte.jpg", year: "2024" },
  { id: "tendances", title: "Tendances", artist: "Collectif Audiva", cover: "/hero-tendances.jpg", year: "2025" },
];

export default function AlbumsBibliothequePage() {
  return (
    <main className="min-h-screen bg-[#060b18] px-4 py-6 pb-32 text-[#eff4ff] sm:px-7 sm:py-8 sm:pb-32 xl:px-9">
        <section className="relative min-h-72 overflow-hidden border border-white/10 bg-[#0c1630] p-7 sm:p-10">
          <div className="absolute inset-0 scale-105 bg-[url('/hero-recommandation.jpg')] bg-cover bg-center opacity-60 blur-[2px]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,11,24,.96)_8%,rgba(6,11,24,.72)_52%,rgba(6,11,24,.3)),linear-gradient(0deg,rgba(6,11,24,.78),transparent_65%)]" />
          <div className="relative flex min-h-52 max-w-2xl flex-col justify-end">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#83eee8]">Votre collection</p>
            <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">Albums</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#d1dbef]">Retrouvez les albums que vous écoutez, importez et sauvegardez dans votre bibliothèque.</p>
            <Link href="/bibliotheque" className="mt-6 w-fit border border-[#72eee7]/45 bg-[#07101e]/60 px-4 py-3 text-sm font-extrabold text-[#bffffa] backdrop-blur-sm transition hover:bg-[#72eee7]/10">Retour à la bibliothèque</Link>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black text-white">Albums enregistrés</h2><p className="mt-1 text-sm text-[#91a0bd]">Vos sorties récentes et vos favoris.</p></div><span className="text-sm font-bold text-[#aebbd7]">{albums.length} albums</span></div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {albums.map((album) => <Link href={`/albums/${album.id}`} key={album.title} className="group block border border-white/8 bg-[#0a1221] p-3 transition hover:-translate-y-1 hover:border-[#72eee7]/35 hover:bg-[#101b31]"><div className="aspect-square bg-cover bg-center" style={{ backgroundImage: `url(${album.cover})` }} /><p className="mt-3 truncate font-extrabold text-white">{album.title}</p><p className="mt-1 truncate text-xs text-[#91a0bd]">{album.artist} · {album.year}</p><span className="mt-3 block text-xs font-bold text-[#72eee7]">Voir l’album</span></Link>)}
          </div>
        </section>
    </main>
  );
}
