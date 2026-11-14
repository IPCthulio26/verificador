// Service worker do Verificador OSINT.
// Estratégia "network-first" para arquivos do próprio site (sempre fresco quando online,
// funciona offline como fallback). Requisições a outros domínios (APIs, CDN) passam direto.
var CACHE = 'verificador-v1';
var CORE = ['./', './index.html', './username.html', './disposable.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE).catch(function(){}); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // APIs/CDN: deixa o navegador buscar
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
      return res;
    }).catch(function(){ return caches.match(req).then(function(m){ return m || caches.match('./index.html'); }); })
  );
});
