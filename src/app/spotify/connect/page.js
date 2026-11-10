"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { connectSpotify } from "@/domaines/statistiques/services/spotify";

export default function SpotifyConnectPage() {
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    connectSpotify({
      returnTo: params.get("returnTo"),
      resumePlayback: params.get("resume") === "1",
      skipLocalRedirect: true,
    }).catch((reason) => setError(reason?.message || "Impossible de démarrer la connexion Spotify."));
  }, []);
  return <main className="grid min-h-[70dvh] place-items-center p-6 text-white"><div className="max-w-md text-center"><p role="status">{error || "Connexion sécurisée à Spotify…"}</p>{error && <Link className="mt-5 inline-block text-[#76eee9]" href="/bibliotheque">Retour à Audiva</Link>}</div></main>;
}
