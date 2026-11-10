"use client";

import { useRouter } from "next/navigation";
import Carousel from "@/composants/ui/Carousel";
import ArtistCard from "@/composants/metier/ArtistCard";
import SectionHeader from "@/composants/ui/SectionHeader";

export default function TopArtistsSection({ artists }) {
  const router = useRouter();
  return (
    <section className="mt-12">
      <SectionHeader
        title="Top Artistes"
        subtitle="Vos artistes Spotify et ceux de votre bibliothèque"
        href="/decouverte"
      />
      
      <Carousel itemsPerView={6} gap="gap-4">
        {artists.map((artist) => (
          <div key={artist.id} className="flex-shrink-0 w-40">
            <ArtistCard
              artist={artist}
              onClick={() => {
                const artistId = artist.provider === "spotify" && artist.providerId
                  ? `spotify:${artist.providerId}`
                  : artist.id;
                router.push(`/artistes/${encodeURIComponent(artistId)}`);
              }}
            />
          </div>
        ))}
      </Carousel>
    </section>
  );
}
