/* EMBERWILDS service worker — offline-capable WITHOUT ever serving a stale
   build. The old worker was cache-first for everything under a fixed cache
   name, so players kept the first build they ever loaded, forever.
   Strategy now:
   - network-first for the app shell (HTML): every deploy reaches players on
     their next load; the cached copy is only used offline
   - cache-first for content-hashed static assets (they're immutable)
   - the cache name carries a build stamp (injected by scripts/stampSw.mjs) so
     activate purges every previous build's cache */
const CACHE = 'emberwilds-__BUILD__';
const CORE = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // app shell: network-first so a new deploy is picked up on the next load
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', clone));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then((hit) => hit ?? caches.match('./'))),
    );
    return;
  }

  // hashed static assets: cache-first, backfill from the network
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ??
        fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        }),
    ),
  );
});
