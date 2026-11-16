const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
const encode = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const fallbackReturnTo = "/spotify/onboarding";
const safeReturnTo = (value) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallbackReturnTo;
export const spotifyOAuthScopes = [
  "user-top-read", "user-read-private", "user-read-email", "user-read-recently-played", "playlist-read-private",
  "user-library-read", "user-library-modify", "user-follow-read", "user-follow-modify", "playlist-read-collaborative", "playlist-modify-public", "streaming", "user-modify-playback-state",
  "user-read-playback-state", "user-read-currently-playing",
].join(" ");

export function storeSpotifyProviderSession(session) {
  if (typeof window === "undefined" || !session?.provider_token) return false;
  // Supabase exposes provider_token for Google and other OAuth providers too.
  // Never save those tokens as Spotify credentials.
  if (session.user?.app_metadata?.provider !== "spotify") return false;
  saveAuth({ access_token: session.provider_token, refresh_token: session.provider_refresh_token, expires_in: 3600, scope: spotifyOAuthScopes });
  return true;
}

export function hasSpotifyDataConsent(userId) {
  if (!userId) return false;
  try { return localStorage.getItem(`audiva-spotify-data-consent:${userId}`) === "accepted"; } catch { return false; }
}

export function saveSpotifyDataConsent(userId) {
  if (!userId) throw new Error("Impossible d’associer votre accord à votre compte Audiva.");
  try {
    localStorage.setItem(`audiva-spotify-data-consent:${userId}`, "accepted");
    localStorage.setItem(`audiva-spotify-data-consent-at:${userId}`, new Date().toISOString());
  } catch { /* Le consentement cloud reste la source durable. */ }
}

function readAuth() {
  try { return JSON.parse(sessionStorage.getItem("audiva-spotify-token") || "null"); }
  catch { return null; }
}

function saveAuth(data, previous = {}) {
  const auth = {
    access: data.access_token,
    refresh: data.refresh_token || previous.refresh || null,
    expires: Date.now() + Number(data.expires_in || 3600) * 1000,
    scope: data.scope || previous.scope || "",
  };
  sessionStorage.setItem("audiva-spotify-token", JSON.stringify(auth));
  return auth;
}

export async function authorizeSpotify({ returnTo, resumePlayback = false, skipLocalRedirect = false, expectedUserId } = {}) {
  const destination = safeReturnTo(returnTo || `${location.pathname}${location.search}`);
  if (location.hostname === "localhost" && !skipLocalRedirect) {
    const connectUrl = new URL("/spotify/connect", location.href);
    connectUrl.hostname = "127.0.0.1";
    connectUrl.searchParams.set("returnTo", destination);
    if (resumePlayback) connectUrl.searchParams.set("resume", "1");
    if (expectedUserId) connectUrl.searchParams.set("audivaUserId", expectedUserId);
    location.assign(connectUrl.href);
    return;
  }
  if (!clientId) throw new Error("Le service musical n’est pas configuré. Vérifiez NEXT_PUBLIC_SPOTIFY_CLIENT_ID dans .env.");
  const verifier = encode(crypto.getRandomValues(new Uint8Array(64)));
  const state = crypto.randomUUID();
  const redirect = `${location.origin}/spotify/callback`;
  sessionStorage.setItem("audiva-spotify-pkce", JSON.stringify({ verifier, state, redirect, returnTo: destination, resumePlayback }));
  const challenge = encode(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const authorization = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: spotifyOAuthScopes,
    redirect_uri: redirect,
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  location.assign(`https://accounts.spotify.com/authorize?${authorization}`);
}

// Tous les anciens points d’entrée passent par l’écran d’explication unique.
export async function connectSpotify({ returnTo } = {}) {
  const destination = safeReturnTo(returnTo || `${location.pathname}${location.search}`);
  const onboarding = new URL("/spotify/onboarding", location.href);
  onboarding.searchParams.set("next", destination);
  location.assign(onboarding.href);
}

export async function finishSpotify() {
  const params = new URLSearchParams(location.search);
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem("audiva-spotify-pkce") || "null"); }
  catch { saved = null; }
  if (params.has("error") || !saved || saved.state !== params.get("state") || !params.get("code")) {
    throw new Error("La connexion au catalogue a été refusée ou a expiré.");
  }
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.get("code"),
      redirect_uri: saved.redirect,
      client_id: clientId,
      code_verifier: saved.verifier,
    }),
  });
  if (!response.ok) throw new Error("La connexion au catalogue n’a pas abouti. Vérifiez l’URL de retour et la configuration de l’application musicale.");
  const data = await response.json();
  saveAuth(data);
  if (saved.resumePlayback) sessionStorage.setItem("audiva-spotify-resume", "1");
  sessionStorage.removeItem("audiva-spotify-pkce");
  return { returnTo: safeReturnTo(saved.returnTo), resumePlayback: Boolean(saved.resumePlayback) };
}

