"use client";

import { artistPhotoKey } from "../services/artistPhotos";

async function optimizePortrait(file) {
  if (!file.type.startsWith("image/")) throw new Error("Choisis un fichier image.");
  if (file.size > 15 * 1024 * 1024) throw new Error("L’image doit faire moins de 15 Mo.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.82);
}

export default function ArtistPortraitControl({ artist, save, onNotice }) {
  if (!artist) return null;

  async function selectPortrait(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imageUrl = await optimizePortrait(file);
      await save({
        id: artistPhotoKey(artist.name),
        name: artist.name,
        imageUrl,
        sourceUrl: "",
        publishedAt: null,
        attribution: "Photo ajoutée par l’utilisateur",
        retrievedAt: Date.now(),
        status: "user-selected",
      });
      onNotice("Photo de l’artiste enregistrée sur cet appareil.");
    } catch (error) {
      onNotice(error.message || "La photo n’a pas pu être enregistrée.");
    }
  }

  return <label className="mi-artist-photo-upload">
    <span>Ajouter ou remplacer la photo</span>
    <input type="file" accept="image/*" onChange={selectPortrait} />
  </label>;
}
