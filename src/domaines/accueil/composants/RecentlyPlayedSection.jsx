"use client";

import Carousel from "@/composants/ui/Carousel";
import AlbumCard from "@/composants/metier/AlbumCard";
import SectionHeader from "@/composants/ui/SectionHeader";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

export default function RecentlyPlayedSection() {
  // Utiliser l'historique du player
  const { queue } = useLecteurStore();

  // Grouper par albums/artistes
  const recentAlbums = Array.from(
    new Map(
      queue.slice(0, 8).map((track) => [
        track.album,
        {
          id: `${track.album}-${track.artist}`,
          title: track.album,
          artist: track.artist,
          cover: track.cover,
          tracks: 1,
          songs: [track],
        },
      ])
    ).values()
  );

  if (recentAlbums.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <SectionHeader
        title="Écouté récemment"
        subtitle="Continuez votre écoute"
        href="/bibliotheque?vue=historique"
      />

      <Carousel itemsPerView={4} gap="gap-4">
        {recentAlbums.map((album) => (
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
