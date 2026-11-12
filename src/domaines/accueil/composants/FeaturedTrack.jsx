"use client";

import Image from "next/image";
import { PochetteImage } from "@/composants/ui/PochetteImage";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, FavouriteIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { isLocalTrack, useLecteurControlsStore } from "@/domaines/lecteur/stores/lecteurStore";

export default function FeaturedTrack({ track }) {
  const [isHovered, setIsHovered] = useState(false);
  const { currentTrack, setCurrentTrack, play, likedTrackIds, toggleLike } = useLecteurControlsStore();
  const selectedTrack = currentTrack && !/soundhelix\.com/i.test(currentTrack.streamUrl || "") ? currentTrack : track;
  const displayTrack = selectedTrack || { id: "empty", title: "Votre musique à la une", artist: "Importez vos morceaux pour commencer", album: "Votre sélection apparaîtra ici", cover: "/placeholders/audio-cover.svg" };
  const isFavorited = likedTrackIds.includes(displayTrack.id);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (!selectedTrack) return;
    setCurrentTrack(displayTrack);
    play();
  };

  return (
    <section className="relative mt-10 overflow-hidden border border-white/10 bg-[#101626]">
      <PochetteImage unoptimized src={displayTrack.cover || "/placeholders/audio-cover.svg"} alt="" fill className="scale-110 object-cover opacity-20 blur-3xl transition-opacity duration-500" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,19,34,.97),rgba(13,19,34,.89),rgba(13,19,34,.73))]" />
      <div
        className="relative flex min-h-[280px] flex-col items-center gap-6 p-6 sm:min-h-[310px] sm:flex-row sm:gap-8 sm:p-10 group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background decoration */}
        <div className={`absolute inset-0 bg-gradient-to-r from-[#72eee7]/10 via-transparent to-transparent transition duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`} />

        {/* Image */}
        <div className="relative z-10 h-48 w-48 shrink-0 overflow-hidden sm:h-56 sm:w-56 group-hover:ring-2 group-hover:ring-[#72eee7]/50 transition">
          <PochetteImage unoptimized
            src={displayTrack.cover || "/placeholders/audio-cover.svg"}
            alt={displayTrack.title}
            fill
            className="object-cover"
          />

          {/* Play overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
              <button
                disabled={!selectedTrack}
                onClick={handlePlayClick}
                className="p-4 bg-[#72eee7] text-[#071426] rounded-full hover:scale-110 transition transform"
              >
                <HugeiconsIcon icon={PlayIcon} size={32} fill="currentColor" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 text-center sm:text-left">
          <div className="mb-4 inline-flex items-center gap-1.5 border border-[#72eee7]/50 bg-[#72eee7]/20 px-3 py-1.5">
            <HugeiconsIcon icon={SparklesIcon} size={15} className="text-[#72eee7]" />
            <span className="text-xs font-bold text-[#72eee7]">{currentTrack?.id === displayTrack.id ? "En lecture" : "Pour vous"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {displayTrack.title}
          </h2>

          <p className="text-lg text-white/80 mb-4">
            {displayTrack.artist}
          </p>

          <p className="text-sm text-white/60 mb-6">
            {displayTrack.album || "Votre sélection Audiva"}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
            <button
              disabled={!selectedTrack}
              onClick={handlePlayClick}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#72eee7] text-[#071426] font-bold hover:bg-white transition transform hover:scale-105 active:scale-95"
            >
              <HugeiconsIcon icon={PlayIcon} size={20} fill="currentColor" />
              {selectedTrack ? "Écouter dans Audiva" : "Lire maintenant"}
            </button>

            <button
              disabled={!selectedTrack}
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(displayTrack);
              }}
              className={`flex items-center justify-center gap-2 px-6 py-3 font-semibold transition border ${
                isFavorited
                  ? "bg-[#72eee7]/20 border-[#72eee7] text-[#72eee7]"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }`}
            >
              <HugeiconsIcon
                icon={FavouriteIcon}
                size={20}
                fill={isFavorited ? "currentColor" : "none"}
              />
              {isFavorited ? "Aimé" : "Aimer"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
