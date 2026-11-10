const DB_NAME = 'audiva-artist-photos';
const STORE = 'photos';

export const artistPhotoKey = (name = '') => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB indisponible'));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readArtistPhotos() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveArtistPhoto(record) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => { db.close(); resolve(record); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}


/** Pinterest does not expose search-result images to this client without an approved integration.
 * Keep discovery as a user-driven search; never scrape Pinterest or substitute another source. */
export async function findArtistPortrait(name) {
  return { id: artistPhotoKey(name), name, imageUrl: '', sourceUrl: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(`${name} portrait récent`)}`, publishedAt: null, attribution: '', retrievedAt: Date.now(), status: 'pinterest-search' };
}
