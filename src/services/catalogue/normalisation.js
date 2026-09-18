const EDITION_WORDS = /\b(live|remix|acoustic|instrumental|radio edit|extended)\b/gi;

export function normalizeText(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function trackIdentity(track) {
  // Keep materially different editions separate while matching true duplicates.
  const edition = (String(track.title || "").match(EDITION_WORDS) || []).join(" ");
  return `${normalizeText(track.title)}|${normalizeText(track.artist)}|${normalizeText(edition)}`;
}

export function searchScore(item, query) {
  const q = normalizeText(query);
  const title = normalizeText(item.title || item.name);
  const artist = normalizeText(item.artist || item.artistName);
  const album = normalizeText(item.album);
  const genre = normalizeText(Array.isArray(item.genres) ? item.genres.join(" ") : item.genre);
  if (title === q) return 100;
  if (title.includes(q) && artist.includes(q)) return 85;
  if (artist.includes(q)) return 70;
  if (album.includes(q)) return 55;
  if (genre.includes(q)) return 40;
  return title.includes(q) ? 65 : 10;
}

export function dedupeTracks(items) {
  const seen = [];
  return items.filter((item) => {
    if (item.type !== "tracks") return true;
    const identity = trackIdentity(item);
    const duplicate = seen.find((known) => known.identity === identity && Math.abs((known.duration || 0) - (item.duration || 0)) <= 3);
    if (duplicate) return false;
    seen.push({ identity, duration: item.duration });
    return true;
  });
}
