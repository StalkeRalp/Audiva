"use client";

import { PochetteImage } from "@/composants/ui/PochetteImage";

import { LyricsPanel } from "@/domaines/lecteur/composants/LyricsPanel";
import ShareMusicCard from "@/domaines/lecteur/composants/ShareMusicCard";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Cancel01Icon, FavouriteIcon, InformationCircleIcon, Mic01Icon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, Queue01Icon, RepeatIcon, Share01Icon, ShuffleIcon, VolumeHighIcon, VolumeLowIcon, VolumeMute01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { isLocalTrack, useLecteurControlsStore, useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useSocialStore } from "@/domaines/social/stores/socialStore";
import { PlasmaBackground } from "@/domaines/lecteur/composants/PlasmaBackground";
import { ElasticSlider } from "@/composants/ui/ElasticSlider";

const time = (value = 0) => {
  const seconds = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};
const fileSize = (bytes) => !bytes ? null : bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`;
const coverFor = (track) => track.cover || track.image || "/placeholders/audio-cover.svg";

export default function LecteurPage() {
  const router = useRouter();
  const player = useLecteurControlsStore();
  const { friends, conversations, sendMessage } = useSocialStore();
  const [panel, setPanel] = useState("cover");
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [glassMode, setGlassMode] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("audiva-reader-glass") === "true");
  const [plasmaStyle, setPlasmaStyle] = useState(() => typeof window !== "undefined" ? window.localStorage.getItem("audiva-plasma-style") || "auto" : "auto");
  useEffect(() => {
    document.body.classList.toggle("reader-glass-mode", glassMode);
    return () => document.body.classList.remove("reader-glass-mode");
  }, [glassMode]);
  const track = player.currentTrack;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!track) return <main className="now-playing now-playing--empty"><HugeiconsIcon icon={Mic01Icon} size={40} /><h1>À vous de choisir la musique.</h1><Link href="/bibliotheque" className="audiva-button-primary rounded-full px-6 py-3">Ouvrir ma bibliothèque</Link></main>;

  const togglePanel = (name) => setPanel(panel === name ? "cover" : name);
  const liked = player.likedTrackIds.includes(track.id);
  const nextTracks = [...player.upNextQueue.map((item, index) => ({ track: item, key: `next-${index}`, priorityIndex: index })), ...player.queue.slice(player.currentIndex + 1).map((item, index) => ({ track: item, key: `queue-${index}` }))];
  const share = (friend) => {
    const conversation = conversations.find((item) => item.participantId === friend.id);
    if (!conversation) { setNotice("Aucune conversation disponible avec cet ami."); return; }
    sendMessage(conversation.id, { share: { kind: "morceau", title: track.title, subtitle: [track.artist, track.album].filter(Boolean).join(" · "), cover: coverFor(track) } });
    setShareOpen(false);
    setNotice(`Morceau partagé avec ${friend.name}`);
  };

  const isVideo=track.mediaType === "video" || track.fileInfo?.type === "video/mp4" || /\.mp4$/i.test(track.fileInfo?.name || "");
  return <main className={`now-playing ${isVideo ? "now-playing--video" : ""} ${panel !== "cover" ? "now-playing--expanded" : ""}`}>
    <PlasmaBackground cover={coverFor(track)} style={plasmaStyle} />
    <div className="now-playing__giant-disc" aria-hidden="true" data-playing={player.isPlaying}>
      <Image unoptimized src="/cd/cd5.png" alt="" fill sizes="(max-width: 767px) 180vw, 1450px" className="now-playing__giant-disc-image" draggable={false} />
    </div>
    <header className="now-playing__header">
      <button type="button" onClick={() => router.back()} className="now-playing__icon now-playing__glass" aria-label="Fermer le lecteur et revenir à la page précédente"><HugeiconsIcon icon={ArrowDown01Icon} size={22} /></button>
      <div className="now-playing__source"><span>LECTURE DEPUIS</span><p>{player.queueSourceName || "Votre musique"}</p></div>
      <button type="button" className="now-playing__icon now-playing__glass" onClick={() => setShareOpen(true)} aria-label="Partager le morceau"><HugeiconsIcon icon={Share01Icon} size={21} strokeWidth={1.7} /></button>
      <button type="button" className="now-playing__icon now-playing__glass" onClick={() => setAppearanceOpen(value => !value)} aria-label="Apparence du lecteur" aria-expanded={appearanceOpen}><HugeiconsIcon icon={Settings01Icon} size={21} /></button>
    </header>

    {appearanceOpen && <section className="now-playing__appearance" aria-label="Personnaliser votre lecteur">
      <header><div><span>ATELIER AUDIVA</span><strong>Personnalise ton espace</strong></div><button type="button" onClick={() => setAppearanceOpen(false)} aria-label="Fermer">×</button></header>
      <p className="appearance-caption">AMBIANCE DU PLASMA</p>
      <div className="appearance-presets" role="group" aria-label="Choisir une ambiance de plasma">
        {[['auto','Pochette','linear-gradient(135deg,#7c67e8,#65d8cd)'],['ocean','Océan','linear-gradient(135deg,#126e89,#52ded2)'],['violet','Nébuleuse','linear-gradient(135deg,#5530a4,#e276d2)'],['sunset','Coucher de soleil','linear-gradient(135deg,#e65b52,#efb64c)'],['mono','Lunaire','linear-gradient(135deg,#384658,#d4def1)']].map(([id,label,swatch])=><button type="button" key={id} className={plasmaStyle===id?'is-selected':''} aria-pressed={plasmaStyle===id} onClick={()=>{setPlasmaStyle(id);localStorage.setItem("audiva-plasma-style",id);}}><span className="appearance-swatch" style={{background:swatch}}><i/></span><span>{label}</span></button>)}
      </div>
      <div className="appearance-divider"/>
      <button type="button" className={`appearance-glass-card ${glassMode?'is-on':''}`} aria-pressed={glassMode} onClick={()=>{const next=!glassMode;setGlassMode(next);localStorage.setItem("audiva-reader-glass",String(next));}}><span className="appearance-glass-icon">✧</span><span><strong>Mode verre</strong><small>{glassMode?'Reflets activés sur l’interface':'Applique le verre à la navigation'}</small></span><i className="appearance-switch"/></button>
    </section>}

    <div className="now-playing__layout">{isVideo && <div className="now-playing__video-frame"><div id="audiva-video-slot"/><span>VIDÉO LOCALE · AUDIVA <button type="button" aria-label="Afficher la vidéo en plein écran" onClick={() => document.querySelector("[data-audiva-media]")?.requestFullscreen?.().catch(() => {})}>Plein écran ↗</button></span></div>}
      <section className="now-playing__record" aria-label="Morceau et commandes de lecture">
        {!isVideo && <div className={`now-playing__artwork ${player.isPlaying ? "now-playing__artwork--playing" : ""}`}><PochetteImage unoptimized src={coverFor(track)} alt={`Pochette de ${track.title}`} fill priority sizes="(min-width: 1024px) 420px, (min-width: 640px) 400px, 85vw" className="object-cover" /></div>}
        <div className="now-playing__identity"><div className="min-w-0"><h1>{track.title}</h1><p>{track.artist}</p>{track.album && <span>{track.album}</span>}</div><button type="button" onClick={() => player.toggleLike(track)} aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={liked} className={`now-playing__icon now-playing__glass ${liked ? "is-active" : ""}`}><HugeiconsIcon icon={FavouriteIcon} size={23} fill={liked ? "currentColor" : "none"} strokeWidth={1.7} /></button></div>
        <ReaderTimeline />
        <div className="now-playing__transport">
          <button type="button" className={`now-playing__icon ${player.isShuffled ? "is-active" : ""}`} onClick={player.toggleShuffle} aria-label="Lecture aléatoire" aria-pressed={player.isShuffled}><HugeiconsIcon icon={ShuffleIcon} size={23} strokeWidth={1.8} /></button>
          <button type="button" className="now-playing__icon now-playing__skip" onClick={player.previousTrack} aria-label="Morceau précédent"><HugeiconsIcon icon={PreviousIcon} size={34} fill="currentColor" /></button>
          <button type="button" className="now-playing__play" onClick={player.isPlaying ? player.pause : player.play} aria-label={player.isPlaying ? "Mettre en pause" : "Lire"} aria-pressed={player.isPlaying}><HugeiconsIcon icon={player.isPlaying ? PauseIcon : PlayIcon} size={43} fill="#071523" strokeWidth={1.8} style={{ color: "#071523", fill: "#071523", stroke: "#071523" }} /></button>
          <button type="button" className="now-playing__icon now-playing__skip" onClick={player.nextTrack} aria-label="Morceau suivant"><HugeiconsIcon icon={NextIcon} size={34} fill="currentColor" /></button>
          <button type="button" className={`now-playing__icon now-playing__repeat ${player.repeatMode !== "off" ? "is-active" : ""}`} onClick={player.cycleRepeatMode} aria-label={`Répétition : ${player.repeatMode === "off" ? "désactivée" : player.repeatMode === "track" ? "un morceau" : "toute la file"}`} aria-pressed={player.repeatMode !== "off"}><HugeiconsIcon icon={RepeatIcon} size={23} strokeWidth={1.8} />{player.repeatMode === "track" && <span>1</span>}</button>
        </div>
        <div className="now-playing__volume"><button type="button" className="now-playing__icon" onClick={player.toggleMute} aria-label={player.isMuted ? "Réactiver le son" : "Couper le son"}><HugeiconsIcon icon={player.isMuted ? VolumeMute01Icon : VolumeLowIcon} size={19} strokeWidth={1.7} /></button><ElasticSlider ariaLabel="Volume" value={player.isMuted ? 0 : player.volume} startingValue={0} maxValue={1} stepSize={0.01} leftIcon={null} rightIcon={null} valuePosition="bubble" formatValue={value => `${Math.round(value * 100)}%`} thumb thickness={4} activeThickness={7} jumpToClick rangeColor="rgba(255,255,255,.65)" trackColor="rgba(255,255,255,.13)" className="w-full" onChange={player.setVolume} /><button type="button" className="now-playing__icon" onClick={() => player.setVolume(1)} aria-label="Volume maximum"><HugeiconsIcon icon={VolumeHighIcon} size={19} strokeWidth={1.7} /></button></div>
        <div className="now-playing__tools" aria-label="Affichage du lecteur"><ShareMusicCard track={track}/><PanelButton active={panel === "lyrics"} onClick={() => togglePanel("lyrics")} icon={Mic01Icon}>Paroles</PanelButton><PanelButton active={panel === "queue"} onClick={() => togglePanel("queue")} icon={Queue01Icon}>À suivre</PanelButton><PanelButton active={panel === "info"} onClick={() => togglePanel("info")} icon={InformationCircleIcon}>Détails</PanelButton></div>
      </section>

      {panel !== "cover" && <section className="now-playing__panel" aria-label={panel === "lyrics" ? "Paroles" : panel === "info" ? "Informations" : "File d’attente"}><header><h2>{panel === "lyrics" ? "Paroles" : panel === "info" ? "Informations" : "À suivre"}</h2><button type="button" className="now-playing__icon" onClick={() => setPanel("cover")} aria-label="Fermer le panneau"><HugeiconsIcon icon={Cancel01Icon} size={20}/></button></header>{panel === "lyrics" ? <LyricsPanel track={track}/> : panel === "info" ? <TrackInformation track={track} /> : <div className="now-playing__queue"><p>{nextTracks.length} morceau{nextTracks.length > 1 ? "x" : ""} à venir</p>{nextTracks.length ? nextTracks.map(({ track: item, key, priorityIndex }) => <button type="button" key={key} onClick={() => { if (priorityIndex !== undefined) { for (let index = priorityIndex; index >= 0; index -= 1) player.removeUpNext(index); } player.setCurrentTrack(item); player.play(); }} className="now-playing__queue-track"><Image unoptimized src={coverFor(item)} alt="" width={52} height={52} /><span><strong>{item.title}</strong><small>{item.artist}</small></span><span>{time(item.duration)}</span><HugeiconsIcon icon={PlayIcon} size={17} fill="currentColor" /></button>) : <div className="now-playing__panel-empty"><HugeiconsIcon icon={Queue01Icon} size={36} /><p>La suite vous appartient.</p><span>Ajoutez des morceaux depuis votre bibliothèque.</span><Link href="/bibliotheque">Explorer ma musique</Link></div>}</div>}
      </section>}
    </div>
    {notice && <p role="status" className="now-playing__notice audiva-glass">{notice}</p>}
    {shareOpen && <ShareDialog track={track} friends={friends} onShare={share} onClose={() => setShareOpen(false)} />}
  </main>;
}

function ReaderTimeline() {
  const currentTime = useLecteurStore((state) => state.currentTime);
  const duration = useLecteurStore((state) => state.duration);
  const seek = useLecteurStore((state) => state.seek);
  const commitSeek = (value) => {
    const position = Math.max(0, Math.min(value, duration || value));
    const audio = document.querySelector("[data-audiva-media]");
    if (isLocalTrack(useLecteurStore.getState().currentTrack) && audio && Number.isFinite(audio.duration)) audio.currentTime = position;
    seek(position);
  };
  return <div className="now-playing__timeline"><ElasticSlider ariaLabel="Position du morceau" value={Math.min(currentTime, duration || currentTime)} startingValue={0} maxValue={duration || 1} stepSize={0.1} disabled={!duration} leftIcon={null} rightIcon={null} valuePosition="bubble" formatValue={time} thumb thickness={5} activeThickness={9} jumpToClick rangeColor="#b7fff5" trackColor="rgba(255,255,255,.18)" className="w-full" onChange={seek} onChangeEnd={commitSeek} /><div className="now-playing__times"><span>{time(currentTime)}</span><span>{time(duration)}</span></div></div>;
}

function PanelButton({ active, onClick, icon, children }) {
  return <button type="button" className={active ? "is-active" : ""} onClick={onClick} aria-pressed={active}><HugeiconsIcon icon={icon} size={21} strokeWidth={1.7} /><span>{children}</span></button>;
}

function ShareDialog({ track, friends, onShare, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  return <dialog ref={dialogRef} className="now-playing__share audiva-glass" aria-labelledby="share-track-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}><header><div><h2 id="share-track-title">Partager la musique</h2><p>{track.title} · {track.artist}</p></div><button type="button" onClick={onClose} className="now-playing__icon" aria-label="Fermer le partage"><HugeiconsIcon icon={Cancel01Icon} size={20} /></button></header><div>{friends.length ? friends.map((friend) => <button type="button" key={friend.id} onClick={() => onShare(friend)}><Image unoptimized src={friend.avatar || "/placeholders/audio-cover.svg"} alt="" width={42} height={42} /><span>{friend.name}</span><HugeiconsIcon icon={Share01Icon} size={19} /></button>) : <p>Ajoutez des amis pour partager vos découvertes.</p>}</div></dialog>;
}
function TrackInformation({ track }) {
  const tags = track.tags || {}; const technical = track.technical || {};
  const quality = [technical.bitrate ? `${Math.round(technical.bitrate / 1000)} kb/s` : null, technical.sampleRate ? `${technical.sampleRate / 1000} kHz` : null, technical.bitsPerSample ? `${technical.bitsPerSample} bits` : null].filter(Boolean).join(" · ");
  const rows = [["Artiste", track.artist], ["Album", track.album], ["Année", track.year || tags.year || tags.date], ["Genre", track.genre || tags.genre], ["Durée", time(track.duration)], ["Format", track.fileInfo?.type || technical.container], ["Codec", technical.codec], ["Qualité audio", quality], ["Canaux", technical.numberOfChannels ? `${technical.numberOfChannels} canal${technical.numberOfChannels > 1 ? "x" : ""}` : null], ["Taille du fichier", fileSize(track.fileInfo?.size)], ["Encodage", technical.lossless === true ? "Sans perte" : technical.lossless === false ? "Compressé" : null], ["BPM", tags.bpm], ["Tonalité", tags.key], ["Compositeur", tags.composer], ["Label", tags.label], ["Copyright", tags.copyright], ["ISRC", tags.isrc]].filter(([, value]) => value !== undefined && value !== null && value !== "");
  return <div className="mt-6 max-h-72 overflow-y-auto border border-white/[.08] bg-[#07101e]/80 p-4"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#72eee7]">Informations du morceau</p><div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="border-b border-white/[.06] pb-2"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#8290aa]">{label}</p><p className="mt-1 break-words text-sm font-medium text-[#e3eaff]">{String(value)}</p></div>)}</div>{!rows.length ? <p className="mt-4 text-sm text-[#91a0bd]">Les détails apparaîtront après l’import d’un fichier avec métadonnées.</p> : null}</div>;
}
