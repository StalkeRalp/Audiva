import Image from "next/image";
import Link from "next/link";

const navigation = ["Accueil", "Recherche", "Bibliothèque", "Découvrir", "Favoris", "Amis", "Statistiques"];
const routes = { Accueil: "/", Recherche: "/recherche", Bibliothèque: "/bibliotheque", Découvrir: "/decouverte", Favoris: "/favoris", Amis: "/amis", Statistiques: "/statistiques" };
const genres = [
  ["Pop", "from-[#8062a3] to-[#5d72fe]", "rotate-[-18deg]"],
  ["Hip-Hop", "from-[#9a4d08] to-[#d47b13]", "rotate-[17deg]"],
  ["Afro", "from-[#a1278d] to-[#d6529a]", "rotate-[-15deg]"],
];

const categories = [
  ["Podcasts", "from-[#258b76] to-[#42b197]"], ["Made For You", "from-[#233d77] to-[#5d72fe]"],
  ["Charts", "from-[#8866aa] to-[#ba94d3]"], ["New Releases", "from-[#e71360] to-[#ff5490]"],
  ["Discover", "from-[#765194] to-[#a485bd]"], ["Concerts", "from-[#233a72] to-[#4c68a8]"],
  ["R&B", "from-[#c52f86] to-[#e459aa]"], ["Frequency", "from-[#ab9bc1] to-[#d0c2e0]"],
  ["Christian & Gospel", "from-[#4d94e6] to-[#75aff2]"], ["Soul", "from-[#ea2e9e] to-[#f263b6]"],
  ["Chill", "from-[#427d99] to-[#63a0ba]"], ["Mood", "from-[#8465a5] to-[#ad90c8]"],
  ["Equal", "from-[#0c9c0a] to-[#4ab848]"], ["Alternative", "from-[#83ded0] to-[#b5f1e6]"],
  ["Workout", "from-[#686868] to-[#999999]"],
];

function SearchIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.2" /><path d="m16 16 4.2 4.2" /></svg>;
}

function Arrow({ right = false }) {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d={right ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} /></svg>;
}

function NavigationIcon({ name }) {
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

function Artwork({ className = "", hue = "" }) {
  return <div className={`absolute -bottom-6 -right-4 h-20 w-20 rotate-[25deg] rounded-md border border-white/20 bg-black/35 shadow-xl ${className}`}><div className={`m-3 h-14 rounded-sm bg-gradient-to-br ${hue} opacity-90`} /></div>;
}

export default function RecherchePage() {
  return (
    <main className="min-h-screen bg-black text-white lg:flex">
      <aside className="sticky top-[70px] hidden h-[calc(100dvh-70px)] w-64 shrink-0 self-start overflow-y-auto border-r border-[#5d72fe]/20 bg-[#03050b] px-7 py-6 lg:flex lg:flex-col">
        <Link href="/" className="mb-9 flex items-center gap-3">
          <Image src="/logoAudiva2.png" alt="Audiva" width={1254} height={1254} className="h-12 w-12 rounded-xl object-cover" />
          <span className="text-2xl font-semibold tracking-tight">Audi<span className="text-[#5d72fe]">va</span></span>
        </Link>
        <nav className="space-y-1">
          {navigation.map((item) => <Link key={item} href={routes[item]} className={`flex items-center gap-4 rounded-xl px-3 py-3 text-sm transition ${item === "Recherche" ? "bg-[#5d72fe] font-semibold text-white" : "text-[#b9c2ed] hover:bg-[#5d72fe]/10 hover:text-white"}`}><NavigationIcon name={item} />{item}</Link>)}
        </nav>
        <div className="mt-7 border-t border-[#5d72fe]/20 pt-5">
          <div className="mb-3 flex items-center justify-between text-sm font-medium"><span>Mes playlists</span><span className="text-xl text-[#93a0ff]">+</span></div>
          <div className="space-y-3">{[["Hits du moment", "32 morceaux"], ["Afro Vibes", "56 morceaux"], ["Chill & Relax", "42 morceaux"]].map(([name, count], index) => <div key={name} className="flex items-center gap-3"><div className={`h-10 w-10 rounded-md bg-gradient-to-br ${["from-[#d44d83] to-[#fa9353]", "from-[#d17a32] to-[#302236]", "from-[#6eaec7] to-[#f6e5c5]"][index]}`} /><div><p className="text-sm text-white">{name}</p><p className="text-xs text-[#8490bf]">{count}</p></div></div>)}</div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-10">
      <div className="max-w-[1440px] px-5 py-6 sm:px-7">
        <section>
          <h1 className="text-base font-bold">Recherches récentes</h1>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-1">
            <RecentSearch name="The Chainsmokers" hue="from-slate-200 via-slate-500 to-slate-900" selected />
            <RecentSearch name="Ed Sheeran" hue="from-[#d6a475] via-[#774e30] to-[#19191c]" />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-base font-bold">Vos meilleurs genres</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {genres.map(([title, color, rotation]) => <article key={title} className={`relative h-[136px] overflow-hidden rounded-md bg-gradient-to-br ${color} p-3`}><h3 className="text-2xl font-bold">{title}</h3><Artwork className={rotation} hue="from-white/80 to-black/30" /></article>)}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-base font-bold">Tout parcourir</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {categories.map(([title, color], index) => <Link href="#" key={title} className={`relative aspect-[1.18] overflow-hidden rounded-md bg-gradient-to-br ${color} p-3 transition hover:scale-[1.02]`}><h3 className="max-w-[130px] text-base font-bold leading-5">{title}</h3><Artwork className={index % 2 ? "rotate-[25deg]" : "rotate-[-18deg]"} hue={index % 3 === 0 ? "from-[#ffde5d] to-[#e7308b]" : "from-[#83c4fa] to-[#21194e]"} /></Link>)}
          </div>
        </section>
      </div>
      </div>
    </main>
  );
}

function RecentSearch({ name, hue, selected = false }) {
  return <article className={`relative h-[164px] w-[116px] shrink-0 rounded-sm bg-[#070b18] p-3 ${selected ? "border-2 border-[#5d72fe]" : "border-2 border-transparent"}`}><button aria-label={`Supprimer ${name}`} className="absolute right-2 top-1 z-10 text-xl font-light text-white/90">×</button><div className={`h-20 w-20 rounded-full bg-gradient-to-br ${hue} shadow-inner`} /><p className="mt-4 truncate text-xs font-bold">{name}</p><p className="mt-1 text-[10px] text-white/60">Artiste</p></article>;
}
