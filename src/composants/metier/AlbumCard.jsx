"use client";

import Image from "next/image";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, FavouriteIcon, Menu01Icon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

export default function AlbumCard({ album, onClick, showPlaylistMenu = false, onPlaylistMenuClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { currentTrack, isPlaying, setCurrentTrack, togglePlay, likedTrackIds, toggleLike } = useLecteurStore();
  const isFavorited = album.songs?.[0] && likedTrackIds.includes(album.songs[0].id);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (album.songs?.length > 0) {
      setCurrentTrack(album.songs[0]);
      togglePlay();
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (album.songs?.length > 0) {
      toggleLike(album.songs?.[0] || { id: album.id });
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (showPlaylistMenu) {
      onPlaylistMenuClick?.(album);
      setShowMenu(false);
    } else {
      setShowMenu(!showMenu);
    }
  };

  return (
    <div
      className="group relative bg-gradient-to-b from-white/8 to-white/3 p-3 backdrop-blur-sm transition duration-300 hover:-translate-y-2 hover:from-white/12 hover:to-white/5 hover:shadow-2xl hover:shadow-white/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      onClick={onClick}
    >
      {/* Pochette Album */}
      <div className="relative overflow-hidden">
        <Image
          src={album.cover || "/placeholder.jpg"}
          alt={album.title}
          width={200}
          height={200}
          className="aspect-square w-full object-cover"
          priority={false}
        />
        {/* Overlay au survol */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`} />

        {/* Actions au survol */}
        {isHovered && (
          <div className="absolute inset-0 flex items-end gap-2 p-3">
            <button
              onClick={handlePlayClick}
              className="flex-1 flex items-center justify-center gap-2 bg-[#72eee7] text-[#071426] py-2 font-semibold hover:bg-white transition transform hover:scale-105 active:scale-95"
              aria-label={`Lire ${album.title}`}
            >
              <HugeiconsIcon icon={PlayIcon} size={18} fill="currentColor" />
              <span className="hidden sm:inline">Lire</span>
            </button>
            <button
              onClick={handleFavoriteClick}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
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
      <div className="mt-3">
        <h3 className="font-semibold text-sm truncate leading-tight text-white">{album.title}</h3>
        <p className="mt-1 text-xs text-white/60 truncate">{album.artist}</p>
        <p className="mt-1 text-xs text-white/40">{album.tracks} morceaux</p>
      </div>

      {/* Menu contextuel */}
      {showMenu && (
        <div className="absolute right-0 top-12 z-50 min-w-max rounded-xl bg-[#0f1a2e] border border-white/10 shadow-2xl">
          <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 first:rounded-t-xl">
            Ajouter aux favoris
          </button>
          <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5">
            Ajouter à la playlist
          </button>
          <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5">
            Voir l&apos;artiste
          </button>
          <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 last:rounded-b-xl">
            Partager
          </button>
        </div>
      )}
    </div>
  );
}
