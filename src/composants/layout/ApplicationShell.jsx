"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { NavigationMobile } from "@/composants/layout/NavigationMobile";
import { NavigationPrincipale } from "@/composants/layout/NavigationPrincipale";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { loadLocalTracks } from "@/utilitaires/bibliothequeLocaleStorage";
import { loadPlaylistsSnapshot } from "@/utilitaires/playlistsStorage";
import { usePlaylistsStore } from "@/domaines/playlists/stores/playlistsStore";
import { useIntelligenceStore } from "@/domaines/statistiques/stores/intelligenceStore";

export function ApplicationShell({ children }) {
  const pathname = usePathname();
  const setTracks = useBibliothequeStore((state) => state.setTracks);
  const restoreLocalTracks = useLecteurStore((state) => state.restoreLocalTracks);
  const restorePlaylists = usePlaylistsStore((state) => state.restorePlaylists);
  const isPublicRoute = pathname === "/" || pathname.startsWith("/authentification");

  useEffect(() => {
    if (isPublicRoute) return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      loadLocalTracks().then((tracks) => {
        if (!active) return;
        setTracks(tracks);
        restoreLocalTracks(tracks);
        useIntelligenceStore.getState().restoreLocalTrackCovers(tracks);
      }).catch(() => {
        if(active)useBibliothequeStore.getState().setLoadError("Impossible de charger les fichiers locaux. Vérifiez les autorisations de stockage du navigateur.");
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [isPublicRoute, restoreLocalTracks, setTracks]);

  useEffect(() => {
    if (isPublicRoute) return undefined;
    loadPlaylistsSnapshot().then((saved) => { if (saved) restorePlaylists(saved); }).catch(() => {});
  }, [isPublicRoute, restorePlaylists]);

  if (isPublicRoute) return children;

  return (
    <div className="audiva-app min-h-[calc(100dvh-72px)] lg:flex">
      <Suspense fallback={<aside aria-hidden="true" className="hidden w-64 shrink-0 lg:block" />}><NavigationPrincipale /></Suspense>
      <div className="min-w-0 flex-1">{children}</div>
      <Suspense fallback={null}><NavigationMobile /></Suspense>
    </div>
  );
}
