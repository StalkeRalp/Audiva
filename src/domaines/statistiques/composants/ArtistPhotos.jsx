"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { artistPhotoKey, findArtistPortrait, readArtistPhotos, saveArtistPhoto } from '../services/artistPhotos';

export function useArtistPhotoCache() {
  const [photos, setPhotos] = useState({});
  const cacheRef = useRef({});
  const pending = useRef(new Map());
  useEffect(() => {
    let active = true;
    readArtistPhotos().then(records => {
      if (active) {
        const cache = Object.fromEntries(records.map(record => [record.id, record]));
        cacheRef.current = cache;
        setPhotos(cache);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const save = useCallback(async record => {
    await saveArtistPhoto(record);
    cacheRef.current = { ...cacheRef.current, [record.id]: record };
    setPhotos(cacheRef.current);
  }, []);
  const refresh = useCallback(async (name, force = false) => {
    const id = artistPhotoKey(name);
    const current = cacheRef.current[id];
    if (!force && current && (current.status === 'pinterest-selected' || Date.now() - current.retrievedAt < 7 * 86400000)) return current;
    if (pending.current.has(id)) return pending.current.get(id);
    const task = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
        const record = await findArtistPortrait(name, controller.signal);
        try { await save(record); } catch {
          cacheRef.current = { ...cacheRef.current, [record.id]: record };
          setPhotos(cacheRef.current);
        }
        return record;
      } catch {
        return current || null;
      } finally {
        window.clearTimeout(timeout);
        pending.current.delete(id);
      }
    })();
    pending.current.set(id, task);
    return task;
  }, [save]);
  return { photos, save, refresh };
}

export function ArtistPhoto({ name, photo, className = '', compact = false }) {
  const [failedUrl, setFailedUrl] = useState('');
  const entries = photo?.pinterestPhotos?.length ? photo.pinterestPhotos : photo?.status === 'pinterest-selected' && photo.imageUrl ? [{ imageUrl: photo.imageUrl }] : [];
  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => {
    if (entries.length < 2) return undefined;
    const timer = window.setInterval(() => setPhotoIndex(index => (index + 1) % entries.length), 12000);
    return () => window.clearInterval(timer);
  }, [entries.length]);
  const imageUrl = entries[photoIndex % Math.max(1, entries.length)]?.imageUrl;
  return imageUrl && failedUrl !== imageUrl
    ? <Image unoptimized className={className} src={imageUrl} alt={`Portrait de ${name}`} width={600} height={600} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(imageUrl)} />
    : <div className={`${className} mi-avatar mi-artist-photo-fallback`} aria-label={`Photo indisponible pour ${name}`}>{name?.[0]?.toUpperCase()}<small>{compact ? '' : 'Portrait indisponible'}</small></div>;
}
