"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NavigationPrincipale } from "@/composants/layout/NavigationPrincipale";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { loadLocalTracks } from "@/utilitaires/bibliothequeLocaleStorage";
import { loadPlaylistsSnapshot } from "@/utilitaires/playlistsStorage";
import { usePlaylistsStore } from "@/domaines/playlists/stores/playlistsStore";

export function ApplicationShell({ children }) {
  const pathname = usePathname();
  const setTracks = useBibliothequeStore((state) => state.setTracks);
  const restoreLocalTracks = useLecteurStore((state) => state.restoreLocalTracks);
  const restorePlaylists = usePlaylistsStore((state) => state.restorePlaylists);
  const isPublicRoute = pathname === "/" || pathname.startsWith("/authentification");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      loadLocalTracks().then((tracks) => {
        if (!active) return;
        setTracks(tracks);
        restoreLocalTracks(tracks);
      }).catch(() => {
        // IndexedDB peut être désactivé dans une navigation privée restrictive.
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [restoreLocalTracks, setTracks]);

  useEffect(() => {
    loadPlaylistsSnapshot().then((saved) => { if (saved) restorePlaylists(saved); }).catch(() => {});
  }, [restorePlaylists]);

  if (isPublicRoute) return children;

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#060b18] lg:flex">
      <NavigationPrincipale />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
