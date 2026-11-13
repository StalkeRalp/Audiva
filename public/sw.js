const CACHE_VERSION = "audiva-offline-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const OFFLINE_URL = "/offline.html";
const PAGE_LIMIT = 35;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await Promise.allSettled([OFFLINE_URL, "/manifest.webmanifest"].map((path) => shell.add(path)));
    const pages = await caches.open(PAGE_CACHE);
    await Promise.allSettled(["/accueil", "/bibliotheque", "/decouverte"].map(async (path) => {
      const response = await fetch(path, { credentials: "same-origin" });
      if (response.ok && response.type === "basic") await pages.put(path, response);
    }));
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("audiva-offline-") && !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)))));
  self.clients.claim();
});

function excluded(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/authentification/") || url.pathname.startsWith("/spotify/") || url.pathname.includes("callback") || url.pathname.includes("onboarding");
}

async function limitCache(cache, limit) {
  const keys = await cache.keys();
  if (keys.length > limit) await cache.delete(keys[0]);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || excluded(url)) return;

  const isNavigation = request.mode === "navigate";
  const isNextAsset = url.pathname.startsWith("/_next/static/");
  const isNextData = request.headers.has("RSC") || request.headers.has("Next-Router-Prefetch");
  const isSmallAsset = /\.(?:css|js|woff2?|ttf|otf|svg|png|jpe?g|webp|ico)$/i.test(url.pathname);

  if (isNavigation && !url.search) {
    event.respondWith((async () => {
      const cache = await caches.open(PAGE_CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
          await limitCache(cache, PAGE_LIMIT);
        }
        return response;
      } catch {
        return (await cache.match(request)) || (await caches.match(OFFLINE_URL));
      }
    })());
    return;
  }

  if (isNextAsset || isSmallAsset || isNextData) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
          await limitCache(cache, 160);
        }
        return response;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    })());
  }
});
