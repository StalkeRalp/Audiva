"use client";

import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, PlayIcon, RefreshIcon, SparklesIcon, ThumbsDownIcon } from "@hugeicons/core-free-icons";
import { PochetteImage } from "@/composants/ui/PochetteImage";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useIntelligenceStore } from "@/domaines/statistiques/stores/intelligenceStore";
import { connectSpotify, hasSpotifySession, searchSpotify } from "@/domaines/statistiques/services/spotify";
import "./personalizedDiscoveries.css";

const HIDDEN_KEY = "audiva-hidden-recommendations";
const normalize = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("fr-FR");
const trackArtist = track => track?.artist || track?.artists?.map?.(artist => artist.name).join(", ") || "";

function getTasteProfile({ artists, tracks, likedTracks, recentTracks, plays, localTracks }) {
  const artistScores = new Map();
  const genreScores = new Map();
  const addArtist = (name, score) => {
    const clean = String(name || "").trim();
    if (clean) artistScores.set(clean, (artistScores.get(clean) || 0) + score);
  };
  artists.forEach((artist, index) => {
    addArtist(artist.name || artist.title, 12 - index);
    (artist.genres || []).forEach(genre => genreScores.set(genre, (genreScores.get(genre) || 0) + 8 - index));
  });
  likedTracks.forEach(track => addArtist(trackArtist(track), 8));
  recentTracks.slice(0, 8).forEach((track, index) => addArtist(trackArtist(track), 6 - index * 0.4));
  plays.forEach(play => addArtist(trackArtist(play.track), Math.min(8, Math.max(1, Number(play.seconds) || 0) / 30)));
  localTracks.forEach(track => {
    addArtist(trackArtist(track), 1);
    const genre = track.genre || track.tags?.genre;
    if (genre) genreScores.set(genre, (genreScores.get(genre) || 0) + 1);
  });
  return {
    artists: [...artistScores].sort((a, b) => b[1] - a[1]).map(([name]) => name).slice(0, 4),
    genres: [...genreScores].sort((a, b) => b[1] - a[1]).map(([name]) => name).slice(0, 3),
  };
}

