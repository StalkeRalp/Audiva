"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Album01Icon, ArrowDown01Icon, ArrowUp01Icon, Cancel01Icon, FavouriteIcon, Mic01Icon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, Queue01Icon, RepeatIcon, ShuffleIcon, Share01Icon, UserIcon, VolumeHighIcon, VolumeMute01Icon, MoreHorizontalIcon, Clock01Icon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useUiStore } from "@/stores/uiStore";

export function LecteurPersistant() {
  const pathname = usePathname();
  const router = useRouter();
  const audioRef = useRef(null);
  const [queueTab, setQueueTab] = useState("queue");
  const [queueNotice, setQueueNotice] = useState("");
  const { currentTrack, queue, currentIndex, upNextQueue, queueSourceName, recentTracks, isPlaying, currentTime, duration, volume, isMuted, isShuffled, repeatMode, lyricsOpen, queueOpen, likedTrackIds, play, pause, seek, setCurrentTime, setDuration, setVolume, toggleMute, toggleShuffle, cycleRepeatMode, toggleLyrics, toggleQueue, toggleLike, nextTrack, previousTrack, handleTrackEnd, setCurrentTrack, removeFromQueue, removeUpNext, moveQueueItem, moveUpNext, playNext } = useLecteurStore();
  const { playerVisible, setPlayerVisible } = useUiStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => pause());
    else audio.pause();
  }, [isPlaying, currentTrack?.id, pause]);

  if (pathname === "/" || pathname.startsWith("/authentification")) return null;
  if (!playerVisible) return null;
  const track = currentTrack;
  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const activeLyric = track.lyrics?.reduce((active, line) => currentTime >= line.time ? line.time : active, 0);
  const time = (value) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
  const controlClass = "flex h-9 w-9 items-center justify-center rounded-full text-[#c9d3e8] transition duration-150 hover:scale-110 hover:bg-white/10 hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-35";
  const notifyQueue = (message) => { setQueueNotice(message); window.setTimeout(() => setQueueNotice(""), 2200); };

  return <><audio ref={audioRef} src={track.streamUrl} preload="metadata" onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => { const audio = event.currentTarget; setDuration(audio.duration); if (currentTime > 0) audio.currentTime = Math.min(currentTime, Number.isFinite(audio.duration) ? audio.duration : currentTime); }} onEnded={handleTrackEnd} />
    {lyricsOpen && <aside className="fixed bottom-[72px] left-0 right-0 top-[72px] z-40 overflow-hidden bg-[#07132b] text-[#eff4ff] lg:left-64"><div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_10%,rgba(80,128,255,.28),transparent_32%),linear-gradient(135deg,#071120,#0b1730_58%,#060b18)]" /><div className="relative grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]"><section className="min-w-0 overflow-y-auto px-5 py-8 sm:px-10 lg:px-14"><div className="mx-auto max-w-4xl"><div className="flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#75eee8]">Paroles synchronisées</p><p className="mt-2 text-sm font-semibold text-[#c3d0e8]">{track.title} · {track.artist}</p></div><button onClick={toggleLyrics} className={`${controlClass} border border-white/10 bg-[#07101e]`} aria-label="Fermer les paroles"><HugeiconsIcon icon={Cancel01Icon} size={20} /></button></div>{track.lyrics ? <div className="mt-10 space-y-7 pb-14">{track.lyrics.map((line) => <button type="button" key={line.time} onClick={() => { audioRef.current.currentTime = line.time; seek(line.time); }} className={`block w-full text-left text-2xl font-black leading-tight transition sm:text-4xl ${line.time === activeLyric ? "scale-[1.015] text-white underline decoration-[#75eee8] decoration-2 underline-offset-8" : "text-[#7584a3] hover:text-[#cbd7ec]"}`}>{line.text}</button>)}</div> : <div className="mt-12 grid min-h-64 place-items-center border border-white/10 bg-[#07101e]/55 p-8 text-center"><div><HugeiconsIcon icon={Mic01Icon} size={34} className="mx-auto text-[#75eee8]" /><p className="mt-5 text-xl font-black">Paroles indisponibles</p><p className="mt-2 text-sm text-[#91a0bd]">Aucune parole synchronisée n’est disponible pour ce morceau.</p></div></div>}</div></section><aside className="hidden h-full overflow-y-auto border-l border-white/[.08] bg-[#08101d] p-4 lg:block"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#75eee8]">Lecture en cours</p><Image src={track.cover} alt="" width={480} height={480} className="mt-4 aspect-square w-full object-cover" /><p className="mt-4 text-lg font-black">{track.title}</p><p className="mt-1 text-sm text-[#aebbd7]">{track.artist}</p></aside></div></aside>}
    {queueOpen && <aside role="dialog" aria-label="File d&apos;attente" className="fixed bottom-[72px] right-0 top-0 z-50 flex w-[min(420px,100vw)] flex-col border-l border-white/10 bg-[#0a0a0b] shadow-[-16px_0_45px_rgba(0,0,0,.38)] animate-in slide-in-from-right-5 duration-200">
      <header className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 pt-5">
        <div className="flex h-10 items-start gap-6">
          <button type="button" onClick={() => setQueueTab("queue")} className={`h-full border-b-2 text-sm font-extrabold transition ${queueTab === "queue" ? "border-[#75eee8] text-white" : "border-transparent text-white/50 hover:text-white"}`}>File d&apos;attente</button>
          <button type="button" onClick={() => setQueueTab("recent")} className={`h-full border-b-2 text-sm font-extrabold transition ${queueTab === "recent" ? "border-[#75eee8] text-white" : "border-transparent text-white/50 hover:text-white"}`}>Écoutés récemment</button>
        </div>
        <button type="button" onClick={toggleQueue} className={controlClass} aria-label="Fermer la file"><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2.4} /></button>
      </header>
      {queueTab === "queue" ? <QueueList queue={queue} currentIndex={currentIndex} currentTrack={track} upNextQueue={upNextQueue} queueSourceName={queueSourceName} onPlay={(item) => { setCurrentTrack(item); play(); }} onRemove={removeFromQueue} onRemoveUpNext={removeUpNext} onMove={moveQueueItem} onMoveUpNext={moveUpNext} onPlayNext={playNext} onLike={toggleLike} onLyrics={(item) => { setCurrentTrack(item); if (!lyricsOpen) toggleLyrics(); }} onNavigate={(query) => router.push(`/recherche?query=${encodeURIComponent(query)}`)} onNotice={notifyQueue} /> : <RecentList tracks={recentTracks} onPlay={(item) => { setCurrentTrack(item); play(); }} />}
      {queueNotice ? <p role="status" className="absolute bottom-5 left-5 right-5 border border-[#75eee8]/30 bg-[#14263a] px-3 py-2 text-xs font-semibold text-[#bffcf8] shadow-xl">{queueNotice}</p> : null}
    </aside>}
    <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#03060d]/[.98] px-3 py-2 text-white shadow-[0_-12px_35px_rgba(0,0,0,.32)] backdrop-blur-xl sm:px-5"><button type="button" onClick={() => setPlayerVisible(false)} aria-label="Fermer le lecteur" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-[#b8c2d7] hover:bg-rose-400/15 hover:text-rose-200 sm:hidden"><HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2.2} /></button><div className="mx-auto grid max-w-[1800px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(150px,1fr)_minmax(280px,1.45fr)_minmax(150px,1fr)] sm:gap-4">
      <Link href="/lecteur" className="flex min-w-0 items-center gap-2 rounded-lg p-1 transition hover:bg-white/5"><Image src={track.cover} alt={`Pochette de ${track.title}`} width={56} height={56} className="h-11 w-11 rounded-md object-cover" /><div className="min-w-0"><p className="truncate text-sm font-bold">{track.title}</p><p className="mt-0.5 truncate text-xs text-[#9ca7bd]">{track.artist}</p></div><button type="button" onClick={(event) => { event.preventDefault(); toggleLike(); }} aria-label="Ajouter aux favoris" className={`hidden sm:flex ${controlClass} ${likedTrackIds.includes(track.id) ? "text-[#75eee8]" : ""}`}><HugeiconsIcon icon={FavouriteIcon} size={19} fill={likedTrackIds.includes(track.id) ? "currentColor" : "none"} /></button></Link>
      <div className="min-w-0"><div className="flex items-center justify-center gap-0.5 text-[#bcc6dc] sm:mb-1 sm:gap-3"><button type="button" onClick={toggleShuffle} aria-pressed={isShuffled} className={`flex ${controlClass} ${isShuffled ? "bg-[#173a51] text-[#75eee8]" : ""}`}><HugeiconsIcon icon={ShuffleIcon} size={19} strokeWidth={2.2} /></button><button type="button" onClick={previousTrack} className={controlClass} aria-label="Titre précédent"><HugeiconsIcon icon={PreviousIcon} size={20} strokeWidth={2.2} /></button><button type="button" onClick={isPlaying ? pause : play} aria-label={isPlaying ? "Pause" : "Lire"} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#75eee8] text-[#05121f] shadow-[0_0_18px_rgba(117,238,232,.22)] transition hover:scale-110 active:scale-90">{isPlaying ? <HugeiconsIcon icon={PauseIcon} size={20} fill="currentColor" strokeWidth={2.5} /> : <HugeiconsIcon icon={PlayIcon} size={21} fill="currentColor" strokeWidth={2.5} />}</button><button type="button" onClick={nextTrack} className={controlClass} aria-label="Titre suivant"><HugeiconsIcon icon={NextIcon} size={20} strokeWidth={2.2} /></button><button type="button" onClick={cycleRepeatMode} aria-label={`Répétition : ${repeatMode}`} className={`flex ${controlClass} ${repeatMode !== "off" ? "bg-[#173a51] text-[#75eee8]" : ""}`}><span className="relative"><HugeiconsIcon icon={RepeatIcon} size={19} strokeWidth={2.2} />{repeatMode === "track" && <b className="absolute -right-2 -bottom-1 text-[9px]">1</b>}</span></button><button type="button" onClick={toggleLyrics} aria-pressed={lyricsOpen} className={`flex sm:hidden ${controlClass} ${lyricsOpen ? "bg-[#173a51] text-[#75eee8]" : ""}`} aria-label="Afficher les paroles"><HugeiconsIcon icon={Mic01Icon} size={19} strokeWidth={2.2} /></button></div><div className="hidden items-center gap-2 sm:flex"><span className="w-8 text-right text-[10px] font-semibold tabular-nums text-[#aab5cc]">{time(currentTime)}</span><input aria-label="Progression de lecture" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => { const value = Number(event.target.value); audioRef.current.currentTime = value; seek(value); }} className="audiva-range flex-1" style={{ "--progress": `${progress}%` }} /><span className="w-8 text-[10px] font-semibold tabular-nums text-[#aab5cc]">{time(duration)}</span></div></div>
      <div className="hidden items-center justify-end gap-1 text-[#bcc6dc] sm:flex"><button type="button" onClick={toggleLyrics} aria-pressed={lyricsOpen} className={`${controlClass} ${lyricsOpen ? "bg-[#173a51] text-[#75eee8]" : ""}`} aria-label="Afficher les paroles"><HugeiconsIcon icon={Mic01Icon} size={20} strokeWidth={2.2} /></button><button type="button" onClick={toggleQueue} aria-pressed={queueOpen} className={`hidden md:flex ${controlClass} ${queueOpen ? "bg-[#173a51] text-[#75eee8]" : ""}`} aria-label="File d’attente"><HugeiconsIcon icon={Queue01Icon} size={20} strokeWidth={2.2} /></button><button type="button" onClick={toggleMute} className={`hidden sm:flex ${controlClass} ${isMuted ? "text-[#75eee8]" : ""}`} aria-label={isMuted ? "Réactiver le son" : "Couper le son"}>{isMuted ? <HugeiconsIcon icon={VolumeMute01Icon} size={20} strokeWidth={2.2} /> : <HugeiconsIcon icon={VolumeHighIcon} size={20} strokeWidth={2.2} />}</button><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(event) => setVolume(Number(event.target.value))} className="audiva-range hidden w-20 lg:block" style={{ "--progress": `${(isMuted ? 0 : volume) * 100}%` }} /><button type="button" onClick={() => setPlayerVisible(false)} aria-label="Fermer le lecteur" title="Fermer le lecteur" className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#b8c2d7] transition hover:scale-105 hover:border-rose-400/50 hover:bg-rose-400/15 hover:text-rose-200 active:scale-90"><HugeiconsIcon icon={Cancel01Icon} size={19} strokeWidth={2.2} /></button></div>
    </div></footer></>;
}

