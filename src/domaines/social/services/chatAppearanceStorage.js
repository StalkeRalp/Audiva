const DATABASE_NAME = "audiva-chat-appearance";
const STORE_NAME = "conversation-backgrounds";
const VERSION = 1;

function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Le stockage local n’est pas disponible."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Impossible d’ouvrir les réglages locaux du chat."));
  });
}

export async function readConversationBackground(conversationId) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(conversationId);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error || new Error("Impossible de lire le fond de la conversation."));
    });
  } finally { database.close(); }
}

export async function saveConversationBackground(conversationId, image) {
  if (!conversationId || !(image instanceof Blob) || !image.type.startsWith("image/")) throw new Error("Choisissez une image valide.");
  if (image.size > 12 * 1024 * 1024) throw new Error("L’image doit faire moins de 12 Mo.");
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(image, conversationId);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Impossible d’enregistrer ce fond sur cet appareil."));
      transaction.onabort = () => reject(transaction.error || new Error("Enregistrement du fond annulé."));
    });
  } finally { database.close(); }
}

export async function deleteConversationBackground(conversationId) {
  if (!conversationId) return;
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(conversationId);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Impossible de retirer ce fond."));
    });
  } finally { database.close(); }
}
