"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveLocalGif } from "@/domaines/social/services/gifMediaStorage";
import { ChatGifImage } from "@/domaines/social/composants/ChatGifMedia";

const FAVORITES_KEY = "audiva-chat-gif-favorites";
const RECENTS_KEY = "audiva-chat-gif-recents";
const categories = ["Musique", "Danse", "Réaction", "Rire", "Célébration", "Amour", "Applaudissements", "Chat"];
const tenorTrendingUrl = "https://tenor.com/fr/search/trending-gifs";
const audivaGifs = [
  ["wave", "Vibes"], ["love", "Love"], ["spark", "Brillant"], ["dance", "Danse"],
  ["dream", "Nuit"], ["fire", "Hot"], ["vinyl", "Vinyle"], ["party", "Party"],
].map(([name, label]) => ({ id: `audiva-${name}`, url: `/stickers/${name}.gif`, thumbnail: `/stickers/${name}.gif`, label, source: "Audiva", sourceUrl: "", width: 256, height: 256, creator: "Création Audiva", license: "Création Audiva", licenseUrl: "", filetype: "gif", storage: "remote" }));

const readList = key => {
  if (typeof window === "undefined") return [];
  try { const parsed = JSON.parse(window.localStorage.getItem(key) || "[]"); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
};
const persistList = (key, value) => { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const safeHttpUrl = (value, fallback = "") => {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : fallback; }
  catch { return fallback; }
};
const imageMetadata = item => ({
  id: String(item.id), title: item.title || "GIF animé", url: item.url, thumbnail: safeHttpUrl(item.thumbnail, item.url),
  source: item.source || item.provider || "Openverse", sourceUrl: safeHttpUrl(item.foreign_landing_url || item.detail_url, "https://openverse.org/"),
  width: Number(item.width) || 0, height: Number(item.height) || 0, filesize: Number(item.filesize) || 0,
  creator: item.creator || "Auteur non indiqué", license: item.license || "Licence non indiquée",
  licenseUrl: safeHttpUrl(item.license_url), attribution: item.attribution || "", filetype: item.filetype || "gif",
});

export function GifPicker({ onSend, onClose }) {
  const [tab, setTab] = useState("tendances");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);
  const [sending, setSending] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setFavorites(readList(FAVORITES_KEY)); setRecents(readList(RECENTS_KEY)); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { const url = selected?.localPreviewUrl; return () => { if (url) URL.revokeObjectURL(url); }; }, [selected?.localPreviewUrl]);
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const params = new URLSearchParams({ q: value, extension: "gif", license_type: "all-cc", size: "small,medium", page_size: "20", mature: "false" });
        const response = await fetch(`https://api.openverse.org/v1/images/?${params}`, { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(response.status === 429 ? "La recherche libre est momentanément limitée. Réessayez dans un instant." : "La source de GIF ne répond pas pour le moment.");
        const data = await response.json();
        const items = (data.results || []).filter(item => {
          if (!item.url) return false;
          try { return new URL(item.url).protocol === "https:" && (item.filetype ? /gif/i.test(item.filetype) : new URL(item.url).pathname.toLowerCase().endsWith(".gif")); }
          catch { return false; }
        }).map(imageMetadata);
        setResults(items);
        if (!items.length) setError("Aucun GIF sous licence ouverte trouvé. Essayez un autre mot-clé ou importez un fichier.");
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message || "La recherche de GIF a échoué.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const visibleItems = useMemo(() => tab === "favoris" ? favorites : tab === "récents" ? recents : query.trim().length >= 2 ? results : [], [tab, favorites, recents, query, results]);
  const toggleFavorite = item => {
    const entry = { ...item };
    delete entry.localFile; delete entry.localPreviewUrl;
    const exists = favorites.some(favorite => favorite.id === entry.id);
    const updated = exists ? favorites.filter(favorite => favorite.id !== entry.id) : [entry, ...favorites].slice(0, 80);
    setFavorites(updated); persistList(FAVORITES_KEY, updated);
  };
  const chooseCategory = value => { setTab("catégories"); setSelected(null); setLoading(false); setError(""); setQuery(`${value.toLowerCase()} gif`); };
  const chooseLocalFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const signature = new TextDecoder().decode(await file.slice(0, 6).arrayBuffer());
    if (!file.name.toLowerCase().endsWith(".gif") || (file.type && file.type !== "image/gif") || !/^GIF8[79]a$/.test(signature)) { setError("Choisissez un vrai fichier GIF animé (.gif)."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("Ce GIF dépasse la limite de 15 Mo."); return; }
    let width = 0, height = 0;
    try { const bitmap = await createImageBitmap(file); width = bitmap.width; height = bitmap.height; bitmap.close(); } catch {}
    const id = `local-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    try {
      await saveLocalGif(id, file);
      setSelected({ id, url: `local-gif:${id}`, localFile: file, localPreviewUrl: URL.createObjectURL(file), width, height, source: "GIF importé", sourceUrl: "", creator: "Import local", license: "Fichier de l’utilisateur", licenseUrl: "", filetype: "gif", storage: "indexeddb" });
      setTab("aperçu"); setError("");
    } catch { setError("Impossible d’enregistrer ce GIF dans le stockage local du navigateur."); }
  };
  const sendSelected = async () => {
    if (!selected || sending) return;
    setSending(true); setError("");
    try {
      const metadata = Object.fromEntries(Object.entries(selected).filter(([key]) => key !== "localFile" && key !== "localPreviewUrl"));
      const sentAt = Date.now();
      const gif = { ...metadata, sentAt, storage: selected.localFile ? "indexeddb" : "remote" };
      const updated = [gif, ...recents.filter(item => item.id !== gif.id)].slice(0, 40);
      setRecents(updated); persistList(RECENTS_KEY, updated);
      onSend({ type: "gif", gif });
      setSelected(null); onClose();
    } catch (sendError) { setError(sendError.message || "Impossible d’enregistrer ce GIF."); }
    finally { setSending(false); }
  };

  return <section className="chat-gif-library" aria-label="Bibliothèque de GIF">
    <header className="chat-gif-library-header"><div><span>GIF / STICKERS</span><h3>À partager</h3></div><button type="button" onClick={onClose} aria-label="Fermer la bibliothèque GIF">×</button></header>
    <div className="chat-gif-searchbar"><span aria-hidden="true">⌕</span><input value={query} onChange={event => { setQuery(event.target.value); setTab("tendances"); setSelected(null); setError(""); setLoading(false); }} placeholder="Rechercher un GIF animé…" aria-label="Rechercher un GIF animé" /><button type="button" onClick={() => fileInput.current?.click()}>Importer</button><input ref={fileInput} className="chat-gif-file-input" type="file" accept="image/gif,.gif" onChange={chooseLocalFile} /></div>
    <nav className="chat-gif-tabs" aria-label="Parcourir les GIFs">{[["tendances", "Tendances"], ["catégories", "Catégories"], ["récents", "Récents"], ["favoris", "Favoris"]].map(([id, label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => { setTab(id); setSelected(null); }}>{label}</button>)}</nav>
    {tab === "tendances" && <div className="chat-gif-trending"><div><b>Tendances GIF</b><p>Consultez les tendances officielles sur Tenor. Pour sélectionner et envoyer un GIF dans Audiva, utilisez la recherche libre ci-dessus.</p></div><a href={tenorTrendingUrl} target="_blank" rel="noreferrer">Voir Tenor ↗</a></div>}
    {tab === "catégories" && <div className="chat-gif-categories" aria-label="Catégories populaires">{categories.map(category => <button type="button" key={category} onClick={() => chooseCategory(category)}>{category}</button>)}</div>}
    {query.trim().length >= 2 && <p className="chat-gif-source-note">Recherche de GIF sous licence Creative Commons · Openverse</p>}
    {loading && <p className="chat-gif-status" role="status">Recherche de GIFs…</p>}
    {error && <p className="chat-gif-status" role="status">{error}</p>}
    {tab !== "aperçu" && <div className="chat-gif-results">{visibleItems.map(item => <div key={item.id} className="chat-gif-result"><button type="button" onClick={() => setSelected(item)} aria-label={`Prévisualiser le GIF ${item.id}`}><ChatGifImage gif={{ ...item, url: item.thumbnail || item.url }} alt={item.creator ? `GIF par ${item.creator}` : "GIF animé"} /></button><button type="button" className={`chat-gif-favorite ${favorites.some(favorite => favorite.id === item.id) ? "is-favorite" : ""}`} aria-label={favorites.some(favorite => favorite.id === item.id) ? "Retirer des favoris" : "Ajouter aux favoris"} onClick={() => toggleFavorite(item)}>{favorites.some(favorite => favorite.id === item.id) ? "★" : "☆"}</button></div>)}{!loading && visibleItems.length === 0 && !error && tab !== "tendances" && tab !== "catégories" && <p className="chat-gif-status">Aucun GIF ici pour l’instant. Choisissez un GIF dans une recherche ou importez un fichier.</p>}{!query.trim() && (tab === "tendances" || tab === "catégories") && <p className="chat-gif-status">Saisissez un mot-clé pour lancer une recherche libre, ou choisissez une catégorie.</p>}</div>}
    {!query.trim() && (tab === "tendances" || tab === "catégories") && <><p className="chat-gif-source-note">GIFs originaux inclus dans Audiva</p><div className="chat-gif-results">{audivaGifs.map(item => <div key={item.id} className="chat-gif-result"><button type="button" onClick={() => setSelected(item)} aria-label={`Prévisualiser ${item.label}`}><ChatGifImage gif={item} alt={`GIF Audiva ${item.label}`} /></button><button type="button" className={`chat-gif-favorite ${favorites.some(favorite => favorite.id === item.id) ? "is-favorite" : ""}`} aria-label={favorites.some(favorite => favorite.id === item.id) ? "Retirer des favoris" : "Ajouter aux favoris"} onClick={() => toggleFavorite(item)}>{favorites.some(favorite => favorite.id === item.id) ? "★" : "☆"}</button></div>)}</div></>}
    {selected && <div className="chat-gif-preview-card"><div className="chat-gif-preview-frame"><Image unoptimized src={selected.localPreviewUrl || selected.url} alt="Aperçu du GIF animé" width={selected.width || 400} height={selected.height || 300} /></div><div className="chat-gif-metadata"><span>{selected.creator || "Auteur non indiqué"} · {selected.source}</span>{selected.licenseUrl ? <a href={selected.licenseUrl} target="_blank" rel="noreferrer">Licence {selected.license} ↗</a> : <small>{selected.license}</small>}<a href={selected.sourceUrl || undefined} target={selected.sourceUrl ? "_blank" : undefined} rel={selected.sourceUrl ? "noreferrer" : undefined}>{selected.sourceUrl ? "Page source ↗" : "Import local"}</a></div><div className="chat-gif-preview-actions"><button type="button" onClick={() => toggleFavorite(selected)}>{favorites.some(item => item.id === selected.id) ? "★ Favori" : "☆ Ajouter aux favoris"}</button><button type="button" onClick={sendSelected} disabled={sending}>{sending ? "Envoi…" : "Envoyer le GIF"}</button></div></div>}
  </section>;
}