export default function PersonalizedDiscoveries({ artists = [], tracks = [], localTracks = [] }) {
  const likedTracks = useLecteurStore(state => state.likedTracks);
  const recentTracks = useLecteurStore(state => state.recentTracks);
  const plays = useIntelligenceStore(state => state.plays);
  const hydrateHistory = useIntelligenceStore(state => state.hydrate);
  const [recommendations, setRecommendations] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(() => {
    try { return typeof window === "undefined" ? [] : JSON.parse(window.localStorage.getItem(HIDDEN_KEY) || "[]"); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const profile = useMemo(() => getTasteProfile({ artists, tracks, likedTracks, recentTracks, plays, localTracks }), [artists, tracks, likedTracks, recentTracks, plays, localTracks]);
  const profileKey = useMemo(() => JSON.stringify(profile), [profile]);
  const stableProfile = useMemo(() => JSON.parse(profileKey), [profileKey]);
  const listenedIdsKey = useMemo(() => JSON.stringify([...new Set([...recentTracks.map(track => track.id), ...likedTracks.map(track => track.id), ...plays.map(play => play.track?.id)].filter(Boolean))]), [recentTracks, likedTracks, plays]);
  const localSuggestions = useMemo(() => {
    const listened = new Set(JSON.parse(listenedIdsKey));
    const artistOrder = new Map(stableProfile.artists.map((artist, index) => [normalize(artist), index]));
    const genreOrder = new Map(stableProfile.genres.map((genre, index) => [normalize(genre), index]));
    return [...localTracks].map(track => {
      const artistRank = artistOrder.get(normalize(trackArtist(track)));
      const genreRank = genreOrder.get(normalize(track.genre || track.tags?.genre));
      const unseen = !listened.has(track.id);
      return { track, score: (unseen ? 20 : 0) + (artistRank === undefined ? 0 : 8 - artistRank) + (genreRank === undefined ? 0 : 5 - genreRank) };
    }).filter(({ track }) => track?.id && !likedTracks.some(item => item.id === track.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ track }) => ({ ...track, recommendationReason: "À explorer dans votre bibliothèque" }));
  }, [localTracks, likedTracks, listenedIdsKey, stableProfile]);

  useEffect(() => { hydrateHistory(); }, [hydrateHistory]);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!hasSpotifySession()) {
        setRecommendations(localSuggestions.filter(item => !hiddenIds.includes(item.id)));
        setLoading(false);
        return;
      }
      const queries = [
        ...stableProfile.artists.slice(0, 2).map(name => ({ query: `artist:"${name.replaceAll('"', '')}"`, reason: `À partir de ${name}` })),
        ...stableProfile.genres.slice(0, 2).map(name => ({ query: `${name} music`, reason: `Dans la couleur ${name}` })),
      ].slice(0, 4);
      if (!queries.length) {
        setRecommendations([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotice("");
      try {
        const known = new Set([...tracks, ...likedTracks, ...recentTracks, ...localTracks].map(track => track.id));
        const results = await Promise.allSettled(queries.map(seed =>
          searchSpotify(seed.query, { type: "tracks", signal: controller.signal }).then(items =>
            items.map(item => ({ ...item, recommendationReason: seed.reason, recommendationSeed: seed.query })),
          ),
        ));
        if (controller.signal.aborted) return;
        const unique = new Map();
        results.forEach(result => {
          if (result.status !== "fulfilled") return;
          result.value.forEach(item => {
            const artistKey = normalize(trackArtist(item));
            if (known.has(item.id) || hiddenIds.includes(item.id) || !item.id || !artistKey || unique.has(item.id)) return;
            unique.set(item.id, item);
          });
        });
        setRecommendations([...unique.values(), ...localSuggestions.filter(item => !unique.has(item.id) && !hiddenIds.includes(item.id))].slice(0, 16));
        const failed = results.filter(result => result.status === "rejected");
        if (failed.length === results.length) setNotice(failed[0]?.reason?.message || "Les suggestions Spotify sont temporairement indisponibles.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load().catch(error => { if (!controller.signal.aborted) { setNotice(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [profileKey, stableProfile.artists, stableProfile.genres, refresh, tracks, likedTracks, recentTracks, localTracks, localSuggestions, hiddenIds]);

  const play = track => {
    const player = useLecteurStore.getState();
    player.setCurrentTrack(track);
    player.play();
  };
  const hide = track => {
    const next = [...new Set([...hiddenIds, track.id])];
    setHiddenIds(next);
    setRecommendations(items => items.filter(item => item.id !== track.id));
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(next.slice(-300))); } catch { /* Les préférences restent en mémoire. */ }
  };

  return <section className="personal-discoveries" aria-labelledby="personal-discoveries-title">
    <header><div><span><HugeiconsIcon icon={SparklesIcon} size={16} /> VOTRE SÉLECTION ÉVOLUE AVEC VOUS</span><h2 id="personal-discoveries-title">À découvrir selon vos goûts</h2><p>Basé sur vos titres favoris, vos écoutes récentes et vos artistes Spotify préférés.</p></div><button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading} aria-label="Actualiser les recommandations"><HugeiconsIcon icon={RefreshIcon} size={17} />{loading ? " Recherche…" : "Actualiser"}</button></header>
    {stableProfile.genres.length > 0 && <div className="personal-discoveries-taste">Vos couleurs musicales <div>{stableProfile.genres.map(genre => <span key={genre}>{genre}</span>)}</div></div>}
    {notice && <p className="personal-discoveries-notice" role="status">{notice}{!hasSpotifySession() && <button type="button" onClick={() => connectSpotify().catch(error => setNotice(error.message))}>Connecter Spotify</button>}</p>}
    {recommendations.length > 0 ? <div className="personal-discoveries-grid">{recommendations.map(track => { const liked = likedTracks.some(item => item.id === track.id); return <article key={track.id}><button type="button" className="personal-discoveries-cover" onClick={() => play(track)} aria-label={`Écouter ${track.title} dans Audiva`}><PochetteImage unoptimized src={track.cover} alt="" width={360} height={360} /><span><HugeiconsIcon icon={PlayIcon} size={20} fill="currentColor" /></span></button><div className="personal-discoveries-copy"><strong title={track.title}>{track.title}</strong><small title={track.artist}>{track.artist}</small><em>{track.recommendationReason}</em></div><button type="button" className="personal-discoveries-like" aria-pressed={liked} onClick={() => useLecteurStore.getState().toggleLike(track)} aria-label={liked ? `Retirer ${track.title} des favoris` : `Ajouter ${track.title} aux favoris`} title={liked ? "Retirer des favoris" : "J’aime ça"}><HugeiconsIcon icon={FavouriteIcon} size={16} fill={liked ? "currentColor" : "none"} /></button><button type="button" className="personal-discoveries-hide" onClick={() => hide(track)} aria-label={`Moins de recommandations comme ${track.title}`} title="Moins comme ça"><HugeiconsIcon icon={ThumbsDownIcon} size={16} /></button></article>; })}</div> : !loading && !notice && <p className="personal-discoveries-empty">{stableProfile.artists.length ? "Pas encore de nouveau titre trouvé à partir de vos goûts. Actualisez pour réessayer." : "Écoutez ou ajoutez quelques titres favoris pour personnaliser vos découvertes."}{!hasSpotifySession() && <button type="button" onClick={() => connectSpotify().catch(error => setNotice(error.message))}>Connecter Spotify</button>}</p>}
    <footer>Les suggestions utilisent le catalogue Spotify et, si besoin, les fichiers de votre bibliothèque. « Moins comme ça » masque un titre sur cet appareil.</footer>
  </section>;
}
