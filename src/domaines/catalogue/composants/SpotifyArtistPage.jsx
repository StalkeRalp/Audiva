"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Album01Icon, ArrowLeft01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { PochetteImage } from "@/composants/ui/PochetteImage";
import ArtistBiography from "./ArtistBiography";
import { canonical } from "@/domaines/statistiques/services/history";
import { spotifyItem, spotifyRequest, spotifyRequestAll } from "@/domaines/statistiques/services/spotify";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

const duration = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const totalDuration = (tracks) => Math.round(tracks.reduce((sum, track) => sum + (Number(track.duration) || 0), 0));
const formatTotal = (seconds) => `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} min`;

export default function SpotifyArtistPage({ artistId, artistName = "", libraryTracks = [] }) {
  const [state, setState] = useState({ loading: true, artist: null, tracks: [], albums: [], error: "" });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      let resolvedId = artistId;
      if (!resolvedId && artistName) {
        const search = await spotifyRequest(`search?${new URLSearchParams({ q: artistName, type: "artist", limit: "10" })}`, { signal: controller.signal });
        const match = (search.artists?.items || []).find(item => canonical(item.name) === canonical(artistName));
        if (!match) throw new Error(`Aucun profil correspondant exactement à « ${artistName} » n’a été trouvé.`);
        resolvedId = match.id;
      }
      const results = await Promise.allSettled([
        spotifyRequest(`artists/${encodeURIComponent(resolvedId)}`, { signal: controller.signal }),
        spotifyRequestAll(`artists/${encodeURIComponent(resolvedId)}/albums?include_groups=album,single,compilation&limit=50&market=from_token`, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      const artistResult = results[0];
      if (artistResult.status === "rejected") {
        setState({ loading: false, artist: null, tracks: [], albums: [], error: artistResult.reason?.message || "Profil artiste indisponible." });
        return;
      }
      let tracks = [];
      let trackError = false;
      try {
        const search = await spotifyRequest(`search?${new URLSearchParams({ q: `artist:${artistResult.value.name}`, type: "track", limit: "10" })}`, { signal: controller.signal });
        tracks = (search.tracks?.items || []).filter(track => track.artists?.some(entry => canonical(entry.name) === canonical(artistResult.value.name))).map(track => spotifyItem(track));
      } catch {
        if (controller.signal.aborted) return;
        trackError = true;
      }
      const albums = results[1].status === "fulfilled" ? [...new Map((results[1].value.items || []).filter(Boolean).map(album => [album.id, { ...spotifyItem(album, "albums"), trackCount: album.total_tracks, releaseDate: album.release_date, albumType: album.album_type }])).values()] : [];
      setState({ loading: false, artist: artistResult.value, tracks, albums, error: trackError || results[1].status === "rejected" ? "Certaines listes Spotify sont indisponibles." : "" });
    };
    load().catch(error => { if (!controller.signal.aborted) setState({ loading: false, artist: null, tracks: [], albums: [], error: error.message || "Profil artiste indisponible." }); });
    return () => controller.abort();
  }, [artistId, artistName]);

  const play = (track, tracks = state.tracks.length ? state.tracks : libraryTracks, name = state.artist?.name || artistName) => {
    if (!track || !tracks.length) return;
    const player = useLecteurStore.getState();
    player.setQueue(tracks, `Titres de ${name || track.artist}`);
    player.setCurrentTrack(track);
    player.play();
  };

  if (state.loading) return <main className="artist-profile"><div className="artist-profile-loading" role="status">Chargement du profil artiste…</div></main>;

  if (!state.artist) {
    if (!artistName && !libraryTracks.length) return <main className="artist-profile">
      <Link className="artist-profile-back" href="/decouverte"><HugeiconsIcon icon={ArrowLeft01Icon} size={17} /> Retour à Découverte</Link>
      <section className="artist-profile-unavailable"><span className="artist-profile-kicker">FICHE ARTISTE</span><h1>Profil momentanément indisponible</h1><p>{state.error || "Les informations de cet artiste n’ont pas pu être chargées."}</p><Link href="/recherche">Rechercher un artiste dans Audiva</Link></section>
    </main>;

    return <main className="artist-profile">
      <Link className="artist-profile-back" href="/decouverte"><HugeiconsIcon icon={ArrowLeft01Icon} size={17} /> Retour à Découverte</Link>
      <header className="artist-profile-hero artist-profile-hero--local">
        <div className="artist-profile-portrait-wrap"><PochetteImage unoptimized src={libraryTracks[0]?.cover || "/placeholders/audio-cover.svg"} alt={`Pochette associée à ${artistName}`} width={250} height={250} className="artist-profile-portrait" /></div>
        <div className="artist-profile-hero-copy"><span className="artist-profile-kicker">ARTISTE · VOTRE BIBLIOTHÈQUE</span><h1>{artistName || "Profil artiste"}</h1><p className="artist-profile-subtitle">Votre collection Audiva, vos écoutes et les informations disponibles sur cet artiste.</p><div className="artist-profile-metrics"><div><strong>{libraryTracks.length}</strong><span>Titres dans Audiva</span></div><div><strong>{formatTotal(totalDuration(libraryTracks))}</strong><span>Durée de la sélection</span></div></div><button className="artist-profile-primary" type="button" disabled={!libraryTracks.length} onClick={() => play(libraryTracks[0], libraryTracks, artistName)}><HugeiconsIcon icon={PlayIcon} size={17} fill="currentColor" />Tout écouter dans Audiva</button></div>
      </header>
      <nav className="artist-profile-nav" aria-label="Sections de la fiche artiste"><a href="#artist-biography">Biographie</a><a href="#artist-tracks">Vos titres</a></nav>
      <section id="artist-biography"><ArtistBiography artist={artistName} description={libraryTracks.find(track => track.artistBio || track.biography || track.bio)?.artistBio || libraryTracks.find(track => track.artistBio || track.biography || track.bio)?.biography || libraryTracks.find(track => track.artistBio || track.biography || track.bio)?.bio || ""} /></section>
      <ArtistTracks tracks={libraryTracks} artistName={artistName} play={track => play(track, libraryTracks, artistName)} heading="Vos titres" eyebrow="VOTRE BIBLIOTHÈQUE AUDIVA" empty="Aucun fichier de cet artiste n’est encore importé dans votre bibliothèque." id="artist-tracks" />
      {state.error && <p className="artist-profile-notice" role="status">{state.error} Les titres importés restent accessibles ci-dessus.</p>}
    </main>;
  }

  const artist = state.artist;
  const artistTracks = state.tracks;
  return <main className="artist-profile">
    <Link className="artist-profile-back" href="/decouverte"><HugeiconsIcon icon={ArrowLeft01Icon} size={17} /> Retour à Découverte</Link>
    <header className="artist-profile-hero">
      <div className="artist-profile-portrait-wrap"><PochetteImage unoptimized src={artist.images?.[0]?.url || libraryTracks[0]?.cover || "/placeholders/audio-cover.svg"} alt={`Portrait de ${artist.name}`} width={260} height={260} className="artist-profile-portrait" /></div>
      <div className="artist-profile-hero-copy"><span className="artist-profile-kicker">ARTISTE · FICHE AUDIVA</span><h1>{artist.name}</h1><p className="artist-profile-subtitle">Biographie, titres disponibles et discographie réunis dans votre espace d’écoute.</p>
        {artist.genres?.length > 0 && <div className="artist-profile-genres" aria-label="Genres de l’artiste">{artist.genres.slice(0, 6).map(genre => <span key={genre}>{genre}</span>)}</div>}
        <div className="artist-profile-metrics"><div><strong>{artist.followers?.total > 0 ? new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(artist.followers.total) : "—"}</strong><span>Abonnés</span></div><div><strong>{artistTracks.length}</strong><span>Titres trouvés</span></div><div><strong>{state.albums.length}</strong><span>Albums & singles</span></div></div>
        <div className="artist-profile-hero-actions"><button className="artist-profile-primary" type="button" disabled={!artistTracks.length} onClick={() => play(artistTracks[0], artistTracks, artist.name)}><HugeiconsIcon icon={PlayIcon} size={17} fill="currentColor" />Écouter dans Audiva</button><a className="artist-profile-secondary" href="#artist-discography"><HugeiconsIcon icon={Album01Icon} size={17} />Voir la discographie</a></div>
      </div>
    </header>

    {state.error && <p className="artist-profile-notice" role="status">{state.error} Les autres sections restent disponibles.</p>}
    <nav className="artist-profile-nav" aria-label="Sections de la fiche artiste"><a href="#artist-biography">Biographie</a><a href="#artist-tracks">Titres trouvés</a><a href="#artist-discography">Discographie</a>{libraryTracks.length > 0 && <a href="#artist-library">Votre bibliothèque</a>}</nav>
    <section id="artist-biography"><ArtistBiography artist={artist.name} /></section>
    <ArtistTracks tracks={artistTracks} artistName={artist.name} play={track => play(track, artistTracks, artist.name)} heading="Titres trouvés" eyebrow="CATALOGUE SPOTIFY" empty="Aucun morceau Spotify disponible pour cet artiste." id="artist-tracks" />
    <section className="artist-profile-section" id="artist-discography"><header><div><span>ALBUMS, SINGLES ET COMPILATIONS</span><h2>Discographie</h2><p>Ouvrez une collection pour parcourir ses titres dans Audiva.</p></div><HugeiconsIcon icon={Album01Icon} size={22} /></header>{state.albums.length ? <div className="artist-profile-albums">{state.albums.map(album => <Link className="artist-profile-album" href={`/albums/${encodeURIComponent(`spotify:${album.providerId}`)}`} key={album.id}><PochetteImage unoptimized src={album.cover || "/placeholders/audio-cover.svg"} alt={`Pochette de ${album.title}`} width={200} height={200} /><span className="artist-profile-album-type">{album.albumType === "single" ? "Single" : album.albumType === "compilation" ? "Compilation" : "Album"}</span><strong>{album.title}</strong><small>{album.releaseDate?.slice(0, 4) || "Année inconnue"} · {album.trackCount || "—"} titres</small></Link>)}</div> : <p className="artist-profile-empty">Aucun album disponible pour le moment.</p>}</section>
    {libraryTracks.length > 0 && <ArtistTracks tracks={libraryTracks} artistName={artist.name} play={track => play(track, libraryTracks, artist.name)} heading={`Vos titres de ${artist.name}`} eyebrow="FICHIERS IMPORTÉS SUR CET APPAREIL" empty="Aucun titre importé." id="artist-library" />}
    <footer className="artist-profile-attribution">Les informations de catalogue et la discographie proviennent de Spotify. La lecture s’effectue dans le lecteur Audiva.</footer>
  </main>;
}

