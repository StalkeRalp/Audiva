const sessionTracks = new Map();

const DATABASE_NAME = "audiva-local-library";
const STORE_NAME = "tracks";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadLocalTracks() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const validEntries = request.result.filter((entry) => entry.file instanceof Blob);
      resolve(validEntries.map(({ file, coverBlob, ...track }) => (() => {
        const existing = sessionTracks.get(track.id);
        if (existing?.streamUrl?.startsWith("blob:") && (!existing.cover?.startsWith("blob:") || existing.coverBlob)) return { ...track, ...existing };
        const persistedCover = coverBlob instanceof Blob && coverBlob.size > 0 ? URL.createObjectURL(coverBlob) : null;
        const urls = {
          streamUrl: existing?.streamUrl?.startsWith("blob:") ? existing.streamUrl : URL.createObjectURL(file),
          cover: persistedCover || (track.cover?.startsWith("blob:") ? "/placeholders/audio-cover.svg" : track.cover),
          coverBlob: coverBlob instanceof Blob ? coverBlob : null,
        };
        sessionTracks.set(track.id, urls);
        return { ...track, ...urls };
      })()));
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveLocalTracks(entries) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    entries.forEach((entry) => store.put(entry));
    transaction.oncomplete = () => {
      entries.forEach(entry => {
        const cover = entry.coverBlob instanceof Blob && entry.coverBlob.size > 0
          ? URL.createObjectURL(entry.coverBlob)
          : (entry.cover?.startsWith("blob:") ? "/placeholders/audio-cover.svg" : entry.cover);
        sessionTracks.set(entry.id, { streamUrl: entry.streamUrl, cover, coverBlob: entry.coverBlob || null });
      });
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteLocalTrack(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}
