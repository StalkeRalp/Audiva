"use client";

import { LyricsPanel } from "@/domaines/lecteur/composants/LyricsPanel";
import { prefetchLyrics } from "@/domaines/lecteur/services/lyricService";
import { useEcouteStore } from "@/domaines/statistiques/stores/ecouteStore";
import { useIntelligenceStore } from "@/domaines/statistiques/stores/intelligenceStore";
import Link from "next/link";
import Image from "next/image";
import { PochetteImage } from "@/composants/ui/PochetteImage";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Album01Icon, ArrowDown01Icon, ArrowUp01Icon, BluetoothIcon, BluetoothNotConnectedIcon, Cancel01Icon, FavouriteIcon, Mic01Icon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, Queue01Icon, RepeatIcon, ShuffleIcon, Share01Icon, UserIcon, VolumeHighIcon, VolumeLowIcon, VolumeMute01Icon, MoreHorizontalIcon, Clock01Icon } from "@hugeicons/core-free-icons";
import { isLocalTrack, useLecteurControlsStore, useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { clearSpotifyPlayback, getSpotifyPlayback, registerSpotifyPlayback, updateSpotifyPlaybackDevice } from "@/domaines/lecteur/services/spotifyPlayback";
import { connectSpotify, getSpotifyAccessToken, hasSpotifySession, searchSpotify, spotifyHasStreamingScope, spotifyRequest } from "@/domaines/statistiques/services/spotify";
import { useUiStore } from "@/stores/uiStore";
import { acceptTrackDrag, takeTrackDrop } from "@/utilitaires/trackDrag";
import { ElasticSlider } from "@/composants/ui/ElasticSlider";

const bluetoothOutputPattern = /bluetooth|headphone|headset|airpod|wireless|écouteur|sony|jbl|bose|beats|soundcore|anker|marshall|wf-|wh-|buds/i;

export function LecteurPersistant() {
  const pathname = usePathname();
  const router = useRouter();
  const audioRef = useRef(null);
  const spotifyPlayerRef = useRef(null);
  const spotifyEndedTrackRef = useRef(null);
  const [outputName, setOutputName] = useState("");
  const [outputError, setOutputError] = useState("");
  const [videoRect,setVideoRect]=useState(null);
  const [spotifySdkEnabled, setSpotifySdkEnabled] = useState(false);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState(null);
  const [spotifyReady, setSpotifyReady] = useState(false);
  const [spotifyNeedsConnection, setSpotifyNeedsConnection] = useState(false);
  const listened = useRef({ position: 0, wall: 0, id: null });
  const handleAudioTimeUpdate = event => {
    const audio = event.currentTarget, now = event.timeStamp, track = useLecteurStore.getState().currentTrack;
    const previous = listened.current, delta = audio.currentTime - previous.position, elapsed = (now - previous.wall) / 1000;
    if (previous.id === track?.id && previous.wall && !audio.paused && !audio.seeking && audio.readyState >= 2 && delta > 0 && delta <= 2 && elapsed > 0 && elapsed < 3 && Math.abs(delta - elapsed * audio.playbackRate) < .5) { useEcouteStore.getState().record(track, Math.min(delta / audio.playbackRate, elapsed)); useIntelligenceStore.getState().sample(track,Math.min(delta / audio.playbackRate,elapsed),audio.currentTime,audio.duration); }
    listened.current = { position: audio.currentTime, wall: now, id: track?.id };
    setCurrentTime(audio.currentTime);
  };
  const [queueTab, setQueueTab] = useState("queue");
  const [queueNotice, setQueueNotice] = useState("");
  useEffect(()=>{if(!queueNotice||spotifyNeedsConnection)return;const timer=setTimeout(()=>setQueueNotice(''),3500);return()=>clearTimeout(timer);},[queueNotice,spotifyNeedsConnection]);
  const { currentTrack, queue, currentIndex, upNextQueue, queueSourceName, recentTracks, isPlaying, volume, isMuted, isShuffled, repeatMode, lyricsOpen, queueOpen, likedTrackIds, play, pause, setCurrentTime, setDuration, setVolume, toggleMute, toggleShuffle, cycleRepeatMode, toggleLyrics, toggleQueue, toggleLike, nextTrack, previousTrack, handleTrackEnd, setCurrentTrack, removeFromQueue, removeUpNext, moveQueueItem, moveUpNext, playNext } = useLecteurControlsStore();
  const initializeSpotifySdk = useCallback(() => {
    if (!window.Spotify?.Player || spotifyPlayerRef.current) return;
    const player = new window.Spotify.Player({
      name: "Audiva",
      getOAuthToken: (callback) => getSpotifyAccessToken().then(callback).catch((error) => {
        setSpotifyNeedsConnection(true);
        setQueueNotice("Votre autorisation de lecture a expiré. Reconnectez votre compte pour reprendre.");
      }),
      volume: useLecteurStore.getState().isMuted ? 0 : useLecteurStore.getState().volume,
    });
    spotifyPlayerRef.current = player;
    registerSpotifyPlayback(player);
    player.addListener("ready", ({ device_id: deviceId }) => {
      updateSpotifyPlaybackDevice(deviceId);
      setSpotifyDeviceId(deviceId);
      setSpotifyReady(true);
      setSpotifyNeedsConnection(false);
      setQueueNotice("");
    });
    player.addListener("not_ready", () => {
      updateSpotifyPlaybackDevice(null);
      setSpotifyDeviceId(null);
      setSpotifyReady(false);
      setQueueNotice("Le lecteur s’est déconnecté. Réessayez dans quelques instants.");
    });
    player.addListener("player_state_changed", (state) => {
      if (!state) return;
      const spotifyTrack = state.track_window?.current_track;
      const store = useLecteurStore.getState();
      if (!spotifyTrack || store.currentTrack?.provider !== "spotify" || store.currentTrack.providerId !== spotifyTrack.id) return;
      const position = Math.max(0, state.position || 0) / 1000;
      const duration = Math.max(0, state.duration || 0) / 1000;
      const now = Date.now();
      const previous = listened.current;
      if (previous.id !== store.currentTrack.id) {
        useIntelligenceStore.getState().start(store.currentTrack, position);
      } else {
        const delta = position - previous.position;
        const elapsed = previous.wall ? (now - previous.wall) / 1000 : 0;
        if (!state.paused && delta > 0 && delta <= 2 && elapsed > 0 && elapsed < 3 && Math.abs(delta - elapsed) < 0.6) {
          useEcouteStore.getState().record(store.currentTrack, delta);
          useIntelligenceStore.getState().sample(store.currentTrack, delta, position, duration);
        }
      }
      listened.current = { position, wall: now, id: store.currentTrack.id };
      useLecteurStore.setState({
        currentTime: position,
        duration,
        isPlaying: !state.paused,
      });
      if (!state.duration) return;
      if (state.position < state.duration - 1500) spotifyEndedTrackRef.current = null;
      const atEnd = state.paused && state.position >= state.duration - 700;
      if (!atEnd || spotifyEndedTrackRef.current === spotifyTrack.id) return;
      spotifyEndedTrackRef.current = spotifyTrack.id;
      useIntelligenceStore.getState().finish(true);
      if (useLecteurStore.getState().repeatMode === "track") {
        const deviceId = getSpotifyPlayback().deviceId;
        if (deviceId) spotifyRequest(`me/player/play?device_id=${encodeURIComponent(deviceId)}`, { method: "PUT", body: { uris: [spotifyTrack.uri] } }).catch((error) => setQueueNotice(error.message));
      } else {
        useLecteurStore.getState().handleTrackEnd();
      }
    });
    player.addListener("authentication_error", () => {
      setSpotifyNeedsConnection(true);
      setSpotifyReady(false);
      useLecteurStore.getState().pause();
      setQueueNotice("Votre autorisation de lecture a expiré. Reconnectez votre compte pour reprendre.");
    });
    player.addListener("account_error", () => {
      setSpotifyReady(false);
      useLecteurStore.getState().pause();
      setQueueNotice("Le lecteur intégré exige un compte Premium.");
    });
    player.addListener("initialization_error", ({ message }) => {
      setSpotifyReady(false);
      setQueueNotice(message || "Le lecteur ne peut pas démarrer dans ce navigateur.");
    });
    player.addListener("playback_error", ({ message }) => setQueueNotice(message || "Impossible de lire ce titre pour le moment."));
    player.addListener("autoplay_failed", () => setQueueNotice("Touchez Lecture pour démarrer le morceau dans Audiva."));
    player.connect().then((connected) => {
      if (!connected) setQueueNotice("Impossible de démarrer le lecteur intégré.");
    }).catch(() => setQueueNotice("Impossible de démarrer le lecteur intégré."));
  }, [setQueueNotice]);
  useEffect(() => {
    const initializeTimer = window.setTimeout(() => {
      setSpotifySdkEnabled(Boolean(hasSpotifySession() && spotifyHasStreamingScope()));
    }, 0);
    if (sessionStorage.getItem("audiva-spotify-resume") === "1") {
      sessionStorage.removeItem("audiva-spotify-resume");
      const savedTrack = useLecteurStore.getState().currentTrack;
      if (savedTrack && !isLocalTrack(savedTrack)) useLecteurStore.getState().play();
    }
    return () => window.clearTimeout(initializeTimer);
  }, []);
  useEffect(() => () => {
    const player = spotifyPlayerRef.current;
    spotifyPlayerRef.current = null;
    clearSpotifyPlayback(player);
    player?.disconnect();
  }, []);
  useEffect(()=>{
    let observer,frame;
    const measure=()=>{const slot=document.getElementById('audiva-video-slot');if(!slot){setVideoRect(null);return;}const r=slot.getBoundingClientRect();setVideoRect({top:r.top,left:r.left,width:r.width,height:r.height,borderRadius:window.matchMedia('(max-width: 767px)').matches?0:18});};
    frame=requestAnimationFrame(()=>{measure();const slot=document.getElementById('audiva-video-slot');if(slot){observer=new ResizeObserver(measure);observer.observe(slot);}});
    window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);
    return()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);};
  },[pathname,currentTrack?.id]);
  useEffect(()=>{useIntelligenceStore.getState().hydrate();const flush=()=>useIntelligenceStore.getState().commit();window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',flush);return()=>{flush();window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',flush);};},[]);
  useEffect(()=>{useIntelligenceStore.getState().finish(false);},[currentTrack?.id]);
  const { playerVisible, setPlayerVisible, playerStyle, setPlayerStyle } = useUiStore();
  useEffect(() => {
    const savedStyle = window.localStorage.getItem("audiva-player-style");
    if (savedStyle === "apple" || savedStyle === "audiva") setPlayerStyle(savedStyle);
  }, [setPlayerStyle]);
  const togglePlayerStyle = () => setPlayerStyle(playerStyle === "apple" ? "audiva" : "apple");

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && isLocalTrack(useLecteurStore.getState().currentTrack)) audio.volume = isMuted ? 0 : volume;
    const spotifyPlayer = spotifyPlayerRef.current;
    if (spotifyPlayer) spotifyPlayer.setVolume(isMuted ? 0 : volume).catch(() => {});
  }, [isMuted, volume, spotifyReady]);

  const chooseAudioOutput = async () => {
    const audio = audioRef.current;
    const mediaDevices = navigator.mediaDevices;
    setOutputError("");
    try {
      if (!audio?.setSinkId || !mediaDevices?.selectAudioOutput) {
        const message = "La sélection de sortie Bluetooth n’est pas proposée par ce navigateur. Choisissez la sortie dans les réglages audio de l’appareil.";
        setOutputError(message);
        setQueueNotice(message);
        return;
      }
      const device = await mediaDevices.selectAudioOutput();
      await audio.setSinkId(device.deviceId);
      setOutputName(device.label || "Sortie audio sélectionnée");
      setQueueNotice(`Sortie audio : ${device.label || "appareil sélectionné"}`);
      try { window.localStorage.setItem("audiva-audio-output", device.deviceId); } catch {}
    } catch (error) {
      if (error?.name !== "NotAllowedError" && error?.name !== "AbortError") {
        const message = "Impossible de changer la sortie audio. Vérifiez les autorisations du navigateur.";
        setOutputError(message);
        setQueueNotice(message);
      }
    }
  };
  useEffect(() => {
    const audio = audioRef.current;
    let active = true;
    const savedId = (() => { try { return window.localStorage.getItem("audiva-audio-output"); } catch { return null; } })();
    const refreshName = async () => {
      const devices = await navigator.mediaDevices?.enumerateDevices?.().catch(() => []);
      const output = devices?.find(device => device.kind === "audiooutput" && device.deviceId === (savedId || "default"));
      if (active && output?.label && !/^default$/i.test(output.label)) setOutputName(output.label);
    };
    if (savedId && audio?.setSinkId) audio.setSinkId(savedId).then(refreshName).catch(() => { try { window.localStorage.removeItem("audiva-audio-output"); } catch {} });
    else refreshName();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshName);
    return () => { active = false; navigator.mediaDevices?.removeEventListener?.("devicechange", refreshName); };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isLocalTrack(currentTrack)) {
      audio.pause();
      return;
    }
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error?.name !== "AbortError") { useLecteurStore.getState().pause(); setQueueNotice("Lecture impossible. Vérifiez la source audio puis réessayez."); }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.id, currentTrack?.streamUrl, currentTrack]);

  useEffect(() => {
    if (!currentTrack || isLocalTrack(currentTrack)) return;
    let active = true;
    const spotifyPlayer = spotifyPlayerRef.current;
    if (!isPlaying) {
      spotifyPlayer?.pause().catch(() => {});
      return () => { active = false; };
    }
    if (!hasSpotifySession() || !spotifyHasStreamingScope()) {
      const needsAuthorization = hasSpotifySession();
      queueMicrotask(() => {
        if (!active) return;
        setSpotifyNeedsConnection(true);
        setQueueNotice(needsAuthorization ? "Votre autorisation de lecture a expiré. Reconnectez votre compte pour reprendre." : "Associez votre compte musical pour écouter ce titre dans Audiva.");
      });
      pause();
      return () => { active = false; };
    }
    if (!spotifySdkEnabled) {
      queueMicrotask(() => { if (active) setSpotifySdkEnabled(true); });
      return () => { active = false; };
    }
    if (!spotifyReady || !spotifyDeviceId || !spotifyPlayer) {
      setQueueNotice("");
      return () => { active = false; };
    }
    const launch = async () => {
      try {
        let target = currentTrack;
        if (target.provider !== "spotify" || target.type !== "tracks" || !target.providerId) {
          const query = [`track:${target.title}`, target.artist && `artist:${target.artist}`].filter(Boolean).join(" ");
          const matches = await searchSpotify(query, { type: "tracks" });
          if (!active) return;
          if (!matches.length) throw new Error("Ce titre n’a pas été retrouvé dans le catalogue musical.");
          target = matches[0];
          const store = useLecteurStore.getState();
          const oldIndex = store.queue.findIndex((item) => item.id === currentTrack.id);
          const queue = oldIndex >= 0
            ? store.queue.map((item, index) => index === oldIndex ? target : item)
            : [target, ...store.queue];
          const currentIndex = oldIndex >= 0 ? oldIndex : 0;
          useLecteurStore.setState({
            currentTrack: target,
            queue,
            currentIndex,
            currentTime: 0,
            duration: target.duration || 0,
            recentTracks: [target, ...store.recentTracks.filter((item) => item.id !== target.id)].slice(0, 30),
          });
          return;
        }
        await spotifyPlayer.activateElement?.();
        if (!active) return;
        await spotifyRequest(`me/player/play?device_id=${encodeURIComponent(spotifyDeviceId)}`, {
          method: "PUT",
          body: { uris: [target.uri || `spotify:track:${target.providerId}`] },
        });
        if (active) setQueueNotice("");
      } catch (error) {
        if (!active) return;
        pause();
        setQueueNotice(error?.message || "Impossible de lire ce titre pour le moment.");
      }
    };
    launch();
    return () => { active = false; };
  }, [isPlaying, currentTrack, pause, spotifySdkEnabled, spotifyReady, spotifyDeviceId]);

  useEffect(() => useLecteurStore.subscribe((state, previous) => {
    if ((state.isPlaying && !previous.isPlaying) || state.currentTrack !== previous.currentTrack) {
      useUiStore.getState().setPlayerVisible(true);
    }
    const audio = audioRef.current;
    if (state.currentTrack?.id === previous.currentTrack?.id && state.currentTime !== previous.currentTime && Math.abs(state.currentTime - previous.currentTime) > 1) {
      if (isLocalTrack(state.currentTrack) && audio && Number.isFinite(audio.duration) && Math.abs(audio.currentTime - state.currentTime) > 1) {
        audio.currentTime = state.currentTime;
        if (state.isPlaying && audio.paused) audio.play().catch(() => {});
      }
    }
  }), []);
  useEffect(() => {
    const showQueue = () => { useUiStore.getState().setPlayerVisible(true); useLecteurStore.setState({ queueOpen: true, lyricsOpen: false }); };
    window.addEventListener('audiva-track-drag', showQueue);
    return () => window.removeEventListener('audiva-track-drag', showQueue);
  }, []);
  useEffect(() => { if (currentTrack) prefetchLyrics([currentTrack]); }, [currentTrack]);
  const publicRoute = pathname === "/" || pathname.startsWith("/authentification");
  const dropTrack = event => { const item = takeTrackDrop(event); if (item) { useLecteurStore.getState().addToQueue(item); setQueueTab('queue'); notifyQueue(`${item.title} ajouté à la file`); } };
  const isLecteurPage = pathname === "/lecteur";
  const track = currentTrack || { title: "Aucun titre", artist: "Choisissez votre musique" };
  const cover = track.cover || track.image || "/placeholders/audio-cover.svg";

  const controlClass = "flex h-9 w-9 items-center justify-center rounded-full text-[#c9d3e8] transition duration-150 hover:scale-110 hover:bg-white/10 hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-35";
  const notifyQueue = (message) => { setQueueNotice(message); window.setTimeout(() => setQueueNotice(""), 2200); };

  return <>{spotifySdkEnabled && <Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" onReady={initializeSpotifySdk} onError={() => setQueueNotice("Le lecteur intégré n’a pas pu être chargé.")} />}<video data-audiva-media playsInline ref={audioRef} className="audiva-persistent-media" style={videoRect && isLocalTrack(track) && (track.mediaType === "video" || track.fileInfo?.type === "video/mp4" || /\.mp4$/i.test(track.fileInfo?.name || "")) ? {position:"fixed",...videoRect,zIndex:20,objectFit:"contain",background:"#040609",borderRadius:videoRect.borderRadius} : {position:"fixed",width:1,height:1,opacity:0,pointerEvents:"none"}} src={isLocalTrack(track) ? track.streamUrl : undefined} preload={isLocalTrack(track) ? "metadata" : "none"} onPlaying={() => useIntelligenceStore.getState().start(track,audioRef.current?.currentTime || 0)} onTimeUpdate={handleAudioTimeUpdate} onSeeking={() => { listened.current.wall = 0; }} onPause={() => { listened.current.wall = 0; }} onWaiting={() => { listened.current.wall = 0; }} onLoadedMetadata={(event) => { const audio = event.currentTarget; setQueueNotice(""); setDuration(audio.duration); const savedTime = useLecteurStore.getState().currentTime; if (savedTime > 0) audio.currentTime = Math.min(savedTime, Number.isFinite(audio.duration) ? audio.duration : savedTime); }} onError={() => { if (isLocalTrack(track) && track.streamUrl) { pause(); } }} onEnded={() => { useIntelligenceStore.getState().finish(true); handleTrackEnd(); }} />
    {!publicRoute && !playerVisible && <button className="audiva-player-restore" onClick={() => setPlayerVisible(true)} aria-label="Afficher le lecteur">♫ <span>{track.title}</span> ↑</button>}
    {!publicRoute && playerVisible && <>
    {queueNotice && !queueOpen && <div role="status" className="audiva-player-notice fixed bottom-24 right-3 z-[80] flex max-w-[min(480px,calc(100vw-24px))] items-center justify-between gap-3 rounded-2xl border border-[#76eee9]/30 bg-[#112139] px-4 py-3 text-sm font-semibold text-[#c8fffb] shadow-xl sm:right-5"><span>{queueNotice}{spotifyNeedsConnection && <button type="button" className="ml-3 font-bold text-[#a6f6ef] underline underline-offset-2" onClick={() => connectSpotify({ returnTo: `${pathname}${window.location.search}`, resumePlayback: true }).catch((error) => setQueueNotice(error.message))}>Réassocier mon compte</button>}</span><button type="button" onClick={() => setQueueNotice("")} aria-label="Fermer le message du lecteur" className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-white/10"><HugeiconsIcon icon={Cancel01Icon} size={16}/></button></div>}
    {lyricsOpen && <aside className="fixed bottom-[88px] sm:bottom-[96px] left-0 right-0 top-[72px] z-40 overflow-hidden bg-[#07132b] text-[#eff4ff] lg:left-64"><div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_10%,rgba(80,128,255,.28),transparent_32%),linear-gradient(135deg,#071120,#0b1730_58%,#060b18)]" /><div className="relative grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]"><section className="min-w-0 overflow-y-auto px-5 py-8 sm:px-10 lg:px-14"><div className="mx-auto max-w-4xl"><div className="flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#a6f6ef]">Paroles synchronisées</p><p className="mt-2 text-sm font-semibold text-[#c3d0e8]">{track.title} · {track.artist}</p></div><button onClick={toggleLyrics} className={`${controlClass} border border-white/10 bg-[#07101e]`} aria-label="Fermer les paroles"><HugeiconsIcon icon={Cancel01Icon} size={20} /></button></div><LyricsPanel track={track}/></div></section><aside className="hidden h-full overflow-y-auto border-l border-white/[.08] bg-[#08101d] p-4 lg:block"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#a6f6ef]">Lecture en cours</p><PochetteImage unoptimized src={cover} alt="" width={480} height={480} className="mt-4 aspect-square w-full object-cover rounded-2xl" /><p className="mt-4 text-lg font-black">{track.title}</p><p className="mt-1 text-sm text-[#aebbd7]">{track.artist}</p></aside></div></aside>}
    {queueOpen && <aside onDragOver={acceptTrackDrag} onDrop={dropTrack} role="dialog" aria-label="File d&apos;attente" className="audiva-queue fixed bottom-[160px] sm:bottom-[120px] right-3 top-[84px] z-50 flex w-[min(420px,calc(100vw-24px))] flex-col border border-white/10 bg-[#101626]/90 backdrop-blur-2xl rounded-3xl shadow-[-16px_0_45px_rgba(0,0,0,.38)] animate-in slide-in-from-right-5 duration-200">
      <header className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 pt-5">
        <div className="flex h-10 items-start gap-6">
          <button type="button" onClick={() => setQueueTab("queue")} className={`h-full border-b-2 text-sm font-extrabold transition ${queueTab === "queue" ? "border-[#a6f6ef] text-white" : "border-transparent text-white/50 hover:text-white"}`}>File d&apos;attente</button>
          <button type="button" onClick={() => setQueueTab("recent")} className={`h-full border-b-2 text-sm font-extrabold transition ${queueTab === "recent" ? "border-[#a6f6ef] text-white" : "border-transparent text-white/50 hover:text-white"}`}>Écoutés récemment</button>
        </div>
        <button type="button" onClick={toggleQueue} className={controlClass} aria-label="Fermer la file"><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2.4} /></button>
      </header>
      <p className="audiva-queue-drop">Déposez vos titres ici pour les écouter ensuite</p>
      {queueTab === "queue" ? <QueueList queue={queue} currentIndex={currentIndex} currentTrack={track} upNextQueue={upNextQueue} queueSourceName={queueSourceName} onPlay={(item) => { setCurrentTrack(item); play(); }} onRemove={removeFromQueue} onRemoveUpNext={removeUpNext} onMove={moveQueueItem} onMoveUpNext={moveUpNext} onPlayNext={playNext} onLike={toggleLike} onLyrics={(item) => { setCurrentTrack(item); if (!lyricsOpen) toggleLyrics(); }} onNavigate={(query) => router.push(`/recherche?q=${encodeURIComponent(query)}`)} onNotice={notifyQueue} /> : <RecentList tracks={recentTracks} onPlay={(item) => { setCurrentTrack(item); play(); }} />}
      {queueNotice ? <div role="status" className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3 border border-[#a6f6ef]/30 bg-[#14263a] px-3 py-2 text-xs font-semibold text-[#bffcf8] shadow-xl"><span>{queueNotice}</span><button type="button" onClick={() => setQueueNotice("")} aria-label="Fermer le message du lecteur" className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-white/10"><HugeiconsIcon icon={Cancel01Icon} size={16}/></button></div> : null}
    </aside>}
    {isLecteurPage ? null : (
    <footer onDragOver={acceptTrackDrag} onDrop={dropTrack} className={`audiva-player ${playerStyle === "apple" ? "audiva-player--apple" : ""} fixed z-50 px-4 sm:px-6 py-3 text-white`}>
      {/* Desktop / Tablet layout */}
      <div className="hidden sm:flex items-center justify-between gap-6 lg:gap-8">
        {/* Left: Track Info */}
        <div className="flex min-w-0 items-center gap-3 sm:w-[260px] lg:w-[280px] shrink-0">
          <Link href="/lecteur" className="group relative h-13 w-13 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-md">
            <PochetteImage unoptimized src={cover} alt={track.title} fill sizes="56px" className="object-cover transition duration-300 group-hover:scale-105" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href="/lecteur" className="block truncate text-sm font-bold text-white tracking-tight hover:underline">
              {track.title}
            </Link>
            <p className="truncate text-xs font-medium text-[#8c8d99] mt-0.5">
              {track.artist}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleLike()}
            aria-label="Ajouter aux favoris"
            className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-110 active:scale-95 ${
              likedTrackIds.includes(track.id) ? "text-[#a6f6ef]" : "text-[#8c8d99] hover:text-white"
            }`}
          >
            <HugeiconsIcon icon={FavouriteIcon} size={18} fill={likedTrackIds.includes(track.id) ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Center: Controls on Top + Inline Progress Slider with Timestamps on Bottom */}
        <div className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1.5 max-w-[720px] mx-auto py-0.5">
          {/* Controls Row */}
          <div className="flex items-center justify-center gap-6 text-[#8c8d99]">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-pressed={isShuffled}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:text-white active:scale-95 ${
                isShuffled ? "text-[#a6f6ef]" : "text-[#8c8d99]"
              }`}
              title="Aléatoire"
            >
              <HugeiconsIcon icon={ShuffleIcon} size={18} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={previousTrack}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b2b2be] transition hover:text-white hover:scale-110 active:scale-90"
              aria-label="Titre précédent"
            >
              <HugeiconsIcon icon={PreviousIcon} size={20} strokeWidth={2} />
            </button>

            {/* Custom squircle Play/Pause button from design */}
            <button
              type="button"
              onClick={isPlaying ? pause : play}
              aria-label={isPlaying ? "Pause" : "Lire"}
              className="audiva-player-play-toggle group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#76eee9] text-[#071523] border border-[#a6f6ef]/45 shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition duration-200 active:scale-95"
              style={{ backgroundColor: "#76eee9", color: "#071523", borderColor: "#a6f6ef" }}
            >
              {isPlaying ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span aria-hidden="true" className="rounded-full" style={{ width: 4, height: 17, flex: "0 0 4px", backgroundColor: "#071523" }} />
                  <span aria-hidden="true" className="rounded-full" style={{ width: 4, height: 17, flex: "0 0 4px", backgroundColor: "#071523" }} />
                </span>
              ) : (
                <HugeiconsIcon icon={PlayIcon} size={20} fill="#071523" className="ml-0.5 text-[#071523]" style={{ color: "#071523", fill: "#071523" }} />
              )}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b2b2be] transition hover:text-white hover:scale-110 active:scale-90"
              aria-label="Titre suivant"
            >
              <HugeiconsIcon icon={NextIcon} size={20} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={cycleRepeatMode}
              aria-label={`Répétition : ${repeatMode}`}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full transition hover:text-white active:scale-95 ${
                repeatMode !== "off" ? "text-[#a6f6ef]" : "text-[#8c8d99]"
              }`}
              title={`Répétition : ${repeatMode}`}
            >
              <HugeiconsIcon icon={RepeatIcon} size={18} strokeWidth={2} />
              {repeatMode === "track" && <span className="absolute -right-0.5 top-0.5 text-[9px] font-bold">1</span>}
            </button>
          </div>

          {/* Progress Row: [ 0:32 ] [================== ElasticSlider ==================] [ -2:27 ] */}
          <PlayerProgress audioRef={audioRef} />
        </div>

        {/* Right: Volume & Utilities */}
        <div className="flex items-center justify-end gap-3 sm:w-[260px] lg:w-[280px] shrink-0 text-[#8c8d99]">
          <button type="button" onClick={chooseAudioOutput} className={`audiva-output-button ${outputName && bluetoothOutputPattern.test(outputName) ? "audiva-output-button--connected" : ""}`} aria-label={outputError || (outputName ? `Sortie audio : ${outputName}. Cliquer pour changer` : "Choisir une sortie audio ou Bluetooth")} title={outputError || outputName || "Choisir une sortie audio / Bluetooth"}>
            <HugeiconsIcon icon={outputName && bluetoothOutputPattern.test(outputName) ? BluetoothIcon : BluetoothNotConnectedIcon} size={18} />
            {outputName && <span>{outputName}</span>}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#8c8d99] hover:text-white transition active:scale-90"
              aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
            >
              <HugeiconsIcon icon={isMuted ? VolumeMute01Icon : VolumeLowIcon} size={18} strokeWidth={1.8} />
            </button>
            <div className="w-20 lg:w-28">
              <ElasticSlider
                ariaLabel="Volume"
                value={isMuted ? 0 : volume}
                startingValue={0}
                maxValue={1}
                stepSize={0.01}
                leftIcon={null}
                rightIcon={null}
                valuePosition="bubble"
                formatValue={(value) => `${Math.round(value * 100)}%`}
                jumpToClick
                thumb
                thickness={4}
                activeThickness={7}
                rangeColor="#76eee9"
                trackColor="rgba(255, 255, 255, 0.14)"
                className="w-full"
                style={{ width: "100%" }}
                onChange={(val) => setVolume(val)}
              />
            </div>
            <span className="w-9 text-right text-[10px] font-semibold tabular-nums text-[#91a0bd]">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            <button
              type="button"
              onClick={() => setVolume(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#8c8d99] hover:text-white transition active:scale-90"
              aria-label="Volume maximum"
            >
              <HugeiconsIcon icon={VolumeHighIcon} size={18} strokeWidth={1.8} />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-white/10 mx-1" />

          <button
            type="button"
            onClick={toggleLyrics}
            aria-pressed={lyricsOpen}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:text-white active:scale-90 ${
              lyricsOpen ? "bg-white/10 text-[#a6f6ef]" : "hover:bg-white/5"
            }`}
            aria-label="Afficher les paroles"
            title="Paroles"
          >
            <HugeiconsIcon icon={Mic01Icon} size={18} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={toggleQueue}
            aria-pressed={queueOpen}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:text-white active:scale-90 ${
              queueOpen ? "bg-white/10 text-[#a6f6ef]" : "hover:bg-white/5"
            }`}
            aria-label="File d’attente"
            title="File d'attente"
          >
            <HugeiconsIcon icon={Queue01Icon} size={18} strokeWidth={2} />
          </button>

          <button type="button" onClick={togglePlayerStyle} aria-pressed={playerStyle === "apple"} title={`Style ${playerStyle === "apple" ? "Apple" : "Audiva"} — cliquer pour changer`} className="audiva-player-style-button">
            {playerStyle === "apple" ? "Apple" : "Audiva"}
          </button>

          <button
            type="button"
            onClick={() => setPlayerVisible(false)}
            aria-label="Fermer le lecteur"
            title="Fermer le lecteur"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8c8d99] transition hover:bg-rose-400/15 hover:text-rose-300 active:scale-90"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden flex flex-col gap-2">
        <PlayerProgress audioRef={audioRef} mobile />

        <div className="flex items-center gap-3 px-1 text-[#91a0bd]" aria-label="Volume mobile">
          <button type="button" onClick={toggleMute} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-white/10" aria-label={isMuted ? "Réactiver le son" : "Couper le son"}><HugeiconsIcon icon={isMuted ? VolumeMute01Icon : VolumeLowIcon} size={17} /></button>
          <ElasticSlider ariaLabel="Volume" value={isMuted ? 0 : volume} startingValue={0} maxValue={1} stepSize={0.01} leftIcon={null} rightIcon={null} valuePosition="bubble" formatValue={(value) => `${Math.round(value * 100)}%`} jumpToClick thumb thickness={4} activeThickness={7} rangeColor="#76eee9" trackColor="rgba(255,255,255,.14)" className="w-full" style={{ width: "100%" }} onChange={setVolume} />
          <span className="w-9 shrink-0 text-right text-[10px] font-semibold tabular-nums">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
          <button type="button" onClick={chooseAudioOutput} className={`audiva-output-button audiva-output-button--mobile ${outputName && bluetoothOutputPattern.test(outputName) ? "audiva-output-button--connected" : ""}`} aria-label={outputError || (outputName ? `Sortie audio : ${outputName}. Cliquer pour changer` : "Choisir une sortie audio ou Bluetooth")} title={outputError || outputName || "Choisir une sortie audio / Bluetooth"}><HugeiconsIcon icon={outputName && bluetoothOutputPattern.test(outputName) ? BluetoothIcon : BluetoothNotConnectedIcon} size={18} />{outputName && <span>{outputName}</span>}</button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Link href="/lecteur" className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-sm">
              <PochetteImage unoptimized src={cover} alt={track.title} fill sizes="44px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{track.title}</p>
              <p className="truncate text-[11px] font-medium text-[#8c8d99]">{track.artist}</p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={previousTrack}
              className="flex h-8 w-8 items-center justify-center text-[#b2b2be] active:scale-90"
              aria-label="Titre précédent"
            >
              <HugeiconsIcon icon={PreviousIcon} size={18} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={isPlaying ? pause : play}
              aria-label={isPlaying ? "Pause" : "Lire"}
              className="audiva-player-play-toggle flex h-10 w-10 items-center justify-center rounded-2xl bg-[#76eee9] text-[#071523] border border-[#a6f6ef]/45 shadow-[0_4px_12px_rgba(0,0,0,0.25)] active:scale-95"
              style={{ backgroundColor: "#76eee9", color: "#071523", borderColor: "#a6f6ef" }}
            >
              {isPlaying ? (
                <span className="flex items-center justify-center gap-1">
                  <span aria-hidden="true" className="rounded-full" style={{ width: 3, height: 16, flex: "0 0 3px", backgroundColor: "#071523" }} />
                  <span aria-hidden="true" className="rounded-full" style={{ width: 3, height: 16, flex: "0 0 3px", backgroundColor: "#071523" }} />
                </span>
              ) : (
                <HugeiconsIcon icon={PlayIcon} size={18} fill="#071523" className="ml-0.5 text-[#071523]" style={{ color: "#071523", fill: "#071523" }} />
              )}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="flex h-8 w-8 items-center justify-center text-[#b2b2be] active:scale-90"
              aria-label="Titre suivant"
            >
              <HugeiconsIcon icon={NextIcon} size={18} strokeWidth={2} />
            </button>

            <button type="button" onClick={togglePlayerStyle} aria-pressed={playerStyle === "apple"} title={`Style ${playerStyle === "apple" ? "Apple" : "Audiva"} — cliquer pour changer`} className="audiva-player-style-button audiva-player-style-button--mobile">
              {playerStyle === "apple" ? "Apple" : "Audiva"}
            </button>

            <button
              type="button"
              onClick={() => setPlayerVisible(false)}
              aria-label="Fermer le lecteur"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8c8d99] hover:text-rose-300"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </footer>
    )}</>}</>;
}

function PlayerProgress({ audioRef, mobile = false }) {
  const currentTime = useLecteurStore((state) => state.currentTime);
  const duration = useLecteurStore((state) => state.duration);
  const seek = useLecteurStore((state) => state.seek);
  const formatTime = (value = 0) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
  const seekTo = (value) => {
    const track = useLecteurStore.getState().currentTrack;
    if (isLocalTrack(track) && audioRef.current && Number.isFinite(audioRef.current.duration)) audioRef.current.currentTime = value;
    seek(value);
  };
  return <div className={`flex w-full items-center ${mobile ? "gap-2.5" : "gap-3"}`}>
    <span className={`${mobile ? "text-[10px]" : "w-10 text-[11px] text-right"} font-semibold tabular-nums text-[#8c8d99] shrink-0`}>{formatTime(currentTime)}</span>
    <div className="flex-1 min-w-0"><ElasticSlider ariaLabel="Progression du morceau" value={currentTime} startingValue={0} maxValue={duration || 100} stepSize={0.1} leftIcon={null} rightIcon={null} valuePosition="bubble" formatValue={formatTime} jumpToClick thumb thickness={mobile ? 4 : 5} activeThickness={mobile ? 7 : 9} rangeColor="#76eee9" trackColor="rgba(255, 255, 255, 0.14)" className="w-full" style={{ width: "100%" }} onChange={seekTo} onChangeEnd={seekTo} /></div>
    <span className={`${mobile ? "text-[10px]" : "w-10 text-[11px]"} text-left font-semibold tabular-nums text-[#8c8d99] shrink-0`}>{formatTime(duration)}</span>
  </div>;
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
        <div className="mt-6 flex items-center justify-between px-2"><p className="text-sm font-extrabold text-white">Musique suivante</p><span className="text-[10px] font-semibold text-[#a6f6ef]">Ajoutée manuellement</span></div>
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
      {listened.length ? <div className="space-y-0.5">{listened.map((item, index) => <QueueItem key={`${item.id}-recent-${index}`} item={item} onPlay={() => onPlay(item)} compact />)}</div> : <div className="mx-2 mt-2 flex flex-col items-center border border-dashed border-white/12 bg-white/[.025] px-6 py-12 text-center"><HugeiconsIcon icon={Clock01Icon} size={26} className="text-[#a6f6ef]" /><p className="mt-3 text-sm font-bold">Votre historique est vide</p><p className="mt-1 text-xs leading-5 text-[#9ca7bd]">Les titres écoutés pendant cette session apparaîtront ici.</p></div>}
    </div>
  );
}