function QueueList({ queue, currentIndex, currentTrack, upNextQueue, queueSourceName, onPlay, onRemove, onRemoveUpNext, onMove, onMoveUpNext, onPlayNext, onLike, onLyrics, onNavigate, onNotice }) {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const upcoming = queue.map((item, index) => ({ item, index })).filter(({ index }) => index !== currentIndex);
  const moveTrack = (from, to) => {
    if (from === null || from === to) return;
    onMove(from, to);
    setDraggingIndex(null);
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5 pt-5">
      <p className="px-2 text-sm font-extrabold text-white">Titre en cours de lecture</p>
      <QueueItem item={currentTrack} queueIndex={currentIndex} isCurrent onPlay={() => onPlay(currentTrack)} onLike={onLike} onLyrics={onLyrics} onNavigate={onNavigate} onNotice={onNotice} onMoveUp={() => moveTrack(currentIndex, currentIndex - 1)} onMoveDown={() => moveTrack(currentIndex, currentIndex + 1)} canMoveUp={currentIndex > 0} canMoveDown={currentIndex < queue.length - 1} draggable onDragStart={() => setDraggingIndex(currentIndex)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveTrack(draggingIndex, currentIndex)} />
      {upNextQueue.length ? <>
        <div className="mt-6 flex items-center justify-between px-2"><p className="text-sm font-extrabold text-white">Musique suivante</p><span className="text-[10px] font-semibold text-[#75eee8]">Ajoutée manuellement</span></div>
        <div className="mt-2 space-y-0.5">
          {upNextQueue.map((item, index) => <QueueItem key={`${item.id}-next-${index}`} item={item} onPlay={() => onPlay(item)} onRemove={() => onRemoveUpNext(index)} onPlayNext={() => onPlayNext(item)} onLike={onLike} onLyrics={onLyrics} onNavigate={onNavigate} onNotice={onNotice} onMoveUp={() => onMoveUpNext(index, index - 1)} onMoveDown={() => onMoveUpNext(index, index + 1)} canMoveUp={index > 0} canMoveDown={index < upNextQueue.length - 1} />)}
        </div>
      </> : null}
      <div className="mt-6 flex items-center justify-between px-2"><p className="text-sm font-extrabold text-white">À suivre dans : {queueSourceName}</p><span className="text-[10px] font-semibold text-[#8794ad]">Glissez pour réorganiser</span></div>
      {upcoming.length ? <div className="mt-2 space-y-0.5">{upcoming.map(({ item, index }) => <QueueItem key={`${item.id}-${index}`} item={item} queueIndex={index} onPlay={() => onPlay(item)} onRemove={() => onRemove(index)} onPlayNext={() => onPlayNext(item)} onLike={onLike} onLyrics={onLyrics} onNavigate={onNavigate} onNotice={onNotice} onMoveUp={() => moveTrack(index, index - 1)} onMoveDown={() => moveTrack(index, index + 1)} canMoveUp={index > 0} canMoveDown={index < queue.length - 1} draggable isDropTarget={draggingIndex !== null && draggingIndex !== index} onDragStart={() => setDraggingIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveTrack(draggingIndex, index)} onDragEnd={() => setDraggingIndex(null)} />)}</div> : <p className="mx-2 mt-3 border border-white/8 bg-white/[.035] p-4 text-sm text-[#9ca7bd]">Aucun autre titre dans la file.</p>}
    </div>
  );
}

