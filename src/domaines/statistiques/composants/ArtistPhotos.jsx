"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { artistPhotoKey, readArtistPhotos, saveArtistPhoto } from '../services/artistPhotos';
import { canonical } from '../services/history';
import { spotifyRequest } from '../services/spotify';

async function findSpotifyArtistPortrait(name, signal) {
  const query = new URLSearchParams({ q: name, type: 'artist', limit: '10' });
  const result = await spotifyRequest(`search?${query}`, { signal });
  const artist = (result.artists?.items || []).find(item => canonical(item.name) === canonical(name));
  const image = artist?.images?.filter(item => item.url).sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  if (!artist || !image) return null;
  return {
    id: artistPhotoKey(name),
    name: artist.name,
    imageUrl: image.url,
    sourceUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
    source: 'Spotify',
    publishedAt: null,
    attribution: 'Spotify',
    retrievedAt: Date.now(),
    status: 'spotify-catalog',
  };
}

export function useArtistPhotoCache() {
  const [photos, setPhotos] = useState({});
  const [ready, setReady] = useState(false);
  const cacheRef = useRef({});
  const pending = useRef(new Map());
  useEffect(() => {
    let active = true;
    readArtistPhotos().then(records => {
      if (active) {
        const cache = { ...Object.fromEntries(records.map(record => [record.id, record])), ...cacheRef.current };
        cacheRef.current = cache;
        setPhotos(cache);
      }
    }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const save = useCallback(async record => {
    try { await saveArtistPhoto(record); } catch { /* Keep the portrait visible for this session if IndexedDB is unavailable. */ }
    cacheRef.current = { ...cacheRef.current, [record.id]: record };
    setPhotos(cacheRef.current);
  }, []);
  const refresh = useCallback(async (name, force = false) => {
    const id = artistPhotoKey(name);
    const current = cacheRef.current[id];
    const fresh = current?.retrievedAt && Date.now() - current.retrievedAt < 14 * 86400000;
    if (!force && current?.imageUrl && (current.status === 'user-selected' || current.status === 'pinterest-selected' || fresh)) return current;
    if (!ready) return current || null;
    if (pending.current.has(id)) return pending.current.get(id);
    const task = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const record = await findSpotifyArtistPortrait(name, controller.signal);
        if (record) await save(record);
        return record || current || null;
      } catch {
        return current || null;
      } finally {
        window.clearTimeout(timeout);
        pending.current.delete(id);
      }
    })();
    pending.current.set(id, task);
    return task;
  }, [ready, save]);
  return { photos, save, ready, refresh };
}

export function ArtistPhoto({ name, photo, className = '', compact = false }) {
  const [failedUrl, setFailedUrl] = useState('');
  const entries = photo?.pinterestPhotos?.length ? photo.pinterestPhotos : photo?.imageUrl ? [{ imageUrl: photo.imageUrl }] : [];
  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => {
    if (entries.length < 2) return undefined;
    const timer = window.setInterval(() => setPhotoIndex(index => (index + 1) % entries.length), 12000);
    return () => window.clearInterval(timer);
  }, [entries.length]);
  const imageUrl = entries[photoIndex % Math.max(1, entries.length)]?.imageUrl;
  return imageUrl && failedUrl !== imageUrl
    ? <Image key={imageUrl} unoptimized className={className} src={imageUrl} alt={`Portrait de ${name}`} width={600} height={600} loading="lazy" onError={() => setFailedUrl(imageUrl)} />
    : <div className={`${className} mi-avatar mi-artist-photo-fallback`} aria-label={`Photo indisponible pour ${name}`}>{name?.[0]?.toUpperCase()}<small>{compact ? '' : 'Portrait indisponible'}</small></div>;
}
