"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import AlbumCard from "@/composants/metier/AlbumCard";

export default function TopAlbumsSection({ albums }) {
  const router = useRouter();
  const railRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const threshold = 2;
    setCanGoBack(rail.scrollLeft > threshold);
    setCanGoForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - threshold);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(rail);
    rail.addEventListener("scroll", updateControls, { passive: true });

    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", updateControls);
    };
  }, [updateControls, albums]);

  const scrollRail = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.72, 280), behavior: "smooth" });
  };

  return (
    <section className="mt-12">
      <div className="mb-6 mt-9 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Top Albums</h2>
          <p className="mt-2 text-sm text-white/60">Les albums les plus écoutés cette semaine</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/bibliotheque/albums" className="hidden text-xs font-semibold text-white/60 transition hover:text-[#72eee7] sm:block">
            Voir tout
          </Link>
          {canGoBack || canGoForward ? (
            <div className="flex items-center gap-2">
              <CarouselButton disabled={!canGoBack} label="Albums précédents" onClick={() => scrollRail(-1)} icon={ArrowLeft01Icon} />
              <CarouselButton disabled={!canGoForward} label="Albums suivants" onClick={() => scrollRail(1)} icon={ArrowRight01Icon} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden">
        <div ref={railRef} className="audiva-carousel flex gap-3 overflow-x-auto scroll-smooth pb-1 touch-pan-x">
        {albums.map((album) => (
          <div key={album.id} className="w-[clamp(160px,calc((100vw-340px)/6),280px)] min-w-[160px] flex-shrink-0">
            <AlbumCard
              album={album}
              onClick={() => {
                router.push(`/bibliotheque/albums?album=${album.id}`);
              }}
            />
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}

function CarouselButton({ icon, label, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center border border-white/10 bg-white/[0.04] text-white transition duration-200 hover:border-[#72eee7]/45 hover:bg-[#72eee7]/10 hover:text-[#72eee7] active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:bg-white/[0.04] disabled:hover:text-white"
    >
      <HugeiconsIcon icon={icon} size={20} strokeWidth={2.5} />
    </button>
  );
}
