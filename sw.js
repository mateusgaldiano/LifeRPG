/* ==========================================================================
   SERVICE WORKER — LifeRPG The System
   Cache-first strategy + Local notifications scheduling
   ========================================================================== */

// Versão vem da fonte única (1.core/version.js) — bump APENAS lá.
importScripts('1.core/version.js');
const CACHE_VERSION = self.APP_VERSION;
const CACHE_NAME = `liferpg-cache-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    '1.core/version.js',
    '1.core/styles.css',
    '1.core/vendor/supabase.min.js',
    '1.core/supabase-config.js',
    '1.core/app.js',
    '1.core/modules/state.js',
    '1.core/modules/utils.js',
    '1.core/modules/ui.js',
    '1.core/modules/game-logic.js',
    '1.core/modules/weekly-report.js',
    '1.core/modules/social.js',
    '1.core/modules/pwa.js',
    'manifest.json',
    '2.assets/icons/icon-192.png',
    '2.assets/icons/icon-512.png',
    '2.assets/avatars/0 - female/1.rank-e.png',
    '2.assets/avatars/0 - female/2.rank-d.png',
    '2.assets/avatars/0 - female/3.rank-c.png',
    '2.assets/avatars/0 - female/4.rank-b.png',
    '2.assets/avatars/0 - female/5.rank-a.png',
    '2.assets/avatars/0 - female/6.rank-s.png',
    '2.assets/avatars/1 - male/1.rank-e.png',
    '2.assets/avatars/1 - male/2.rank-d.png',
    '2.assets/avatars/1 - male/3.rank-c.png',
    '2.assets/avatars/1 - male/4.rank-b.png',
    '2.assets/avatars/1 - male/5.rank-a.png',
    '2.assets/avatars/1 - male/6.rank-s.png',
];

// ── INSTALL: pre-cache all assets ────────────────────────────────────────────
self.addEventListener('install', (event) => {
    self.skipWaiting();
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
        })
    );
});

// ── ACTIVATE: remove old caches and claim/notify clients ──────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
            .then(() => self.clients.matchAll({ type: 'window' }))
            .then(clients => {
                clients.forEach(client =>
                    client.postMessage({ type: 'SW_UPDATED' })
                );
            })
    );
});

// ── FETCH: Network-first for index.html, Cache-first for assets ───────────────
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    const url = new URL(event.request.url);

    // index.html: Stale-While-Revalidate (carrega instantâneo do cache, atualiza em background)
    if (url.pathname === '/' ||
        url.pathname.endsWith('/LifeRPG/') ||
        url.pathname.endsWith('/LifeRPG_Dev/') ||
        url.pathname.endsWith('index.html')) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                const networkFetch = fetch(event.request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                }).catch((err) => {
                    console.warn('[SW] Falha ao atualizar index.html em background:', err);
                });
                return cached || networkFetch;
            })
        );
        return;
    }

    // Outros assets (JS, CSS, imagens): cache-first com fallback para rede
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
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

// ── PUSH EVENTS: Native Web Push listener ─────────────────────────────────────
self.addEventListener('push', (event) => {
    let payload = { title: '⚡ THE SYSTEM', body: 'Alerta geral do sistema.', tag: 'general-push' };
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload = { title: '⚡ THE SYSTEM', body: event.data.text(), tag: 'general-push' };
        }
    }
    
    const options = {
        body: payload.body,
        icon: '2.assets/icons/icon-192.png',
        badge: '2.assets/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: payload.tag || 'general-push',
        renotify: true,
        data: { url: payload.url || './' }
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});
