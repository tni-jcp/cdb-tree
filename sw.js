// sw.js — Chalakuzhy Genealogy App (Relationship Finder + Lookup Family Near Me)
// Caches the static app shell (HTML/CSS/JS/icons + the CDN library used by
// Relationship Finder's graph view) so the app installs cleanly and opens
// instantly on repeat visits. Deliberately does NOT cache anything under
// /api/ — relationship and location data must always come from the live
// backend, never a stale cached response.

const CACHE_NAME = "chalakuzhy-shell-v2";

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./family_near_me.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "https://cdnjs.cloudflare.com/ajax/libs/vis-network/10.1.0/standalone/umd/vis-network.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls — always go live to the backend.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Cache-first for the app shell, falling back to network (and caching the
  // result) for anything not pre-cached.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
