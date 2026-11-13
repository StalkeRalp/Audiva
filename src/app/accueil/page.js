"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HeroAccueil } from "@/domaines/accueil/composants/HeroAccueil";
import { useAccueil } from "@/domaines/accueil/hooks/useAccueil";
import { useRouter } from "next/navigation";
import { isLocalTrack, useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import TopAlbumsSection from "@/domaines/accueil/composants/TopAlbumsSection";
import TopArtistsSection from "@/domaines/accueil/composants/TopArtistsSection";
import Top30Section from "@/domaines/accueil/composants/Top30Section";
import TopPlaylistsSection from "@/domaines/accueil/composants/TopPlaylistsSection";
import RecentlyPlayedSection from "@/domaines/accueil/composants/RecentlyPlayedSection";
import PersonalizedDiscoveries from "@/domaines/decouverte/composants/PersonalizedDiscoveries";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";
import FriendsActivitySection from "@/domaines/accueil/composants/FriendsActivitySection";
import GenresSection from "@/domaines/accueil/composants/GenresSection";
import ListeningStatsSection from "@/domaines/accueil/composants/ListeningStatsSection";
import TrendingSection from "@/domaines/accueil/composants/TrendingSection";
import FeaturedTrack from "@/domaines/accueil/composants/FeaturedTrack";
import PochetteGallery from "@/composants/ui/PochetteGallery";

export default function AccueilPage() {
  const [feedback, setFeedback] = useState("");
  const localTracks = useBibliothequeStore(state => state.tracks);
  const data = useAccueil();
  const router = useRouter();
  const handleHeroAction = (slide) => {
    if (slide.action === "library" || !slide.track) { router.push("/bibliotheque"); return; }
    const player = useLecteurStore.getState();
    player.setCurrentTrack(slide.track);
    player.play();
    setFeedback(isLocalTrack(slide.track) ? `Lecture de ${slide.track.title}` : "Lecture Spotify dans Audiva");
    window.setTimeout(() => setFeedback(""), 2200);
  };

  return (
    <main className="min-h-screen bg-[#060b18] pb-32 text-[#eff4ff] lg:flex">
      <div className="min-w-0 flex-1">
        <HeroAccueil slides={data.slides} onAction={handleHeroAction} />
        <PochetteGallery compact />
        
        <div className="w-full px-4 sm:px-7 xl:px-9">
          {data.loading && <p role="status">Chargement de votre sélection…</p>}
          {data.error && <p role="status">{data.error}</p>}
          {/* Featured Track */}
          <FeaturedTrack track={data.featured} />

          {/* Top Albums */}
          <TopAlbumsSection albums={data.albums} />

          {/* Top Artistes */}
          <TopArtistsSection artists={data.artists} />

          {/* Recently Played */}
          <RecentlyPlayedSection albums={data.recentAlbums} />

          {/* Trending */}
          <TrendingSection tracks={data.tracks.slice(0, 3)} />

          {/* Top 30 */}
          <Top30Section tracks={data.tracks} />

          {/* Top Playlists */}
          <TopPlaylistsSection playlists={data.playlists} />

          {/* Genres Section */}
          <GenresSection />

          {/* Recommended */}
          <PersonalizedDiscoveries artists={data.artists.filter(artist => artist.provider === "spotify")} tracks={data.tracks.filter(track => track.provider === "spotify")} localTracks={localTracks} />

          {/* Listening Stats */}
          <ListeningStatsSection topArtist={data.topArtist} topGenre={data.topGenre} />

          {/* Friends Activity */}
          <FriendsActivitySection />
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div role="status" className="fixed bottom-24 right-5 z-50 flex max-w-[calc(100vw-24px)] items-center gap-3 rounded-xl border border-white/25 bg-[#101d36] px-4 py-3 pr-2 text-sm shadow-2xl">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback("")} aria-label="Fermer le message" className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-white/10"><HugeiconsIcon icon={Cancel01Icon} size={16}/></button>
        </div>
      )}
    </main>
  );
}
