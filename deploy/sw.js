/* ==========================================================================
   SERVICE WORKER — LifeRPG The System
   Cache-first strategy + Local notifications scheduling
   ========================================================================== */

const CACHE_NAME = 'liferpg-v6';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/avatars/1.rank-e.png',
    '/avatars/2.rank-d.png',
    '/avatars/3.rank-c.png',
    '/avatars/4.rank-b.png',
    '/avatars/5.rank-a.png',
    '/avatars/6.rank-s.png',
];

// ── INSTALL: pre-cache all assets ────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Cache each asset individually to avoid one failure blocking all
            return Promise.allSettled(
                ASSETS_TO_CACHE.map(url =>
                    cache.add(url).catch(() => {
                        console.warn('[SW] Could not cache:', url);
                    })
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// ── ACTIVATE: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ── FETCH: Cache-First strategy ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // Not in cache: fetch from network and cache it
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

// ── NOTIFICATIONS: Schedule local notifications ───────────────────────────────
// Called from app.js via postMessage when user configures notification times
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
        const { morningHour, morningMin, eveningHour, eveningMin } = event.data;
        scheduleNotifications(morningHour, morningMin, eveningHour, eveningMin);
    }
    if (event.data && event.data.type === 'TEST_NOTIFICATION') {
        showNotification(
            '⚡ THE SYSTEM — Teste',
            'Notificações funcionando! Nenhuma missão passou despercebida.',
            'test'
        );
    }
});

// Timers ativos (guardados em memória do SW)
let notifTimers = [];

function scheduleNotifications(morningHour = 7, morningMin = 0, eveningHour = 19, eveningMin = 0) {
    // Cancela timers anteriores
    notifTimers.forEach(t => clearTimeout(t));
    notifTimers = [];

    // Agenda notificação da manhã
    const morningMs = msUntil(morningHour, morningMin);
    notifTimers.push(setTimeout(() => {
        showNotification(
            '⚔️ GET UP, MATEUS!',
            'Suas missões diárias estão esperando. O Sistema não tem paciência para fraqueza.',
            'morning-reminder'
        );
        // Re-agenda para o próximo dia
        scheduleNotifications(morningHour, morningMin, eveningHour, eveningMin);
    }, morningMs));

    // Agenda notificação da noite
    const eveningMs = msUntil(eveningHour, eveningMin);
    notifTimers.push(setTimeout(() => {
        showNotification(
            '🔥 ALERTA DO SISTEMA',
            'Você completou suas missões hoje? Não quebre seu streak — o Sistema está de olho.',
            'evening-reminder'
        );
    }, eveningMs));

    console.log(`[SW] Notificações agendadas: manhã em ${morningMs/1000/60} min, noite em ${eveningMs/1000/60} min`);
}

function msUntil(targetHour, targetMin) {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHour, targetMin, 0, 0);
    if (target <= now) {
        target.setDate(target.getDate() + 1); // próximo dia
    }
    return target.getTime() - now.getTime();
}

function showNotification(title, body, tag) {
    self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag,
        renotify: true,
        requireInteraction: false,
        data: { url: '/' }
    });
}

// ── NOTIFICATION CLICK: abre o app ───────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Se o app já está aberto, foca nele
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Senão, abre uma nova janela
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
