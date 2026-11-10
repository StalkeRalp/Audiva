"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, ChartLineData01Icon, FireIcon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import TrackRow from "@/composants/metier/TrackRow";

export default function TrendingSection({ tracks = [] }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center bg-[#72eee7]/10 text-[#72eee7]"><HugeiconsIcon icon={FireIcon} size={20} strokeWidth={2.3} /></span><h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Tendances</h2></div>
          <p className="mt-2 text-sm text-white/60">Les morceaux de votre sélection personnelle.</p>
        </div>
        <Link href="/decouverte/tendances" className="inline-flex items-center gap-1 text-xs font-bold text-white/60 transition hover:text-[#72eee7]">Voir tout <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2.4} /></Link>
      </div>

      <div className="relative overflow-hidden border border-white/10 bg-[#0b1221] shadow-[0_18px_42px_rgba(0,0,0,.18)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#72eee7]/55 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#7785a3]"><span>Vos titres du moment</span><span className="hidden items-center gap-1 sm:flex"><HugeiconsIcon icon={ChartLineData01Icon} size={14} />Votre classement</span></div>
        <div className="divide-y divide-white/5">
          {!tracks.length && <p className="p-4 text-sm text-white/60">Vos titres apparaîtront après vos premières écoutes ou une connexion Spotify.</p>}
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              position={null}
              ranking={0}
              onClick={() => { const player = useLecteurStore.getState(); player.setCurrentTrack(track); player.play(); }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
