"use client";

import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import TrackRow from "@/composants/metier/TrackRow";
import SectionHeader from "@/composants/ui/SectionHeader";

export default function Top30Section({ tracks }) {
  const tracksWithRanking = tracks.map(track => ({ ...track, position: null, ranking: 0 }));

  return (
    <section className="mt-12">
      <SectionHeader
        title="Top 30 Classement"
        subtitle="Votre top Spotify, puis vos écoutes Audiva et votre bibliothèque"
        href="/statistiques"
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
              onClick={() => { const player = useLecteurStore.getState(); player.setCurrentTrack(track); player.play(); }}

            />
          ))}
        </div>
      </div>
    </section>
  );
}
