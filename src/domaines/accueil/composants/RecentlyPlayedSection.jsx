"use client";

import Carousel from "@/composants/ui/Carousel";
import AlbumCard from "@/composants/metier/AlbumCard";
import SectionHeader from "@/composants/ui/SectionHeader";

export default function RecentlyPlayedSection({ albums = [] }) {
  const recentAlbums = albums.slice(0, 8);

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
            />
          </div>
        ))}
      </Carousel>
    </section>
  );
}
