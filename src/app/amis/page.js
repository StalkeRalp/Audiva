"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle02Icon, Copy01Icon, Link01Icon, Message01Icon, Share01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { useSocialStore } from "@/domaines/social/stores/socialStore";

const slides = [
  { image: "/ami1.jpg", label: "Votre cercle Audiva", title: "Amis", text: "Découvrez, comparez et partagez la musique qui vous ressemble." },
  { image: "/ami2.jpg", label: "Musique partagée", title: "Ensemble, en rythme.", text: "Envoyez une playlist, un morceau ou un message à votre cercle." },
];

export default function AmisPage() {
  const router = useRouter();
  const { friends, requests, acceptRequest, declineRequest, createInvite } = useSocialStore();
  const [slide, setSlide] = useState(0);
  const [invitation, setInvitation] = useState(null);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);
  const current = slides[slide];

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => { window.clearInterval(timer); window.clearTimeout(initialTimer); };
  }, []);

  const inviteUrl = invitation && typeof window !== "undefined" ? `${window.location.origin}/amis?invitation=${invitation.token}` : "";
  const remaining = invitation ? Math.max(0, Math.ceil((invitation.expiresAt - now) / 1000)) : 0;
  const expired = invitation && remaining === 0;
  const createLink = () => {
    setInvitation(createInvite());
    setNotice("Lien d’invitation créé : il expirera dans 5 minutes.");
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setNotice("Lien d’invitation copié."); } catch { setNotice("Copiez le lien affiché pour le partager."); }
  };
  const shareLink = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Rejoins-moi sur Audiva", text: "Rejoins mon cercle musical Audiva.", url: inviteUrl });
      else await copyLink();
    } catch {
      // L’utilisateur a fermé la fenêtre de partage : aucune erreur à afficher.
    }
  };

  return <main className="min-h-screen bg-[#060b18] pb-32 text-[#eff4ff]">
    <section className="relative isolate min-h-[320px] overflow-hidden border-b border-white/[.07] bg-[#081122] px-5 py-12 sm:min-h-[360px] sm:px-10 lg:px-14">
      <Image key={current.image} src={current.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-center opacity-75 transition-opacity duration-700" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#060b18_3%,rgba(6,11,24,.76)_47%,rgba(6,11,24,.22)),linear-gradient(180deg,transparent_45%,#060b18)]" />
      <div className="mx-auto flex max-w-[1500px] flex-col justify-end sm:min-h-[260px]"><div className="flex max-w-2xl items-end gap-5"><div className="grid h-24 w-24 shrink-0 place-items-center bg-[#102044]/90 shadow-2xl backdrop-blur sm:h-32 sm:w-32"><HugeiconsIcon icon={UserGroupIcon} size={48} strokeWidth={1.7} className="text-[#72eee7]" /></div><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#83eee8]">{current.label}</p><h1 className="mt-2 text-4xl font-black tracking-[-.055em] text-white sm:text-6xl">{current.title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#d4def0]">{current.text}</p></div></div><div className="mt-7 flex items-center gap-2">{slides.map((item, index) => <button type="button" key={item.image} onClick={() => setSlide(index)} aria-label={`Afficher la bannière ${index + 1}`} className={`h-1.5 transition-all ${slide === index ? "w-9 bg-[#72eee7]" : "w-4 bg-white/45 hover:bg-white"}`} />)}</div></div>
    </section>
    <section className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-7 xl:px-9">
      <section className="border border-[#72eee7]/25 bg-[#0a1221] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#83eee8]">Inviter un ami</p><h2 className="mt-2 text-xl font-black text-white">Partagez un lien Audiva</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#aebbd7]">Envoyez ce lien par WhatsApp, Facebook, Telegram ou toute autre application. Il expire automatiquement après cinq minutes.</p></div><button type="button" onClick={createLink} className="inline-flex items-center gap-2 bg-[#72eee7] px-4 py-3 text-sm font-extrabold text-[#061426]"><HugeiconsIcon icon={Link01Icon} size={18} />Créer un lien</button></div>{invitation && <div className={`mt-5 border p-3 ${expired ? "border-rose-300/30 bg-rose-300/5" : "border-white/10 bg-[#07101e]"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><code className="min-w-0 flex-1 truncate text-xs text-[#d8e2f4]">{inviteUrl}</code><div className="flex gap-2"><button type="button" disabled={expired} onClick={copyLink} className="inline-flex items-center gap-2 border border-white/12 px-3 py-2 text-xs font-bold disabled:opacity-40"><HugeiconsIcon icon={Copy01Icon} size={16} />Copier</button><button type="button" disabled={expired} onClick={shareLink} className="inline-flex items-center gap-2 border border-white/12 px-3 py-2 text-xs font-bold disabled:opacity-40"><HugeiconsIcon icon={Share01Icon} size={16} />Partager</button></div></div><p className={`mt-2 text-xs font-bold ${expired ? "text-rose-200" : "text-[#72eee7]"}`}>{expired ? "Ce lien a expiré. Créez-en un nouveau." : `Lien valide encore ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}.`}</p></div>}</section>
      {notice && <p role="status" className="mt-4 border border-[#72eee7]/25 bg-[#112139] px-4 py-3 text-sm font-bold text-[#c8fffb]">{notice}</p>}
      {requests.length ? <section className="mt-10"><h2 className="text-2xl font-black text-white">Demandes d’amitié</h2><div className="mt-5 grid gap-4 lg:grid-cols-2">{requests.map((request) => <article key={request.id} className="flex flex-wrap items-center gap-4 border border-[#72eee7]/22 bg-[#0a1221] p-4"><Avatar person={request} /><div className="min-w-0 flex-1"><p className="font-extrabold text-white">{request.name}</p><p className="text-xs text-[#91a0bd]">{request.username} · {request.mutual} amis en commun</p><p className="mt-2 text-xs text-[#72eee7]">Écoute souvent {request.topArtist}</p></div><div className="flex gap-2"><button type="button" onClick={() => acceptRequest(request.id)} className="inline-flex items-center gap-2 bg-[#72eee7] px-3 py-2 text-xs font-extrabold text-[#061426]"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />Accepter</button><button type="button" onClick={() => declineRequest(request.id)} className="grid h-9 w-9 place-items-center border border-white/12"><HugeiconsIcon icon={Cancel01Icon} size={18} /></button></div></article>)}</div></section> : null}
      <section className="mt-10"><h2 className="text-2xl font-black text-white">Vos amis</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{friends.map((friend) => <article key={friend.id} className="border border-white/[.08] bg-[#0a1221] p-4 transition hover:-translate-y-1 hover:border-[#72eee7]/35"><div className="flex gap-3"><Avatar person={friend} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-extrabold text-white">{friend.name}</h3>{friend.online && <span className="h-2 w-2 rounded-full bg-[#72eee7]" />}</div><p className="text-xs text-[#91a0bd]">{friend.username}</p></div></div><div className="mt-5 grid grid-cols-2 gap-2 border-y border-white/[.07] py-4 text-xs"><div><p className="text-[#71809d]">Top artiste</p><p className="mt-1 truncate font-bold">{friend.topArtist}</p></div><div><p className="text-[#71809d]">En commun</p><p className="mt-1 truncate font-bold">{friend.common}</p></div></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => router.push(`/amis/${friend.id}`)} className="flex-1 border border-white/12 px-3 py-2.5 text-xs font-extrabold hover:border-[#72eee7]/45">Profil</button><button type="button" onClick={() => router.push(`/chat?conversation=${friend.id}`)} className="grid h-9 w-10 place-items-center bg-[#72eee7] text-[#061426]"><HugeiconsIcon icon={Message01Icon} size={18} /></button></div></article>)}</div></section>
    </section>
  </main>;
}

function Avatar({ person }) { return <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#152444]"><Image src={person.avatar || "/hero-playlist.jpg"} alt="" fill sizes="48px" className="object-cover" /></span>; }
