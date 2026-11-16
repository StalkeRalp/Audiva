"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, DeviceAccessIcon } from "@hugeicons/core-free-icons";
import { connectSpotify, hasSpotifySession, spotifyRequest } from "@/domaines/statistiques/services/spotify";

const deviceName = device => String(device?.name || "Appareil Spotify").trim();

export default function SpotifyDevicePicker({ open, anchor, onClose, onNotice, onSelectDevice }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState("");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 72 });
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const placePanel = () => {
      const panel = panelRef.current;
      const margin = 12;
      const width = Math.min(360, window.innerWidth - margin * 2);
      const height = panel?.getBoundingClientRect().height || Math.min(390, window.innerHeight * 0.72);
      const anchorLeft = anchor?.left ?? window.innerWidth / 2;
      const anchorTop = anchor?.top ?? 72;
      const anchorBottom = anchor?.bottom ?? anchorTop;
      const left = Math.max(margin, Math.min(window.innerWidth - width - margin, anchorLeft + ((anchor?.width || 0) - width) / 2));
      const below = anchorBottom + 8;
      const top = below + height <= window.innerHeight - margin
        ? below
        : Math.max(margin, anchorTop - height - 8);
      setPosition({ left, top });
    };
    placePanel();
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open, anchor]);

  const refresh = useCallback(async () => {
    if (!hasSpotifySession()) {
      setConnected(false);
      setDevices([]);
      setError("Connectez Spotify à Audiva pour afficher vos appareils.");
      return;
    }
    setConnected(true);
    setLoading(true);
    setError("");
    try {
      const result = await spotifyRequest("me/player/devices");
      setDevices((result.devices || []).slice().sort((a, b) => Number(b.is_active) - Number(a.is_active) || deviceName(a).localeCompare(deviceName(b), "fr")));
    } catch (cause) {
      setError(cause?.message || "Impossible de récupérer les appareils Spotify.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => refresh(), 0);
    const onKeyDown = event => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", onKeyDown); };
  }, [open, refresh, onClose]);

  const selectDevice = async device => {
    if (!device.id || device.is_restricted || transferring) return;
    setTransferring(device.id);
    setError("");
    try {
      await spotifyRequest("me/player", { method: "PUT", body: { device_ids: [device.id], play: false } });
      setDevices(current => current.map(item => ({ ...item, is_active: item.id === device.id })));
      onSelectDevice?.(device.id, deviceName(device));
      onNotice(`Session Spotify transférée vers ${deviceName(device)}. Récupération du titre en cours…`);
      onClose();
    } catch (cause) {
      setError(cause?.message || "Spotify n’a pas pu transférer la lecture vers cet appareil.");
    } finally {
      setTransferring("");
    }
  };

  if (!open) return null;
  return <div className="spotify-devices-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panelRef} className="spotify-devices-dialog" style={{ left: position.left, top: position.top }} role="dialog" aria-modal="false" aria-labelledby="spotify-devices-title">
      <header className="spotify-devices-header">
        <div className="spotify-devices-brand"><HugeiconsIcon icon={DeviceAccessIcon} size={22} /><span>SPOTIFY CONNECT</span></div>
        <button type="button" onClick={onClose} aria-label="Fermer la liste des appareils" className="spotify-devices-close"><HugeiconsIcon icon={Cancel01Icon} size={19} /></button>
        <h2 id="spotify-devices-title">Vos appareils</h2>
        <p>Appareils Spotify Connect actuellement disponibles sur votre compte.</p>
      </header>
      <div className="spotify-devices-content">
        {error && <p role="alert" className="spotify-devices-error">{error}<button type="button" onClick={() => connectSpotify({ returnTo: `${window.location.pathname}${window.location.search}` }).catch(problem => setError(problem.message))}>{connected ? "Réassocier Spotify" : "Connecter Spotify"}</button></p>}
        {loading ? <p role="status" className="spotify-devices-empty">Recherche des appareils Spotify…</p>
          : devices.length ? <ul className="spotify-devices-list">{devices.map(device => <li key={device.id || `${device.name}-${device.type}`}>
            <button type="button" onClick={() => selectDevice(device)} disabled={!device.id || device.is_restricted || Boolean(transferring)} aria-current={device.is_active ? "true" : undefined}>
              <span className="spotify-device-icon"><HugeiconsIcon icon={DeviceAccessIcon} size={19} /></span>
              <span className="spotify-device-copy"><b>{deviceName(device)}</b><small>{String(device.type || "appareil").replaceAll("_", " ")}{device.is_restricted ? " · Commandes indisponibles" : ""}</small></span>
              {transferring === device.id ? <span className="spotify-device-status">Connexion…</span> : device.is_active ? <span className="spotify-device-status is-active">En cours</span> : <span className="spotify-device-status">Choisir</span>}
            </button>
          </li>)}</ul> : !error && <p role="status" className="spotify-devices-empty">Aucun appareil disponible pour le moment. Ouvrez Spotify sur un téléphone, un ordinateur, une enceinte ou une télévision, puis actualisez.</p>}
      </div>
      <footer className="spotify-devices-footer"><p>Spotify ne renvoie que les appareils détectés et disponibles maintenant. Certains modèles ne sont pas pris en charge par son API.</p><button type="button" onClick={refresh} disabled={loading || Boolean(transferring)}>{loading ? "Actualisation…" : "Actualiser la liste"}</button></footer>
    </section>
  </div>;
}
