/* ──────────────────────────────────────────────────────────
   GCU Sports — Service Worker
   Cache-first for static assets, network-first for API data.
   Supabase Realtime (WebSocket) is never intercepted.
   ────────────────────────────────────────────────────────── */

const CACHE_VERSION = 'gcu-sports-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

/* Files to pre-cache on install */
const PRE_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/gcu-logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

/* ─── Install ─── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRE_CACHE_URLS);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

/* ─── Activate — clean up old caches ─── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

/* ─── Fetch ─── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept WebSocket / Supabase Realtime
  if (
    request.url.includes('supabase') ||
    request.url.includes('realtime') ||
    request.url.startsWith('ws://') ||
    request.url.startsWith('wss://')
  ) {
    return; // Let the browser handle it natively
  }

  // 2. Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // 3. Skip chrome-extension and other non-http(s) schemes
  if (!request.url.startsWith('http')) {
    return;
  }

  // 4. API / dynamic data → Network-first
  if (
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 5. Navigation requests (HTML pages) → Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a clone of the page for offline use
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Try cache first, then offline fallback
          return caches.match(request).then(
            (cached) => cached || caches.match('/offline.html')
          );
        })
    );
    return;
  }

  // 6. Static assets → Cache-first
  event.respondWith(cacheFirst(request));
});

/* ─── Strategies ─── */

/** Cache-first: return cached response, or fetch and cache */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a basic offline response for failed static requests
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/** Network-first: try network, fall back to cache */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
