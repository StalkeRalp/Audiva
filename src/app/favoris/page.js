import Image from "next/image";
import Link from "next/link";

const navigation = ["Accueil", "Recherche", "Bibliothèque", "Découvrir", "Favoris", "Amis", "Statistiques"];
const routes = { Accueil: "/", Recherche: "/recherche", Bibliothèque: "/bibliotheque", Découvrir: "/decouverte", Favoris: "/favoris", Amis: "/amis", Statistiques: "/statistiques" };
const tracks = [
  ["The Night We Met", "Lord Huron", "Play It Safe", "2:12", "from-[#e8887b] to-[#6d3d5b]"],
  ["Akpooza", "Dynamites", "In the Shape of a Dream", "2:12", "from-[#b43a39] to-[#e0b24b]"],
  ["Be Alright", "Dean Lewis", "Free Spirit", "3:02", "from-[#d09c4d] to-[#472e25]"],
  ["Falling", "Trevor Daniel", "Vacation", "4:25", "from-[#b48360] to-[#28232d]"],
  ["If the world was ending", "JP Saxe, Julia Michaels", "Same Old", "2:56", "from-[#d3b6a6] to-[#7a6163]"],
  ["Let Her Go", "Passenger", "A Moment Apart", "3:54", "from-[#4c839a] to-[#1c364b]"],
  ["Another Love", "Tom Odell", "1993", "3:13", "from-[#e9917c] to-[#563c64]"],
  ["Sleepless Nights", "ayokay, Nightly", "In the Shape of a Dream", "2:12", "from-[#8ca8d5] to-[#ead3c7]"],
  ["Atlantis", "Seafret", "Girl, I Know", "3:14", "from-[#9e6158] to-[#342e3e]"],
  ["Slow Grenade", "Ellie Goulding, Lauv", "Brightest Blue", "3:37", "from-[#5489aa] to-[#c9d7dd]"],
  ["Play It Safe", "Julia Wolf", "Play It Safe", "2:12", "from-[#d1c8b8] to-[#6b7286]"],
  ["Ocean Front Apt.", "ayokay", "In the Shape of a Dream", "2:12", "from-[#8ca8d5] to-[#ead3c7]"],
];

function Icon({ name }) {
  const common = { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "1.8" };
  const icons = {
    Accueil: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />,
    Recherche: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    Bibliothèque: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 3v5l2-1.5L12 8V3" /></>,
    Découvrir: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    Favoris: <path d="M20.8 8.8c0 5.1-8.8 10.2-8.8 10.2S3.2 13.9 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z" />,
    Amis: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-3.4 2.3-5 5.5-5s5.1 1.6 5.5 5M17 9a2.5 2.5 0 1 0 0-5M17 15c2.1 0 3.3 1.1 3.7 3.2" /></>,
    Statistiques: <path d="M4 20V11M10 20V4M16 20v-7M22 20V8" />,
  };
  return <svg {...common}>{icons[name]}</svg>;
}

function Cover({ gradient, className = "" }) {
  return <div className={`shrink-0 rounded-md bg-gradient-to-br ${gradient} ${className}`} />;
}

