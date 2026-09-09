"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, PauseIcon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

export default function NowPlayingBadge() {
  const { currentTrack, isPlaying } = useLecteurStore();

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-40 pointer-events-none">
      <div className="flex items-center gap-3 rounded-full bg-gradient-to-r from-[#072026] via-[#0a1b2e] to-[#05101a] border border-[#72eee7]/20 px-4 py-2.5 shadow-xl backdrop-blur-xl animate-fade-in-up">
        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
          <Image
            src={currentTrack.cover || "/placeholder.jpg"}
            alt={currentTrack.title}
            fill
            className="object-cover"
            sizes="32px"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-2 bg-[#72eee7] animate-pulse" style={{ animationDelay: "0ms" }} />
                <div className="w-0.5 h-3 bg-[#72eee7] animate-pulse" style={{ animationDelay: "150ms" }} />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 text-xs">
          <div className="font-semibold text-[#72eee7] truncate">En écoute</div>
          <div className="text-white/80 truncate">{currentTrack.title}</div>
        </div>

        <div className="text-[#72eee7] ml-1 shrink-0">
          {isPlaying ? (
            <HugeiconsIcon icon={PauseIcon} size={16} fill="currentColor" />
          ) : (
            <HugeiconsIcon icon={PlayIcon} size={16} fill="currentColor" />
          )}
        </div>
      </div>
    </div>
  );
}
