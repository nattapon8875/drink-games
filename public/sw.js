/* Buffy Party Drink - service worker.
 *
 * The point of this file is installability and a civil offline screen, not
 * offline play: every room lives on the server behind /api/room, so a cached
 * game page would only show a board that cannot move. The rules below are
 * deliberately conservative.
 *
 *   /api/*            never touched. Room state must never come from a cache.
 *   navigations       network first, /offline.html only when the network fails.
 *   /_next/static/*   cache first. The filenames carry a build hash, so a
 *                     cached copy can never be the wrong build.
 *   images, fonts     stale while revalidate.
 *   everything else   straight to the network.
 *
 * Bump CACHE_VERSION to evict every cache on the next visit.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `buffy-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `buffy-assets-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const SHELL_FILES = [
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/buffy-mascot.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // One missing file must not fail the whole install, or the worker never
      // activates and the app stops being installable.
      .then((cache) => Promise.allSettled(SHELL_FILES.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

function isAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/i.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Another origin's business is its own, and room state is never cached.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) =>
            cached ||
            new Response('ออฟไลน์', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
        )
      )
    );
    return;
  }

  if (!isAsset(url)) return;

  const immutable = url.pathname.startsWith('/_next/static/');

  event.respondWith(
    caches.open(ASSET_CACHE).then(async (cache) => {
      // Fall through to the shell cache too: the icons the offline page shows
      // were precached there at install, and looking only in the asset cache
      // left that page with a broken image exactly when it matters.
      const cached = (await cache.match(request)) || (await caches.match(request));

      // A hashed build asset can never go stale, so a hit is the final answer.
      if (cached && immutable) return cached;

      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