export function spotifyToken() {
  const auth = readAuth();
  return auth?.expires > Date.now() ? auth.access : null;
}

export function spotifyHasStreamingScope() {
  const auth = readAuth();
  return Boolean(auth?.scope?.split(/\s+/).includes("streaming"));
}

export function hasSpotifySession() {
  const auth = readAuth();
  return Boolean(auth?.access || auth?.refresh);
}

export async function getSpotifyAccessToken() {
  const auth = readAuth();
  if (auth?.access && auth.expires > Date.now() + 60_000) return auth.access;
  if (!auth?.refresh) throw new Error("Votre autorisation de lecture a expiré. Reconnectez votre compte.");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: auth.refresh, client_id: clientId }),
  });
  if (!response.ok) {
    sessionStorage.removeItem("audiva-spotify-token");
    throw new Error("Votre autorisation de lecture a expiré. Reconnectez votre compte.");
  }
  return saveAuth(await response.json(), auth).access;
}

let blockedUntil = 0;
export async function spotifyRequest(path, { signal, method = "GET", body } = {}) {
  if (Date.now() < blockedUntil) throw new Error("Trop de demandes en peu de temps. Réessayez dans quelques instants.");
  const requestPath = String(path || "").replace(/^\/+/, "");
  if (!requestPath || /^https?:\/\//i.test(requestPath) || requestPath.includes("..")) {
    throw new Error("Requête Spotify invalide : chemin d’API incorrect.");
  }
  const endpoint = requestPath.split("?", 1)[0];
  if (endpoint === "search") {
    const params = new URLSearchParams(requestPath.split("?")[1] || "");
    if (!params.get("q")?.trim() || !params.get("type")) throw new Error("Requête Spotify invalide : la recherche doit préciser un texte et un type.");
    const limit = Number(params.get("limit"));
    if (Number.isFinite(limit) && limit > 10) params.set("limit", "10");
    path = `search?${params}`;
  }
  if (endpoint === "me/player" && method === "PUT" && body?.device_ids !== undefined) {
    const ids = body.device_ids;
    if (!Array.isArray(ids) || ids.length !== 1 || typeof ids[0] !== "string" || !ids[0].trim()) {
      throw new Error("Spotify exige un seul identifiant d’appareil valide pour transférer la lecture.");
    }
  }
  const token = await getSpotifyAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/${path || requestPath}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });
  if (response.status === 401) {
    sessionStorage.removeItem("audiva-spotify-token");
    throw new Error("Votre autorisation de lecture a expiré. Reconnectez votre compte.");
  }
  if (response.status === 429) {
    blockedUntil = Date.now() + (Number(response.headers.get("Retry-After")) || 60) * 1000;
    let detail = "";
    try { detail = (await response.clone().json())?.error?.reason || ""; } catch { /* Le corps de l’erreur peut être vide. */ }
    throw new Error(detail === "QUOTA_EXCEEDED"
      ? "Le quota Spotify de cette application est atteint. Réessayez plus tard."
      : "Spotify limite temporairement les demandes. Réessayez plus tard.");
  }
  if (!response.ok) {
    if (response.status === 403 && path === "me/player/devices") throw new Error("Spotify refuse l’accès à la liste des appareils. Réassociez votre compte et vérifiez l’autorisation de lecture de l’état Spotify.");
    if (response.status === 403 && /me\/player/.test(path)) throw new Error("Un abonnement Premium et l’autorisation de lecture sont nécessaires pour utiliser le lecteur intégré.");
    let payload = null;
    try { payload = await response.clone().json(); } catch { /* Conserve le statut HTTP si Spotify n’envoie pas de détail. */ }
    const detail = payload?.error?.message || payload?.error?.reason || payload?.message || "";
    const error = new Error(`Le catalogue musical est indisponible pour ce compte (${response.status})${detail ? ` : ${detail}` : ""}.`);
    error.status = response.status;
    error.code = payload?.error?.status || payload?.error?.code || null;
    throw error;
  }
  if (response.status === 204) return {};
  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : {};
}

