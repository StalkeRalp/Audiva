const PLACEHOLDER_COVER = "/placeholders/audio-cover.svg";

const omitEmpty = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value.map(omitEmpty).filter((item) => item !== undefined);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, omitEmpty(item)]).filter(([, item]) => item !== undefined));
  return value;
};

const serializable = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof ArrayBuffer) return `[Données binaires : ${value.byteLength} octets]`;
  if (ArrayBuffer.isView(value)) return `[Données binaires : ${value.byteLength} octets]`;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializable).filter((item) => item !== undefined);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializable(item)]).filter(([, item]) => item !== undefined));
  return value;
};

const fileNameWithoutExtension = (file) => file.name.replace(/\.[^/.]+$/, "").replaceAll("_", " ").trim() || "Titre inconnu";
const first = (value) => Array.isArray(value) ? value.filter(Boolean).join(", ") : value;

function pictureToBlob(picture) {
  if (!picture?.data || !picture.format) return null;
  try { return new Blob([picture.data], { type: picture.format }); } catch { return null; }
}

function preferredPicture(pictures = []) {
  return pictures.find((picture) => /front/i.test(picture.type || "")) || pictures[0] || null;
}

function normalizeFormat(format = {}) {
  return omitEmpty({
    duration: format.duration, bitrate: format.bitrate, codec: format.codec, container: format.container,
    lossless: format.lossless, sampleRate: format.sampleRate, numberOfChannels: format.numberOfChannels,
    channelMode: format.channelMode, bitsPerSample: format.bitsPerSample, bitsPerRawSample: format.bitsPerRawSample,
    bitrateMode: format.bitrateMode, codecProfile: format.codecProfile, mpegVersion: format.mpegVersion,
    mpegLayer: format.mpegLayer, tool: format.tool, tagTypes: format.tagTypes,
  });
}

function normalizeTags(common = {}) {
  return omitEmpty({
    title: common.title, artist: first(common.artist || common.artists), artists: common.artists,
    album: common.album, albumArtist: common.albumartist, albumArtists: common.albumartists, originalArtist: common.originalartist,
    composer: first(common.composer), lyricist: first(common.lyricist), writer: first(common.writer), producer: first(common.producer), genre: first(common.genre), year: common.year, date: common.date, originalDate: common.originaldate, originalYear: common.originalyear, releaseDate: common.releasedate,
    track: common.track, disk: common.disk, comment: first(common.comment), copyright: common.copyright,
    publisher: first(common.publisher), label: first(common.label), bpm: common.bpm, key: common.key, lyrics: first(common.lyrics),
    isrc: first(common.isrc), musicBrainz: omitEmpty({ recordingId: common.musicbrainz_recordingid, trackId: common.musicbrainz_trackid, albumId: common.musicbrainz_albumid, artistId: common.musicbrainz_artistid, albumArtistId: common.musicbrainz_albumartistid, releaseGroupId: common.musicbrainz_releasegroupid, workId: common.musicbrainz_workid, discId: common.musicbrainz_discid }),
    acoustId: common.acoustid_id, replayGain: common.replaygain, rating: common.rating, barcode: common.barcode,
    catalogNumber: common.catalognumber, grouping: common.grouping, mood: common.mood, media: common.media,
  });
}

/**
 * Lit les métadonnées d'un objet File dans le navigateur uniquement.
 * Les URLs créées pour les pochettes doivent être libérées avec revokeMetadataUrls.
 */
export async function extractAudioMetadata(file) {
  const fallbackTitle = fileNameWithoutExtension(file);
  const base = { file, fileInfo: { name: file.name, size: file.size, type: file.type || "audio/*", lastModified: file.lastModified }, title: fallbackTitle, artist: "Artiste inconnu", album: "Album inconnu", genre: "Genre inconnu", year: undefined, duration: 0, cover: PLACEHOLDER_COVER, coverBlob: null, pictures: [], tags: {}, technical: {}, rawTags: {}, error: null };
  try {
    const { parseBlob } = await import("music-metadata-browser");
    const metadata = await parseBlob(file, { duration: true, skipCovers: false, includeChapters: true });
    const tags = normalizeTags(metadata.common);
    const pictureEntries = (metadata.common.picture || []).map((picture, index) => {
      const blob = pictureToBlob(picture);
      return { index, type: picture.type || "Other", format: picture.format || "", description: picture.description || "", blob, url: blob ? URL.createObjectURL(blob) : null };
    });
    const preferred = preferredPicture(metadata.common.picture);
    const coverBlob = pictureToBlob(preferred);
    const cover = coverBlob ? URL.createObjectURL(coverBlob) : PLACEHOLDER_COVER;
    const commonWithoutPictures = { ...metadata.common };
    delete commonWithoutPictures.picture;
    return { ...base, title: tags.title || fallbackTitle, artist: tags.artist || "Artiste inconnu", album: tags.album || "Album inconnu", genre: tags.genre || "Genre inconnu", year: tags.year || tags.date, duration: Math.round(metadata.format.duration || 0), cover, coverBlob, pictures: pictureEntries, tags, technical: normalizeFormat(metadata.format), rawTags: serializable({ common: commonWithoutPictures, format: metadata.format, native: metadata.native, quality: metadata.quality, chapters: metadata.chapters }) };
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : "Métadonnées indisponibles pour ce fichier" };
  }
}

/** Analyse tous les fichiers sans qu'une erreur individuelle n'arrête le lot. */
export async function extractAudioMetadataBatch(files, onItem) {
  const tasks = [...files].map(async (file, index) => {
    const result = await extractAudioMetadata(file);
    onItem?.(result, index);
    return result;
  });
  const settled = await Promise.allSettled(tasks);
  return settled.map((item, index) => item.status === "fulfilled" ? item.value : ({ file: files[index], title: fileNameWithoutExtension(files[index]), artist: "Artiste inconnu", album: "Album inconnu", genre: "Genre inconnu", cover: PLACEHOLDER_COVER, pictures: [], tags: {}, technical: {}, rawTags: {}, error: String(item.reason || "Analyse impossible") }));
}

export function revokeMetadataUrls(metadata) {
  [metadata?.cover, ...(metadata?.pictures || []).map((picture) => picture.url)].filter((url) => typeof url === "string" && url.startsWith("blob:")).forEach((url) => URL.revokeObjectURL(url));
}

export { PLACEHOLDER_COVER };
