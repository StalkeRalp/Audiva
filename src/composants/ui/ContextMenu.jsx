"use client";

import { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  Add01Icon,
  PlayNextIcon,
  QueueIcon,
  UserAddIcon,
  ShareForwardIcon,
} from "@hugeicons/core-free-icons";

export default function ContextMenu({ isOpen, items, position = { x: 0, y: 0 }, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-max rounded-xl bg-[#0f1a2e] border border-white/10 shadow-2xl divide-y divide-white/5 overflow-hidden"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick?.();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition flex items-center gap-2 whitespace-nowrap"
        >
          {item.icon && <span className="w-4 h-4">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

export const contextMenuItems = {
  track: (track, onAddToFavorites, onAddToPlaylist, onPlayNext) => [
    {
      label: "Ajouter aux favoris",
      icon: <HugeiconsIcon icon={FavouriteIcon} size={16} />,
      onClick: onAddToFavorites,
    },
    {
      label: "Ajouter à la playlist",
      icon: <HugeiconsIcon icon={Add01Icon} size={16} />,
      onClick: onAddToPlaylist,
    },
    {
      label: "Lire ensuite",
      icon: <HugeiconsIcon icon={PlayNextIcon} size={16} />,
      onClick: onPlayNext,
    },
    {
      label: "Voir l'artiste",
      icon: <HugeiconsIcon icon={UserAddIcon} size={16} />,
      onClick: () => {},
    },
    {
      label: "Partager",
      icon: <HugeiconsIcon icon={ShareForwardIcon} size={16} />,
      onClick: () => {},
    },
  ],

  album: (album, onPlayFirst, onAddToFavorites) => [
    {
      label: "Lire d'abord",
      icon: <HugeiconsIcon icon={PlayNextIcon} size={16} />,
      onClick: onPlayFirst,
    },
    {
      label: "Ajouter aux favoris",
      icon: <HugeiconsIcon icon={FavouriteIcon} size={16} />,
      onClick: onAddToFavorites,
    },
    {
      label: "Ajouter à la file",
      icon: <HugeiconsIcon icon={QueueIcon} size={16} />,
      onClick: () => {},
    },
  ],

  playlist: (playlist, onPlayPlaylist, onAddToFavorites) => [
    {
      label: "Lire la playlist",
      icon: <HugeiconsIcon icon={PlayNextIcon} size={16} />,
      onClick: onPlayPlaylist,
    },
    {
      label: "Ajouter aux favoris",
      icon: <HugeiconsIcon icon={FavouriteIcon} size={16} />,
      onClick: onAddToFavorites,
    },
    {
      label: "Partager",
      icon: <HugeiconsIcon icon={ShareForwardIcon} size={16} />,
      onClick: () => {},
    },
  ],
};
