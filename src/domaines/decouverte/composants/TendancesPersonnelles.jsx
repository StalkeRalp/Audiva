"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Album01Icon, ArrowLeft01Icon, Clock01Icon, FireIcon, FavouriteIcon, MusicNote01Icon, PlayIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { PochetteImage } from "@/composants/ui/PochetteImage";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { usePlaylistsStore } from "@/domaines/playlists/stores/playlistsStore";
import { useIntelligenceStore } from "@/domaines/statistiques/stores/intelligenceStore";
import { canonical, summarize } from "@/domaines/statistiques/services/history";
import { connectSpotify, hasSpotifySession, spotifyItem, spotifyRequest } from "@/domaines/statistiques/services/spotify";
import { ArtistPhoto, useArtistPhotoCache } from "@/domaines/statistiques/composants/ArtistPhotos";
import { artistPhotoKey } from "@/domaines/statistiques/services/artistPhotos";
import { useAccueil } from "@/domaines/accueil/hooks/useAccueil";
import "./tendances.css";

const choices = [{ id: "7", label: "7 jours", days: 7 }, { id: "30", label: "30 jours", days: 30 }, { id: "90", label: "3 mois", days: 90 }, { id: "365", label: "12 mois", days: 365 }, { id: "all", label: "Depuis toujours", days: null }];
const duration = seconds => seconds >= 3600 ? `${Math.floor(seconds / 3600)} h ${Math.floor(seconds % 3600 / 60)} min` : `${Math.floor(seconds / 60)} min`;
const validPlays = rows => rows.filter(play => Number.isFinite(play.start));

function topAlbums(tracks) {
  const albums = new Map();
  tracks.filter(track => track.album && !/inconnu/i.test(track.album)).forEach(track => {
    const id = `${canonical(track.album)}:${canonical(track.artist)}`;
    const album = albums.get(id) || { id, title: track.album, artist: track.artist, cover: track.cover, count: 0, seconds: 0, tracks: 0 };
    album.count += track.count;
    album.seconds += track.seconds;
    album.tracks += 1;
    album.cover ||= track.cover;
    albums.set(id, album);
  });
  return [...albums.values()].sort((a, b) => b.seconds - a.seconds || b.count - a.count);
}

function getWeekdays(rows) {
  const values = Array(7).fill(0);
  rows.forEach(play => { values[(new Date(play.start).getDay() + 6) % 7] += play.seconds; });
  return values;
}

