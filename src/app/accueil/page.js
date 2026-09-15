"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon } from "@hugeicons/core-free-icons";
import { HeroAccueil } from "@/domaines/accueil/composants/HeroAccueil";
import { heroSlides, morceauxClassement, artistesDuMois, topAlbums, topArtists, topPlaylists } from "@/domaines/accueil/donnees/accueilMock";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import TopAlbumsSection from "@/domaines/accueil/composants/TopAlbumsSection";
import TopArtistsSection from "@/domaines/accueil/composants/TopArtistsSection";
import Top30Section from "@/domaines/accueil/composants/Top30Section";
import TopPlaylistsSection from "@/domaines/accueil/composants/TopPlaylistsSection";
import RecentlyPlayedSection from "@/domaines/accueil/composants/RecentlyPlayedSection";
import RecommendedSection from "@/domaines/accueil/composants/RecommendedSection";
import FriendsActivitySection from "@/domaines/accueil/composants/FriendsActivitySection";
import GenresSection from "@/domaines/accueil/composants/GenresSection";
import ListeningStatsSection from "@/domaines/accueil/composants/ListeningStatsSection";
import TrendingSection from "@/domaines/accueil/composants/TrendingSection";
import FeaturedTrack from "@/domaines/accueil/composants/FeaturedTrack";

export default function AccueilPage() {
  const [feedback, setFeedback] = useState("");
  const { isPlaying, setCurrentTrack, togglePlay } = useLecteurStore();
  
  const notify = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  };

  const handleHeroAction = (slide) => {
    if (slide.action === "library") {
      notify(`${slide.title} a été ajouté à votre bibliothèque`);
      return;
    }
    setCurrentTrack({
      id: slide.id,
      title: slide.title,
      artist: slide.artist,
      cover: slide.image,
      gradient: "from-[#3559d7] to-[#091632]",
    });
    if (!isPlaying) togglePlay();
    notify(
      slide.action === "discover"
        ? `Découverte de ${slide.title} lancée`
        : `${slide.title} est en lecture`
    );
  };

  return (
    <main className="min-h-screen bg-[#060b18] pb-32 text-[#eff4ff] lg:flex">
      <div className="min-w-0 flex-1">
        <HeroAccueil slides={heroSlides} onAction={handleHeroAction} />
        
        <div className="w-full px-4 sm:px-7 xl:px-9">
          {/* Featured Track */}
          <FeaturedTrack />

          {/* Top Albums */}
          <TopAlbumsSection albums={topAlbums} />

          {/* Top Artistes */}
          <TopArtistsSection artists={topArtists} />

          {/* Recently Played */}
          <RecentlyPlayedSection />

          {/* Trending */}
          <TrendingSection />

          {/* Top 30 */}
          <Top30Section tracks={morceauxClassement} />

          {/* Top Playlists */}
          <TopPlaylistsSection playlists={topPlaylists} />

          {/* Genres Section */}
          <GenresSection />

          {/* Recommended */}
          <RecommendedSection albums={topAlbums} />

          {/* Listening Stats */}
          <ListeningStatsSection />

          {/* Friends Activity */}
          <FriendsActivitySection />
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          role="status"
          className="fixed bottom-24 right-5 z-50 rounded-xl border border-[/25 bg-[#101d36] px-4 py-3 text-sm shadow-2xl"
        >
          {feedback}
        </div>
      )}
    </main>
  );
}