function RecentList({ tracks, onPlay }) {
  const listened = tracks;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5 pt-5">
      {listened.length ? <div className="space-y-0.5">{listened.map((item, index) => <QueueItem key={`${item.id}-recent-${index}`} item={item} onPlay={() => onPlay(item)} compact />)}</div> : <div className="mx-2 mt-2 flex flex-col items-center border border-dashed border-white/12 bg-white/[.025] px-6 py-12 text-center"><HugeiconsIcon icon={Clock01Icon} size={26} className="text-[#75eee8]" /><p className="mt-3 text-sm font-bold">Votre historique est vide</p><p className="mt-1 text-xs leading-5 text-[#9ca7bd]">Les titres écoutés pendant cette session apparaîtront ici.</p></div>}
    </div>
  );
}

function QueueItem({ item, isCurrent = false, compact = false, onPlay, onRemove, onPlayNext, onLike, onLyrics, onNavigate, onNotice, onMoveUp, onMoveDown, canMoveUp, canMoveDown, draggable = false, isDropTarget = false, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  if (!item) return null;
  const duration = typeof item.duration === "number" ? `${Math.floor(item.duration / 60)}:${String(Math.floor(item.duration % 60)).padStart(2, "0")}` : item.duration;

  return (
    <article draggable={draggable} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; onDragStart?.(); }} onDragOver={onDragOver} onDrop={(event) => { event.preventDefault(); onDrop?.(); }} onDragEnd={onDragEnd} className={`group relative mt-2 flex items-center gap-3 px-2 py-2 transition ${isCurrent ? "bg-[#101b2d]" : "hover:bg-white/[.065]"} ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${isDropTarget ? "border-t-2 border-[#75eee8]" : ""}`}>
      <button type="button" onClick={onPlay} className="relative h-12 w-12 shrink-0 overflow-hidden text-left" aria-label={`Lire ${item.title}`}>
        <Image src={item.cover} alt="" fill sizes="48px" className="object-cover" />
        <span className={`absolute inset-0 grid place-items-center bg-black/45 transition ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}><HugeiconsIcon icon={PlayIcon} size={19} fill="currentColor" className="text-white" /></span>
      </button>
      <button type="button" onClick={onPlay} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-sm font-bold ${isCurrent ? "text-[#75eee8]" : "text-white"}`}>{item.title}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-[#aeb7c9]">{item.artist}</p>
        {!compact && duration ? <p className="mt-1 text-[10px] font-semibold text-[#6f7c95]">{duration}</p> : null}
      </button>
      {isCurrent ? <span className="flex h-5 items-end gap-[2px] px-1" aria-label="En lecture"><i className="h-2 w-[2px] animate-pulse bg-[#75eee8]" /><i className="h-4 w-[2px] animate-pulse bg-[#75eee8] [animation-delay:120ms]" /><i className="h-3 w-[2px] animate-pulse bg-[#75eee8] [animation-delay:240ms]" /></span> : null}
      {!compact ? <div className="relative flex items-center gap-0.5"><button type="button" disabled={!canMoveUp} onClick={() => onMoveUp?.()} className="grid h-7 w-6 place-items-center text-white/45 opacity-0 transition hover:bg-white/10 hover:text-[#75eee8] group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0" aria-label={`Monter ${item.title}`}><HugeiconsIcon icon={ArrowUp01Icon} size={16} strokeWidth={2.4} /></button><button type="button" disabled={!canMoveDown} onClick={() => onMoveDown?.()} className="grid h-7 w-6 place-items-center text-white/45 opacity-0 transition hover:bg-white/10 hover:text-[#75eee8] group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0" aria-label={`Descendre ${item.title}`}><HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2.4} /></button><button type="button" onClick={() => setActionsOpen((open) => !open)} className="grid h-8 w-8 place-items-center text-white/55 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100" aria-label={`Options pour ${item.title}`}><HugeiconsIcon icon={MoreHorizontalIcon} size={20} strokeWidth={2.4} /></button>{actionsOpen ? <TrackContextMenu item={item} onClose={() => setActionsOpen(false)} onRemove={onRemove} onPlayNext={onPlayNext} onLike={onLike} onLyrics={onLyrics} onNavigate={onNavigate} onNotice={onNotice} /> : null}</div> : null}
    </article>
  );
}

