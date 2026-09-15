"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Carousel from "@/composants/ui/Carousel";
import PlaylistCard from "@/composants/metier/PlaylistCard";
import SectionHeader from "@/composants/ui/SectionHeader";
import CreatePlaylistButton from "@/domaines/playlists/composants/CreatePlaylistButton";

export default function TopPlaylistsSection({ playlists }) {
  const router = useRouter();
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1"><SectionHeader title="Top Playlists" subtitle="Les meilleures sélections de la semaine" href="/bibliotheque?vue=playlists" /></div>
        <div className="mb-6 shrink-0"><CreatePlaylistButton /></div>
      </div>
      
      <Carousel itemsPerView={4} gap="gap-4">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="flex-shrink-0 w-60">
            <PlaylistCard
              playlist={playlist}
              onClick={() => {
                router.push(`/bibliotheque?vue=playlists&playlist=${playlist.id}`);
              }}
            />
          </div>
        ))}
      </Carousel>
    </section>
  );
}
