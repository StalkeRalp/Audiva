"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { FireIcon, LibraryIcon, Message01Icon } from "@hugeicons/core-free-icons";
import { useSocialStore } from "../stores/socialStore";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";
import { getConversationStreak } from "../services/streaks";

export default function FriendProfile({ friendId }) {
  const router = useRouter();
  const { friends, conversations, getOrCreateConversation } = useSocialStore();
  const user = useAuthStore(state => state.user);
  const friend = friends.find(item => item.id === friendId);
  const conversation = conversations.find(item => item.participantId === friendId);
  const streak = getConversationStreak(conversation);

  if (!friend) return <main className="audiva-workspace min-h-screen bg-[#060b18] px-5 py-20 text-[#eff4ff]"><h1 className="text-3xl font-bold">Cet ami est introuvable</h1><p className="mt-3 text-[#91a0bd]">Il a peut-être été retiré de votre cercle.</p><Link href="/amis" className="mt-6 inline-flex items-center gap-2 bg-[#76eee9] px-5 py-3 font-bold text-[#071523]">Retour aux amis</Link></main>;

  const openChat = async () => {
    if (!user) { router.push("/authentification/connexion"); return; }
    const id = await getOrCreateConversation(friendId);
    if (id) router.push(`/chat?conversation=${encodeURIComponent(id)}`);
  };

  return <main className="audiva-workspace audiva-friend-profile min-h-screen bg-[#060b18] pb-32 text-[#eff4ff]">
    <header className="audiva-theme-banner relative isolate overflow-hidden border-b border-[#76eee91d] bg-[#091322] px-5 py-12 sm:px-9 lg:px-12">
      <Image src={friend.avatar || "/hero-playlist.jpg"} alt="" fill priority className="-z-20 scale-110 object-cover opacity-25 blur-sm" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#060b18_8%,rgba(6,11,24,.82)_53%,rgba(8,17,34,.35)),linear-gradient(0deg,#060b18,transparent_80%)]" />
      <div className="mx-auto flex w-full max-w-none flex-col items-start gap-5 sm:flex-row sm:items-end">
        <Image src={friend.avatar || "/hero-playlist.jpg"} alt={`Avatar de ${friend.name}`} width={176} height={176} className="h-32 w-32 rounded-[26px] border border-[#76eee966] object-cover shadow-[0_12px_40px_#0008] sm:h-44 sm:w-44" />
        <div className="min-w-0 flex-1 pb-1"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#a6f6ef]">Votre cercle Audiva</p><h1 className="mt-2 text-4xl font-bold tracking-[-.055em] text-white sm:text-6xl">{friend.name}</h1><p className="mt-2 text-sm text-[#c1cce3]">{friend.username || "Ami Audiva"}{friend.online && <span className="ml-3 inline-flex items-center gap-2 text-[#76eee9]"><i className="h-2 w-2 rounded-full bg-current" />En ligne</span>}</p></div>
        <button type="button" onClick={openChat} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#76eee9] to-[#8bd4ff] px-5 py-3 text-sm font-bold text-[#071523] shadow-[0_8px_28px_#76eee925] transition hover:-translate-y-0.5"><HugeiconsIcon icon={Message01Icon} size={21} />Envoyer un message</button>
      </div>
    </header>
    <section className="mx-auto grid w-full max-w-none gap-4 px-4 py-7 sm:grid-cols-2 sm:px-7 xl:grid-cols-4">
      <article className="border border-white/10 bg-gradient-to-br from-[#14213a] to-[#0b1220] p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#91a0bd]">Artiste préféré</p><p className="mt-3 truncate text-xl font-bold text-white">{friend.topArtist || "À découvrir"}</p><p className="mt-2 text-sm text-[#8292ae]">Selon les informations de son profil</p></article>
      <article className="border border-white/10 bg-gradient-to-br from-[#14213a] to-[#0b1220] p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#91a0bd]">Goûts en commun</p><p className="mt-3 truncate text-xl font-bold text-white">{friend.common || "À découvrir ensemble"}</p><p className="mt-2 text-sm text-[#8292ae]">Vos univers musicaux partagés</p></article>
      <article className="border border-white/10 bg-gradient-to-br from-[#201a2d] to-[#0b1220] p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#b7a5d3]">Playlist partagée</p><p className="mt-3 truncate text-xl font-bold text-white">{friend.playlist || "Aucune playlist indiquée"}</p><Link href="/playlists" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#a6f6ef]"><HugeiconsIcon icon={LibraryIcon} size={17} />Ouvrir mes playlists</Link></article>
      <article className="border border-orange-300/15 bg-gradient-to-br from-[#30202a] to-[#0b1220] p-5"><p className="text-xs font-semibold uppercase tracking-wider text-orange-100/65">Votre série de messages</p><p className="mt-3 flex items-center gap-2 text-xl font-bold text-white"><HugeiconsIcon icon={FireIcon} size={22} className={streak.current ? "text-orange-300" : "text-[#8390a7]"} />{streak.current} jour{streak.current > 1 ? "s" : ""}</p><p className="mt-2 text-sm text-[#a89ca1]">{streak.current ? "Vous avez écrit plusieurs jours de suite." : "Écrivez aujourd’hui pour commencer votre série."}</p></article>
    </section>
    <section className="mx-auto w-full max-w-none px-4 pb-8 sm:px-7"><div className="flex flex-wrap items-center justify-between gap-4 border border-[#76eee91b] bg-[#0c1422] p-5 sm:p-7"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#76eee9]">À vous de jouer</p><h2 className="mt-2 text-2xl font-bold text-white">Une découverte à partager ?</h2><p className="mt-2 text-sm text-[#91a0bd]">Envoyez un message, un GIF, un sticker ou une sélection musicale.</p></div><button type="button" onClick={openChat} className="inline-flex items-center gap-2 rounded-xl border border-[#76eee94a] bg-[#76eee910] px-5 py-3 font-semibold text-[#b8fffb] transition hover:bg-[#76eee91b]"><HugeiconsIcon icon={Message01Icon} size={20} />Reprendre la conversation</button></div></section>
  </main>;
}