function TrackContextMenu({ item, onClose, onRemove, onPlayNext, onLike, onLyrics, onNavigate, onNotice }) {
  const saveToPlaylist = (playlist) => {
    const key = "audiva-playlist-tracks";
    const saved = JSON.parse(window.localStorage.getItem(key) || "{}");
    const ids = new Set(saved[playlist] || []);
    ids.add(item.id);
    window.localStorage.setItem(key, JSON.stringify({ ...saved, [playlist]: [...ids] }));
    onNotice(`${item.title} a été ajouté à « ${playlist} »`);
    onClose();
  };

  const shareTrack = async () => {
    const shareData = { title: item.title, text: `${item.title} — ${item.artist}`, url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard?.writeText(`${shareData.text} — ${shareData.url}`);
    onNotice("Lien du titre copié");
    onClose();
  };

  const action = (label, icon, callback, danger = false) => <button type="button" key={label} onClick={() => { callback(); onClose(); }} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-white/[.07] ${danger ? "text-rose-200" : "text-[#e5e9f4]"}`}><HugeiconsIcon icon={icon} size={18} strokeWidth={2} className="shrink-0 text-[#aeb8cb]" />{label}</button>;
  return <div role="menu" className="absolute right-0 top-9 z-30 w-64 border border-white/12 bg-[#202124] py-1.5 shadow-2xl">
    <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[.15em] text-[#75eee8]">Actions Audiva</p>
    {action("Ajouter à Chill & Relax", Add01Icon, () => saveToPlaylist("Chill & Relax"))}
    {action("Ajouter à Focus & Study", Add01Icon, () => saveToPlaylist("Focus & Study"))}
    <div className="my-1 border-t border-white/10" />
    {action("Ajouter aux favoris", FavouriteIcon, () => { onLike(item); onNotice("Ajouté à vos favoris"); })}
    {onPlayNext ? action("Lire juste après", NextIcon, () => { onPlayNext(); onNotice("Le titre sera lu juste après"); }) : null}
    {onRemove ? action("Retirer de la file d’attente", Cancel01Icon, () => { onRemove(); onNotice("Titre retiré de la file"); }, true) : null}
    <div className="my-1 border-t border-white/10" />
    {action("Afficher les paroles", Mic01Icon, () => onLyrics(item))}
    {action("Voir l’artiste", UserIcon, () => onNavigate(item.artist))}
    {action("Voir l’album", Album01Icon, () => onNavigate(item.album || item.title))}
    {action("Partager", Share01Icon, shareTrack)}
  </div>;
}
