"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Home01Icon, Notification03Icon, Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { loadProfileSettings } from "@/utilitaires/profilStorage";
import { useSocialStore } from "@/domaines/social/stores/socialStore";

export function BarreSuperieure() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState({ name: "Enoch", avatar: "" });
  const unreadNotifications = useSocialStore((state) => state.notifications.filter((item) => !item.read).length);

  useEffect(() => {
    const readProfile = async () => {
      try {
        const stored = await loadProfileSettings();
        const savedProfile = stored?.profile || {};
        setProfile({ name: savedProfile.name || "Enoch", avatar: savedProfile.avatar || "" });
      } catch {
        setProfile({ name: "Enoch", avatar: "" });
      }
    };

    const timer = window.setTimeout(readProfile, 0);
    window.addEventListener("audiva-profile-updated", readProfile);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("audiva-profile-updated", readProfile);
    };
  }, []);

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

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/notifications" aria-label={unreadNotifications ? `${unreadNotifications} notification${unreadNotifications > 1 ? "s" : ""} non lue${unreadNotifications > 1 ? "s" : ""}` : "Notifications"} className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#b9c3dc] transition hover:bg-white/7 hover:text-white">{unreadNotifications ? <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#03050a] bg-[#ef4c86] px-1 text-[9px] font-bold text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span> : null}<HugeiconsIcon icon={Notification03Icon} size={20} /></Link>
        <Link href="/amis" aria-label="Amis" className="hidden h-10 w-10 items-center justify-center rounded-full text-[#b9c3dc] transition hover:bg-white/7 hover:text-white lg:flex"><HugeiconsIcon icon={UserGroupIcon} size={20} /></Link>
        <Link href="/parametres" aria-label="Ouvrir les paramètres du profil" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-white/[.06]">
          <span
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#40d5a3] bg-gradient-to-br from-[#7588ff] to-[#5452c9] bg-cover bg-center text-[11px] font-bold text-white ring-2 ring-[#17223f]"
            style={profile.avatar ? { backgroundImage: `url(${profile.avatar})` } : undefined}
          >
            {!profile.avatar && profile.name.slice(0, 1).toUpperCase()}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="hidden text-[#9eabcf] sm:block" />
        </Link>
      </div>
    </header>
  );
}