function QueueItem({ item, isCurrent = false, compact = false, onPlay, onRemove, onPlayNext, onLike, onLyrics, onNavigate, onNotice, onMoveUp, onMoveDown, canMoveUp, canMoveDown, draggable = false, isDropTarget = false, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  if (!item) return null;
  const duration = typeof item.duration === "number" ? `${Math.floor(item.duration / 60)}:${String(Math.floor(item.duration % 60)).padStart(2, "0")}` : item.duration;
  const cover = item.cover || item.image || "/placeholders/audio-cover.svg";

  return (
    <article draggable={draggable} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; onDragStart?.(); }} onDragOver={onDragOver} onDrop={(event) => { event.preventDefault(); onDrop?.(); }} onDragEnd={onDragEnd} className={`group relative mt-2 flex items-center gap-3 px-2 py-2 transition ${isCurrent ? "bg-[#101b2d]" : "hover:bg-white/[.065]"} ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${isDropTarget ? "border-t-2 border-[#a6f6ef]" : ""}`}>
      <button type="button" onClick={onPlay} className="relative h-12 w-12 shrink-0 overflow-hidden text-left" aria-label={`Lire ${item.title}`}>
        <PochetteImage unoptimized src={cover} alt="" fill sizes="48px" className="object-cover" />
        <span className={`absolute inset-0 grid place-items-center bg-black/45 transition ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}><HugeiconsIcon icon={PlayIcon} size={19} fill="currentColor" className="text-white" /></span>
      </button>
      <button type="button" onClick={onPlay} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-sm font-bold ${isCurrent ? "text-[#a6f6ef]" : "text-white"}`}>{item.title}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-[#aeb7c9]">{item.artist}</p>
        {!compact && duration ? <p className="mt-1 text-[10px] font-semibold text-[#6f7c95]">{duration}</p> : null}
      </button>
      {isCurrent ? <span className="flex h-5 items-end gap-[2px] px-1" aria-label="En lecture"><i className="h-2 w-[2px] animate-pulse bg-[#a6f6ef]" /><i className="h-4 w-[2px] animate-pulse bg-[#a6f6ef] [animation-delay:120ms]" /><i className="h-3 w-[2px] animate-pulse bg-[#a6f6ef] [animation-delay:240ms]" /></span> : null}
      {!compact ? <div className="relative flex items-center gap-0.5"><button type="button" disabled={!canMoveUp} onClick={() => onMoveUp?.()} className="grid h-7 w-6 place-items-center text-white/45 opacity-0 transition hover:bg-white/10 hover:text-[#a6f6ef] group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0" aria-label={`Monter ${item.title}`}><HugeiconsIcon icon={ArrowUp01Icon} size={16} strokeWidth={2.4} /></button><button type="button" disabled={!canMoveDown} onClick={() => onMoveDown?.()} className="grid h-7 w-6 place-items-center text-white/45 opacity-0 transition hover:bg-white/10 hover:text-[#a6f6ef] group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0" aria-label={`Descendre ${item.title}`}><HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2.4} /></button><button type="button" onClick={() => setActionsOpen((open) => !open)} className="grid h-8 w-8 place-items-center text-white/55 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100" aria-label={`Options pour ${item.title}`}><HugeiconsIcon icon={MoreHorizontalIcon} size={20} strokeWidth={2.4} /></button>{actionsOpen ? <TrackContextMenu item={item} onClose={() => setActionsOpen(false)} onRemove={onRemove} onPlayNext={onPlayNext} onLike={onLike} onLyrics={onLyrics} onNavigate={onNavigate} onNotice={onNotice} /> : null}</div> : null}
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
    <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[.15em] text-[#a6f6ef]">Actions Audiva</p>
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
