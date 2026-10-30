// Service worker de la PWA: deja la guía disponible sin conexión. Se escribe como texto en el build (vite.config.ts) para que
// la lista de archivos y el nombre de la caché salgan de cada versión.

/** El código de sw.js: guarda `files` al instalarse y responde primero de la red, con la caché de respaldo (así nunca enseña una versión vieja con conexión). */
export function serviceWorker(version: string, files: string[]): string {
  return `const CACHE = "poe-gemas-${version}";
const FILES = ${JSON.stringify(files)};

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Solo mismo origen: los precios de poe.watch y las fuentes de Google van por su cuenta (la app ya guarda los precios).
self.addEventListener("fetch", e => {
  const { request } = e;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
  e.respondWith(fetch(request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(request, copy)); }
    return res;
  }).catch(() => caches.match(request, { ignoreSearch: true })));
});
`;
}