/** Charge les pages `items/next` Spotify sans accepter d’URL de pagination externe. */
export async function spotifyRequestAll(path, { signal, maxPages = 20 } = {}) {
  const first = await spotifyRequest(path, { signal });
  const items = [...(first.items || [])];
  let next = first.next;
  let pages = 1;
  while (next && pages < maxPages) {
    const url = new URL(next);
    if (url.origin !== "https://api.spotify.com" || !url.pathname.startsWith("/v1/")) {
      throw new Error("Pagination Spotify invalide.");
    }
    const page = await spotifyRequest(`${url.pathname.slice(4)}${url.search}`, { signal });
    items.push(...(page.items || []));
    next = page.next;
    pages += 1;
  }
  return { ...first, items, next, truncated: Boolean(next) };
}

export function saveSpotifyPlaylistToLibrary(playlistId) {
  const value = String(playlistId || "").trim();
  const id = value.match(/^spotify:playlist:([A-Za-z0-9]+)$/)?.[1] || value;
  if (!/^[A-Za-z0-9]+$/.test(id)) return Promise.reject(new Error("Cette playlist Spotify n’a pas d’identifiant valide."));
  const params = new URLSearchParams({ uris: `spotify:playlist:${id}` });
  return spotifyRequest(`me/library?${params}`, { method: "PUT" });
}

export function spotifyItem(item, type = "tracks") {
  const artist = item.artists?.map((entry) => entry.name).join(", ") || item.owner?.display_name || item.name;
  const image = item.album?.images?.[0]?.url || item.images?.[0]?.url || "/placeholders/audio-cover.svg";
  return {
    id: `spotify:${type}:${item.id}`,
    provider: "spotify",
    providerId: item.id,
    type,
    title: item.name,
    artist,
    album: item.album?.name || "",
    duration: (item.duration_ms || 0) / 1000,
    cover: image,
    image,
    externalUrl: item.external_urls?.spotify || `https://open.spotify.com/${type.slice(0, -1)}/${item.id}`,
    uri: item.uri || `spotify:${({ tracks: "track", artists: "artist", albums: "album", playlists: "playlist" }[type] || type.replace(/s$/, ""))}:${item.id}`,
    description: item.description || "",
    owner: item.owner?.display_name || "",
    trackCount: Number(item.items?.total ?? item.tracks?.total) || 0,
    genres: item.genres || [],
    streamUrl: null,
  };
}

export async function searchSpotify(query, { type = "all", signal } = {}) {
  const types = type === "all" ? "track,artist,album,playlist" : type.slice(0, -1);
  const data = await spotifyRequest(`search?${new URLSearchParams({ q: query, type: types, limit: "10" })}`, { signal });
  return Object.entries(data).flatMap(([kind, value]) => (value.items || []).filter(Boolean).map((item) => spotifyItem(item, kind)));
}
