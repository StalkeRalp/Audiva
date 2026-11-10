"use client";

import { useEffect, useState } from "react";
import { canonical } from "@/domaines/statistiques/services/history";
import "./artistProfile.css";

const musicDescription = /chanteur|chanteuse|rappeur|rappeuse|musicien|musicienne|compositeur|compositrice|singer|rapper|musician|songwriter|band|music group/i;

function matchesArtist(page, artistName) {
  const title = String(page.title || "").replace(/\s*\([^)]*\)\s*$/, "");
  return canonical(title) === canonical(artistName) && musicDescription.test(page.description || "");
}

async function findBiography(artistName, signal) {
  for (const language of ["fr", "en"]) {
    const root = `https://${language}.wikipedia.org`;
    const search = await fetch(`${root}/w/rest.php/v1/search/page?${new URLSearchParams({ q: artistName, limit: "8" })}`, { signal });
    if (!search.ok) continue;
    const pages = (await search.json()).pages || [];
    const candidate = pages.find(page => matchesArtist(page, artistName));
    if (!candidate) continue;
    const response = await fetch(`${root}/api/rest_v1/page/summary/${encodeURIComponent(candidate.title)}`, { signal });
    if (!response.ok) continue;
    const summary = await response.json();
    if (summary.type === "disambiguation" || !summary.extract || !matchesArtist({ title: summary.title, description: summary.description || candidate.description }, artistName)) continue;
    return { text: summary.extract, source: summary.content_urls?.desktop?.page || `${root}/wiki/${encodeURIComponent(summary.title)}`, language };
  }
  return null;
}

export default function ArtistBiography({ artist, description = "" }) {
  const [state, setState] = useState({ artist: "", loading: false, biography: null });
  useEffect(() => {
    const controller = new AbortController();
    if (description?.trim()) return () => controller.abort();
    findBiography(artist, controller.signal)
      .then(biography => { if (!controller.signal.aborted) setState({ artist, loading: false, biography }); })
      .catch(() => { if (!controller.signal.aborted) setState({ artist, loading: false, biography: null }); });
    return () => controller.abort();
  }, [artist, description]);

  const searchUrl = `https://fr.wikipedia.org/w/index.php?${new URLSearchParams({ search: `${artist} chanteur musicien` })}`;
  const current = description?.trim() ? { loading: false, biography: { text: description, source: "", language: "provider" } } : state.artist === artist ? state : { loading: true, biography: null };
  return <section className="artist-biography">
    <header><span>BIOGRAPHIE</span>{current.biography?.language && current.biography.language !== "provider" && <small>Wikipédia · {current.biography.language.toUpperCase()}</small>}</header>
    {current.loading ? <p role="status">Recherche d’une biographie correspondant à cet artiste…</p> : current.biography ? <><p>{current.biography.text}</p>{current.biography.source && <a href={current.biography.source} target="_blank" rel="noreferrer">Lire la source complète ↗</a>}</> : <><p>Aucune biographie correspondant avec certitude à « {artist} » n’a été trouvée.</p><a href={searchUrl} target="_blank" rel="noreferrer">Rechercher une biographie ↗</a></>}
  </section>;
}
