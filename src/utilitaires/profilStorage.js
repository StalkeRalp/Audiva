const DATABASE_NAME = "audiva-profile-storage";
const STORE_NAME = "settings";
const PROFILE_KEY = "current-profile";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readFromDatabase() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(PROFILE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function writeToDatabase(value) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, PROFILE_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadProfileSettings() {
  const stored = await readFromDatabase();
  if (stored) return stored;

  // Migration d'une ancienne version qui utilisait localStorage.
  try {
    const profile = JSON.parse(localStorage.getItem("audiva-profile") || "null");
    const preferences = JSON.parse(localStorage.getItem("audiva-preferences") || "null");
    if (!profile && !preferences) return null;

    const migrated = { profile: profile || {}, preferences: preferences || {} };
    await writeToDatabase(migrated);
    localStorage.removeItem("audiva-profile");
    localStorage.removeItem("audiva-preferences");
    return migrated;
  } catch {
    return null;
  }
}

export async function saveProfileSettings(profile, preferences) {
  await writeToDatabase({ profile, preferences });
  // Retire une éventuelle ancienne photo en base64 qui occuperait encore le quota.
  localStorage.removeItem("audiva-profile");
  localStorage.removeItem("audiva-preferences");
}
