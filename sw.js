const CACHE_NAME = 'gcloudy-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/main.html',
    '/css/style.css',
    '/js/login.js',
    '/js/main.js',
    '/assets/favicon/favicon-96x96.png',
    '/assets/favicon/favicon.svg',
    '/assets/favicon/favicon.ico',
    '/assets/favicon/apple-touch-icon.png',
    '/assets/gcloudy.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js'
];

// Installation des Service Workers
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Aktivierung des Service Workers
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch-Event-Handler
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache-Hit - gib die Antwort aus dem Cache zurück
                if (response) {
                    return response;
                }

                // Cache-Miss - versuche es mit dem Netzwerk
                return fetch(event.request).then(
                    (response) => {
                        // Überprüfe, ob wir eine gültige Antwort erhalten haben
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Klone die Antwort, da sie nur einmal verwendet werden kann
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                ).catch(() => {
                    // Wenn das Netzwerk fehlschlägt und es sich um eine HTML-Seite handelt,
                    // gib eine Offline-Seite zurück
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
}); 