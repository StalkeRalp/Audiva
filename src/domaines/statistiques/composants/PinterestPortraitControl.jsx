"use client";

import { artistPhotoKey } from "../services/artistPhotos";

export default function PinterestPortraitControl({ artist, currentPhoto, save, onNotice }) {
  if (!artist) return null;
  const query = encodeURIComponent(`${artist.name} portrait récent`);
  const savePinterestImage = async () => {
    const value = window.prompt("Colle le lien direct i.pinimg.com d’une photo choisie sur Pinterest.");
    if (!value) return;
    let imageUrl;
    try { imageUrl = new URL(value); } catch { onNotice("Lien d’image invalide."); return; }
    if (imageUrl.hostname !== "i.pinimg.com") { onNotice("Colle le lien direct i.pinimg.com de la photo Pinterest."); return; }
    const pinterestPhotos = [...(currentPhoto?.pinterestPhotos || []), { imageUrl: imageUrl.href, addedAt: Date.now() }]
      .filter((entry, index, all) => all.findIndex(item => item.imageUrl === entry.imageUrl) === index);
    try {
      await save({
        id: artistPhotoKey(artist.name), name: artist.name, imageUrl: imageUrl.href,
        sourceUrl: `https://www.pinterest.com/search/pins/?q=${query}`,
        pinterestPhotos, publishedAt: null, retrievedAt: Date.now(), status: "pinterest-selected",
      });
      onNotice("Portrait enregistré. Vos photos Pinterest enregistrées alterneront automatiquement.");
    } catch { onNotice("La photo n’a pas pu être enregistrée sur cet appareil."); }
  };

  return <>
    <a href={`https://www.pinterest.com/search/pins/?q=${query}`} target="_blank" rel="noreferrer">Choisir un portrait sur Pinterest ↗</a>
    <button type="button" onClick={savePinterestImage}>Enregistrer le lien d’image</button>
    <small className="mi-photo-recency">Pinterest ne permet pas de récupérer ses résultats automatiquement. Collez un lien i.pinimg.com choisi sur Pinterest.</small>
  </>;
}
