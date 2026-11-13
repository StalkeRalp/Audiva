"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartBarBigIcon, CompassIcon, FavouriteIcon, Home01Icon, LibraryIcon, Message01Icon, MoreHorizontalIcon, Notification01Icon, Search01Icon, Settings01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";

const primaryItems = [
  { href: "/accueil", label: "Accueil", icon: Home01Icon },
  { href: "/decouverte", label: "Découvrir", icon: CompassIcon },
  { href: "/bibliotheque", label: "Ma musique", icon: LibraryIcon },
  { href: "/chat", label: "Chat", icon: Message01Icon },
];
const moreItems = [
  { href: "/recherche", label: "Recherche", icon: Search01Icon },
  { href: "/statistiques", label: "Statistiques", icon: ChartBarBigIcon },
  { href: "/favoris", label: "Favoris", icon: FavouriteIcon },
  { href: "/amis", label: "Amis", icon: UserGroupIcon },
  { href: "/notifications", label: "Notifications", icon: Notification01Icon },
  { href: "/parametres", label: "Paramètres", icon: Settings01Icon },
];

export function NavigationMobile() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [moreOpen, setMoreOpen] = useState(false);
  const viewingStats = pathname === "/bibliotheque" && searchParams.get("vue") === "statistiques";
  const isActive = ({ href, query }) => query ? viewingStats : href === "/bibliotheque" ? pathname === href && !viewingStats : pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = moreItems.some(isActive);
  return <>
    {moreOpen && <><button className="audiva-mobile-menu-scrim" aria-label="Fermer le menu" onClick={() => setMoreOpen(false)} /><nav aria-label="Autres pages" className="audiva-mobile-menu lg:hidden">{moreItems.map(item => <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} aria-current={isActive(item) ? "page" : undefined} className={`audiva-mobile-menu-link ${isActive(item) ? "audiva-mobile-link--active" : ""}`}><HugeiconsIcon icon={item.icon} size={20} /><span>{item.label}</span></Link>)}</nav></>}
    <nav aria-label="Navigation principale mobile" className="audiva-mobile-nav lg:hidden">
      {primaryItems.map(item => <Link key={item.href} href={item.href} aria-current={isActive(item) ? "page" : undefined} className={`audiva-mobile-link ${isActive(item) ? "audiva-mobile-link--active" : ""}`}>
        <HugeiconsIcon icon={item.icon} size={22} strokeWidth={1.7} />
        <span>{item.label}</span>
      </Link>)}
      <button type="button" aria-expanded={moreOpen} aria-label="Afficher les autres pages" onClick={() => setMoreOpen(value => !value)} className={`audiva-mobile-link ${moreOpen || moreActive ? "audiva-mobile-link--active" : ""}`}>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={22} strokeWidth={1.7} /><span>Plus</span>
      </button>
    </nav>
  </>;
}
