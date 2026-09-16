"use client";

import Image from "next/image";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, FavouriteIcon, InformationCircleIcon, Mic01Icon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, Share01Icon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useSocialStore } from "@/domaines/social/stores/socialStore";

const time = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const fileSize = (bytes) => !bytes ? null : bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`;

export default function LecteurPage() {
  const player = useLecteurStore();
  const { friends, conversations, sendMessage } = useSocialStore();
  const [panel, setPanel] = useState("cover");
  const [shareOpen, setShareOpen] = useState(false);
  const track = player.currentTrack;
  if (!track) return <main className="grid min-h-screen place-items-center bg-[#060b18] text-white">Aucun morceau en cours.</main>;

  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;
  const seek = (value) => { const audio = document.querySelector("audio"); if (audio) audio.currentTime = value; player.seek(value); };
  const activeLyric = track.lyrics?.reduce((result, line) => player.currentTime >= line.time ? line.time : result, 0);
  const share = (friend) => { const conversation = conversations.find((item) => item.participantId === friend.id); if (conversation) sendMessage(conversation.id, { share: { kind: "morceau", title: track.title, subtitle: `${track.artist} · ${track.album}`, cover: track.cover } }); setShareOpen(false); };

  return <main className="relative isolate min-h-screen overflow-hidden bg-[#060b18] px-5 py-10 text-[#eff4ff] sm:px-10 lg:px-14">
    <Image src={track.cover} alt="" fill priority className="-z-20 scale-110 object-cover opacity-25 blur-3xl" />
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_25%,rgba(71,117,255,.25),transparent_38%),linear-gradient(90deg,#060b18_8%,rgba(6,11,24,.64),#060b18)]" />
    <Image src="/cd/cd5.png" alt="" width={1300} height={1300} className={`pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(1120px,112vw)] w-[min(1120px,112vw)] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[.56] ${player.isPlaying ? "animate-[spin_28s_linear_infinite]" : ""} motion-reduce:animate-none`} />
    <div className="relative z-10 mx-auto grid w-full max-w-[1280px] items-center gap-10 border border-white/[.08] bg-[#07101e]/78 p-5 shadow-[0_28px_100px_rgba(0,0,0,.42)] backdrop-blur-[2px] sm:p-7 lg:grid-cols-[minmax(300px,1fr)_minmax(350px,.9fr)] lg:p-8">
      <section><div className="relative mx-auto aspect-square max-w-[570px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.55)]"><Image src={track.cover} alt={`Pochette de ${track.title}`} fill priority sizes="(min-width:1024px) 45vw, 90vw" className="object-cover" /></div><div className="mx-auto mt-6 flex max-w-[570px] items-start justify-between gap-4"><div><p className="text-3xl font-black tracking-[-.045em] text-white">{track.title}</p><p className="mt-1 text-base text-[#b9c7e1]">{track.artist} · {track.album}</p></div><button type="button" onClick={() => player.toggleLike(track)} className={`grid h-11 w-11 place-items-center border transition ${player.likedTrackIds.includes(track.id) ? "border-[#72eee7]/45 bg-[#72eee7]/12 text-[#72eee7]" : "border-white/15 text-white hover:border-[#72eee7]/45"}`}><HugeiconsIcon icon={FavouriteIcon} size={22} fill={player.likedTrackIds.includes(track.id) ? "currentColor" : "none"} /></button></div></section>
      <section className="border border-white/[.1] bg-[#091323]/75 p-5 backdrop-blur-xl sm:p-7"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#72eee7]">Lecture en cours</p><div className="flex gap-2"><PanelButton active={panel === "info"} onClick={() => setPanel(panel === "info" ? "cover" : "info")} icon={InformationCircleIcon}>Infos</PanelButton><PanelButton active={panel === "lyrics"} onClick={() => setPanel(panel === "lyrics" ? "cover" : "lyrics")} icon={Mic01Icon}>{panel === "lyrics" ? "Pochette" : "Paroles"}</PanelButton></div></div>
        {panel === "info" ? <TrackInformation track={track} /> : panel === "lyrics" ? <div className="mt-8 min-h-72 space-y-4 text-center">{track.lyrics ? track.lyrics.map((line) => <button type="button" key={line.time} onClick={() => seek(line.time)} className={`block w-full text-lg font-bold transition ${line.time === activeLyric ? "scale-105 text-[#72eee7]" : "text-[#70809d] hover:text-white"}`}>{line.text}</button>) : <p className="pt-24 text-sm text-[#91a0bd]">Paroles indisponibles pour cette chanson.</p>}</div> : <NowPlayingVisual track={track} isPlaying={player.isPlaying} />}
        <div className="mt-8"><div className="flex justify-between text-xs font-bold text-[#9eabc3]"><span>{time(player.currentTime)}</span><span>{time(player.duration)}</span></div><input type="range" aria-label="Position du morceau" min="0" max={player.duration || 0} step="0.1" value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => seek(Number(event.target.value))} className="audiva-range mt-2 w-full" style={{ "--progress": `${progress}%` }} /><div className="mt-7 flex items-center justify-center gap-6"><button type="button" onClick={player.previousTrack} className="text-[#d6dfef] hover:text-[#72eee7]"><HugeiconsIcon icon={PreviousIcon} size={27} /></button><button type="button" onClick={player.isPlaying ? player.pause : player.play} className="grid h-16 w-16 place-items-center rounded-full bg-[#72eee7] text-[#061426] transition hover:scale-105"><HugeiconsIcon icon={player.isPlaying ? PauseIcon : PlayIcon} size={28} fill="currentColor" /></button><button type="button" onClick={player.nextTrack} className="text-[#d6dfef] hover:text-[#72eee7]"><HugeiconsIcon icon={NextIcon} size={27} /></button></div></div><button type="button" onClick={() => setShareOpen(true)} className="mt-7 inline-flex w-full items-center justify-center gap-2 border border-white/14 px-4 py-3 text-sm font-extrabold text-white transition hover:border-[#72eee7]/50 hover:bg-white/[.06]"><HugeiconsIcon icon={Share01Icon} size={18} />Partager ce morceau à un ami</button></section>
    </div>
    {shareOpen ? <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-[#02050b]/75 p-4 backdrop-blur-sm" onMouseDown={() => setShareOpen(false)}><div className="w-full max-w-md border border-white/12 bg-[#0d1527] p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><p className="text-lg font-black">Envoyer à un ami</p><p className="mt-1 text-sm text-[#91a0bd]">{track.title} · {track.artist}</p><div className="mt-5 space-y-2">{friends.map((friend) => <button type="button" key={friend.id} onClick={() => share(friend)} className="flex w-full items-center gap-3 border border-white/[.08] p-3 text-left hover:border-[#72eee7]/45"><Image src={friend.avatar} alt="" width={38} height={38} className="h-10 w-10 rounded-full object-cover" /><span className="flex-1 text-sm font-extrabold">{friend.name}</span><HugeiconsIcon icon={Share01Icon} size={18} className="text-[#72eee7]" /></button>)}</div></div></div> : null}
  </main>;
}

function PanelButton({ active, onClick, icon, children }) { return <button type="button" onClick={onClick} aria-label={active ? `Fermer ${children}` : String(children)} className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-extrabold ${active ? "bg-[#72eee7] text-[#061426]" : "border border-white/12 text-white"}`}>{active ? <HugeiconsIcon icon={Cancel01Icon} size={17} strokeWidth={2.4} /> : <HugeiconsIcon icon={icon} size={17} />}{active ? "Fermer" : children}</button>; }