export default function FavorisPage() {
  return (
    <main className="min-h-screen bg-black text-[#edf0ff] lg:flex">
      <aside className="sticky top-[70px] hidden h-[calc(100dvh-70px)] w-64 shrink-0 self-start overflow-y-auto border-r border-[#5d72fe]/20 bg-[#03050b] px-7 py-6 lg:flex lg:flex-col">
        <Link href="/" className="mb-9 flex items-center gap-3"><Image src="/logoAudiva2.png" alt="Audiva" width={1254} height={1254} className="h-12 w-12 rounded-xl object-cover" /><span className="text-2xl font-semibold tracking-tight">Audi<span className="text-[#5d72fe]">va</span></span></Link>
        <nav className="space-y-1">{navigation.map((item) => <Link key={item} href={routes[item]} className={`flex items-center gap-4 rounded-xl px-3 py-3 text-sm transition ${item === "Favoris" ? "bg-[#5d72fe] font-semibold text-white" : "text-[#b9c2ed] hover:bg-[#5d72fe]/10 hover:text-white"}`}><Icon name={item} />{item}</Link>)}</nav>
        <div className="mt-7 border-t border-[#5d72fe]/20 pt-5"><div className="mb-3 flex items-center justify-between text-sm font-medium"><span>Mes playlists</span><span className="text-xl text-[#93a0ff]">+</span></div><div className="space-y-3">{[["Hits du moment", "32 morceaux"], ["Afro Vibes", "56 morceaux"], ["Chill & Relax", "42 morceaux"]].map(([name, count], index) => <div key={name} className="flex items-center gap-3"><Cover gradient={["from-[#d44d83] to-[#fa9353]", "from-[#d17a32] to-[#302236]", "from-[#6eaec7] to-[#f6e5c5]"][index]} className="h-10 w-10" /><div><p className="text-sm text-white">{name}</p><p className="text-xs text-[#8490bf]">{count}</p></div></div>)}</div></div>
      </aside>

      <div className="min-w-0 flex-1 pb-24">
        <section className="relative overflow-hidden border-b border-[#5d72fe]/20 bg-[linear-gradient(180deg,#25265d_0%,#10142e_58%,#000_100%)] px-6 pb-8 pt-10 sm:px-10 lg:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(93,114,254,0.45),transparent_36%)]" />
          <div className="relative flex items-end gap-5"><div className="flex h-32 w-32 shrink-0 items-center justify-center bg-gradient-to-br from-[#4422d1] via-[#6c61df] to-[#a5c8bd] text-6xl shadow-xl sm:h-40 sm:w-40">♥</div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-[#c5cbef]">Playlist publique</p><h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-6xl">Titres likés</h1><p className="mt-3 text-xs text-[#c5cbef]">Enoch Emmanuel · <span className="font-semibold text-white">255 titres</span></p></div></div>
        </section>

        <div className="px-6 py-7 sm:px-10 lg:px-14"><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-5"><button aria-label="Lire les favoris" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5d72fe] transition hover:bg-[#7184ff]"><span className="ml-1 h-0 w-0 border-y-[8px] border-l-[12px] border-y-transparent border-l-white" /></button><button className="text-xl text-[#c9d1ff]">↝</button><button className="text-xl text-[#c9d1ff]">⇩</button><button className="text-xl text-[#c9d1ff]">•••</button></div><button className="text-xs text-[#c9d1ff]">⌕ &nbsp; Trier par&nbsp; ▾</button></div>
          <div className="min-w-[680px]"><div className="grid grid-cols-[30px_minmax(220px,1.5fr)_minmax(170px,1fr)_80px_28px] border-b border-white/15 px-2 pb-2 text-[10px] uppercase tracking-wide text-[#8490bf]"><span>#</span><span>Titre</span><span>Album</span><span>Durée</span><span>♡</span></div>{tracks.map(([title, artist, album, duration, gradient], index) => <div key={title} className="grid grid-cols-[30px_minmax(220px,1.5fr)_minmax(170px,1fr)_80px_28px] items-center rounded-md px-2 py-2 text-xs hover:bg-[#5d72fe]/10"><span className="text-[#8490bf]">{index + 1}</span><div className="flex min-w-0 items-center gap-3"><Cover gradient={gradient} className="h-9 w-9" /><div className="min-w-0"><p className={`truncate ${index === 0 ? "text-[#7688ff]" : "text-white"}`}>{title}</p><p className="truncate text-[10px] text-[#8490bf]">{artist}</p></div></div><span className="truncate text-[#aeb8df]">{album}</span><span>{duration}</span><span className="text-[#5d72fe]">♥</span></div>)}</div></div>
      </div>
    </main>
  );
}
