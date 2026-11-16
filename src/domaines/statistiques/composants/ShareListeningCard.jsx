"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Cancel01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { summarize } from "../services/history";
import { artistPhotoKey } from "../services/artistPhotos";

const backgrounds = ["#080d18", "#111b35", "#122839", "#251b3c"];
const recapPeriods = [{ id: "week", label: "Semaine", range: "7 derniers jours" }, { id: "month", label: "Mois", range: "Ce mois-ci" }, { id: "year", label: "Année", range: "Cette année" }];
const duration = seconds => seconds >= 3600 ? `${Math.floor(seconds / 3600)} h ${Math.floor(seconds % 3600 / 60)} min` : `${Math.floor(seconds / 60)} min`;

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawWrapped(ctx, text, x, y, width, lineHeight, maxLines = 3) {
  const lines = [];
  let line = "";
  for (const word of String(text || "").split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  return Math.min(lines.length, maxLines);
}

function loadImage(src) {
  if (!src) return Promise.resolve(null);
  return new Promise(resolve => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

export default function ShareListeningCard({ plays, photos = {} }) {
  const dialog = useRef(null);
  const canvas = useRef(null);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("recap");
  const [rangeId, setRangeId] = useState("week");
  const [background, setBackground] = useState(backgrounds[0]);
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState("");
  const [rendering, setRendering] = useState(false);
  const selectedRange = recapPeriods.find(period => period.id === rangeId) || recapPeriods[0];
  const stats = useMemo(() => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    if (rangeId === "week") since.setDate(since.getDate() - 6);
    if (rangeId === "month") since.setDate(1);
    if (rangeId === "year") since.setMonth(0, 1);
    return summarize(plays, since.getTime());
  }, [plays, rangeId]);
  const artist = stats.artists[0];
  const track = stats.tracks[0];
  const cachedArtistPhoto = artist ? photos[artistPhotoKey(artist.name)] : null;
  const artistPhoto = cachedArtistPhoto?.imageUrl ? cachedArtistPhoto : null;
  const periodLabel = selectedRange.range;
  const revision = `${kind}:${rangeId}:${background}:${stats.count}:${artist?.name || ""}:${track?.id || ""}:${artistPhoto?.imageUrl || ""}`;

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return undefined;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    const render = async () => {
      const element = canvas.current;
      if (!element) return;
      const ctx = element.getContext("2d");
      element.width = 1080;
      element.height = 1920;
      ctx.scale(16 / 9, 16 / 9);
      const [r, g, b] = background.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16));
      const light = r * .299 + g * .587 + b * .114 > 150;
      const ink = light ? "#101524" : "#f4f7ff";
      const muted = light ? "#3b4b64" : "#9faccc";
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 608, 1080);
      const glow = ctx.createRadialGradient(460, 110, 10, 460, 110, 620);
      glow.addColorStop(0, "#76eee94d");
      glow.addColorStop(.55, "#657cff20");
      glow.addColorStop(1, "#080d1800");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 608, 1080);
      const logo = await loadImage("/logoAudiva3.png");
      if (!active) return;
      if (logo) {
        const ratio = logo.naturalWidth / logo.naturalHeight;
        const height = 52;
        ctx.drawImage(logo, 40, 28, height * ratio, height);
      }
      ctx.fillStyle = ink;
      ctx.font = "700 31px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("AUDIVA", 40, 102);
      ctx.globalAlpha = .68;
      ctx.textAlign = "right";
      ctx.font = "500 17px Arial, sans-serif";
      ctx.fillText(periodLabel.toUpperCase(), 568, 70);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;

      const cardImage = kind === "track" ? track?.cover : artistPhoto?.imageUrl;
      const [image, spotifyLogo] = await Promise.all([
        loadImage(cardImage),
        artistPhoto?.source === "Spotify" ? loadImage("/spotify12.png") : Promise.resolve(null),
      ]);
      if (!active) return;
      if (kind === "recap") {
        ctx.fillStyle = "#76eee9";
        ctx.font = "700 16px Arial, sans-serif";
        ctx.fillText("VOTRE RÉCAP MUSICAL", 40, 170);
        ctx.fillStyle = ink;
        ctx.font = "700 45px Arial, sans-serif";
        ctx.fillText(`Votre ${rangeId === "week" ? "semaine" : rangeId === "month" ? "mois" : "année"}`, 40, 225);
        ctx.fillText("en musique.", 40, 278);
        roundedRect(ctx, 144, 315, 320, 300, 24);
        ctx.save(); ctx.clip();
        if (image) {
          drawCover(ctx, image, 144, 315, 320, 300);
        } else {
          ctx.fillStyle = "#1c3451"; ctx.fillRect(144, 315, 320, 300);
          ctx.fillStyle = "#76eee9"; ctx.globalAlpha = .22; ctx.beginPath(); ctx.arc(304, 465, 145, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          ctx.fillStyle = ink; ctx.font = "700 82px Arial, sans-serif"; ctx.fillText(artist?.name?.[0]?.toUpperCase() || "♪", 280, 490);
        }
        ctx.restore();
        ctx.fillStyle = ink; ctx.font = "600 20px Arial, sans-serif";
        ctx.textAlign = "center";
        drawWrapped(ctx, artist?.name || "Votre artiste favori", 304, 650, 520, 25, 2);
        if (spotifyLogo) {
          ctx.drawImage(spotifyLogo, 220, 672, 16, 16);
          ctx.fillStyle = muted; ctx.font = "500 11px Arial, sans-serif"; ctx.textAlign = "left"; ctx.fillText("IMAGE FOURNIE PAR SPOTIFY", 244, 685); ctx.textAlign = "center";
        }
        ctx.textAlign = "left";
        ctx.globalAlpha = .84;
        ctx.font = "400 16px Arial, sans-serif";
        ctx.fillStyle = muted;
        ctx.fillText("Une bande-son faite de vos vraies écoutes.", 40, 720);
        ctx.globalAlpha = 1;
        ctx.fillStyle = ink;
        ctx.font = "700 96px Arial, sans-serif";
        ctx.fillText(String(stats.count), 40, 830);
        ctx.fillStyle = "#76eee9";
        ctx.font = "600 18px Arial, sans-serif";
        ctx.fillText("ÉCOUTES RETENUES", 48, 858);
        ctx.fillStyle = muted; ctx.font = "400 13px Arial, sans-serif";
        ctx.fillText("Lectures d’au moins 30 s ou la moitié du titre", 48, 882);
        const cells = [
          [40, 918, "TEMPS D’ÉCOUTE", duration(stats.seconds), "#76eee9"],
          [315, 918, "ARTISTE N° 1", artist?.name || "À découvrir", "#9d9cff"],
          [40, 1000, "TITRES EXPLORÉS", String(stats.tracks.length), "#ff9b80"],
          [315, 1000, "GENRE DOMINANT", stats.genres[0]?.[0] || "Votre style", "#ffd166"],
        ];
        cells.forEach(([x, y, label, value, color]) => {
          roundedRect(ctx, x, y, 253, 68, 14);
          ctx.fillStyle = light ? "#ffffffb8" : "#ffffff0c";
          ctx.fill();
          ctx.strokeStyle = `${color}66`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = "700 11px Arial, sans-serif";
          ctx.fillText(label, x + 14, y + 22);
          ctx.fillStyle = ink;
          ctx.font = value.length > 15 ? "600 16px Arial, sans-serif" : "650 20px Arial, sans-serif";
          drawWrapped(ctx, value, x + 14, y + 51, 225, 18, 1);
        });
      } else if (kind === "artist") {
        ctx.fillStyle = "#76eee9";
        ctx.font = "700 16px Arial, sans-serif";
        ctx.fillText("VOTRE ARTISTE N° 1", 40, 170);
        roundedRect(ctx, 70, 205, 468, 440, 28);
        ctx.save();
        ctx.clip();
        if (image) {
          drawCover(ctx, image, 70, 205, 468, 440);
        } else {
          ctx.fillStyle = "#1c3451";
          ctx.fillRect(70, 205, 468, 440);
          ctx.fillStyle = "#76eee9";
          ctx.globalAlpha = .23;
          ctx.beginPath(); ctx.arc(304, 420, 200, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          ctx.fillStyle = ink; ctx.font = "700 90px Arial, sans-serif";
          ctx.fillText(artist?.name?.[0]?.toUpperCase() || "♪", 270, 460);
        }
        ctx.restore();
        if (spotifyLogo) {
          ctx.drawImage(spotifyLogo, 40, 662, 18, 18);
          ctx.fillStyle = muted; ctx.font = "500 12px Arial, sans-serif"; ctx.fillText("Image fournie par Spotify", 66, 677);
        }
        ctx.fillStyle = "#76eee9"; ctx.font = "700 16px Arial, sans-serif"; ctx.fillText("VOTRE ARTISTE LE PLUS ÉCOUTÉ", 40, 710);
        ctx.fillStyle = ink; ctx.font = "700 52px Arial, sans-serif"; drawWrapped(ctx, artist?.name || "Votre artiste", 40, 785, 530, 60, 2);
        ctx.fillStyle = "#76eee9"; ctx.font = "600 24px Arial, sans-serif"; ctx.fillText(`${artist?.count || 0} écoutes`, 40, 900);
        ctx.fillStyle = muted; ctx.font = "500 18px Arial, sans-serif"; ctx.fillText(`${duration(artist?.seconds || 0)} · ${artist?.tracks?.size || 0} titres différents`, 40, 938);
        roundedRect(ctx, 40, 970, 528, 74, 16); ctx.fillStyle = light ? "#ffffffb8" : "#ffffff0c"; ctx.fill();
        ctx.fillStyle = ink; ctx.font = "600 22px Arial, sans-serif"; ctx.fillText("Un nom. Des heures de musique.", 64, 1015);
      } else {
        ctx.fillStyle = "#76eee9";
        ctx.font = "700 16px Arial, sans-serif";
        ctx.fillText("LE TITRE QUI VOUS ACCOMPAGNE", 40, 170);
        roundedRect(ctx, 70, 195, 468, 468, 28);
        ctx.save(); ctx.clip();
        if (image) {
          const side = Math.min(image.width, image.height);
          ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 70, 195, 468, 468);
        } else {
          ctx.fillStyle = "#273b62"; ctx.fillRect(70, 195, 468, 468);
          ctx.fillStyle = "#76eee9"; ctx.font = "120px Arial, sans-serif"; ctx.fillText("♫", 270, 465);
        }
        ctx.restore();
        ctx.fillStyle = ink;
        ctx.font = "700 46px Arial, sans-serif";
        drawWrapped(ctx, track?.title || "Votre titre préféré", 40, 755, 530, 58, 2);
        ctx.fillStyle = muted;
        ctx.font = "500 23px Arial, sans-serif";
        ctx.fillText(track?.artist || "Audiva", 40, 900);
        ctx.fillStyle = "#76eee9";
        ctx.font = "600 18px Arial, sans-serif";
        ctx.fillText(`${track?.count || 0} écoutes · ${duration(track?.seconds || 0)}`, 40, 948);
      }
      ctx.globalAlpha = .56;
      ctx.fillStyle = ink;
      ctx.font = "500 16px Arial, sans-serif";
      ctx.textAlign = "center";
        ctx.fillText("MA MUSIQUE, MON HISTOIRE", 304, 1074);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
      return await new Promise((resolve, reject) => element.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image non disponible")), "image/png"));
    };
    render().then(blob => {
      if (active) {
        setFile({ revision, blob: new File([blob], "audiva-recap-portrait-9-16.png", { type: "image/png" }) });
        setRendering(false);
      }
    }).catch(() => { if (active) { setNotice("L’image ne peut pas être préparée sur cet appareil."); setRendering(false); } });
    return () => { active = false; };
  }, [open, kind, rangeId, background, revision, stats, artist, track, artistPhoto, periodLabel]);

  const close = () => { setOpen(false); setNotice(""); };
  const download = () => {
    if (!file || file.revision !== revision) return;
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = file.blob.name; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Carte téléchargée dans vos fichiers.");
  };
  const share = async () => {
    if (!file || file.revision !== revision) return;
    if (navigator.canShare?.({ files: [file.blob] }) && navigator.share) {
      try { await navigator.share({ files: [file.blob], title: "Mon récap musical Audiva" }); }
      catch (error) { if (error.name !== "AbortError") setNotice("Le partage n’est pas disponible. Téléchargez la carte pour l’envoyer."); }
      return;
    }
    download();
  };
  const ready = file?.revision === revision && !rendering;

  return <>
    <button type="button" className="mi-share-trigger" onClick={() => { setRendering(true); setOpen(true); }}><HugeiconsIcon icon={Share01Icon} size={18} /> Créer une carte de partage</button>
    {open && <dialog ref={dialog} className="mi-share-dialog" onCancel={close} onClick={event => { if (event.target === event.currentTarget) close(); }} aria-labelledby="mi-share-heading">
      <header><div><span>AUDIVA · VOTRE HISTOIRE</span><h2 id="mi-share-heading">Une écoute qui vous ressemble.</h2><p>Créez une carte élégante à partager ou à enregistrer.</p></div><button type="button" onClick={close} aria-label="Fermer"><HugeiconsIcon icon={Cancel01Icon} size={20} /></button></header>
      <div className="mi-share-layout"><div className="mi-share-preview"><canvas ref={canvas} aria-label="Aperçu portrait 9:16 de la carte de statistiques" /></div><section><h3>Période à partager</h3><div className="mi-share-periods">{recapPeriods.map(period => <button key={period.id} type="button" aria-pressed={rangeId === period.id} onClick={() => { setRendering(true); setRangeId(period.id); }}>{period.label}</button>)}</div><h3>Choisissez votre carte</h3><div className="mi-share-types">{[["recap", "Mon récap"], ["artist", "Mon artiste n° 1"], ["track", "Mon titre n° 1"]].map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => { setRendering(true); setKind(value); }}>{label}</button>)}</div><h3>Ambiance</h3><div className="mi-share-colors">{backgrounds.map(color => <button key={color} type="button" style={{ background: color }} aria-label={`Choisir la couleur ${color}`} aria-pressed={background === color} onClick={() => { setRendering(true); setBackground(color); }} />)}</div><label className="mi-share-custom-color"><span>Libre</span><input type="color" aria-label="Choisir une couleur de fond personnalisée" value={background} onChange={event => { setRendering(true); setBackground(event.target.value); }} /></label>{kind!=="track"&&artistPhoto?.source==="Spotify"&&artistPhoto.sourceUrl&&<a className="mi-share-source" href={artistPhoto.sourceUrl} target="_blank" rel="noreferrer">Source du portrait : Spotify ↗</a>}<p className="mi-share-copy">Format portrait 9:16, idéal pour un écran de téléphone. Votre carte utilise uniquement les statistiques affichées sur cet appareil.</p><div className="mi-share-actions"><button type="button" disabled={!ready} onClick={share}><HugeiconsIcon icon={Share01Icon} size={17} /> Partager</button><button type="button" disabled={!ready} onClick={download}>↓ Télécharger l’image</button></div>{rendering && <p role="status">Préparation de votre carte…</p>}{notice && <p role="status">{notice}</p>}</section></div>
    </dialog>}
  </>;
}
