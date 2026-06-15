/* ==========================================================================
   SERVICE WORKER — LifeRPG The System
   Cache-first strategy + Local notifications scheduling
   ========================================================================== */

const CACHE_NAME = 'liferpg-v30';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    '1.core/styles.css',
    '1.core/supabase-config.js',
    '1.core/app.js',
    'manifest.json',
    '2.assets/icons/icon-192.png',
    '2.assets/icons/icon-512.png',
    '2.assets/avatars/1.rank-e.png',
    '2.assets/avatars/2.rank-d.png',
    '2.assets/avatars/3.rank-c.png',
    '2.assets/avatars/4.rank-b.png',
    '2.assets/avatars/5.rank-a.png',
    '2.assets/avatars/6.rank-s.png',
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
                    return caches.match('index.html');
                }
            });
        })
    );
});

// ── NOTIFICATIONS: Schedule local notifications ───────────────────────────────
// Quests pendentes guardadas em memória
let pendingQuestsCount = 0;
let lastMorningHour = 7, lastMorningMin = 0, lastEveningHour = 19, lastEveningMin = 0;

// Called from app.js via postMessage when user configures notification times or updates quest status
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
        const { morningHour, morningMin, eveningHour, eveningMin } = event.data;
        lastMorningHour = morningHour;
        lastMorningMin = morningMin;
        lastEveningHour = eveningHour;
        lastEveningMin = eveningMin;
        scheduleNotifications(morningHour, morningMin, eveningHour, eveningMin);
    }
    if (event.data && event.data.type === 'UPDATE_QUEST_STATUS') {
        pendingQuestsCount = event.data.pendingCount;
        console.log(`[SW] Quests pendentes atualizadas no SW: ${pendingQuestsCount}`);
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

    // Agenda notificação da noite (alerta geral)
    const eveningMs = msUntil(eveningHour, eveningMin);
    notifTimers.push(setTimeout(() => {
        showNotification(
            '🔥 ALERTA DO SISTEMA',
            'Você completou suas missões hoje? Não quebre seu streak — o Sistema está de olho.',
            'evening-reminder'
        );
    }, eveningMs));

    // Agenda notificação de Streak Ameaçado (21h30)
    const warningMs = msUntil(21, 30);
    notifTimers.push(setTimeout(() => {
        if (pendingQuestsCount > 0) {
            showNotification(
                '⚠️ OFFENSIVE EM RISCO!',
                `Ainda restam ${pendingQuestsCount} missões diárias pendentes. Complete-as antes da meia-noite para manter o seu streak!`,
                'streak-danger'
            );
        }
        // Re-agenda
        scheduleNotifications(morningHour, morningMin, eveningHour, eveningMin);
    }, warningMs));

    console.log(`[SW] Notificações agendadas: manhã em ${morningMs/1000/60} min, noite em ${eveningMs/1000/60} min, streak-warning em ${warningMs/1000/60} min`);
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
        icon: '2.assets/icons/icon-192.png',
        badge: '2.assets/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag,
        renotify: true,
        requireInteraction: false,
        data: { url: './' }
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
                return clients.openWindow('./');
            }
        })
    );
});
