let spotifyPlayer = null;
let spotifyDeviceId = null;

export function registerSpotifyPlayback(player, deviceId = null) {
  spotifyPlayer = player;
  spotifyDeviceId = deviceId;
}

export function updateSpotifyPlaybackDevice(deviceId) {
  spotifyDeviceId = deviceId;
}

export function clearSpotifyPlayback(player) {
  if (player && spotifyPlayer !== player) return;
  spotifyPlayer = null;
  spotifyDeviceId = null;
}

export function getSpotifyPlayback() {
  return { player: spotifyPlayer, deviceId: spotifyDeviceId };
}

export function activateSpotifyPlayback() {
  return spotifyPlayer?.activateElement?.() || Promise.resolve();
}
