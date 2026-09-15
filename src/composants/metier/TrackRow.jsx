"use client";

import Image from "next/image";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, FavouriteIcon, Menu01Icon, ArrowUp02Icon, ArrowDown02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

export default function TrackRow({ track, index, ranking, position = "stable", onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { currentTrack, isPlaying, setCurrentTrack, play, pause, likedTrackIds, toggleLike } = useLecteurStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isFavorited = likedTrackIds.includes(track.id);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      setCurrentTrack(track);
      play();
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleLike(track);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const getPositionBadge = () => {
    if (position === "new") return { icon: SparklesIcon, text: "NOUVEAU", color: "text-[#72eee7]" };
    if (position === "up") return { icon: ArrowUp02Icon, text: `+${ranking}`, color: "text-green-400" };
    if (position === "down") return { icon: ArrowDown02Icon, text: `-${ranking}`, color: "text-red-400" };
    return { icon: "—", text: "STABLE", color: "text-white/40" };
  };

  const badge = getPositionBadge();
  const minutes = Math.floor(track.duration / 60);
  const seconds = track.duration % 60;

  return (
    <div
      className="group relative flex items-center gap-4 px-4 py-3 rounded-lg transition duration-200 hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      onClick={onClick}
    >
      {/* Position */}
      <div className="w-8 text-center shrink-0">
        <span className={`text-sm font-bold ${isCurrentTrack && isPlaying ? "text-[#72eee7]" : "text-white/40"}`}>
          {index + 1}
        </span>
      </div>

      {/* Image & Infos */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Pochette */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-[#72eee7]/50 transition">
          <Image
            src={track.cover || "/placeholder.jpg"}
            alt={track.title}
            fill
            className="object-cover"
            sizes="48px"
          />
          
          {isCurrentTrack && isPlaying && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-3 bg-[#72eee7] animate-pulse" style={{ animationDelay: "0ms" }} />
                <div className="w-0.5 h-4 bg-[#72eee7] animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="w-0.5 h-3 bg-[#72eee7] animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Titre & Artiste */}
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold truncate transition ${isCurrentTrack ? "text-[#72eee7]" : "text-white group-hover:text-white/90"}`}>
            {track.title}
          </h3>
          <p className="text-xs text-white/60 truncate group-hover:text-white/70 transition">{track.artist}</p>
        </div>
      </div>

      {/* Ranking */}
      <div className={`hidden sm:flex items-center gap-1.5 shrink-0 font-semibold ${badge.color}`}>
        {typeof badge.icon === "string" ? (
          <span className="text-xs">{badge.icon}</span>
        ) : (
          <HugeiconsIcon icon={badge.icon} size={16} className="text-current" />
        )}
        <span className="text-xs">{badge.text}</span>
      </div>

      {/* Durée */}
      <div className="hidden sm:block text-xs text-white/40 w-10 text-right">
        {minutes}:{String(seconds).padStart(2, "0")}
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
        <button
          onClick={handlePlayClick}
          className="p-2 hover:bg-white/10 rounded-lg transition"
          aria-label={`Lire ${track.title}`}
        >
          <HugeiconsIcon icon={PlayIcon} size={18} fill="currentColor" className="text-[#72eee7]" />
        </button>
        <button
          onClick={handleFavoriteClick}
          className="p-2 hover:bg-white/10 rounded-lg transition"
          aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={18}
            fill={isFavorited ? "currentColor" : "none"}
            className={isFavorited ? "text-[#72eee7]" : "text-white/60"}
          />
        </button>
        <button
          onClick={handleMenuClick}
          className="p-2 hover:bg-white/10 rounded-lg transition relative"
          aria-label="Plus d'options"
        >
          <HugeiconsIcon icon={Menu01Icon} size={18} className="text-white/60" />
          
          {/* Menu contextuel */}
          {showMenu && (
            <div className="absolute right-0 top-10 z-50 min-w-max rounded-xl bg-[#0f1a2e] border border-white/10 shadow-2xl">
              <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 first:rounded-t-xl whitespace-nowrap">
                Ajouter aux favoris
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 whitespace-nowrap">
                Ajouter à la playlist
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 whitespace-nowrap">
                Lire ensuite
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 whitespace-nowrap">
                Voir l&apos;artiste
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 last:rounded-b-xl whitespace-nowrap">
                Partager
              </button>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
