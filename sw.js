// Offline cache for the FWW GED digital packet.
// App shell (index.html, player.html, manifest.json) is cached on install.
// Content files under content/*.json are cached the first time they're
// fetched, then served from cache thereafter — so once a session has been
// opened once with internet, it works with zero connection from then on.
const CACHE_NAME = "fww-packet-v2";
const APP_SHELL = ["./", "./index.html", "./player.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // offline: fall back to whatever is cached
      return cached || networkFetch;
    })
  );
});
