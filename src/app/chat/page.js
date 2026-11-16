"use client";

import { PochetteImage } from "@/composants/ui/PochetteImage";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, FireIcon, Message01Icon, MusicNote01Icon, PlayIcon, SendIcon, Share01Icon } from "@hugeicons/core-free-icons";
import { useSocialStore } from "@/domaines/social/stores/socialStore";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";
import { getConversationStreak } from "@/domaines/social/services/streaks";
import { ChatGifMessage } from "@/domaines/social/composants/ChatGifMedia";
import { useLecteurControlsStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";
import { searchSpotify } from "@/domaines/statistiques/services/spotify";
import { normalizeText } from "@/services/catalogue/normalisation";
import { deleteConversationBackground, readConversationBackground, saveConversationBackground } from "@/domaines/social/services/chatAppearanceStorage";

const ShareContentModal = dynamic(() => import("@/composants/ui/ShareContentModal"), { ssr: false });
const GifPicker = dynamic(() => import("@/domaines/social/composants/GifPicker").then(module => module.GifPicker), { ssr: false, loading: () => <p role="status" className="chat-gif-status">Chargement de la bibliothèque…</p> });
const EmojiPicker = dynamic(() => import("@/domaines/social/composants/ChatEmojiPicker"), { ssr: false, loading: () => <p role="status" className="chat-gif-status">Chargement des emojis…</p> });

const Send01Icon = SendIcon;
const artistParts = value => normalizeText(value || "").split(/\b(?:feat(?:uring)?|ft|with|and|x)\b|,|&/).map(part => part.trim()).filter(Boolean);
const stickers = [{ emoji: "🔥", label: "Ça chauffe" }, { emoji: "🎧", label: "En écoute" }, { emoji: "💙", label: "Cœur bleu" }, { emoji: "🪩", label: "On danse" }, { emoji: "🎶", label: "La musique" }, { emoji: "✨", label: "Brillant" }, { emoji: "💿", label: "Classique" }, { emoji: "🌙", label: "Ambiance nuit" }, { emoji: "🚀", label: "En route" }, { emoji: "🫶", label: "Avec amour" }, { emoji: "🥳", label: "Célébration" }, { emoji: "🙌", label: "Bravo" }];


export default function ChatPage() { return <Suspense fallback={<main className="min-h-screen bg-[#060b18]" />}><Chat /></Suspense>; }
function Chat() {
  const params = useSearchParams(); const router = useRouter(); const { friends, conversations, sendMessage, editMessage, deleteMessage, markConversationRead, clearConversation, getOrCreateConversation, cloudLoading, cloudError } = useSocialStore();
  const user = useAuthStore(state => state.user);
  const player = useLecteurControlsStore();
  const localTracks = useBibliothequeStore(state => state.tracks);
  const requestedId = params.get("conversation") || params.get("friend"); const [selectedId, setSelectedId] = useState(null), [text, setText] = useState(""), [shareKind, setShareKind] = useState(null), [sending, setSending] = useState(false), [sendError, setSendError] = useState(""); const sendingRef = useRef(false);
  const active = useMemo(() => conversations.find((conversation) => conversation.id === selectedId) || conversations.find(conversation => conversation.id === requestedId || conversation.participantId === requestedId) || conversations[0], [conversations, requestedId, selectedId]); const friend = friends.find((item) => item.id === active?.participantId);
  useEffect(() => { if (!requestedId || conversations.some(conversation => conversation.id === requestedId || conversation.participantId === requestedId)) return; getOrCreateConversation(requestedId); }, [requestedId, conversations, getOrCreateConversation]);
  useEffect(() => { if (active?.id) markConversationRead(active.id); }, [active?.id, markConversationRead]);
  const select = (id) => { setSelectedId(id); markConversationRead(id); router.replace(`/chat?conversation=${encodeURIComponent(id)}`, { scroll: false }); };
  const send = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || !active || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSendError("");
    try {
      const sent = await sendMessage(active.id, { text: value });
      if (sent) setText(current => current === value ? "" : current);
      else setSendError(useSocialStore.getState().cloudError || "Le message n’a pas pu être envoyé. Réessayez.");
    } catch (error) {
      setSendError(error?.message || "Le message n’a pas pu être envoyé. Réessayez.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  const shareSelection = async (shared) => active ? sendMessage(active.id, { share: shared }) : false;
  const playShared = async share => {
    const snapshot = share?.track || share?.tracks?.[0];
    if (!snapshot) { setSendError("Cette playlist ne contient pas encore de métadonnées de lecture."); return; }
    setSendError("");
    let track = null;
    const provider = snapshot.provider || (String(snapshot.id || "").startsWith("spotify:") ? "spotify" : "");
    if (provider === "local") track = localTracks.find(item => item.id === snapshot.id || item.localId === snapshot.localId || item.id === snapshot.localId) || null;
    const providerId = snapshot.providerId || String(snapshot.id || "").split(":").at(-1);
    if (!track && provider === "spotify" && providerId) track = { ...snapshot, id: snapshot.id || "spotify:track:" + providerId, provider, providerId };
    if (!track && ["audius", "jamendo"].includes(provider) && providerId) track = { ...snapshot, id: snapshot.id || provider + ":track:" + providerId, provider, providerId, streamUrl: "/api/catalogue/stream?provider=" + provider + "&id=" + encodeURIComponent(providerId) };
    if (!track && snapshot.title) {
      try {
        setSendError("Recherche de ce titre dans le catalogue Spotify…");
        const query = "track:" + snapshot.title + (snapshot.artist ? " artist:" + snapshot.artist : "");
        const results = await searchSpotify(query, { type: "tracks" });
        const expectedTitle = normalizeText(snapshot.title);
        const expectedArtists = artistParts(snapshot.artist);
        const matches = results.filter(candidate => {
          if (normalizeText(candidate.title) !== expectedTitle) return false;
          const candidateArtists = artistParts(candidate.artist);
          const hasArtistMatch = expectedArtists.some(expected => candidateArtists.some(name => name === expected || name.includes(expected) || expected.includes(name)));
          if (expectedArtists.length && !hasArtistMatch) return false;
          return !snapshot.duration || !candidate.duration || Math.abs(Number(snapshot.duration) - Number(candidate.duration)) <= 8;
        });
        matches.sort((left, right) => {
          const durationDelta = candidate => snapshot.duration && candidate.duration ? Math.abs(Number(snapshot.duration) - Number(candidate.duration)) : Number.POSITIVE_INFINITY;
          return durationDelta(left) - durationDelta(right);
        });
        track = matches[0] || null;
      } catch (error) {
        setSendError(error?.message || "Impossible de rechercher ce titre sur Spotify.");
        return;
      }
    }
    if (!track) { setSendError("Aucun titre Spotify ne correspond exactement aux métadonnées partagées."); return; }
    player.setQueue([track], "Partage de " + (track.artist || "Audiva"));
    player.setCurrentTrack(track);
    player.play();
    setSendError("");
  };
  return <><main className="audiva-workspace audiva-chat min-h-screen bg-[#060b18] text-[#eff4ff]"><section className="audiva-theme-banner relative isolate min-h-[210px] overflow-hidden border-b border-white/[.07] bg-[#081122] px-5 py-3 sm:min-h-[230px] sm:px-10 lg:px-14"><Image src="/message1.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[center_48%] opacity-75" /><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_5%,rgba(80,128,255,.28),transparent_35%),linear-gradient(135deg,#071120,#0b1730_58%,#060b18)]" /><div className="relative mx-auto flex min-h-[184px] max-w-[1500px] items-center gap-5 sm:min-h-[202px]"><div className="grid h-24 w-24 shrink-0 place-items-center bg-[#102044]/90 text-[#72eee7] shadow-lg"><HugeiconsIcon icon={Message01Icon} size={38} strokeWidth={2.1} /></div><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a6f6ef]">Messages privés</p><h1 className="mt-1 text-3xl font-semibold text-white">Messages</h1></div><Link href="/amis" className="ml-auto inline-flex items-center gap-2 border border-[#76eee93b] bg-[#76eee90b] px-4 py-2.5 text-sm font-semibold text-[#b8fffb] transition hover:bg-[#76eee919]">Mon cercle <HugeiconsIcon icon={Message01Icon} size={17} /></Link></div></section>
  {cloudError && <p role="alert" className="mx-4 mt-4 border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{cloudError}</p>}
  {!user ? <section className="grid min-h-[380px] place-items-center p-6 text-center"><div><HugeiconsIcon className="mx-auto text-[#76eee9]" icon={Message01Icon} size={40}/><h2 className="mt-4 text-2xl font-bold text-white">Connectez-vous pour retrouver vos conversations</h2><p className="mt-2 max-w-lg text-sm text-[#91a0bd]">Les messages et les amis sont synchronisés de façon privée avec Supabase.</p><Link href="/authentification/connexion" className="mt-5 inline-flex bg-[#76eee9] px-5 py-3 font-bold text-[#071523]">Se connecter</Link></div></section>
    : cloudLoading && !conversations.length ? <p role="status" className="p-12 text-center text-[#91a0bd]">Chargement de vos conversations…</p>
    : <section className="grid w-full max-w-none min-h-0 flex-1 overflow-hidden border border-white/[.08] bg-[#0a1221] sm:my-0 sm:min-h-0 sm:grid-cols-[minmax(270px,24vw)_minmax(0,1fr)]"><ConversationList conversations={conversations} friends={friends} activeId={active?.id} onSelect={select} />{active && friend ? <Conversation key={active.id} onClear={() => clearConversation(active.id)} friend={friend} conversation={active} text={text} setText={setText} onSend={send} sending={sending} sendError={sendError} onTextChange={() => setSendError("")} onSticker={sticker => sendMessage(active.id, { sticker })} onGif={message => sendMessage(active.id, message)} onEditMessage={editMessage} onDeleteMessage={deleteMessage} onOpenShare={playShared} streak={active ? conversations.find(item => item.id === active.id) : null} onTrack={() => setShareKind("track")} onPlaylist={() => setShareKind("playlist")} /> : <div className="grid place-items-center p-8 text-center text-[#91a0bd]">{friends.length ? "Choisissez une conversation ou ouvrez le profil d’un ami pour commencer." : "Votre cercle est vide. Ajoutez des amis pour commencer une conversation."}<Link className="mt-3 font-semibold text-[#a6f6ef]" href="/amis">Découvrir des amis</Link></div>}</section>}</main>{shareKind && <ShareContentModal isOpen initialKind={shareKind} onClose={() => setShareKind(null)} onShare={shareSelection} />}</>;
}

function ConversationList({ conversations, friends, activeId, onSelect }) { const [query,setQuery]=useState(''); return <aside className="chat-conversation-list border-b border-white/[.08] sm:border-b-0 sm:border-r"><div className="chat-conversation-search border-b border-white/[.07] p-4"><p className="font-semibold text-white">Conversations</p><p className="mt-1 text-xs text-[#91a0bd]">Vos échanges et partages</p><input className="chat-search" aria-label="Rechercher une conversation" placeholder="Rechercher une conversation" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="chat-conversation-items flex overflow-x-auto p-2 sm:block sm:space-y-1">{conversations.filter(c=>(friends.find(f=>f.id===c.participantId)?.name || '').toLowerCase().includes(query.toLowerCase())).map((conversation) => { const friend = friends.find((item) => item.id === conversation.participantId); const latest = conversation.messages[conversation.messages.length - 1]; return <button type="button" key={conversation.id} onClick={() => onSelect(conversation.id)} aria-pressed={activeId === conversation.id} className={`chat-conversation-item flex min-w-[215px] items-center gap-3 p-3 text-left transition sm:min-w-0 sm:w-full ${activeId === conversation.id ? "bg-[#15294a]" : "hover:bg-white/[.045]"}`}><Avatar friend={friend} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><b className="truncate text-sm text-white">{friend?.name}</b><small className="text-[10px] text-[#71809d]">{conversation.updatedAt}</small></span><span className="mt-1 block truncate text-xs text-[#91a0bd]">{latest?.deleted ? "Message supprimé" : latest?.share ? `Partage : ${latest.share.title}` : latest?.gif ? "GIF animé" : latest?.sticker ? "Sticker" : latest?.text}</span></span>{conversation.unread ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#76eee9] px-1 text-[10px] font-semibold text-[#071523]">{conversation.unread}</span> : null}</button>; })}</div></aside>; }
function Conversation({ onClear, friend, conversation, text, setText, onSend, sending, sendError, onTextChange, onSticker, onGif, onEditMessage, onDeleteMessage, onOpenShare, streak, onTrack, onPlaylist }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState("stickers");
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [wallpaperError, setWallpaperError] = useState("");
  const messagesRef = useRef(null);
  const wallpaperUrlRef = useRef("");
  const wallpaperInputRef = useRef(null);
  const follow = useRef(true);
  useEffect(() => {
    let active = true;
    readConversationBackground(conversation.id).then(blob => {
      if (!active || !blob) return;
      const url = URL.createObjectURL(blob);
      wallpaperUrlRef.current = url;
      setWallpaperUrl(url);
    }).catch(() => {});
    return () => {
      active = false;
      if (wallpaperUrlRef.current) URL.revokeObjectURL(wallpaperUrlRef.current);
      wallpaperUrlRef.current = "";
    };
  }, [conversation.id]);
  useEffect(() => {
    const element = messagesRef.current;
    if (element && follow.current) element.scrollTop = element.scrollHeight;
  }, [conversation.messages.length, conversation.id]);
  useEffect(() => {
    follow.current = true;
    const element = messagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [conversation.id]);
  const conversationStreak = getConversationStreak(streak);
  const saveWallpaper = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await saveConversationBackground(conversation.id, file);
      if (wallpaperUrlRef.current) URL.revokeObjectURL(wallpaperUrlRef.current);
      const url = URL.createObjectURL(file);
      wallpaperUrlRef.current = url;
      setWallpaperUrl(url);
      setWallpaperError("");
    } catch (error) { setWallpaperError(error.message || "Impossible d’enregistrer cette image sur l’appareil."); }
  };
  const resetWallpaper = async () => {
    try {
      await deleteConversationBackground(conversation.id);
      if (wallpaperUrlRef.current) URL.revokeObjectURL(wallpaperUrlRef.current);
      wallpaperUrlRef.current = "";
      setWallpaperUrl("");
      setWallpaperError("");
    } catch (error) { setWallpaperError(error.message || "Impossible de retirer cette image."); }
  };

  const insertEmoji = emoji => { setText(value => `${value}${emoji}`); setLibraryOpen(false); };

  return <section className="flex min-h-[520px] min-w-0 flex-col">
    <header className="flex items-center gap-3 border-b border-white/[.07] px-5 py-4">
      <Avatar friend={friend} />
      <div className="min-w-0"><Link href={`/amis/${friend.id}`} className="font-semibold text-white hover:text-[#a6f6ef]">{friend.name}</Link><p className="text-xs text-[#76eee9]">Messages synchronisés avec Supabase</p><small className="chat-streak-hint">{conversationStreak.current ? `Votre série : ${conversationStreak.current} jour${conversationStreak.current > 1 ? "s" : ""} consécutifs` : "Envoyez un message aujourd’hui pour lancer votre série"}</small></div>
      {conversationStreak.current > 0 && <span className="chat-streak-badge" title="Jours où vous avez écrit dans cette conversation"><HugeiconsIcon icon={FireIcon} size={20} /><b>{conversationStreak.current}</b><small>jours</small></span>}
      <input ref={wallpaperInputRef} className="sr-only" type="file" accept="image/*" aria-label="Choisir une image de fond locale" onChange={saveWallpaper} /><button type="button" onClick={() => wallpaperInputRef.current?.click()} className="chat-wallpaper-button">Fond</button>{wallpaperUrl && <button type="button" onClick={resetWallpaper} className="chat-wallpaper-button">Réinitialiser le fond</button>}<button type="button" onClick={onClear} className="chat-clear">Effacer l’historique</button>
    </header>
      <div ref={messagesRef} role="log" aria-label="Messages" data-custom-wallpaper={wallpaperUrl ? "true" : "false"} style={{ "--chat-wallpaper-image": wallpaperUrl ? `url("${wallpaperUrl}")` : 'url("/logoAudiva3.png")' }} onScroll={() => { const element = messagesRef.current; follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }} className="chat-message-log flex-1 space-y-4 overflow-y-auto bg-[#08101e]/60 p-5">{wallpaperError && <p role="alert" className="chat-wallpaper-error">{wallpaperError}</p>}{conversation.messages.map(message => <Message key={message.id} message={message} onEdit={onEditMessage} onDelete={onDeleteMessage} onOpenShare={onOpenShare} />)}</div>
    <form onSubmit={onSend} className="relative border-t border-white/[.07] p-4">
      <div className="mb-3 flex gap-2"><button type="button" onClick={onTrack} className="inline-flex items-center gap-2 border border-white/12 px-3 py-2 text-xs font-bold text-[#cbd6ea] hover:border-[#76eee9]/45"><HugeiconsIcon icon={MusicNote01Icon} size={16} />Partager le morceau</button><button type="button" onClick={onPlaylist} className="inline-flex items-center gap-2 border border-white/12 px-3 py-2 text-xs font-bold text-[#cbd6ea] hover:border-[#76eee9]/45"><HugeiconsIcon icon={Share01Icon} size={16} />Partager une playlist</button></div>
      {libraryOpen && <div className="chat-media-library"><header><div><span>VOTRE STUDIO</span><h3>Bibliothèque de partage</h3></div><button type="button" onClick={() => setLibraryOpen(false)} aria-label="Fermer la bibliothèque">×</button></header>
        <nav aria-label="Bibliothèque de réactions">{[["stickers", "Stickers"], ["gif", "GIF"], ["emoji", "Emojis"]].map(([id, label]) => <button type="button" key={id} aria-pressed={libraryTab === id} onClick={() => setLibraryTab(id)}>{label}</button>)}</nav>
        {libraryTab === "stickers" && <div className="chat-sticker-grid">{stickers.map(sticker => <button type="button" key={sticker.label} title={sticker.label} onClick={() => { onSticker(sticker); setLibraryOpen(false); }}><span>{sticker.emoji}</span><small>{sticker.label}</small></button>)}</div>}
        {libraryTab === "emoji" && <EmojiPicker onSelect={insertEmoji} />}
        {libraryTab === "gif" && <GifPicker onSend={onGif} onClose={() => setLibraryOpen(false)} />}
      </div>}
      {sendError && <p role="alert" className="mb-2 text-xs text-rose-300">{sendError}</p>}
      <div className="chat-message-composer flex items-center gap-2 border border-white/12 bg-[#07101e] p-2"><button type="button" onClick={() => { setLibraryTab("gif"); setLibraryOpen(open => !open); }} aria-expanded={libraryOpen} aria-label="Ouvrir la bibliothèque de GIF, stickers et emojis" className={`flex h-9 min-w-12 items-center justify-center gap-1.5 px-2 transition ${libraryOpen ? "bg-[#76eee9]/15 text-[#76eee9]" : "text-[#91a0bd] hover:text-white"}`}><HugeiconsIcon icon={Add01Icon} size={17} /><span className="text-[9px] font-extrabold">GIF</span></button><input value={text} onChange={event => { setText(event.target.value); onTextChange?.(); }} placeholder={`Écrire à ${friend.name}…`} className="min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-[#71809d]" /><button type="submit" disabled={!text.trim() || sending} aria-label={sending ? "Envoi en cours" : "Envoyer"} className="grid h-10 w-10 place-items-center bg-[#76eee9] text-[#ffffff] transition hover:bg-white disabled:opacity-40"><HugeiconsIcon icon={Send01Icon} size={19} /></button></div>
      {sending && <p role="status" className="mt-2 text-xs text-[#91a0bd]">Envoi du message…</p>}
    </form>
  </section>;
}
function Message({ message, onEdit, onDelete, onOpenShare }) {
  const mine = message.author === "me";
  const [editing, setEditing] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [playlistExpanded, setPlaylistExpanded] = useState(false);
  const [draft, setDraft] = useState(message.text || "");
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState("");
  const save = async event => {
    event.preventDefault(); event.stopPropagation();
    if (!draft.trim() || working) return;
    setWorking(true); setActionError("");
    const ok = await onEdit(message.id, draft);
    setWorking(false);
    if (ok) { setEditing(false); setActionsOpen(false); } else setActionError("Le message n’a pas pu être modifié.");
  };
  const remove = async event => {
    event.stopPropagation();
    if (working) return;
    setWorking(true); setActionError("");
    const ok = await onDelete(message.id);
    setWorking(false);
    if (ok) setActionsOpen(false); else setActionError("Le message n’a pas pu être supprimé.");
  };
  return <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
    <div onClick={() => { if (mine && !editing && !message.deleted) setActionsOpen(open => !open); }} className={`chat-bubble max-w-[82%] ${mine ? "bg-[#76eee9] text-[#ffffff]" : "bg-[#172237] text-[#edf4ff]"} ${mine && !editing && !message.deleted ? "chat-message-selectable" : ""}`}>
      {message.deleted ? <p className="chat-message-deleted">{mine ? "Vous avez supprimé ce message" : "Ce message a été supprimé"}</p>
        : message.gif ? <div className="chat-gif-message"><ChatGifMessage gif={message.gif} /></div>
        : message.sticker ? <div className="chat-sent-sticker"><span>{message.sticker.emoji}</span><small>{message.sticker.label}</small></div>
        : message.share ? <div className="chat-shared-wrap">
          <button type="button" className="chat-shared-media" onClick={event => { event.stopPropagation(); if (message.share.kind === "playlist") setPlaylistExpanded(open => !open); else onOpenShare?.(message.share); }} aria-label={message.share.kind === "playlist" ? `Ouvrir la playlist ${message.share.title}` : `Lire ${message.share.title} dans Audiva`}>
            <span className="relative h-14 w-14 shrink-0 overflow-hidden"><PochetteImage src={message.share.cover || "/hero-playlist.jpg"} alt="" fill sizes="56px" className="object-cover" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-[.12em] opacity-65">{message.share.kind === "playlist" ? "Playlist Audiva" : "Morceau"}</span><b className="mt-1 block truncate text-sm">{message.share.title}</b><span className="mt-1 block truncate text-xs opacity-75">{message.share.subtitle}</span><span className="chat-shared-play"><HugeiconsIcon icon={PlayIcon} size={14} fill="currentColor" />{message.share.kind === "playlist" ? (playlistExpanded ? "Masquer les titres" : "Ouvrir la playlist") : "Lire dans Audiva"}</span></span>
          </button>
          {message.share.kind === "playlist" && playlistExpanded && <div className="chat-shared-track-list">{(message.share.tracks || []).map((track, index) => <button type="button" key={track.id || track.providerId || index} onClick={event => { event.stopPropagation(); onOpenShare?.({ kind: "track", track }); }}><span>{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><b className="block truncate">{track.title || "Titre"}</b><small className="block truncate">{track.artist || "Artiste"}</small></span><HugeiconsIcon icon={PlayIcon} size={15} fill="currentColor" /></button>)}{!message.share.tracks?.length && <p>Cette ancienne playlist ne contient pas encore la liste de ses titres.</p>}</div>}
        </div>
        : editing ? <form className="chat-message-edit" onSubmit={save}><textarea autoFocus value={draft} maxLength={10000} onChange={event => setDraft(event.target.value)} aria-label="Modifier le message"/><div><button type="button" disabled={working} onClick={event => { event.stopPropagation(); setEditing(false); setDraft(message.text || ""); }}>Annuler</button><button type="submit" disabled={working || !draft.trim()}>{working ? "Enregistrement…" : "Enregistrer"}</button></div></form>
        : <p className="px-3 py-2.5 text-sm">{message.text}</p>}
      {!message.deleted && mine && actionsOpen && <div className="chat-message-actions" onClick={event => event.stopPropagation()}>{!message.share && !message.gif && !message.sticker && message.type === "text" && !editing && <button type="button" onClick={() => { setDraft(message.text || ""); setEditing(true); setActionError(""); }}>Modifier</button>}{!editing && <button type="button" disabled={working} onClick={remove}>{working ? "Suppression…" : "Supprimer"}</button>}</div>}
      {actionError && <p role="alert" className="chat-message-action-error">{actionError}</p>}
      <p className="px-3 pb-2 text-[10px] font-bold opacity-55">{message.time}{message.edited && !message.deleted ? " · Modifié" : ""}{mine && !message.deleted && (message.read ? " · Lu" : " · Envoyé")}</p>
    </div>
  </div>;
}
function Avatar({ friend }) { return <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#152444]"><Image src={friend?.avatar || "/hero-playlist.jpg"} alt="" fill sizes="44px" className="object-cover" />{friend?.online && <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a1221] bg-[#76eee9]" />}</span>; }
