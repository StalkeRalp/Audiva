const DATABASE = "audiva-chat-media";
const STORE = "local-gifs";
const VERSION = 1;

function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Le stockage local n’est pas disponible."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Impossible d’ouvrir la bibliothèque GIF locale."));
  });
}

export async function saveLocalGif(id, file) {
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put({ id, blob: file, updatedAt: Date.now() });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Impossible d’enregistrer ce GIF local."));
      transaction.onabort = () => reject(transaction.error || new Error("Enregistrement du GIF annulé."));
    });
  } finally { database.close(); }
}

export async function readLocalGif(id) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error || new Error("Impossible de lire ce GIF local."));
    });
  } finally { database.close(); }
}