function NowPlayingVisual({ track, isPlaying }) {
  return <div className="mt-8 flex min-h-72 flex-col items-center justify-center border border-white/[.06] bg-white/[.025] p-7 text-center">
    <Image src="/cd/DiskTournant.png" alt="Disque en lecture" width={240} height={240} className={`h-40 w-40 object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,.5)] sm:h-48 sm:w-48 ${isPlaying ? "animate-[spin_12s_linear_infinite]" : ""} motion-reduce:animate-none`} />
    <p className="mt-6 max-w-md text-xl font-black text-white">{track.title}</p>
    <p className="mt-1 text-sm text-[#b9c7e1]">{track.artist} · {track.album}</p>
    <p className="mt-3 text-xs font-medium text-[#91a0bd]">{isPlaying ? "Lecture en cours" : "Lecture en pause"}</p>
  </div>;
}

function TrackInformation({ track }) {
  const tags = track.tags || {}; const technical = track.technical || {};
  const quality = [technical.bitrate ? `${Math.round(technical.bitrate / 1000)} kb/s` : null, technical.sampleRate ? `${technical.sampleRate / 1000} kHz` : null, technical.bitsPerSample ? `${technical.bitsPerSample} bits` : null].filter(Boolean).join(" · ");
  const rows = [["Artiste", track.artist], ["Album", track.album], ["Année", track.year || tags.year || tags.date], ["Genre", track.genre || tags.genre], ["Durée", time(track.duration)], ["Format", track.fileInfo?.type || technical.container], ["Codec", technical.codec], ["Qualité audio", quality], ["Canaux", technical.numberOfChannels ? `${technical.numberOfChannels} canal${technical.numberOfChannels > 1 ? "x" : ""}` : null], ["Taille du fichier", fileSize(track.fileInfo?.size)], ["Encodage", technical.lossless === true ? "Sans perte" : technical.lossless === false ? "Compressé" : null], ["BPM", tags.bpm], ["Tonalité", tags.key], ["Compositeur", tags.composer], ["Label", tags.label], ["Copyright", tags.copyright], ["ISRC", tags.isrc]].filter(([, value]) => value !== undefined && value !== null && value !== "");
  return <div className="mt-6 max-h-72 overflow-y-auto border border-white/[.08] bg-[#07101e]/80 p-4"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#72eee7]">Informations du morceau</p><div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="border-b border-white/[.06] pb-2"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#8290aa]">{label}</p><p className="mt-1 break-words text-sm font-medium text-[#e3eaff]">{String(value)}</p></div>)}</div>{!rows.length ? <p className="mt-4 text-sm text-[#91a0bd]">Les détails apparaîtront après l’import d’un fichier avec métadonnées.</p> : null}</div>;
}
