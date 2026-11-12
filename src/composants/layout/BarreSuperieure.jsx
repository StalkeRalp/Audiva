"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Home01Icon, Notification01Icon, Search01Icon, UserCircleIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { loadProfileSettings } from "@/utilitaires/profilStorage";
import { useSocialStore } from "@/domaines/social/stores/socialStore";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";
import { getAuthProfileImage } from "@/domaines/authentification/utilitaires/profile";
import { InstallPWAButton } from "@/composants/layout/InstallPWAButton";

export function BarreSuperieure() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState({ name: "Auditeur", avatar: "" });
  const user = useAuthStore(state => state.user);
  const authName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Auditeur";
  const providerAvatar = getAuthProfileImage(user);
  const unreadNotifications = useSocialStore((state) => state.notifications.filter((item) => !item.read).length);

  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/authentification")) return undefined;
    const readProfile = async () => {
      try {
        const stored = await loadProfileSettings();
        const savedProfile = stored?.profile || {};
        setProfile({ name: savedProfile.name || authName, avatar: savedProfile.avatar || providerAvatar });
      } catch {
        setProfile({ name: authName, avatar: providerAvatar });
      }
    };

    const timer = window.setTimeout(readProfile, 0);
    window.addEventListener("audiva-profile-updated", readProfile);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("audiva-profile-updated", readProfile);
    };
  }, [pathname, user?.id, user?.email, authName, providerAvatar]);

  if (pathname === "/" || pathname.startsWith("/authentification")) return null;

  return (
    <header className="audiva-topbar sticky top-0 z-50 flex h-[72px] items-center gap-3 px-4 sm:px-7">
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => router.back()} aria-label="Retour" className="flex h-9 w-8 items-center justify-center text-[#7783a3] transition hover:text-white"><HugeiconsIcon icon={ArrowLeft01Icon} size={21} /></button>
        <button type="button" onClick={() => router.forward()} aria-label="Suivant" className="flex h-9 w-8 items-center justify-center text-[#7783a3] transition hover:text-white"><HugeiconsIcon icon={ArrowRight01Icon} size={21} /></button>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
        <Link href="/accueil" aria-label="Accueil" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#182750] text-white shadow-[0_0_22px_rgba(79,108,255,.16)] transition hover:scale-105 hover:bg-[#263b72]"><HugeiconsIcon icon={Home01Icon} size={22} strokeWidth={1.7} /></Link>
        <form onSubmit={(event) => { event.preventDefault(); const query = new FormData(event.currentTarget).get("query"); router.push(`/recherche${query ? `?q=${encodeURIComponent(query)}` : ""}`); }} className="w-[min(500px,calc(100vw-520px))]"><label className="flex items-center gap-3 rounded-full border border-white/[.06] bg-[#171a22] px-5 py-3 text-[#a5b0ca] transition focus-within:border-[#76eee9]/35 focus-within:bg-[#1a1f2d]"><HugeiconsIcon icon={Search01Icon} size={21} /><input name="query" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#adb6c8]" placeholder="Rechercher dans Audiva" /></label></form>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <InstallPWAButton />
        <Link href="/notifications" aria-label={unreadNotifications ? `${unreadNotifications} notification${unreadNotifications > 1 ? "s" : ""} non lue${unreadNotifications > 1 ? "s" : ""}` : "Notifications"} className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#b9c3dc] transition hover:bg-white/7 hover:text-white">{unreadNotifications ? <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#03050a] bg-[#ef4c86] px-1 text-[9px] font-bold text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span> : null}<HugeiconsIcon icon={Notification01Icon} size={23} strokeWidth={1.7} /></Link>
        <Link href="/amis" aria-label="Amis" className="hidden h-10 w-10 items-center justify-center rounded-full text-[#b9c3dc] transition hover:bg-white/7 hover:text-white lg:flex"><HugeiconsIcon icon={UserGroupIcon} size={23} strokeWidth={1.7} /></Link>
        <Link href={user ? "/parametres" : "/authentification/connexion"} aria-label={user ? "Ouvrir les paramètres du profil" : "Se connecter à Audiva"} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-white/[.06]">
          <span
            className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-cover bg-center text-white ring-2 ring-[#17223f] ${profile.avatar ? "bg-gradient-to-br from-[#7588ff] to-[#5452c9]" : "bg-[#182750] text-[#a6f6ef]"}`}
            style={profile.avatar ? { backgroundImage: `url(${profile.avatar})` } : undefined}
          >
            {!profile.avatar && <HugeiconsIcon icon={UserCircleIcon} size={25} strokeWidth={1.65} aria-hidden="true" />}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="hidden text-[#9eabcf] sm:block" />
        </Link>
      </div>
    </header>
  );
}
