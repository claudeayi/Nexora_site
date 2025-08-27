const NAME = "nexora-site-v3";
const ASSETS = [
  "/", "/index.html", "/styles.css", "/app.js", "/router.js", "/components.js", "/i18n.js",
  "/assets/logo.svg", "/assets/hero.svg",
  "/pages/privacy.html", "/pages/terms.html", "/manifest.webmanifest",
  "/data/posts.json", "/data/roadmap.json"
];

self.addEventListener("install", e => e.waitUntil(caches.open(NAME).then(c => c.addAll(ASSETS))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k!==NAME && caches.delete(k))))));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copy = resp.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); return resp;
    }).catch(()=> caches.match("/index.html")))
  );
});
