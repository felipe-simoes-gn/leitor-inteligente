// Troque o número da versão sempre que atualizar os arquivos do app.
var CACHE = 'venda-externa-v6';
var FOTOS = 'venda-externa-fotos';
var ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './zxing.min.js', './xlsx.min.js', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k !== FOTOS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) {
    // Fotos dos produtos: guarda na primeira vez e depois serve do aparelho, sem internet.
    e.respondWith(caches.open(FOTOS).then(function (c) {
      return c.match(url.href).then(function (hit) {
        if (hit) return hit;
        return fetch(url.href, { mode: 'cors', credentials: 'omit' }).catch(function () { return fetch(e.request); }).then(function (res) {
          if (res && (res.ok || res.type === 'opaque')) c.put(url.href, res.clone());
          return res;
        });
      });
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || fetch(e.request); }));
});
