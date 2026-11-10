"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Album01Icon, ArrowLeft01Icon, PlayIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { PochetteImage } from "@/composants/ui/PochetteImage";
import ArtistBiography from "./ArtistBiography";
import { canonical } from "@/domaines/statistiques/services/history";
import { connectSpotify, spotifyItem, spotifyRequest } from "@/domaines/statistiques/services/spotify";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

const duration = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function SpotifyArtistPage({ artistId, artistName = "", libraryTracks = [] }) {
  const [state, setState] = useState({ loading: true, artist: null, tracks: [], albums: [], error: "" });
  const setQueue = useLecteurStore(player => player.setQueue);
  const setCurrentTrack = useLecteurStore(player => player.setCurrentTrack);
  const startPlayback = useLecteurStore(player => player.play);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      let resolvedId = artistId;
      if (!resolvedId && artistName) {
        const search = await spotifyRequest(`search?${new URLSearchParams({ q: artistName, type: "artist", limit: "10" })}`, { signal: controller.signal });
        const match = (search.artists?.items || []).find(item => canonical(item.name) === canonical(artistName));
        if (!match) throw new Error(`Aucun profil Spotify correspondant exactement à « ${artistName} » n’a été trouvé.`);
        resolvedId = match.id;
      }
      const results = await Promise.allSettled([
        spotifyRequest(`artists/${encodeURIComponent(resolvedId)}`, { signal: controller.signal }),
        spotifyRequest(`artists/${encodeURIComponent(resolvedId)}/top-tracks?market=from_token`, { signal: controller.signal }),
        spotifyRequest(`artists/${encodeURIComponent(resolvedId)}/albums?include_groups=album,single,compilation&limit=50&market=from_token`, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      const artistResult = results[0];
      if (artistResult.status === "rejected") {
        setState({ loading: false, artist: null, tracks: [], albums: [], error: artistResult.reason?.message || "Profil artiste indisponible." });
        return;
      }
      const tracks = results[1].status === "fulfilled" ? (results[1].value.tracks || []).map(track => spotifyItem(track)) : [];
      const albums = results[2].status === "fulfilled" ? [...new Map((results[2].value.items || []).filter(Boolean).map(album => [album.id, { ...spotifyItem(album, "albums"), trackCount: album.total_tracks, releaseDate: album.release_date }])).values()] : [];
      setState({ loading: false, artist: artistResult.value, tracks, albums, error: results.slice(1).some(result => result.status === "rejected") ? "Certaines listes Spotify sont indisponibles." : "" });
    };
    load().catch(error => { if (!controller.signal.aborted) setState({ loading: false, artist: null, tracks: [], albums: [], error: error.message || "Profil artiste indisponible." }); });
    return () => controller.abort();
  }, [artistId, artistName]);

  const play = track => {
    if (!track) return;
    const source = track.provider === "spotify" ? state.tracks : libraryTracks;
    setQueue(source.length ? source : [track], state.artist?.name || artistName || track.artist);
    setCurrentTrack(track);
    startPlayback();
  };

  if (state.loading) return <main className="artist-profile"><div className="artist-profile-loading" role="status">Chargement du profil artiste…</div></main>;
  if (!state.artist) return <main className="artist-profile">
    <Link className="artist-profile-back" href="/decouverte/tendances"><HugeiconsIcon icon={ArrowLeft01Icon} size={17} /> Retour aux tendances</Link>
    <header className="artist-profile-hero">
      <PochetteImage unoptimized src={libraryTracks[0]?.cover} alt="" width={240} height={240} className="artist-profile-portrait" />
      <div><span className="artist-profile-kicker">ARTISTE · VOTRE BIBLIOTHÈQUE</span><h1>{artistName || "Profil artiste"}</h1><p className="artist-profile-local-count">{libraryTracks.length} titre{libraryTracks.length === 1 ? "" : "s"} dans votre bibliothèque Audiva</p><button className="artist-profile-spotify" type="button" onClick={() => connectSpotify().catch(error => setState(current => ({ ...current, error: error.message })))}>Connecter Spotify pour les informations du profil</button></div>
    </header>
    <ArtistBiography artist={artistName} />
    {state.error && <p className="artist-profile-notice" role="status">{state.error}</p>}
    <section className="artist-profile-section"><header><div><span>VOTRE BIBLIOTHÈQUE</span><h2>Titres de {artistName}</h2></div><button type="button" disabled={!libraryTracks.length} onClick={() => play(libraryTracks[0])}><HugeiconsIcon icon={PlayIcon} size={16} fill="currentColor" /> Écouter</button></header>{libraryTracks.length ? <div className="artist-profile-tracks">{libraryTracks.map((track, index) => <button type="button" className="artist-profile-track" key={track.id} onClick={() => play(track)}><span className="artist-profile-index">{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={track.cover} alt="" width={48} height={48} /><span className="artist-profile-track-copy"><strong>{track.title}</strong><small>{track.album || artistName}</small></span><span className="artist-profile-track-duration">{duration(track.duration)}</span><HugeiconsIcon icon={PlayIcon} size={17} fill="currentColor" /></button>)}</div> : <p className="artist-profile-empty">Aucun fichier de cet artiste n’est encore importé dans votre bibliothèque.</p>}</section>
  </main>;

  const artist = state.artist;
  const spotifyUrl = artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`;
  return <main className="artist-profile">
    <Link className="artist-profile-back" href="/decouverte/tendances"><HugeiconsIcon icon={ArrowLeft01Icon} size={17} /> Retour aux tendances</Link>
    <header className="artist-profile-hero">
      <PochetteImage unoptimized src={artist.images?.[0]?.url} alt={`Portrait de ${artist.name}`} width={240} height={240} className="artist-profile-portrait" />
      <div><span className="artist-profile-kicker">ARTISTE · SPOTIFY</span><h1>{artist.name}</h1><div className="artist-profile-meta">{artist.followers?.total > 0 && <span><HugeiconsIcon icon={UserGroupIcon} size={15} /> {artist.followers.total.toLocaleString("fr-FR")} abonnés</span>}{artist.popularity != null && <span>Popularité Spotify · {artist.popularity}/100</span>}</div>{artist.genres?.length > 0 && <div className="artist-profile-genres">{artist.genres.map(genre => <span key={genre}>{genre}</span>)}</div>}<a className="artist-profile-spotify" href={spotifyUrl} target="_blank" rel="noreferrer">Voir le profil Spotify ↗</a></div>
    </header>

    {state.error && <p className="artist-profile-notice" role="status">{state.error}</p>}
    <ArtistBiography artist={artist.name} />

    <section className="artist-profile-section"><header><div><span>LES TITRES QUI VOUS ONT MENÉ ICI</span><h2>Morceaux populaires</h2></div><button type="button" disabled={!state.tracks.length} onClick={() => play(state.tracks[0])}><HugeiconsIcon icon={PlayIcon} size={16} fill="currentColor" /> Écouter</button></header>{state.tracks.length ? <div className="artist-profile-tracks">{state.tracks.map((track, index) => <button type="button" className="artist-profile-track" key={track.id} onClick={() => play(track)}><span className="artist-profile-index">{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={track.cover} alt="" width={48} height={48} /><span className="artist-profile-track-copy"><strong>{track.title}</strong><small>{track.album || artist.name}</small></span><span className="artist-profile-track-duration">{duration(track.duration)}</span><HugeiconsIcon icon={PlayIcon} size={17} fill="currentColor" /></button>)}</div> : <p className="artist-profile-empty">Aucun titre populaire fourni pour ce profil.</p>}</section>

    <section className="artist-profile-section"><header><div><span>DISCOGRAPHIE DISPONIBLE</span><h2>Albums et singles</h2></div><HugeiconsIcon icon={Album01Icon} size={20} /></header>{state.albums.length ? <div className="artist-profile-albums">{state.albums.map(album => <Link className="artist-profile-album" href={`/albums/${encodeURIComponent(`spotify:${album.providerId}`)}`} key={album.id}><PochetteImage unoptimized src={album.cover} alt="" width={160} height={160} /><strong>{album.title}</strong><small>{album.releaseDate?.slice(0, 4) || "Année inconnue"} · {album.trackCount || "—"} titres</small></Link>)}</div> : <p className="artist-profile-empty">Aucun album disponible pour le moment.</p>}</section>
    {libraryTracks.length > 0 && <section className="artist-profile-section"><header><div><span>VOTRE BIBLIOTHÈQUE AUDIVA</span><h2>Vos titres de {artist.name}</h2></div><button type="button" onClick={() => play(libraryTracks[0])}><HugeiconsIcon icon={PlayIcon} size={16} fill="currentColor" /> Écouter</button></header><div className="artist-profile-tracks">{libraryTracks.map((track, index) => <button type="button" className="artist-profile-track" key={track.id} onClick={() => play(track)}><span className="artist-profile-index">{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={track.cover} alt="" width={48} height={48} /><span className="artist-profile-track-copy"><strong>{track.title}</strong><small>{track.album || artist.name}</small></span><span className="artist-profile-track-duration">{duration(track.duration)}</span><HugeiconsIcon icon={PlayIcon} size={17} fill="currentColor" /></button>)}</div></section>}
    <footer className="artist-profile-attribution">Images, titres et discographie fournis par Spotify. La lecture reste dans le lecteur Audiva.</footer>
  </main>;
}
