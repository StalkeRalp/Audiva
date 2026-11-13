"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon, MessageCircleIcon, MusicNote01Icon } from "@hugeicons/core-free-icons";
import { useSocialStore } from "@/domaines/social/stores/socialStore";

export default function FriendsActivitySection() {
  const router = useRouter();
  const activities = useSocialStore(state => state.activities).slice(0, 4);

  return (
    <section className="audiva-friends-activity mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2a4a] via-[#1a2750]/80 to-[#0f1a2e] p-6 sm:p-8 overflow-hidden relative">
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

        <h3 className="text-xl font-bold text-white mb-2">{activities.length ? "Les dernières nouvelles de votre cercle" : "Retrouvez votre cercle musical"}</h3>

        {activities.length ? <div className="mb-5 space-y-2">{activities.map(activity => <article key={activity.id} className="border border-white/10 bg-black/15 px-4 py-3"><p className="text-sm text-white"><strong>{activity.actor?.name || "Un ami"}</strong>{activity.activity_type === "listened" ? " a écouté" : activity.activity_type === "playlist_created" ? " a créé la playlist" : " a partagé une activité"}{activity.summary?.title && <> <strong>« {activity.summary.title} »</strong></>}{activity.summary?.artist && <span className="text-white/65"> · {activity.summary.artist}</span>}</p><small className="mt-1 block text-xs text-white/50">{activity.time}</small></article>)}</div> : <p className="text-sm text-white/70 mb-4">Aucune activité partagée pour le moment. Les écoutes ne s’affichent que si leur auteur a activé le partage dans ses paramètres.</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.push("/amis")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#72eee7] text-[#071426] font-semibold rounded-lg hover:bg-white transition transform hover:scale-105 active:scale-95 shrink-0"
          >
            <HugeiconsIcon icon={Share01Icon} size={18} />
            Voir mes amis
          </button>

          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition shrink-0"
          >
            <HugeiconsIcon icon={MessageCircleIcon} size={18} />
            Ouvrir les messages
          </button>
        </div>


      </div>
    </section>
  );
}
