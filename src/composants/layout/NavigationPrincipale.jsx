"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, ChartBarBigIcon, CompassIcon, FavouriteIcon, Home01Icon, LibraryIcon, Message01Icon, Notification01Icon, Search01Icon, Settings01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";

const sections = [
  { label: "Découvrir", items: [{ href: "/accueil", label: "Accueil", icon: Home01Icon }, { href: "/recherche", label: "Recherche", icon: Search01Icon }, { href: "/decouverte", label: "Découvrir", icon: CompassIcon }] },
  { label: "Ma musique", items: [{ href: "/bibliotheque", label: "Bibliothèque", icon: LibraryIcon }, { href: "/statistiques", label: "Statistiques", icon: ChartBarBigIcon }, { href: "/favoris", label: "Favoris", icon: FavouriteIcon }] },
  { label: "Social", items: [{ href: "/amis", label: "Amis", icon: UserGroupIcon }, { href: "/chat", label: "Messages", icon: Message01Icon }, { href: "/notifications", label: "Notifications", icon: Notification01Icon }] },
  { label: "Compte", items: [{ href: "/bibliotheque?import=1", label: "Importer ma musique", icon: Add01Icon, action: true }, { href: "/parametres", label: "Paramètres", icon: Settings01Icon }] },
];

export function NavigationPrincipale() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const viewingStats = pathname === "/bibliotheque" && searchParams.get("vue") === "statistiques";

  return (
    <aside className={`audiva-sidebar sticky top-[72px] hidden h-[calc(100dvh-72px)] shrink-0 overflow-x-hidden overflow-y-auto px-3 py-6 transition-[width] duration-300 lg:block ${collapsed ? "w-[76px]" : "w-64"}`}>
      <div className={`mb-6 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between gap-2"}`}>
      <Link href="/accueil" title="Audiva" className={`flex items-center rounded-xl py-1 transition hover:bg-white/5 ${collapsed ? "justify-center px-0" : "gap-3 px-2"}`}>
        <span className="audiva-brand-mark h-14 w-14 shrink-0">
          <Image src="/logoAudiva3.png" alt="Audiva" width={500} height={500} priority className="audiva-brand-image audiva-brand-image--audiva" />
          <Image src="/logoAudivaApple.svg" alt="Audiva" width={160} height={160} priority className="audiva-brand-image audiva-brand-image--apple" />
        </span>
        {!collapsed && <div><p className="text-2xl font-bold tracking-tight text-white">Audi<span className="text-[#6578ff]">va</span></p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-[#7180aa]">Ta musique</p></div>}
      </Link>
      <button type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? "Développer la barre latérale" : "Réduire la barre latérale"} aria-expanded={!collapsed} title={collapsed ? "Développer" : "Réduire"} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.04] text-[#aab5d0] transition hover:border-[#72eee7]/40 hover:bg-[#72eee7]/10 hover:text-white"><HugeiconsIcon icon={collapsed ? ArrowRight01Icon : ArrowLeft01Icon} size={18} /></button>
      </div>
      <nav className="space-y-5">
        {sections.map((section) => <div key={section.label}>{!collapsed && <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#7180aa]">{section.label}</p>}{section.items.map((item) => {
          const active = item.href === "/bibliotheque" ? pathname === item.href && !viewingStats : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`group relative mb-0.5 flex items-center rounded-2xl px-3 py-2.5 text-sm transition-all duration-200 ${collapsed ? "justify-center" : "gap-3"} ${active ? "audiva-nav-active font-semibold text-white" : item.action ? "border border-dashed border-[#72eee7]/35 bg-[#72eee7]/[.055] font-semibold text-[#c9fffb] hover:border-[#72eee7]/70 hover:bg-[#72eee7]/10" : "text-[#aab5d0] hover:bg-white/[.055] hover:text-white"}`}
          >
            <HugeiconsIcon icon={item.icon} size={21} strokeWidth={1.65} className={`transition-transform duration-200 group-hover:scale-110 ${active || item.action ? "text-[#72eee7]" : "text-[#8e9bbd]"}`} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
          );
        })}</div>)}
      </nav>
    </aside>
  );
}
