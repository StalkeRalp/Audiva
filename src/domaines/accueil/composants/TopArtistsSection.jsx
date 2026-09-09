"use client";

import Link from "next/link";
import Carousel from "@/composants/ui/Carousel";
import ArtistCard from "@/composants/metier/ArtistCard";
import SectionHeader from "@/composants/ui/SectionHeader";

export default function TopArtistsSection({ artists }) {
  return (
    <section className="mt-12">
      <SectionHeader
        title="Top Artistes"
        subtitle="Les artistes en vogue cette semaine"
        href="/decouverte"
      />
      
      <Carousel itemsPerView={6} gap="gap-4">
        {artists.map((artist) => (
          <div key={artist.id} className="flex-shrink-0 w-40">
            <ArtistCard
              artist={artist}
              onClick={() => {
                window.location.href = `/artistes/${artist.id}`;
              }}
            />
          </div>
        ))}
      </Carousel>
    </section>
  );
}
