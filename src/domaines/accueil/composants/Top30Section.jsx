"use client";

import Link from "next/link";
import TrackRow from "@/composants/metier/TrackRow";
import SectionHeader from "@/composants/ui/SectionHeader";

const rankingChanges = [3, 5, 0];

export default function Top30Section({ tracks }) {
  const tracksWithRanking = tracks.map((track, index) => ({
    ...track,
    position: index === 0 ? "up" : index === 1 ? "down" : index === 2 ? "new" : "stable",
    ranking: rankingChanges[index] ?? 0,
  }));

  return (
    <section className="mt-12">
      <SectionHeader
        title="Top 30 Classement"
        subtitle="Les chansons les plus écoutées du moment"
        href="/bibliotheque?vue=statistiques"
      />
      
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 via-white/3 to-transparent overflow-hidden backdrop-blur-sm">
        <div className="divide-y divide-white/5">
          {tracksWithRanking.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              position={track.position}
              ranking={track.ranking}
              onClick={() => {
                // Lire la chanson
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