export default function TendancesPersonnelles() {
  const plays = useIntelligenceStore(state => state.plays);
  const ready = useIntelligenceStore(state => state.ready);
  const error = useIntelligenceStore(state => state.error);
  const hydrate = useIntelligenceStore(state => state.hydrate);
  const localTracks = useBibliothequeStore(state => state.tracks);
  const likedTracks = useLecteurStore(state => state.likedTracks);
  const playlists = usePlaylistsStore(state => state.playlists);
  const catalogue = useAccueil();
  const { photos } = useArtistPhotoCache();
  const [periodId, setPeriodId] = useState("30");
  const [now, setNow] = useState(0);
  const [bannerMood, setBannerMood] = useState(0);
  const [spotifyExtra, setSpotifyExtra] = useState({ connected: false, loading: false, error: "", profile: null, ranges: {}, savedTracks: [], savedAlbums: [], followedArtists: [] });
  const [spotifyRange, setSpotifyRange] = useState("short_term");
  const period = choices.find(choice => choice.id === periodId) || choices[1];

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { const timer = window.setInterval(() => setBannerMood(value => (value + 1) % 4), 16000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const timer = window.setTimeout(() => setNow(Date.now()), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    const controller = new AbortController();
    if (!hasSpotifySession()) return () => controller.abort();
    const load = async () => {
      setSpotifyExtra(current => ({ ...current, connected: true, loading: true, error: "" }));
      const paths = [
        "me/top/artists?limit=10&time_range=medium_term", "me/top/tracks?limit=10&time_range=medium_term",
        "me/top/artists?limit=10&time_range=long_term", "me/top/tracks?limit=10&time_range=long_term",
        "me/tracks?limit=12", "me/albums?limit=8", "me/following?type=artist&limit=12", "me",
      ];
      const results = await Promise.allSettled(paths.map(path => spotifyRequest(path, { signal: controller.signal })));
      if (controller.signal.aborted) return;
      const data = index => results[index].status === "fulfilled" ? results[index].value : {};
      const entries = index => data(index).items || [];
      const rawFollowed = data(6).artists?.items || [];
      setSpotifyExtra({
        connected: true, loading: false,
        error: results.some(result => result.status === "rejected") ? "Certaines données ne sont pas disponibles pour le moment. Actualisez la page ou reconnectez votre compte." : "",
        profile: data(7),
        ranges: {
          short_term: { artists: catalogue.artists.filter(item => item.provider === "spotify"), tracks: catalogue.tracks.filter(item => item.provider === "spotify") },
          medium_term: { artists: entries(0).map(item => ({ ...spotifyItem(item, "artists"), name: item.name })), tracks: entries(1).map(item => spotifyItem(item)) },
          long_term: { artists: entries(2).map(item => ({ ...spotifyItem(item, "artists"), name: item.name })), tracks: entries(3).map(item => spotifyItem(item)) },
        },
        savedTracks: entries(4).map(item => spotifyItem(item.track)).filter(item => item.providerId),
        savedAlbums: entries(5).map(item => ({ ...spotifyItem(item.album, "albums"), releaseDate: item.album?.release_date })).filter(item => item.providerId),
        followedArtists: rawFollowed.map(item => ({ ...spotifyItem(item, "artists"), name: item.name })),
      });
    };
    load().catch(error => { if (!controller.signal.aborted) setSpotifyExtra(current => ({ ...current, connected: true, loading: false, error: error.message })); });
    return () => controller.abort();
  }, [catalogue.artists, catalogue.tracks]);

  const { current, previous, rangeRows } = useMemo(() => {
    const end = now || plays.reduce((latest, play) => Math.max(latest, play.start || 0), 0) + 1;
    if (!period.days) {
      const rows = validPlays(plays);
      return { current: summarize(rows), previous: summarize([]), rangeRows: rows };
    }
    const span = period.days * 86400000;
    const start = end - span;
    const rangeRows = plays.filter(play => play.start >= start && play.start < end);
    const previousRows = plays.filter(play => play.start >= start - span && play.start < start);
    return { current: summarize(rangeRows), previous: summarize(previousRows), rangeRows };
  }, [plays, period.days, now]);

  const albums = useMemo(() => topAlbums(current.tracks), [current.tracks]);
  const spotifyArtists = catalogue.artists.filter(artist => artist.provider === "spotify").slice(0, 6);
  const spotifyTracks = catalogue.tracks.filter(track => track.provider === "spotify").slice(0, 6);
  const spotifyAlbums = catalogue.albums.filter(album => album.provider === "spotify").slice(0, 4);
  const weekdays = useMemo(() => getWeekdays(rangeRows), [rangeRows]);
  const topHour = current.hours.indexOf(Math.max(0, ...current.hours));
  const peakDay = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][weekdays.indexOf(Math.max(0, ...weekdays))];
  const maxWeekday = Math.max(1, ...weekdays);
  const maxGenre = Math.max(1, ...(current.genres || []).map(([, seconds]) => seconds));
  const libraryGenres = useMemo(() => {
    const map = new Map();
    localTracks.forEach(track => (Array.isArray(track.genre) ? track.genre : [track.genre]).filter(Boolean).forEach(genre => {
      const clean = String(genre).trim();
      if (clean && !/inconnu/i.test(clean)) map.set(clean, (map.get(clean) || 0) + 1);
    }));
    return [...map].sort((a, b) => b[1] - a[1]);
  }, [localTracks]);

  const playTrack = item => {
    const player = useLecteurStore.getState();
    const local = localTracks.find(track => track.id === item.id || track.title === item.title && track.artist === item.artist);
    const liked = likedTracks.find(track => track.id === item.id);
    const match = local || liked || player.queue.find(track => track.id === item.id || track.title === item.title && track.artist === item.artist) || item;
    player.setCurrentTrack(match);
    player.play();
  };
  const artistMovement = current.artists.map(artist => {
    const before = previous.artists.find(item => canonical(item.name) === canonical(artist.name));
    return { ...artist, previousCount: before?.count || 0, change: artist.count - (before?.count || 0) };
  }).sort((a, b) => b.change - a.change || b.count - a.count);
  const dailyBars = useMemo(() => {
    const map = new Map();
    rangeRows.forEach(play => {
      const date = new Date(play.start);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + play.seconds);
    });
    return [...map].sort(([a], [b]) => a.localeCompare(b)).slice(-30);
  }, [rangeRows]);
  const maxDaily = Math.max(1, ...dailyBars.map(([, seconds]) => seconds));

  return <main className="taste-trends">
    <header className={`taste-hero taste-hero--mood-${bannerMood}`}>
      <Link href="/decouverte" className="taste-back"><HugeiconsIcon icon={ArrowLeft01Icon} size={17} /> Découverte</Link>
      <div className="taste-hero-grid"><div><span className="taste-kicker"><HugeiconsIcon icon={FireIcon} size={15} /> VOS HABITUDES, EN MOUVEMENT</span><h1>Vos tendances<br /><em>musicales.</em></h1><p>Un portrait vivant de vos écoutes : les artistes, les styles, les albums et les moments qui comptent vraiment pour vous.</p></div>
        <div className="taste-periods" role="group" aria-label="Période des tendances">{choices.map(choice => <button key={choice.id} type="button" aria-pressed={periodId === choice.id} onClick={() => setPeriodId(choice.id)}>{choice.label}</button>)}</div>
      </div>
    </header>

    {!ready && <p className="taste-status" role="status">Chargement de votre historique d’écoute…</p>}
    {error && <p className="taste-status" role="status">{error}</p>}
    <section className="taste-metrics" aria-label="Résumé d’écoute">
      {[[current.count, "Écoutes retenues", MusicNote01Icon], [duration(current.seconds), "Temps passé à écouter", Clock01Icon], [current.artists.length, "Artistes écoutés", UserGroupIcon], [current.tracks.length, "Titres différents", Album01Icon]].map(([value, label, icon]) => <article key={label}><HugeiconsIcon icon={icon} size={19} /><small>{label}</small><strong>{value}</strong></article>)}
    </section>

    {!current.rows.length && !spotifyArtists.length && !spotifyTracks.length && !spotifyAlbums.length && !likedTracks.length && !localTracks.length && !catalogue.playlists.length ? <section className="taste-empty"><span><HugeiconsIcon icon={MusicNote01Icon} size={28} /></span><h2>Vos tendances commenceront avec vos écoutes.</h2><p>Importez des morceaux ou lancez vos titres dans Audiva. Les tendances reposent sur votre historique réel, sans classement inventé.</p><Link href="/bibliotheque">Ouvrir ma bibliothèque</Link></section> : <>
      <section className="taste-grid taste-overview">
        <article className="taste-panel taste-genres"><header><span>VOS STYLES</span><h2>Les genres qui reviennent</h2><p>Mesurés à partir des métadonnées de vos écoutes.</p></header>{current.genres.length ? current.genres.slice(0, 8).map(([genre, seconds], index) => <div className="taste-genre" key={genre}><span className="taste-genre-rank">{String(index + 1).padStart(2, "0")}</span><strong>{genre}</strong><div><i style={{ width: `${Math.max(4, seconds / maxGenre * 100)}%` }} /></div><small>{Math.round(seconds / Math.max(1, current.seconds) * 100)}%</small></div>) : <p className="taste-muted">Aucun genre renseigné dans les fichiers écoutés.</p>}{libraryGenres.length > 0 && <footer>Votre bibliothèque contient aussi : {libraryGenres.slice(0, 4).map(([genre]) => genre).join(" · ")}</footer>}</article>
        <article className="taste-panel taste-movement"><header><span>CE QUI MONTE</span><h2>Artistes en progression</h2><p>{period.days ? `Comparaison avec les ${period.days} jours précédents.` : "Vos artistes les plus écoutés depuis le début."}</p></header>{artistMovement.slice(0, 6).map((artist, index) => <Link className="taste-artist" href={`/artistes/${encodeURIComponent(artist.name)}`} key={artist.id}><span className="taste-genre-rank">{String(index + 1).padStart(2, "0")}</span><ArtistPhoto name={artist.name} photo={photos[artistPhotoKey(artist.name)]} className="taste-artist-portrait" compact/><span className="taste-artist-name"><strong>{artist.name}</strong><small>{artist.count} écoutes · {artist.tracks.size} titres</small></span><b className={artist.change > 0 ? "is-up" : ""}>{period.days ? artist.previousCount ? `${artist.change > 0 ? "+" : ""}${artist.change}` : "Nouveau" : duration(artist.seconds)}</b></Link>)}{!artistMovement.length && <p className="taste-muted">Les artistes apparaîtront après vos premières écoutes retenues.</p>}</article>
      </section>

      <section className="taste-grid taste-rankings">
        <article className="taste-panel"><header><span>VOTRE CLASSEMENT</span><h2>Titres les plus écoutés</h2></header>{current.tracks.slice(0, 8).map((track, index) => <div className="taste-track" key={track.id}><span className="taste-genre-rank">{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={track.cover} alt="" width={46} height={46} /><span className="taste-track-title"><strong>{track.title}</strong><small>{track.artist} · {track.album || "Album non renseigné"}</small></span><span className="taste-track-count">{track.count}<small>écoutes</small></span><button type="button" onClick={() => playTrack(track)} aria-label={`Écouter ${track.title}`}><HugeiconsIcon icon={PlayIcon} size={15} fill="currentColor" /></button></div>)}
          {!current.tracks.length && <p className="taste-muted">Aucun titre classé sur cette période.</p>}</article>
        <article className="taste-panel"><header><span>VOS ALBUMS</span><h2>Projets que vous retrouvez</h2></header>{albums.slice(0, 6).map((album, index) => <div className="taste-album" key={album.id}><span className="taste-genre-rank">{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={album.cover} alt="" width={48} height={48} /><span><strong>{album.title}</strong><small>{album.artist} · {album.tracks} titres écoutés</small></span><b>{duration(album.seconds)}</b></div>)}{!albums.length && <p className="taste-muted">Les albums apparaîtront quand vos écoutes contiendront ces informations.</p>}</article>
      </section>

      <section className="taste-grid taste-rhythm">
        <article className="taste-panel taste-daily"><header><span>RÉGULARITÉ</span><h2>Vos écoutes au fil du temps</h2><p>Temps d’écoute enregistré chaque jour.</p></header>{dailyBars.length ? <div className="taste-day-chart" aria-label="Écoutes par jour">{dailyBars.map(([day, seconds]) => <div key={day} title={`${day} · ${duration(seconds)}`}><i style={{ height: `${Math.max(3, seconds / maxDaily * 100)}%` }} /><small>{day.slice(8, 10)}</small></div>)}</div> : <p className="taste-muted">Aucune écoute enregistrée sur cette période.</p>}</article>
        <article className="taste-panel taste-rhythm-card"><header><span>VOTRE RYTHME</span><h2>Quand vous écoutez</h2></header><div className="taste-rhythm-stat"><span>Heure préférée</span><strong>{current.seconds ? `${String(topHour).padStart(2, "0")} h – ${String((topHour + 1) % 24).padStart(2, "0")} h` : "—"}</strong><small>{current.seconds ? duration(current.hours[topHour]) : "Pas encore de données"}</small></div><div className="taste-rhythm-stat"><span>Jour le plus actif</span><strong>{rangeRows.length ? peakDay : "—"}</strong><small>{rangeRows.length ? duration(Math.max(...weekdays)) : "Pas encore de données"}</small></div><div className="taste-rhythm-stat"><span>Relectures</span><strong>{current.repeated}</strong><small>titres déjà écoutés auparavant</small></div><div className="taste-weekdays">{weekdays.map((seconds, index) => <span key={index} title={`${["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][index]} · ${duration(seconds)}`} style={{ opacity: .2 + .8 * seconds / maxWeekday }}>{["L", "M", "M", "J", "V", "S", "D"][index]}</span>)}</div></article>
      </section>

      <section className="taste-panel taste-library-panel"><header><div><span>VOTRE UNIVERS</span><h2>Ce que vous gardez près de vous</h2><p>Favoris, playlists et bibliothèque complètent le portrait de vos goûts.</p></div><HugeiconsIcon icon={FavouriteIcon} size={20} /></header><div className="taste-library-summary"><Link href="/favoris"><strong>{likedTracks.length}</strong><span>Titres favoris</span></Link><Link href="/playlists"><strong>{catalogue.playlists.length || playlists.length}</strong><span>Playlists enregistrées</span></Link><Link href="/bibliotheque"><strong>{localTracks.length}</strong><span>Fichiers importés</span></Link><Link href="/statistiques"><strong>{current.sessions}</strong><span>Sessions d’écoute</span></Link></div>{likedTracks.length > 0 && <div className="taste-cover-shelf"><h3>Vos titres favoris</h3><div>{likedTracks.slice(0, 8).map(track => <button type="button" className="taste-cover-card" key={track.id} onClick={() => playTrack(track)}><PochetteImage unoptimized src={track.cover || track.image} alt="" width={160} height={160} /><strong>{track.title}</strong><small>{track.artist}</small><span><HugeiconsIcon icon={PlayIcon} size={17} fill="currentColor" /></span></button>)}</div></div>}{catalogue.playlists.length > 0 && <div className="taste-playlists">{catalogue.playlists.slice(0, 6).map(playlist => <Link href={`/playlists/${encodeURIComponent(playlist.id)}`} key={playlist.id}><PochetteImage unoptimized src={playlist.cover} alt="" width={48} height={48} /><span><strong>{playlist.title}</strong><small>{Array.isArray(playlist.tracks) ? playlist.tracks.length : playlist.tracks || 0} titres</small></span></Link>)}</div>}</section>

      <section className="taste-panel taste-connected-panel"><header><div><span>PROFIL CONNECTÉ</span><h2>{spotifyExtra.profile?.display_name ? `Le Spotify de ${spotifyExtra.profile.display_name}` : "Votre univers Spotify"}</h2><p>Top personnel sur un mois, six mois et un an environ; bibliothèque enregistrée, artistes suivis et playlists accessibles à votre compte.</p></div><button type="button" className="taste-spotify-badge" onClick={() => connectSpotify().catch(error => setSpotifyExtra(current => ({ ...current, error: error.message })))}>{spotifyExtra.connected ? "Actualiser les accès Spotify ↻" : "Connecter Spotify"}</button></header>{spotifyExtra.loading && <p className="taste-muted" role="status">Chargement de votre bibliothèque Spotify…</p>}{spotifyExtra.error && <p className="taste-status" role="status">{spotifyExtra.error}</p>}<div className="taste-range-tabs" role="group" aria-label="Période du top Spotify">{[["short_term", "4 semaines"], ["medium_term", "6 mois"], ["long_term", "1 an"]].map(([value, label]) => <button key={value} type="button" aria-pressed={spotifyRange === value} onClick={() => setSpotifyRange(value)}>{label}</button>)}</div><div className="taste-connected-grid taste-connected-visual">{(spotifyExtra.ranges[spotifyRange]?.artists || spotifyArtists).length > 0 && <div><h3>Artistes préférés</h3><div className="taste-artist-cards">{(spotifyExtra.ranges[spotifyRange]?.artists || spotifyArtists).slice(0, 8).map((artist, index) => <Link className="taste-artist-photo-card" href={`/artistes/${encodeURIComponent(`spotify:${artist.providerId}`)}`} key={artist.id}><span>{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={artist.cover || artist.image} alt="" width={150} height={150} /><strong>{artist.name || artist.title}</strong><small>{artist.genres?.slice(0, 2).join(" · ") || "Artiste de votre top"}</small></Link>)}</div></div>}{(spotifyExtra.ranges[spotifyRange]?.tracks || spotifyTracks).length > 0 && <div><h3>Titres les plus écoutés</h3>{(spotifyExtra.ranges[spotifyRange]?.tracks || spotifyTracks).slice(0, 8).map((track, index) => <div className="taste-spotify-track" key={track.id}><span>{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={track.cover} alt="" width={44} height={44} /><span><strong>{track.title}</strong><small>{track.artist}</small></span><button type="button" onClick={() => playTrack(track)} aria-label={`Écouter ${track.title} dans Audiva`}><HugeiconsIcon icon={PlayIcon} size={15} fill="currentColor" /></button></div>)}</div>}{spotifyExtra.followedArtists.length > 0 && <div><h3>Artistes que vous suivez</h3><div className="taste-followed-grid">{spotifyExtra.followedArtists.slice(0, 8).map(artist => <Link href={`/artistes/${encodeURIComponent(`spotify:${artist.providerId}`)}`} key={artist.id}><PochetteImage unoptimized src={artist.cover || artist.image} alt="" width={64} height={64} /><strong>{artist.name}</strong></Link>)}</div></div>}{spotifyExtra.savedTracks.length > 0 && <div><h3>Titres enregistrés dans Spotify</h3><div className="taste-saved-covers">{spotifyExtra.savedTracks.slice(0, 6).map(track => <button type="button" className="taste-cover-card" key={track.id} onClick={() => playTrack(track)}><PochetteImage unoptimized src={track.cover} alt="" width={130} height={130} /><strong>{track.title}</strong><small>{track.artist}</small><span><HugeiconsIcon icon={PlayIcon} size={16} fill="currentColor" /></span></button>)}</div></div>}{spotifyExtra.savedAlbums.length > 0 && <div><h3>Albums enregistrés</h3><div className="taste-saved-covers">{spotifyExtra.savedAlbums.slice(0, 6).map(album => <Link className="taste-cover-card" href={`/albums/${encodeURIComponent(`spotify:${album.providerId}`)}`} key={album.id}><PochetteImage unoptimized src={album.cover} alt="" width={130} height={130} /><strong>{album.title}</strong><small>{album.artist} · {album.releaseDate?.slice(0, 4) || "Spotify"}</small></Link>)}</div></div>}{spotifyAlbums.length > 0 && <div><h3>Albums déduits de vos écoutes récentes</h3>{spotifyAlbums.slice(0, 6).map((album, index) => <div className="taste-spotify-track" key={album.id}><span>{String(index + 1).padStart(2, "0")}</span><PochetteImage unoptimized src={album.cover} alt="" width={44} height={44} /><span><strong>{album.title}</strong><small>{album.artist}</small></span></div>)}</div>}</div>{catalogue.recent.filter(track => track.provider === "spotify").length > 0 && <div className="taste-recent-spotify"><h3>Écoutés récemment sur Spotify</h3><div className="taste-saved-covers">{catalogue.recent.filter(track => track.provider === "spotify").slice(0, 6).map(track => <button type="button" className="taste-cover-card" key={track.id} onClick={() => playTrack(track)}><PochetteImage unoptimized src={track.cover} alt="" width={130} height={130} /><strong>{track.title}</strong><small>{track.artist}</small><span><HugeiconsIcon icon={PlayIcon} size={16} fill="currentColor" /></span></button>)}</div></div>}<p className="taste-spotify-note">Spotify limite les données selon les accès acceptés, le compte et les règles de l’API. Les classements sont des affinités Spotify et ne représentent pas un nombre exact d’écoutes.</p></section>
    </>}
    <footer className="taste-footnote">Données calculées à partir de vos écoutes sur cet appareil. Elles restent personnelles et ne sont pas mélangées à un classement global.</footer>
  </main>;
}
