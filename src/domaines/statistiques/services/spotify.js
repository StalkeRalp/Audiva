const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
const encode = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const fallbackReturnTo = "/spotify/onboarding";
const safeReturnTo = (value) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallbackReturnTo;
export const spotifyOAuthScopes = [
  "user-top-read", "user-read-private", "user-read-email", "user-read-recently-played", "playlist-read-private",
  "user-library-read", "user-follow-read", "streaming", "user-modify-playback-state",
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
  const token = await getSpotifyAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/${path}`, {
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
    throw new Error("Trop de demandes en peu de temps. Réessayez plus tard.");
  }
  if (!response.ok) {
    if (response.status === 403 && /me\/player/.test(path)) throw new Error("Un abonnement Premium et l’autorisation de lecture sont nécessaires pour utiliser le lecteur intégré.");
    throw new Error(`Le catalogue musical est indisponible pour ce compte (${response.status}).`);
  }
  return response.status === 204 ? {} : response.json();
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
    uri: item.uri || `spotify:track:${item.id}`,
    genres: item.genres || [],
    streamUrl: null,
  };
}

export async function searchSpotify(query, { type = "all", signal } = {}) {
  const types = type === "all" ? "track,artist,album,playlist" : type.slice(0, -1);
  const data = await spotifyRequest(`search?${new URLSearchParams({ q: query, type: types, limit: "10" })}`, { signal });
  return Object.entries(data).flatMap(([kind, value]) => (value.items || []).filter(Boolean).map((item) => spotifyItem(item, kind)));
}
