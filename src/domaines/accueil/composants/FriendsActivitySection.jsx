"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon, MessageCircleIcon, MusicNote01Icon } from "@hugeicons/core-free-icons";

export default function FriendsActivitySection() {
  const [notification, setNotification] = useState("");

  const handleViewShare = () => {
    setNotification("Playlist ouverte dans vos messages");
    setTimeout(() => setNotification(""), 2200);
  };

  return (
    <section className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2a4a] via-[#1a2750]/80 to-[#0f1a2e] p-6 sm:p-8 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#72eee7]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#72eee7]/5 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-[#72eee7] rounded-full animate-pulse" />
          <p className="text-xs font-bold text-[#72eee7] uppercase tracking-widest">
            <HugeiconsIcon icon={MusicNote01Icon} size={15} strokeWidth={2.3} className="mr-1 inline-block align-text-bottom" />
            Activité Amis
          </p>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          Maya a partagé « Afro Vibes »
        </h3>

        <p className="text-sm text-white/70 mb-4">
          Découvrez la sélection musicale de vos amis et collaborez ensemble
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleViewShare}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#72eee7] text-[#071426] font-semibold rounded-lg hover:bg-white transition transform hover:scale-105 active:scale-95 shrink-0"
          >
            <HugeiconsIcon icon={Share01Icon} size={18} />
            Voir le partage
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition shrink-0"
          >
            <HugeiconsIcon icon={MessageCircleIcon} size={18} />
            Répondre
          </button>
        </div>

        {notification && (
          <div className="mt-4 p-3 bg-[#72eee7]/20 border border-[#72eee7]/30 rounded-lg text-sm text-[#72eee7]">
            {notification}
          </div>
        )}
      </div>
    </section>
  );
}
