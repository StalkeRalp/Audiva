"use client";

import { useState, useEffect } from "react";
import Carousel from "@/composants/ui/Carousel";
import SectionHeader from "@/composants/ui/SectionHeader";
import TrackRow from "@/composants/metier/TrackRow";

const trendingTracks = [
  { id: "trending-1", title: "Tendance #1", artist: "Artiste Trending", cover: "/hero-recommandation.jpg", duration: 210 },
  { id: "trending-2", title: "Viral Now", artist: "Artist Viral", cover: "/hero-playlist.jpg", duration: 195 },
  { id: "trending-3", title: "Buzz Song", artist: "Rising Star", cover: "/hero-decouverte.jpg", duration: 220 },
];

export default function TrendingSection() {
  const [trendingData, setTrendingData] = useState([]);

  useEffect(() => {
    // Simuler des données trending
    setTrendingData(trendingTracks);
  }, []);

  return (
    <section className="mt-12">
      <SectionHeader
        title="🔥 Tendances"
        subtitle="Les chansons qui montent en ce moment"
        href="/decouverte/tendances"
      />

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 via-white/3 to-transparent overflow-hidden backdrop-blur-sm">
        <div className="divide-y divide-white/5">
          {trendingData.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              position={index === 0 ? "up" : "stable"}
              ranking={3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
