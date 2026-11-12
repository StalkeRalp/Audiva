"use client";

import { useEffect, useState } from "react";
import { authorizeSpotify } from "@/domaines/statistiques/services/spotify";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/services/supabase/client";

const AUTH_PENDING_KEY = "audiva-spotify-connect-auth-pending";

function safeReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/spotify/connect")) {
    return "/spotify/onboarding";
  }
  return value;
}

export default function SpotifyConnectPage() {
  const [message, setMessage] = useState("Préparation de la connexion Spotify…");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const start = async () => {
      if (window.location.hostname === "localhost") {
        const loopbackUrl = new URL(window.location.href);
        loopbackUrl.hostname = "127.0.0.1";
        window.location.replace(loopbackUrl.href);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const destination = safeReturnTo(params.get("returnTo"));
      const expectedUserId = params.get("audivaUserId");
      const resumePlayback = params.get("resume") === "1";
      if (!isSupabaseConfigured) throw new Error("Supabase n’est pas configuré pour cette session.");

      const client = getSupabaseBrowserClient();
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        if (sessionStorage.getItem(AUTH_PENDING_KEY)) {
          sessionStorage.removeItem(AUTH_PENDING_KEY);
          throw new Error("Reconnectez-vous à Audiva avant de relier Spotify. La connexion locale a été interrompue.");
        }

        // Spotify requires the numeric loopback host (127.0.0.1), which has a separate browser session from localhost.
        // Restore the Audiva session on this host first so the Spotify callback can return to an authenticated user.
        sessionStorage.setItem(AUTH_PENDING_KEY, "1");
        const resumePath = `/spotify/connect?returnTo=${encodeURIComponent(destination)}${expectedUserId ? `&audivaUserId=${encodeURIComponent(expectedUserId)}` : ""}${resumePlayback ? "&resume=1" : ""}`;
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(resumePath)}`;
        const { error: authError } = await client.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (authError) {
          sessionStorage.removeItem(AUTH_PENDING_KEY);
          throw authError;
        }
        return;
      }

      if (expectedUserId && session.user.id !== expectedUserId) {
        throw new Error("La session Google ouverte ici ne correspond pas au compte Audiva utilisé. Reconnectez le même compte Google, puis relancez l’association.");
      }
      sessionStorage.removeItem(AUTH_PENDING_KEY);
      if (active) setMessage("Ouverture de Spotify…");
      await authorizeSpotify({ returnTo: destination, resumePlayback, skipLocalRedirect: true, expectedUserId });
    };

    start().catch((reason) => {
      if (active) setError(reason.message || "Impossible de démarrer la connexion Spotify.");
    });
    return () => { active = false; };
  }, []);

  return (
    <main className="grid min-h-[70dvh] place-items-center p-6 text-white">
      <div className="w-full max-w-lg text-center">
        {error ? (
          <>
            <p role="alert" className="text-sm leading-6 text-rose-100">{error}</p>
            <a href="/spotify/onboarding" className="mt-5 inline-flex items-center justify-center bg-[#72eee7] px-5 py-3 text-sm font-bold text-[#061426] transition hover:bg-[#a6f6ef]">Revenir à l’association</a>
          </>
        ) : <p role="status">{message}</p>}
      </div>
    </main>
  );
}
