"use client";

import Carousel from "@/composants/ui/Carousel";
import AlbumCard from "@/composants/metier/AlbumCard";
import SectionHeader from "@/composants/ui/SectionHeader";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

export default function RecommendedSection({ albums }) {
  const { likedTrackIds } = useLecteurStore();

  if (likedTrackIds.length === 0) {
    return null;
  }

  // Recommander des albums basés sur les favoris
  const recommendedAlbums = albums.filter(
    (album) =>
      album.songs?.some((song) => likedTrackIds.includes(song.id))
  );

  if (recommendedAlbums.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <SectionHeader
        title="Parce que vous aimez..."
        subtitle="Basé sur vos favoris"
        href="/recherche"
      />

      <Carousel itemsPerView={4} gap="gap-4">
        {recommendedAlbums.slice(0, 8).map((album) => (
          <div key={album.id} className="flex-shrink-0 w-60">
            <AlbumCard
              album={album}
              onClick={() => {
                // Ouvrir l'album
              }}
            />
          </div>
        ))}
      </Carousel>
    </section>
  );
}
