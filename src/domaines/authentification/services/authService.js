import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/services/supabase/client";
import { spotifyOAuthScopes } from "@/domaines/statistiques/services/spotify";

export function getAuthSuccessPath(search = "") {
  const candidate = new URLSearchParams(search).get("next");
  if (!candidate?.startsWith("/spotify/onboarding?")) return "/spotify/onboarding";
  try {
    const parsed = new URL(candidate, "https://audiva.invalid");
    if (parsed.origin !== "https://audiva.invalid" || parsed.pathname !== "/spotify/onboarding") return "/spotify/onboarding";
    const destination = parsed.searchParams.get("next");
    if (!destination?.startsWith("/") || destination.startsWith("//") || destination.startsWith("/spotify/onboarding")) return "/spotify/onboarding";
    return `/spotify/onboarding?next=${encodeURIComponent(destination)}`;
  } catch { return "/spotify/onboarding"; }
}

function client() {
  if (!isSupabaseConfigured) throw new Error("Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env, puis redémarrez Audiva.");
  return getSupabaseBrowserClient();
}

export async function loginWithEmail(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function registerWithEmail({ email, password, displayName, redirectPath = "/spotify/onboarding" }) {
  const { data, error } = await client().auth.signUp({
    email: email.trim(), password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`, data: { display_name: displayName.trim() } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle(redirectPath = "/spotify/onboarding") {
  const { data, error } = await client().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}` },
  });
  if (error) throw error;
  return data;
}

export async function signInWithSpotify(redirectPath = "/spotify/onboarding") {
  const safePath = redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/spotify/onboarding";
  const { data, error } = await client().auth.signInWithOAuth({
    provider: "spotify",
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safePath)}`, scopes: spotifyOAuthScopes },
  });
  if (error) throw error;
  return data;
}

export async function requestPasswordReset(email) {
  const { error } = await client().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/auth/callback?next=/authentification/reinitialiser`,
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { data, error } = await client().auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function updateEmail(email) {
  const { data, error } = await client().auth.updateUser({ email: email.trim() });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await client().auth.signOut();
  if (error) throw error;
}
