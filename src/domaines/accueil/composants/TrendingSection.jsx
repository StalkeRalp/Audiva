"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, ChartLineData01Icon, FireIcon } from "@hugeicons/core-free-icons";
import TrackRow from "@/composants/metier/TrackRow";

const trendingTracks = [
  { id: "trending-1", title: "Afterglow", artist: "Maya K.", album: "Blue Hour", cover: "/hero-recommandation.jpg", duration: 210, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", trend: "+3", badge: "HOT" },
  { id: "trending-2", title: "Nuit électrique", artist: "Audiva Sessions", album: "Nuit électrique", cover: "/hero-playlist.jpg", duration: 195, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", trend: "+1", badge: "VIRAL" },
  { id: "trending-3", title: "Lila Sun", artist: "Lila Sun", album: "Indie Dreams", cover: "/hero-decouverte.jpg", duration: 220, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", trend: "NOUVEAU", badge: "JAMENDO" },
];

export default function TrendingSection() {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center bg-[#72eee7]/10 text-[#72eee7]"><HugeiconsIcon icon={FireIcon} size={20} strokeWidth={2.3} /></span><h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Tendances</h2></div>
          <p className="mt-2 text-sm text-white/60">Les morceaux qui prennent de l&apos;ampleur en ce moment.</p>
        </div>
        <Link href="/decouverte/tendances" className="inline-flex items-center gap-1 text-xs font-bold text-white/60 transition hover:text-[#72eee7]">Voir tout <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2.4} /></Link>
      </div>

      <div className="relative overflow-hidden border border-white/10 bg-[#0b1221] shadow-[0_18px_42px_rgba(0,0,0,.18)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#72eee7]/55 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#7785a3]"><span>Cette semaine</span><span className="hidden items-center gap-1 sm:flex"><HugeiconsIcon icon={ChartLineData01Icon} size={14} />Classement Audiva</span></div>
        <div className="divide-y divide-white/5">
          {trendingTracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              position={index === 0 ? "up" : index === 1 ? "up" : "new"}
              ranking={index === 0 ? 3 : 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
