"use client";

import Link from "next/link";
import Carousel from "@/composants/ui/Carousel";
import PlaylistCard from "@/composants/metier/PlaylistCard";
import SectionHeader from "@/composants/ui/SectionHeader";

export default function TopPlaylistsSection({ playlists }) {
  return (
    <section className="mt-12">
      <SectionHeader
        title="Top Playlists"
        subtitle="Les meilleures sélections de la semaine"
        href="/playlists"
      />
      
      <Carousel itemsPerView={4} gap="gap-4">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="flex-shrink-0 w-60">
            <PlaylistCard
              playlist={playlist}
              onClick={() => {
                window.location.href = `/playlists/${playlist.id}`;
              }}
            />
          </div>
        ))}
      </Carousel>
    </section>
  );
}
