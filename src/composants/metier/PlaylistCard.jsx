"use client";

import Image from "next/image";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, FavouriteIcon, Menu01Icon } from "@hugeicons/core-free-icons";

export default function PlaylistCard({ playlist, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    // Déclencher la lecture de la playlist
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      className="group relative rounded-2xl bg-gradient-to-b from-white/8 to-white/3 p-3 backdrop-blur-sm transition duration-300 hover:-translate-y-2 hover:from-white/12 hover:to-white/5 hover:shadow-2xl hover:shadow-white/10 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      onClick={onClick}
    >
      {/* Couverture */}
      <div className="relative overflow-hidden rounded-xl mb-3">
        <Image
          src={playlist.cover || "/placeholder.jpg"}
          alt={playlist.title}
          width={200}
          height={200}
          className="aspect-square w-full object-cover"
        />

        {/* Overlay au survol */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`} />

        {/* Badge curated */}
        {playlist.curated && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-[#72eee7]/90 text-[#071426] text-xs font-bold rounded-full">
            AUDIVA PICK
          </div>
        )}

        {/* Actions au survol */}
        {isHovered && (
          <div className="absolute inset-0 flex items-end gap-2 p-3">
            <button
              onClick={handlePlayClick}
              className="flex-1 flex items-center justify-center gap-2 bg-[#72eee7] text-[#071426] rounded-lg py-2 font-semibold hover:bg-white transition transform hover:scale-105 active:scale-95"
              aria-label={`Lire ${playlist.title}`}
            >
              <HugeiconsIcon icon={PlayIcon} size={18} fill="currentColor" />
              <span className="hidden sm:inline">Lire</span>
            </button>
            <button
              onClick={handleFavoriteClick}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              aria-label="Ajouter aux favoris"
            >
              <HugeiconsIcon
                icon={FavouriteIcon}
                size={20}
                fill={isFavorited ? "currentColor" : "none"}
                className={isFavorited ? "text-[#72eee7]" : "text-white/60"}
              />
            </button>
            <button
              onClick={handleMenuClick}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              aria-label="Plus d'options"
            >
              <HugeiconsIcon icon={Menu01Icon} size={20} className="text-white/60" />
            </button>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1">
        <h3 className="font-semibold text-sm truncate leading-tight text-white">
          {playlist.title}
        </h3>
        <p className="mt-1 text-xs text-white/60 line-clamp-2 min-h-[2em]">
          {playlist.description}
        </p>
        <p className="mt-2 text-xs text-white/40">
          {playlist.tracks} morceaux • {playlist.updatedAt}
        </p>
      </div>

      {/* Menu contextuel */}
      {showMenu && (
        <div className="absolute right-0 top-12 z-50 min-w-max rounded-xl bg-[#0f1a2e] border border-white/10 shadow-2xl">
          <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 first:rounded-t-xl whitespace-nowrap">
            Ajouter aux favoris
          </button>
          <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 whitespace-nowrap">
            Télécharger
          </button>
          <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 last:rounded-b-xl whitespace-nowrap">
            Partager
          </button>
        </div>
      )}
    </div>
  );
}
