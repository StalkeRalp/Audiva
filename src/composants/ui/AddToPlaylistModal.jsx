"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Plus01Icon, PlayIcon } from "@hugeicons/core-free-icons";

const DEMO_PLAYLISTS = [
  { id: "late-night", name: "Late Night Drive", trackCount: 24 },
  { id: "afro-vibes", name: "Afro Vibes", trackCount: 38 },
  { id: "indie-radar", name: "Indie Radar", trackCount: 18 },
  { id: "blue-room", name: "Blue Room", trackCount: 22 },
];

export default function AddToPlaylistModal({ isOpen, onClose, onAddToPlaylist }) {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateNew, setShowCreateNew] = useState(false);

  if (!isOpen) return null;

  const handleCreateNew = () => {
    if (newPlaylistName.trim()) {
      onAddToPlaylist({
        id: `playlist-${Date.now()}`,
        name: newPlaylistName,
      });
      setNewPlaylistName("");
      setShowCreateNew(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl bg-[#0f1a2e] border border-white/10 p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Ajouter à la playlist</h2>

        {!showCreateNew ? (
          <>
            {/* Créer nouvelle playlist */}
            <button
              onClick={() => setShowCreateNew(true)}
              className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-[#72eee7]/10 hover:bg-[#72eee7]/20 transition border border-[#72eee7]/30 text-white font-semibold"
            >
              <HugeiconsIcon icon={Plus01Icon} size={20} className="text-[#72eee7]" />
              Nouvelle playlist
            </button>

            {/* Playlists existantes */}
            <div className="space-y-2">
              {DEMO_PLAYLISTS.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => {
                    onAddToPlaylist(playlist);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition border border-transparent hover:border-white/10 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{playlist.name}</p>
                      <p className="text-xs text-white/60">
                        {playlist.trackCount} morceaux
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition">
                      <HugeiconsIcon icon={Plus01Icon} size={20} className="text-[#72eee7]" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Créer nouvelle playlist */}
            <input
              type="text"
              placeholder="Nom de la playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#72eee7] text-white placeholder-white/40 outline-none transition"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCreateNew(false);
                  setNewPlaylistName("");
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold transition"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateNew}
                disabled={!newPlaylistName.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#72eee7] hover:bg-white text-[#071426] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold transition"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
