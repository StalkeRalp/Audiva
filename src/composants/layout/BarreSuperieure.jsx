"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Home01Icon, Notification01Icon, PaletteIcon, Search01Icon, UserCircleIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { loadProfileSettings } from "@/utilitaires/profilStorage";
import { useSocialStore } from "@/domaines/social/stores/socialStore";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";
import { getAuthProfileImage } from "@/domaines/authentification/utilitaires/profile";
import { InstallPWAButton } from "@/composants/layout/InstallPWAButton";
import { toggleAppleTheme } from "@/composants/layout/ThemeProvider";
import { searchContent } from "@/domaines/recherche/services/rechercheService";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";

export function BarreSuperieure() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState({ name: "Auditeur", avatar: "" });
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const user = useAuthStore(state => state.user);
  const authName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Auditeur";
  const providerAvatar = getAuthProfileImage(user);
  const unreadNotifications = useSocialStore((state) => state.notifications.filter((item) => !item.read).length);
  const localTracks = useBibliothequeStore((state) => state.tracks);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!searchFocused || query.length < 2) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchContent(query, { type: "all", localTracks, signal: controller.signal })
        .then(({ results }) => { if (!controller.signal.aborted) setSuggestions(results.slice(0, 5)); })
        .catch(() => { if (!controller.signal.aborted) setSuggestions([]); });
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [searchQuery, searchFocused, localTracks]);

  const submitSearch = (event, value = searchQuery) => {
    event?.preventDefault();
    const query = value.trim();
    if (!query) return;
    setSearchFocused(false);
    setSuggestions([]);
    router.push(`/recherche?q=${encodeURIComponent(query)}`);
  };

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
        <form onSubmit={submitSearch} className="relative w-[min(500px,calc(100vw-520px))]"><label className="flex items-center gap-3 rounded-full border border-white/[.06] bg-[#171a22] px-5 py-3 text-[#a5b0ca] transition focus-within:border-[#76eee9]/35 focus-within:bg-[#1a1f2d]"><HugeiconsIcon icon={Search01Icon} size={21} /><input name="query" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)} autoComplete="off" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#adb6c8]" placeholder="Rechercher dans Audiva" /></label>{searchFocused && suggestions.length > 0 && <div className="audiva-search-suggestions absolute left-0 right-0 top-full z-[90] mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#101827] p-1.5 shadow-2xl">{suggestions.map(item => <button type="button" key={`${item.provider || "local"}:${item.id}`} onMouseDown={event => event.preventDefault()} onClick={event => submitSearch(event, item.title)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/10"><span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">{item.image || item.cover ? <Image unoptimized src={item.image || item.cover} alt="" fill sizes="40px" className="object-cover" /> : <HugeiconsIcon icon={Search01Icon} size={17} className="absolute inset-0 m-auto" />}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{item.title}</span><span className="block truncate text-xs text-slate-400">{item.artist || (item.type === "artists" ? "Artiste" : item.type === "albums" ? "Album" : item.type === "playlists" ? "Playlist" : "Votre bibliothèque")}</span></span></button>)}</div>}</form>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button type="button" onClick={toggleAppleTheme} aria-label="Basculer entre le thème Audiva et le thème Apple" title="Thème Apple / Audiva" className="audiva-theme-toggle flex h-10 w-10 items-center justify-center rounded-full text-[#b9c3dc] transition hover:bg-white/7 hover:text-white"><HugeiconsIcon icon={PaletteIcon} size={22} strokeWidth={1.7} /></button>
        <InstallPWAButton />
        <Link href="/notifications" aria-label={unreadNotifications ? `${unreadNotifications} notification${unreadNotifications > 1 ? "s" : ""} non lue${unreadNotifications > 1 ? "s" : ""}` : "Notifications"} className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#b9c3dc] transition hover:bg-white/7 hover:text-white">{unreadNotifications ? <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#03050a] bg-[#ef4c86] px-1 text-[9px] font-bold text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span> : null}<HugeiconsIcon icon={Notification01Icon} size={23} strokeWidth={1.7} /></Link>
        <Link href="/amis" aria-label="Amis" className="hidden h-10 w-10 items-center justify-center rounded-full text-[#b9c3dc] transition hover:bg-white/7 hover:text-white lg:flex"><HugeiconsIcon icon={UserGroupIcon} size={23} strokeWidth={1.7} /></Link>
        <Link href={user ? "/parametres" : "/authentification/connexion"} aria-label={user ? "Ouvrir les paramètres du profil" : "Se connecter à Audiva"} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-white/[.06]">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-[#182750] text-[#a6f6ef] ring-2 ring-[#17223f]">
            {profile.avatar && profile.avatar !== failedAvatarUrl ? <Image unoptimized src={profile.avatar} alt="" fill sizes="40px" onError={() => setFailedAvatarUrl(profile.avatar)} className="object-cover" /> : <HugeiconsIcon icon={UserCircleIcon} size={25} strokeWidth={1.65} aria-hidden="true" />}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="hidden text-[#9eabcf] sm:block" />
        </Link>
      </div>
    </header>
  );
}
