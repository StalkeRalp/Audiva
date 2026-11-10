"use client";

import { useEffect, useMemo, useState } from "react";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { usePlaylistsStore } from "@/domaines/playlists/stores/playlistsStore";
import { useIntelligenceStore } from "@/domaines/statistiques/stores/intelligenceStore";
import { summarize, trackIdentity } from "@/domaines/statistiques/services/history";
import { spotifyRequest, spotifyItem, hasSpotifySession } from "@/domaines/statistiques/services/spotify";
import { localAlbumsFromTracks } from "@/domaines/decouverte/utilitaires/collections";

const real = track => track?.id && !/soundhelix\.com/i.test(track.streamUrl || "");
const unique = items => [...new Map(items.filter(real).map(item => [item.id, item])).values()];
const cover = item => item.cover || item.image || "/placeholders/audio-cover.svg";

export function useAccueil() {
  const local = useBibliothequeStore(s => s.tracks);
  const recent = useLecteurStore(s => s.recentTracks);
  const liked = useLecteurStore(s => s.likedTracks);
  const playlists = usePlaylistsStore(s => s.playlists);
  const plays = useIntelligenceStore(s => s.plays);
  const hydrate = useIntelligenceStore(s => s.hydrate);
  const [remote, setRemote] = useState({ tracks: [], artists: [], albums: [], playlists: [], recent: [] });
  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (!hasSpotifySession()) { setStatus({ loading: false, error: "" }); return; }
      const paths = ["me/top/tracks?limit=30&time_range=short_term", "me/top/artists?limit=12&time_range=short_term", "me/playlists?limit=12", "me/player/recently-played?limit=30"];
      const results = await Promise.allSettled(paths.map(path => spotifyRequest(path, { signal: controller.signal })));
      if (controller.signal.aborted) return;
      const items = index => results[index].status === "fulfilled" ? results[index].value.items || [] : [];
      const rawTracks = items(0);
      const albumTracks = [...rawTracks, ...items(3).map(p => p.track).filter(Boolean)];
      setRemote({
        tracks: rawTracks.map(t => spotifyItem(t)),
        artists: items(1).map(a => ({ ...spotifyItem(a, "artists"), name: a.name, followers: a.followers?.total })),
        albums: [...new Map(albumTracks.filter(t => t.album?.id).map(t => [t.album.id, { ...spotifyItem(t.album, "albums"), songs: albumTracks.filter(song => song.album?.id === t.album.id).map(song => spotifyItem(song)) }])).values()],
        playlists: items(2).filter(Boolean).map(p => ({ ...spotifyItem(p, "playlists"), description: p.description || "", tracks: p.tracks?.total || 0 })),
        recent: unique(items(3).filter(p => p.track).map(p => spotifyItem(p.track))),
      });
      setStatus({ loading: false, error: results.some(r => r.status === "rejected") ? "Certaines données Spotify sont indisponibles. Votre bibliothèque reste disponible." : "" });
    }
    load();
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  return useMemo(() => {
    const collection = unique([...local, ...liked, ...recent]);
    const byIdentity = new Map(collection.map(t => [trackIdentity(t), t]));
    const summary = summarize(plays.filter(p => real(p.track)));
    const ranked = summary.tracks.filter(t => t.count > 0).map(t => byIdentity.get(t.id) || { ...t, id: plays.find(p => p.trackKey === t.id)?.track.id || t.id });
    const tracks = unique([...remote.tracks, ...ranked, ...collection]).slice(0, 30);
    const albums = [...remote.albums, ...localAlbumsFromTracks(collection)];
    const localArtists = [...new Map(collection.filter(t => t.artist).map(t => [t.artist, { id: `local:${t.artist}`, name: t.artist, title: t.artist, image: cover(t), track: t }])).values()];
    const artists = [...remote.artists, ...localArtists.filter(a => !remote.artists.some(r => r.name === a.name))];
    const recentTracks = unique([...recent, ...remote.recent]);
    const recentAlbums = localAlbumsFromTracks(recentTracks).map(a => remote.albums.find(r => r.title === a.title && r.artist === a.artist) || a);
    const playlistCards = [...playlists.map(p => ({ ...p, songs: (p.tracks || []).map(t => local.find(l => l.id === t.id) || t).filter(real), tracks: (p.tracks || []).length, updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("fr-FR") : "Votre bibliothèque" })), ...remote.playlists];
    const slides = tracks.slice(0, 4).map(t => ({ id: t.id, image: cover(t), overline: "Votre sélection personnelle", badge: t.provider === "spotify" ? "Votre top Spotify" : "Votre bibliothèque", title: t.title, artist: t.artist, description: t.album || "Votre musique dans Audiva", actionLabel: t.provider === "spotify" ? "Lire depuis Spotify" : "Écouter maintenant", gradient: "from-[#060b18] via-[#060b18]/65 to-transparent", track: t }));
    if (!slides.length) slides.push({ id: "empty", image: "/hero-recommandation.jpg", overline: "Bienvenue dans Audiva", badge: "Votre musique", title: "Votre univers musical", artist: "Tout commence par vos morceaux", description: "Importez votre musique ou connectez Spotify dans les paramètres de votre bibliothèque.", actionLabel: "Ouvrir ma bibliothèque", gradient: "from-[#060b18] via-[#060b18]/65 to-transparent" });
    return { ...status, slides, tracks, albums, artists, playlists: playlistCards, recent: recentTracks, recentAlbums, featured: tracks[0], topArtist: remote.artists[0]?.name || summary.artists[0]?.name || "—", topGenre: summary.genres[0]?.[0] || remote.artists[0]?.genres?.[0] || "—" };
  }, [local, recent, liked, playlists, plays, remote, status]);
}
