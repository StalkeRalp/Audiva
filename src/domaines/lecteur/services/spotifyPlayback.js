import { spotifyRequest } from "@/domaines/statistiques/services/spotify";

let spotifyPlayer = null;
let spotifyDeviceId = null;
let spotifyRemoteDeviceId = null;
let remoteDeviceLoaded = false;
let loadedSpotifyTrackId = null;
let queuedSeek = null;
let seekInFlight = false;
let remoteSeekTimer = 0;
let queuedRemoteSeek = null;

export function registerSpotifyPlayback(player, deviceId = null) {
  spotifyPlayer = player;
  spotifyDeviceId = deviceId;
  loadedSpotifyTrackId = null;
}

export function updateSpotifyPlaybackDevice(deviceId) {
  spotifyDeviceId = deviceId;
}

export function setSpotifyRemoteDevice(deviceId) {
  spotifyRemoteDeviceId = deviceId || null;
  remoteDeviceLoaded = true;
  try {
    if (spotifyRemoteDeviceId) window.localStorage.setItem("audiva-spotify-remote-device", spotifyRemoteDeviceId);
    else window.localStorage.removeItem("audiva-spotify-remote-device");
  } catch {}
}

export function getSpotifyRemoteDeviceId() {
  if (!remoteDeviceLoaded && typeof window !== "undefined") {
    remoteDeviceLoaded = true;
    try { spotifyRemoteDeviceId = window.localStorage.getItem("audiva-spotify-remote-device") || null; } catch {}
  }
  return spotifyRemoteDeviceId;
}

function remoteCommand(path, options) {
  return spotifyRequest(path, options).catch(error => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("audiva-spotify-remote-error", { detail: error?.message || "La commande Spotify a échoué." }));
  });
}

export function playSpotifyOnRemote(track, position = 0) {
  const deviceId = getSpotifyRemoteDeviceId();
  if (!deviceId || track?.provider !== "spotify" || !track.providerId) return false;
  const id = String(track.providerId).replace(/^spotify:(?:track|tracks):/i, "");
  if (!id || id.includes(":")) return false;
  const uri = track.uri?.startsWith("spotify:track:") ? track.uri : `spotify:track:${id}`;
  remoteCommand(`me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: "PUT",
    body: { uris: [uri], position_ms: Math.max(0, Math.floor((Number(position) || 0) * 1000)) },
  });
  return true;
}

export function pauseSpotifyRemote() {
  const deviceId = getSpotifyRemoteDeviceId();
  if (!deviceId) return false;
  remoteCommand(`me/player/pause?device_id=${encodeURIComponent(deviceId)}`, { method: "PUT" });
  return true;
}

export function resumeSpotifyRemote() {
  const deviceId = getSpotifyRemoteDeviceId();
  if (!deviceId) return false;
  remoteCommand(`me/player/play?device_id=${encodeURIComponent(deviceId)}`, { method: "PUT" });
  return true;
}

export function skipSpotifyRemote(direction) {
  const deviceId = getSpotifyRemoteDeviceId();
  if (!deviceId || !["next", "previous"].includes(direction)) return false;
  remoteCommand(`me/player/${direction}?device_id=${encodeURIComponent(deviceId)}`, { method: "POST" });
  return true;
}

export function setSpotifyRemoteVolume(volume) {
  const deviceId = getSpotifyRemoteDeviceId();
  if (!deviceId) return false;
  const percent = Math.max(0, Math.min(100, Math.round(Number(volume) * 100)));
  remoteCommand(`me/player/volume?volume_percent=${percent}&device_id=${encodeURIComponent(deviceId)}`, { method: "PUT" });
  return true;
}

export function clearSpotifyPlayback(player) {
  if (player && spotifyPlayer !== player) return;
  spotifyPlayer = null;
  spotifyDeviceId = null;
  loadedSpotifyTrackId = null;
  queuedSeek = null;
  queuedRemoteSeek = null;
  if (remoteSeekTimer) clearTimeout(remoteSeekTimer);
  remoteSeekTimer = 0;
  seekInFlight = false;
}

export function getSpotifyPlayback() {
  return { player: spotifyPlayer, deviceId: spotifyDeviceId, remoteDeviceId: getSpotifyRemoteDeviceId() };
}

export function activateSpotifyPlayback() {
  return spotifyPlayer?.activateElement?.() || Promise.resolve();
}

export function requestSpotifySeek(positionSeconds, trackId) {
  if (!trackId || !Number.isFinite(Number(positionSeconds))) return;
  const deviceId = getSpotifyRemoteDeviceId();
  if (deviceId) {
    queuedRemoteSeek = { deviceId, position: Math.max(0, Math.floor(Number(positionSeconds) * 1000)) };
    if (remoteSeekTimer) clearTimeout(remoteSeekTimer);
    remoteSeekTimer = setTimeout(() => {
      remoteSeekTimer = 0;
      const seek = queuedRemoteSeek;
      queuedRemoteSeek = null;
      if (seek) remoteCommand(`me/player/seek?position_ms=${seek.position}&device_id=${encodeURIComponent(seek.deviceId)}`, { method: "PUT" });
    }, 180);
    return;
  }
  queuedSeek = { trackId: String(trackId), positionMs: Math.max(0, Math.floor(Number(positionSeconds) * 1000)) };
  if (loadedSpotifyTrackId === String(trackId)) flushQueuedSpotifySeek(trackId);
}

export function noteSpotifyPlaybackState(state) {
  loadedSpotifyTrackId = state?.track_window?.current_track?.id || null;
}

export async function flushQueuedSpotifySeek(trackId) {
  const pending = queuedSeek;
  const player = spotifyPlayer;
  if (!pending || !player || pending.trackId !== String(trackId) || seekInFlight) return;
  seekInFlight = true;
  try {
    const state = await player.getCurrentState();
    const loadedTrackId = state?.track_window?.current_track?.id;
    if (!state || loadedTrackId !== pending.trackId || queuedSeek !== pending) return;
    await player.seek(pending.positionMs);
    if (queuedSeek === pending) queuedSeek = null;
  } catch (error) {
    // A transient SDK state before its track list loads is expected during
    // startup. Keep the latest requested seek and retry on the next state event.
    if (!/no list was loaded|no track|not ready/i.test(error?.message || "") && queuedSeek === pending) queuedSeek = null;
  } finally {
    seekInFlight = false;
    if (queuedSeek && queuedSeek !== pending && queuedSeek.trackId === String(trackId)) {
      queueMicrotask(() => flushQueuedSpotifySeek(trackId));
    }
  }
}
