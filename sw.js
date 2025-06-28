self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("v1").then(cache => {
      return cache.addAll([
        "./index.html",
        "./style.css",
        "./app.js",
        "./manifest.json",
        "./assets/edificio.jpg",
        "./assets/icono.png",
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
        "https://unpkg.com/html5-qrcode"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});