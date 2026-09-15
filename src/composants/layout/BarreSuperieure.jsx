"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Home01Icon, Search01Icon, Settings01Icon, UserIcon } from "@hugeicons/core-free-icons";

export function BarreSuperieure() {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  if (pathname === "/" || pathname.startsWith("/authentification")) return null;

  return (
    <header className="sticky top-0 z-50 flex h-[72px] items-center gap-3 border-b border-white/5 bg-[#03050a]/95 px-4 backdrop-blur-xl sm:px-7">
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => router.back()} aria-label="Retour" className="flex h-9 w-8 items-center justify-center text-[#7783a3] transition hover:text-white"><HugeiconsIcon icon={ArrowLeft01Icon} size={21} /></button>
        <button type="button" onClick={() => router.forward()} aria-label="Suivant" className="flex h-9 w-8 items-center justify-center text-[#7783a3] transition hover:text-white"><HugeiconsIcon icon={ArrowRight01Icon} size={21} /></button>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
        <Link href="/accueil" aria-label="Accueil" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#182750] text-white shadow-[0_0_22px_rgba(79,108,255,.16)] transition hover:scale-105 hover:bg-[#263b72]"><HugeiconsIcon icon={Home01Icon} size={22} fill="currentColor" /></Link>
        <form onSubmit={(event) => { event.preventDefault(); const query = new FormData(event.currentTarget).get("query"); router.push(`/recherche${query ? `?q=${encodeURIComponent(query)}` : ""}`); }} className="w-[min(500px,calc(100vw-520px))]"><label className="flex items-center gap-3 rounded-full border border-white/[.06] bg-[#171a22] px-5 py-3 text-[#a5b0ca] transition focus-within:border-[#6479f6]/75 focus-within:bg-[#1a1f2d] focus-within:shadow-[0_0_0_3px_rgba(93,114,254,.13)]"><HugeiconsIcon icon={Search01Icon} size={21} /><input name="query" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#adb6c8]" placeholder="Que souhaitez-vous écouter ou regarder ?" /></label></form>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <Link href="/notifications" aria-label="Notifications" title="Notifications" className="group relative grid h-9 w-7 place-items-center text-[#c4cde0] transition hover:text-white active:scale-90"><span className="absolute right-0 top-0 z-10 flex h-3.5 min-w-3.5 items-center justify-center border-2 border-[#03050a] bg-[#f34d87] px-0.5 text-[8px] font-extrabold text-white">3</span><i aria-hidden="true" className="fi fi-rr-bell text-[19px] leading-none transition-transform group-hover:-rotate-6" /></Link>
        <Link href="/amis" aria-label="Amis en ligne" title="Amis en ligne" className="group relative grid h-9 w-7 place-items-center text-[#c4cde0] transition hover:text-white active:scale-90"><i aria-hidden="true" className="fi fi-rr-users-alt text-[19px] leading-none transition-transform group-hover:scale-110" /></Link>
        <div className="relative ml-1">
          <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-label="Ouvrir le menu profil" aria-expanded={profileOpen} aria-haspopup="menu" className="group grid h-11 w-11 place-items-center rounded-full transition hover:scale-105 active:scale-95"><span className={`relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#d1987f] via-[#644b4a] to-[#17213a] text-[11px] font-extrabold text-white shadow-[0_0_0_2px_#080b12,0_0_0_4px_#39d697,0_0_0_5px_rgba(57,214,151,.22),0_0_18px_rgba(57,214,151,.22)] transition ${profileOpen ? "scale-105" : ""}`}>E<span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#080b12] bg-[#39d697]" /></span></button>
          {profileOpen ? <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-[60] w-52 border border-white/10 bg-[#101727]/[.98] p-1.5 shadow-2xl backdrop-blur-xl"><div className="border-b border-white/[.07] px-3 py-2.5"><p className="text-sm font-extrabold text-white">Enoch</p><p className="mt-0.5 text-xs text-[#8f9bb6]">Compte Audiva</p></div><Link href="/parametres" onClick={() => setProfileOpen(false)} role="menuitem" className="mt-1 flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-[#c4cee1] transition hover:bg-white/[.06] hover:text-[#72eee7]"><HugeiconsIcon icon={UserIcon} size={18} strokeWidth={2.1} />Mon profil</Link><Link href="/parametres" onClick={() => setProfileOpen(false)} role="menuitem" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-[#c4cee1] transition hover:bg-white/[.06] hover:text-[#72eee7]"><HugeiconsIcon icon={Settings01Icon} size={18} strokeWidth={2.1} />Paramètres</Link></div> : null}
        </div>
      </div>
    </header>
  );
}
