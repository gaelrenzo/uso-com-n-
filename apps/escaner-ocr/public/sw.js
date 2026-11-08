// Cache-first para la app, librerías CDN y datos de idioma de Tesseract (funciona sin internet tras el primer uso)
const CACHE = 'escaner-v6';
const COMPARTIDOS = 'compartidos'; // imágenes recibidas por share_target (las lee app.js)
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== COMPARTIDOS).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
// share_target: Android envía las fotos por POST multipart; se guardan y se abre la app con ?compartido=N
async function recibir(req) {
  const fotos = (await req.formData()).getAll('imagenes');
  const c = await caches.open(COMPARTIDOS);
  await Promise.all(fotos.map((f, i) => c.put(`compartida-${Date.now()}-${i}`, new Response(f))));
  return Response.redirect(new URL(`./?compartido=${fotos.length}`, self.registration.scope).href, 303);
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.searchParams.has('compartir')) return e.respondWith(recibir(e.request));
  if (e.request.method !== 'GET' || url.pathname.includes('/api/')) return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
    return r;
  })));
});
