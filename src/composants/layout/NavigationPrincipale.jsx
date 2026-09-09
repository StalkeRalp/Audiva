"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartBarBigIcon, CompassIcon, FavouriteIcon, Home01Icon, LibraryIcon, Message01Icon, Notification03Icon, Search01Icon, Settings01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";

const sections = [
  { label: "Découvrir", items: [{ href: "/accueil", label: "Accueil", icon: Home01Icon }, { href: "/recherche", label: "Recherche", icon: Search01Icon }, { href: "/decouverte", label: "Découvrir", icon: CompassIcon }] },
  { label: "Ma musique", items: [{ href: "/bibliotheque", label: "Bibliothèque", icon: LibraryIcon }, { href: "/favoris", label: "Favoris", icon: FavouriteIcon }, { href: "/historique", label: "Historique", icon: ChartBarBigIcon }, { href: "/playlists", label: "Playlists", icon: LibraryIcon }] },
  { label: "Social", items: [{ href: "/amis", label: "Amis", icon: UserGroupIcon }, { href: "/chat", label: "Messages", icon: Message01Icon }, { href: "/notifications", label: "Notifications", icon: Notification03Icon }] },
  { label: "Compte", items: [{ href: "/statistiques", label: "Statistiques", icon: ChartBarBigIcon }, { href: "/parametres", label: "Paramètres", icon: Settings01Icon }] },
];

export function NavigationPrincipale() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-[72px] hidden h-[calc(100dvh-72px)] w-64 shrink-0 overflow-y-auto border-r border-[#27365f]/45 bg-[#080d1c] px-3 py-5 lg:block">
      <Link href="/accueil" className="mb-7 flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-white/5">
        <Image src="/logoAudiva1.png" alt="Audiva" width={500} height={500} priority className="h-20 w-20 object-contain" />
        <div><p className="text-2xl font-bold tracking-tight text-white">Audi<span className="text-[#6578ff]">va</span></p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-[#7180aa]">Ta musiqu</p></div>
      </Link>
      <nav className="space-y-5">
        {sections.map((section) => <div key={section.label}><p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#7180aa]">{section.label}</p>{section.items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${active ? "bg-[#17254a] font-medium text-white shadow-[inset_2px_0_0_#72eee7]" : "text-[#aab5d0] hover:bg-white/[.055] hover:text-white"}`}
          >
            <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.8} className={`transition-transform duration-200 group-hover:scale-110 ${active ? "text-[#72eee7]" : "text-[#8e9bbd]"}`} />
            <span>{item.label}</span>
          </Link>
          );
        })}</div>)}
      </nav>
    </aside>
  );
}
