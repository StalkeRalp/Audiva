"use client";

import { PochetteImage } from "@/composants/ui/PochetteImage";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, MusicNote01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { usePlaylistsStore } from "@/domaines/playlists/stores/playlistsStore";
import { cacheFollowedSpotifyPlaylistSnapshot, readFollowedSpotifyPlaylists } from "@/domaines/statistiques/services/spotifyLibraryCache";
import { spotifyItem, spotifyRequestAll } from "@/domaines/statistiques/services/spotify";

export default function ShareContentModal({ isOpen, onClose, initialKind = "track", onShare }) {
  const savedTracks = useLecteurStore(state=>state.recentTracks);
  const currentTrack = useLecteurStore((state) => state.currentTrack);
  const playlists = usePlaylistsStore((state) => state.playlists);
  const [kindOverride, setKindOverride] = useState(null);
  const [sendError, setSendError] = useState("");
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [preparing, setPreparing] = useState(false);
  const kind = kindOverride || initialKind;
  const close = () => { setKindOverride(null); setSendError(""); onClose(); };
  const tracks = useMemo(() => {
    const byId = new Map(savedTracks.map(track=>[track.id,track]));
    if (currentTrack) byId.set(currentTrack.id, currentTrack);
    return [...byId.values()];
  }, [currentTrack,savedTracks]);
  useEffect(() => {
    const timer = window.setTimeout(() => setSpotifyPlaylists(readFollowedSpotifyPlaylists()), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;
  const trackSnapshot = (track) => ({
    id: track.id,
    localId: track.localId,
    provider: track.provider,
    providerId: track.providerId,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: Number(track.duration) || 0,
    cover: track.cover || track.image || "",
    mediaType: track.mediaType,
  });
  const choose = async (item) => {
    setPreparing(true);
    setSendError("");
    let playlistTracks = item.tracks || [];
    if (kind === "playlist" && item.provider === "spotify" && !playlistTracks.length) {
      try {
        const page = await spotifyRequestAll("playlists/" + encodeURIComponent(item.providerId) + "/items?limit=50&market=from_token", { maxPages: 10 });
        playlistTracks = (page.items || []).map(row => row.item || row.track || row).filter(track => track?.type === "track" && track.id).map(track => spotifyItem(track, "tracks"));
        if (playlistTracks.length) cacheFollowedSpotifyPlaylistSnapshot(item.providerId, null, playlistTracks);
      } catch (error) {
        setSendError(error?.message || "Impossible de charger les titres de cette playlist Spotify.");
        setPreparing(false);
        return;
      }
    }
    const count = playlistTracks.length || item.trackCount || 0;
    const shared = kind === "track"
      ? { kind: "track", id: item.id, title: item.title, subtitle: (item.artist || "Artiste inconnu") + " · " + (item.album || "Audiva"), cover: item.cover || item.image, track: trackSnapshot(item) }
      : { kind: "playlist", id: item.provider === "spotify" ? "spotify:" + item.providerId : item.id, title: item.title, subtitle: count + " morceau" + (count > 1 ? "x" : "") + " · " + (item.description || "Playlist Audiva"), cover: item.cover || item.image || "/hero-playlist.jpg", tracks: playlistTracks.map(trackSnapshot) };
    try {
      const sent = await onShare(shared);
      if (sent === false) { setSendError("Le partage n’a pas pu être envoyé. Réessayez."); setPreparing(false); return; }
    } catch (error) {
      setSendError(error?.message || "Le partage n’a pas pu être envoyé. Réessayez.");
      setPreparing(false);
      return;
    }
    setPreparing(false);
    close();
  };
  const items = kind === "track" ? tracks : [...playlists, ...spotifyPlaylists];

  return <div role="dialog" aria-modal="true" aria-labelledby="share-content-title" className="fixed inset-0 z-[100] grid place-items-center bg-[#02050d]/80 p-4 backdrop-blur-sm" onMouseDown={close}>
    <section onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl border border-white/12 bg-[#0d1527] p-5 shadow-2xl sm:p-6">
      <header className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#72eee7]">Partage Audiva</p><h2 id="share-content-title" className="mt-2 text-2xl font-black text-white">Que voulez-vous partager ?</h2><p className="mt-2 text-sm text-[#aebbd7]">Choisissez un morceau ou une playlist avant l’envoi.</p></div><button type="button" onClick={close} className="grid h-9 w-9 place-items-center text-[#b9c5d9] hover:bg-white/5" aria-label="Fermer"><HugeiconsIcon icon={Cancel01Icon} size={20} /></button></header>
      <div className="mt-6 grid grid-cols-2 gap-2"><button type="button" onClick={() => setKindOverride("track")} className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-extrabold transition ${kind === "track" ? "bg-[#72eee7] text-[#061426]" : "border border-white/12 text-[#cbd6ea] hover:bg-white/5"}`}><HugeiconsIcon icon={MusicNote01Icon} size={18} />Un morceau</button><button type="button" onClick={() => setKindOverride("playlist")} className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-extrabold transition ${kind === "playlist" ? "bg-[#72eee7] text-[#061426]" : "border border-white/12 text-[#cbd6ea] hover:bg-white/5"}`}><HugeiconsIcon icon={Share01Icon} size={18} />Une playlist</button></div>
      {preparing && <p role="status" className="mt-3 text-sm text-[#aebbd7]">Préparation du partage…</p>}{sendError && <p role="alert" className="mt-3 text-sm text-rose-300">{sendError}</p>}
      <div className="mt-4 max-h-[45dvh] space-y-2 overflow-y-auto pr-1">{items.length ? items.map((item) => <button type="button" key={item.id} onClick={() => choose(item)} disabled={preparing} className="flex w-full items-center gap-3 border border-transparent bg-[#07101e] p-3 text-left transition hover:border-[#72eee7]/45 hover:bg-[#10203a]"><span className="relative h-12 w-12 shrink-0 overflow-hidden bg-[#152444]"><PochetteImage src={item.cover || "/hero-playlist.jpg"} alt="" fill sizes="48px" className="object-cover" /></span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-white">{item.title}</b><span className="mt-1 block truncate text-xs text-[#91a0bd]">{kind === "track" ? `${item.artist} · ${item.album || "Audiva"}` : `${item.tracks?.length || item.trackCount || 0} morceau${(item.tracks?.length || item.trackCount || 0) > 1 ? "x" : ""} · ${item.provider === "spotify" ? "Spotify" : "Audiva"}`}</span></span><HugeiconsIcon icon={Share01Icon} size={18} className="text-[#72eee7]" /></button>) : <p className="border border-dashed border-white/15 px-4 py-10 text-center text-sm text-[#91a0bd]">Aucune playlist créée pour le moment.</p>}</div>
    </section>
  </div>;
}