function ArtistTracks({ tracks, artistName, play, heading, eyebrow, empty, id }) {
  const orderedTracks = Array.isArray(tracks) ? tracks : [];
  return <section className="artist-profile-section" id={id}>
    <header><div><span>{eyebrow}</span><h2>{heading}</h2><p>{orderedTracks.length} titre{orderedTracks.length === 1 ? "" : "s"} · ordre de lecture continu</p></div><button type="button" disabled={!orderedTracks.length} onClick={() => play(orderedTracks[0])}><HugeiconsIcon icon={PlayIcon} size={16} fill="currentColor" />Tout écouter</button></header>
    {orderedTracks.length ? <div className="artist-profile-tracks">{orderedTracks.map((track, index) => <button type="button" className="artist-profile-track" key={track.id} onClick={() => play(track)}><span className="artist-profile-index">{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={track.cover || track.image || "/placeholders/audio-cover.svg"} alt="" width={52} height={52} /><span className="artist-profile-track-copy"><strong>{track.title}</strong><small>{track.album || artistName}</small></span><span className="artist-profile-track-duration">{duration(track.duration)}</span><HugeiconsIcon className="artist-profile-track-play" icon={PlayIcon} size={17} fill="currentColor" /></button>)}</div> : <p className="artist-profile-empty">{empty}</p>}
  </section>;
}
