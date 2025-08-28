// sw.js — Nexora Futurist (final)

const VERSION = 'v4';
const NAME = `nexora-site-${VERSION}`;
const APP_SHELL = [
  '/', '/index.html', '/styles.css',
  '/app.js', '/router.js', '/components.js', '/i18n.js',
  '/assets/logo.svg', '/assets/hero.svg',
  '/pages/privacy.html', '/pages/terms.html',
  '/manifest.webmanifest'
];
// caches “de travail” que l’on autorise
const ALLOWED_PREFIX = ['nexora-site-'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(NAME);
    await c.addAll(APP_SHELL);
    // Active immédiatement la nouvelle SW
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Navigation preload (quand supporté)
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    // Purge des anciens caches Nexora
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => {
        const allowed = ALLOWED_PREFIX.some(p => k.startsWith(p));
        if (!allowed || k === NAME) return Promise.resolve();
        return caches.delete(k);
      })
    );
    // Prend le contrôle tout de suite
    self.clients.claim();
  })());
});

// Utilitaires
const timeoutFetch = (req, ms = 8000, opt = {}) =>
  new Promise((resolve, reject) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    fetch(req, { signal: ctl.signal, ...opt })
      .then((r) => { clearTimeout(t); resolve(r); })
      .catch((e) => { clearTimeout(t); reject(e); });
  });

// Routes helpers
const isHTMLNav = (req) =>
  req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html');

const isStaticAsset = (url) =>
  /\.(?:css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(url.pathname);

const isDataFile = (url) =>
  url.pathname.startsWith('/data/') &&
  /\.(?:json|md|xml)$/i.test(url.pathname);

const isPageStatic = (url) =>
  url.pathname.startsWith('/pages/') && url.pathname.endsWith('.html');

// Stale-While-Revalidate pour données locales
async function staleWhileRevalidate(e, cacheName = NAME) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(e.request);
  const fetchPromise = timeoutFetch(e.request, 8000)
    .then((resp) => {
      if (resp && (resp.ok || resp.type === 'opaque')) {
        cache.put(e.request, resp.clone()).catch(() => {});
      }
      return resp;
    })
    .catch(() => cached || Promise.reject('network-failed'));
  return cached ? Promise.resolve(cached) : fetchPromise;
}

// Cache-first pour assets
async function cacheFirst(e, cacheName = NAME) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(e.request);
  if (cached) return cached;
  const resp = await timeoutFetch(e.request, 10000).catch(() => null);
  if (resp && (resp.ok || resp.type === 'opaque')) {
    cache.put(e.request, resp.clone()).catch(() => {});
    return resp;
  }
  // fallback minimal : index
  return cache.match('/index.html');
}

// Network-first pour app-shell HTML
async function networkFirstHTML(e, cacheName = NAME) {
  const cache = await caches.open(cacheName);

  // Navigation Preload si dispo
  const preload = await e.preloadResponse;
  if (preload) {
    try { cache.put(e.request, preload.clone()); } catch {}
    return preload;
  }

  try {
    const resp = await timeoutFetch(e.request, 8000);
    if (resp && resp.ok) {
      try { await cache.put(e.request, resp.clone()); } catch {}
      return resp;
    }
    // fallback cache si non-OK
    const cached = await cache.match(e.request);
    return cached || cache.match('/index.html');
  } catch {
    const cached = await cache.match(e.request);
    return cached || cache.match('/index.html');
  }
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // on ne gère que GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Hors même origine -> laisse passer (ou tu peux faire cache-first si tu veux)
  if (url.origin !== location.origin) {
    // Optionnel: on peut laisser le navigateur gérer
    return;
  }

  // HTML navigation (app-shell) -> network-first
  if (isHTMLNav(request)) {
    e.respondWith(networkFirstHTML(e));
    return;
  }

  // Données locales /data -> Stale-While-Revalidate
  if (isDataFile(url)) {
    e.respondWith(staleWhileRevalidate(e));
    return;
  }

  // Pages statiques -> cache-first
  if (isPageStatic(url)) {
    e.respondWith(cacheFirst(e));
    return;
  }

  // Assets statiques (css/js/img/fonts) -> cache-first
  if (isStaticAsset(url)) {
    e.respondWith(cacheFirst(e));
    return;
  }

  // Par défaut: essaie cache puis réseau puis fallback index
  e.respondWith((async () => {
    const cache = await caches.open(NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const resp = await timeoutFetch(request, 8000);
      if (resp && (resp.ok || resp.type === 'opaque')) {
        cache.put(request, resp.clone()).catch(() => {});
      }
      return resp;
    } catch {
      return cache.match('/index.html');
    }
  })());
});

// Mise à jour contrôlée depuis la page (facultatif)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
