"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { readLocalGif } from "@/domaines/social/services/gifMediaStorage";

export function ChatGifImage({ gif, alt = "GIF animé", ...props }) {
  const key = `${gif.id || ""}:${gif.url || ""}:${gif.storage || ""}`;
  const [localAsset, setLocalAsset] = useState(null);
  useEffect(() => {
    if (gif.storage !== "indexeddb") return undefined;
    let active = true, objectUrl = "";
    readLocalGif(gif.id).then(blob => {
      if (!active) return;
      if (!blob) { setLocalAsset({ key, missing: true, src: "" }); return; }
      objectUrl = URL.createObjectURL(blob); setLocalAsset({ key, missing: false, src: objectUrl });
    }).catch(() => { if (active) setLocalAsset({ key, missing: true, src: "" }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [gif.id, gif.storage, key]);
  const local = gif.storage === "indexeddb";
  const missing = local && localAsset?.key === key && localAsset.missing;
  const src = local ? (localAsset?.key === key ? localAsset.src : "") : gif.url;
  if (missing) return <span className="chat-gif-missing" role="status">Ce GIF local n’est plus disponible sur cet appareil.</span>;
  if (!src) return <span className="chat-gif-image-loading" role="status">Chargement du GIF…</span>;
  return <Image unoptimized src={src} alt={alt} width={gif.width || 480} height={gif.height || 320} loading="lazy" {...props} />;
}

export function ChatGifMessage({ gif }) {
  const [expanded, setExpanded] = useState(false);
  return <>
    <button type="button" className="chat-gif-message-media" onClick={() => setExpanded(true)} aria-label="Agrandir le GIF">
      <ChatGifImage gif={gif} alt="GIF animé partagé" />
      <span>Agrandir ⤢</span>
    </button>
    <div className="chat-gif-message-meta">
      <span title={gif.attribution || `${gif.creator || "Auteur non indiqué"} · ${gif.license || "Licence inconnue"}`}>{gif.attribution || `${gif.creator || "Auteur non indiqué"} · ${gif.source || "GIF"} · ${gif.license || "Licence inconnue"}`}</span>
      <span className="chat-gif-links">{gif.sourceUrl && <a href={gif.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}{gif.licenseUrl && <a href={gif.licenseUrl} target="_blank" rel="noreferrer">Licence ↗</a>}</span>
    </div>
    {expanded && <div className="chat-gif-lightbox" role="dialog" aria-modal="true" aria-label="Aperçu agrandi du GIF" onClick={() => setExpanded(false)}><button type="button" onClick={() => setExpanded(false)} aria-label="Fermer l’aperçu">×</button><ChatGifImage gif={gif} alt="GIF animé en plein écran" onClick={event => event.stopPropagation()} />{gif.licenseUrl && <a href={gif.licenseUrl} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}>Licence {gif.license} ↗</a>}</div>}
  </>;
}
