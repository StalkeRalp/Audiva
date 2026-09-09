"use client";

import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, Queue02Icon, MusicNote01Icon, StarIcon, ChartLineData01Icon } from "@hugeicons/core-free-icons";

export default function ListeningStatsSection() {
  const { likedTrackIds, queue, currentTrack } = useLecteurStore();

  const stats = [
    { label: "Chansons aimées", value: likedTrackIds.length, icon: FavouriteIcon },
    { label: "Chansons dans la queue", value: queue.length, icon: Queue02Icon },
    { label: "Genre favori", value: "Pop/Indie", icon: MusicNote01Icon },
    { label: "Artiste top", value: "Maya K.", icon: StarIcon },
  ];

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mb-6">
        <HugeiconsIcon icon={ChartLineData01Icon} size={27} strokeWidth={2.25} />
        Vos statistiques d&apos;écoute
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/2 p-5 backdrop-blur-sm hover:border-white/20 hover:from-white/8 transition"
          >
            <div className="mb-3 text-[#72eee7]"><HugeiconsIcon icon={stat.icon} size={28} strokeWidth={2.2} /></div>
            <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-[#72eee7] mt-2">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
