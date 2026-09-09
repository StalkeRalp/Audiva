"use client";

import Image from "next/image";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Add01Icon } from "@hugeicons/core-free-icons";

export default function ArtistCard({ artist, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="text-center group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Avatar circulaire */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-white/5 transition duration-300 ${isHovered ? "ring-2 ring-[#72eee7] shadow-xl shadow-[#72eee7]/30" : ""}`} />
        
        <Image
          src={artist.image}
          alt={artist.name}
          fill
          className={`rounded-full object-cover p-1 transition duration-300 ${isHovered ? "scale-95" : ""}`}
          sizes="(max-width: 640px) 96px, 128px"
        />

        {/* Actions au survol */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <button
              className="p-2 bg-[#72eee7] text-[#071426] rounded-full hover:scale-110 transition transform"
              aria-label={`Lire ${artist.name}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <HugeiconsIcon icon={PlayIcon} size={20} fill="currentColor" />
            </button>
            <button
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition"
              aria-label={`Suivre ${artist.name}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <HugeiconsIcon icon={Add01Icon} size={20} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Nom */}
      <h3 className="text-sm font-semibold text-white max-w-[110px] mx-auto truncate group-hover:text-[#72eee7] transition">
        {artist.name}
      </h3>

      {/* Auditeurs */}
      <p className="text-xs text-white/50 mt-1">{artist.listeners} auditeurs</p>
    </div>
  );
}
