// pwa.js
import { gameState, saveGameData } from './state.js';
import { showSystemToast } from './ui.js';

// ==========================================================================
// CONFIGURAÇÕES & PWA MOBILE ENGINE
// ==========================================================================
let serviceWorkerRegistration = null;
let deferredPrompt = null;

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Havia um SW controlando a página ANTES deste boot? Se sim, um SW_UPDATED
        // significa uma atualização real (não a 1ª instalação) e vale recarregar.
        const hadController = !!navigator.serviceWorker.controller;

        // updateViaCache:'none' força o navegador a revalidar sw.js E o version.js
        // importado a cada checagem de update — sem isso, um bump de versão podia
        // ficar preso no cache HTTP e o SW antigo (com bundle desatualizado) persistia.
        navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
            .then(reg => {
                serviceWorkerRegistration = reg;
                console.log('[App] SW Registrado:', reg.scope);

                // Dispara uma checagem de update imediata a cada boot.
                reg.update().catch(() => {});

                // Configura notificações iniciais assim que o SW estiver pronto
                navigator.serviceWorker.ready.then(() => {
                    updateSWNotifications();
                });
            })
            .catch(err => {
                console.error('[App] Erro SW:', err);
            });

        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'SW_UPDATED') {
                const version = event.data.version || '';
                // Quando uma versão nova ativa, o cache antigo (possivelmente com
                // HTML novo + JS antigo) já foi apagado pelo activate do SW. Recarrega
                // UMA vez para servir o bundle novo e consistente. Guarda por versão
                // no sessionStorage evita loop de reload.
                const key = 'swReloadedFor';
                if (hadController && sessionStorage.getItem(key) !== version) {
                    sessionStorage.setItem(key, version);
                    console.log('[App] Nova versão do SW ativa — recarregando para aplicar.');
                    window.location.reload();
                }
            }
        });
    }
}

function setupSettingsListeners() {
    const modalSettings = document.getElementById('modal-settings');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('close-settings-modal');
    if (btnOpenSettings && modalSettings && btnCloseSettings) {
        btnOpenSettings.addEventListener('click', () => {
            loadSettingsToUI();
            updateNotificationPermissionUI();

            // 1) Aplica o flag síncrono imediatamente — sem flicker
            if (typeof window.updateCloudStatusUI === 'function') {
                window.updateCloudStatusUI(window._isSupabaseAuthenticated || false);
            }

            // 2) Re-verifica a sessão real de forma assíncrona (pega tokens expirados)
            if (typeof supabaseClient !== 'undefined') {
                supabaseClient.auth.getSession().then(({ data }) => {
                    const isLoggedIn = !!(data?.session?.user);
                    if (typeof window.updateCloudStatusUI === 'function') {
                        window.updateCloudStatusUI(isLoggedIn);
                    }
                }).catch(() => {
                    // Supabase offline — mantém o flag atual
                });
            }

            modalSettings.style.display = 'flex';
        });

        
        btnCloseSettings.addEventListener('click', () => {
            modalSettings.style.display = 'none';
        });

        // Supabase Sync Buttons
        const btnLogin = document.getElementById('btn-cloud-login');
        if (btnLogin) {
            btnLogin.addEventListener('click', () => {
                if (typeof window.loginWithGoogle === 'function') window.loginWithGoogle();
            });
        }

        const btnLogout = document.getElementById('btn-cloud-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                if (typeof window.logoutSupabase === 'function') window.logoutSupabase();
            });
        }

        const btnSync = document.getElementById('btn-cloud-sync');
        if (btnSync) {
            btnSync.addEventListener('click', async () => {
                // forceLoadFromCloud: sempre puxa da nuvem sem comparação de conflito
                const syncFn = window.forceLoadFromCloud || window.syncFromCloud;
                if (typeof syncFn === 'function') {
                    btnSync.disabled = true;
                    btnSync.textContent = 'Sincronizando...';
                    await syncFn();
                    btnSync.disabled = false;
                    btnSync.textContent = '☁️ SINCRONIZAR DADOS';
                }
            });
        }

        // Clique fora para fechar
        window.addEventListener('click', (e) => {
            if (e.target === modalSettings) {
                modalSettings.style.display = 'none';
            }
        });
    }

    // Atalhos de header: Troféus e Taverna
    function switchToTab(tabName) {
        const navButtons = document.querySelectorAll('.tab-link[data-tab]');
        const tabContents = document.querySelectorAll('.tab-content');
        const targetTab = document.getElementById(`tab-${tabName}`);
        if (!targetTab) return;
        navButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        const targetBtn = document.querySelector(`.tab-link[data-tab="${tabName}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        targetTab.classList.add('active');
        if (tabName === 'global') renderGlobalDashboard();
        if (tabName === 'achievements') {
            if (typeof window.switchTrophiesTab === 'function') {
                window.switchTrophiesTab('trophies');
            }
        }
        if (window.innerWidth <= 1023) {
            const offset = targetTab.getBoundingClientRect().top + window.scrollY - 130;
            window.scrollTo({ top: offset, behavior: 'smooth' });
        }
    }

    const btnHeaderTrophies = document.getElementById('btn-header-trophies');
    if (btnHeaderTrophies) {
        btnHeaderTrophies.addEventListener('click', () => switchToTab('achievements'));
    }




    // Solicitar permissão de notificação
    const btnRequestNotif = document.getElementById('btn-request-notif');
    if (btnRequestNotif) {
        btnRequestNotif.addEventListener('click', () => {
            if ('Notification' in window) {
                Notification.requestPermission().then((permission) => {
                    updateNotificationPermissionUI();
                    updateSWNotifications();
                    if (permission === 'granted' && typeof window.subscribeUserToPush === 'function') {
                        window.subscribeUserToPush();
                    }
                });
            }
        });
    }

    // Salvar horários
    const btnSaveNotif = document.getElementById('btn-save-notif');
    if (btnSaveNotif) {
        btnSaveNotif.addEventListener('click', () => {
            const morningHour = Math.min(23, Math.max(0, parseInt(document.getElementById('notif-morning-hour').value) || 0));
            const morningMin = Math.min(59, Math.max(0, parseInt(document.getElementById('notif-morning-min').value) || 0));
            const eveningHour = Math.min(23, Math.max(0, parseInt(document.getElementById('notif-evening-hour').value) || 0));
            const eveningMin = Math.min(59, Math.max(0, parseInt(document.getElementById('notif-evening-min').value) || 0));

            gameState.notificationTimes = { morningHour, morningMin, eveningHour, eveningMin };
            saveGameData();
            updateSWNotifications();
            
            // UI feedback
            const originalText = btnSaveNotif.innerText;
            btnSaveNotif.innerText = '✓ SALVO';
            btnSaveNotif.style.background = 'linear-gradient(90deg, var(--neon-green), #34d399)';
            setTimeout(() => {
                btnSaveNotif.innerText = originalText;
                btnSaveNotif.style.background = '';
            }, 1500);
        });
    }



    // Hard Reset (Destruição do Sistema)
    const btnHardReset = document.getElementById('btn-hard-reset');
    if (btnHardReset) {
        btnHardReset.addEventListener('click', async () => {
            const confirmed = confirm("🔥 TEM CERTEZA QUE DESEJA APAGAR TODO O SEU PROGRESSO?\n\nEsta ação destruirá seu histórico, atributos, missões e inventário. Você voltará ao nível 1 e o Onboarding será reiniciado.\n\nESTA AÇÃO NÃO PODE SER DESFEITA.");
            if (!confirmed) return;

            if (gameState.level > 5) {
                const confirmLevel5 = confirm(`⚠️ NÍVEL ATUAL: ${gameState.level}\n\nVocê tem certeza absoluta de que deseja apagar todo o seu progresso? Você perderá todos os seus níveis, itens, conquistas, XP e todo o seu Ouro. Esta ação não poderá ser desfeita.`);
                if (!confirmLevel5) return;
            }

            // Se estiver logado, deletar o perfil correspondente na nuvem do Supabase
            if (window._currentUserDbId && typeof window.deleteCurrentUserCloudProfile === 'function') {
                try {
                    await window.deleteCurrentUserCloudProfile();
                } catch (e) {
                    console.error('[Hard Reset] Erro ao limpar perfil na nuvem:', e);
                    alert("Erro ao limpar dados na nuvem: " + (e.message || e) + "\n\nO reset foi cancelado.");
                    return;
                }
            }

            localStorage.removeItem('lifeRPG_gameState');
            localStorage.removeItem('force_reset_v4');
            localStorage.removeItem('lifeRPG_chatCache');
            alert("O Sistema foi resetado. Reiniciando simulação...");
            window.location.reload();
        });
    }
}

// Carrega as configurações guardadas para a UI dos inputs
function loadSettingsToUI() {
    const times = gameState.notificationTimes || { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 };
    
    const pad = (n) => String(n).padStart(2, '0');
    
    document.getElementById('notif-morning-hour').value = times.morningHour;
    document.getElementById('notif-morning-min').value = pad(times.morningMin);
    document.getElementById('notif-evening-hour').value = times.eveningHour;
    document.getElementById('notif-evening-min').value = pad(times.eveningMin);

}

// Atualiza a badge visual de permissão
function updateNotificationPermissionUI() {
    const btnRequest = document.getElementById('btn-request-notif');
    if (!btnRequest) return;
    
    if (!('Notification' in window)) {
        btnRequest.innerText = 'NÃO SUPORTADO';
        btnRequest.disabled = true;
        btnRequest.style.opacity = '0.5';
        return;
    }
    
    const perm = Notification.permission;
    if (perm === 'granted') {
        btnRequest.innerText = 'ATIVADO';
        btnRequest.disabled = true;
        btnRequest.classList.add('active');
        btnRequest.style.opacity = '1';
    } else if (perm === 'denied') {
        btnRequest.innerText = 'BLOQUEADO';
        btnRequest.disabled = true;
        btnRequest.style.opacity = '0.5';
        btnRequest.classList.remove('active');
    } else {
        btnRequest.innerText = 'ATIVAR';
        btnRequest.disabled = false;
        btnRequest.style.opacity = '1';
        btnRequest.classList.remove('active');
    }
}

// Reschedule notifications in SW
function updateSWNotifications() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const times = gameState.notificationTimes || { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 };
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATIONS',
            ...times
        });
    }
}

// Envia status de missões pendentes para o Service Worker

// PWA Install promotion banner
function setupInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    const btnInstall = document.getElementById('btn-pwa-install');
    const btnDismiss = document.getElementById('btn-pwa-dismiss');
    const instructionsText = document.getElementById('install-banner-instructions');
    const btnFooterInstall = document.getElementById('btn-pwa-install-footer');

    // Detecta se é iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone) {
        console.log('[PWA] Rodando em standalone mode.');
        // Esconde o botão de rodapé e banner quando já instalado
        if (btnFooterInstall) btnFooterInstall.style.display = 'none';
        const footerWrapper = document.querySelector('.pwa-install-mobile-footer');
        if (footerWrapper) footerWrapper.style.display = 'none';
        return; // PWA já instalado e ativo
    }

    // === Botão de rodapé — SEMPRE visível (CSS já faz display:block) ===
    if (btnFooterInstall) {
        btnFooterInstall.addEventListener('click', () => {
            if (isIOS) {
                // iOS não suporta prompt nativo — mostra instruções manuais
                alert('Para instalar no iPhone/iPad:\n\n1. Toque no ícone de "Compartilhar" (quadrado com seta ↑ no Safari)\n2. Role a lista e toque em "Adicionar à Tela de Início"');
            } else if (deferredPrompt) {
                // Android/Desktop com prompt nativo disponível
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        btnFooterInstall.style.display = 'none';
                        const footerWrapper = document.querySelector('.pwa-install-mobile-footer');
                        if (footerWrapper) footerWrapper.style.display = 'none';
                    }
                    deferredPrompt = null;
                });
            } else {
                // Fallback: prompt nativo não disponível
                alert('Para instalar o LifeRPG:\n\n• No Chrome: Toque no menu (⋮) → "Instalar app" ou "Adicionar à tela de início"\n• No Safari: Toque em Compartilhar → "Adicionar à Tela de Início"\n• No Firefox: Toque no menu → "Instalar"');
            }
        });
    }

    // === Banner flutuante — lógica original ===
    if (isIOS) {
        if (instructionsText && btnInstall) {
            instructionsText.innerText = 'Para instalar no iOS: Toque em Compartilhar e depois "Adicionar à Tela de Início".';
            btnInstall.style.display = 'none';
        }
        setTimeout(() => {
            if (banner && localStorage.getItem('pwa_install_dismissed') !== 'true') {
                banner.classList.add('show');
            }
        }, 3000);
    } else {
        // Android/Desktop — captura o prompt nativo
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            if (banner && localStorage.getItem('pwa_install_dismissed') !== 'true') {
                banner.classList.add('show');
            }
        });
    }

    // Banner install button click (do banner flutuante)
    if (btnInstall) {
        btnInstall.addEventListener('click', () => {
            if (!deferredPrompt) return;
            if (banner) banner.classList.remove('show');
            
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('[PWA] Usuário aceitou a instalação.');
                    if (btnFooterInstall) btnFooterInstall.style.display = 'none';
                    const footerWrapper = document.querySelector('.pwa-install-mobile-footer');
                    if (footerWrapper) footerWrapper.style.display = 'none';
                }
                deferredPrompt = null;
            });
        });
    }

    // Banner dismiss button
    if (btnDismiss) {
        btnDismiss.addEventListener('click', () => {
            if (banner) banner.classList.remove('show');
            localStorage.setItem('pwa_install_dismissed', 'true');
        });
    }
}

// ONBOARD-003: revela o banner de instalação logo após o onboarding (Android/desktop).
// No iOS o banner já é exibido automaticamente. Não força nada se o usuário já dispensou.
window.promptInstallAfterOnboarding = function() {
    const banner = document.getElementById('pwa-install-banner');
    if (deferredPrompt && banner && localStorage.getItem('pwa_install_dismissed') !== 'true') {
        banner.classList.add('show');
    }
};


const VAPID_PUBLIC_KEY = 'BNzkAwPWHVgwr-EvHrliAwhleRc_Z7ArYuxJpAgy_2rMSkMbEQXNIMTpoex1SZWKol7ZgrzE2Iyt9Io9rXXTFU0';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[Push] Push não é suportado neste navegador.');
        return;
    }
    try {
        const reg = await navigator.serviceWorker.ready;
        const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

        // Se já existe uma inscrição com uma applicationServerKey DIFERENTE (ex.:
        // chave VAPID antiga), remove antes — o navegador recusa subscribe() com
        // uma chave diferente da inscrição existente (InvalidStateError).
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
            const cur = existing.options && existing.options.applicationServerKey
                ? new Uint8Array(existing.options.applicationServerKey) : null;
            const sameKey = cur && cur.length === appServerKey.length
                && cur.every((b, i) => b === appServerKey[i]);
            if (!sameKey) {
                await existing.unsubscribe();
            }
        }

        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey
        });
        console.log('[Push] Inscrito com sucesso no push manager:', subscription);

        // Se o usuário estiver autenticado no Supabase, salva no banco de dados
        if (window._currentUserDbId && typeof supabaseClient !== 'undefined') {
            const rawP256dh = subscription.getKey('p256dh');
            const rawAuth = subscription.getKey('auth');
            const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(rawP256dh)));
            const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuth)));

            const { data, error } = await supabaseClient
                .from('push_subscriptions')
                .upsert({
                    user_id: window._currentUserDbId,
                    endpoint: subscription.endpoint,
                    p256dh: p256dh,
                    auth: auth
                }, { onConflict: 'user_id,endpoint' });

            if (error) {
                console.error('[Push] Erro ao salvar inscrição no Supabase:', error.message);
            } else {
                console.log('[Push] Inscrição de push salva no Supabase.');
            }
        }
    } catch (err) {
        console.error('[Push] Erro ao inscrever para push:', err);
    }
};

async function unsubscribeUserFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
            // Remove do Supabase antes de desinscrever no navegador
            if (window._currentUserDbId && typeof supabaseClient !== 'undefined') {
                const { error } = await supabaseClient
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', subscription.endpoint);
                
                if (error) {
                    console.error('[Push] Erro ao deletar inscrição do Supabase:', error.message);
                } else {
                    console.log('[Push] Inscrição de push deletada do Supabase.');
                }
            }
            await subscription.unsubscribe();
            console.log('[Push] Desinscrito do push com sucesso.');
        }
    } catch (err) {
        console.error('[Push] Erro ao desinscrever de push:', err);
    }
};

// ==========================================================================
// PULL-TO-REFRESH — sincroniza com a nuvem ao arrastar (quando logado)
// ==========================================================================
function setupPullToRefresh() {
    let startY = 0;
    let pulling = false;
    let indicator = null;

    function getIndicator() {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'ptr-indicator';
            indicator.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0;
                display: flex; align-items: center; justify-content: center;
                height: 0; overflow: hidden;
                background: linear-gradient(135deg, #6c63ff, #4fc3f7);
                color: #fff; font-size: 13px; font-weight: 600;
                letter-spacing: 0.5px; z-index: 9999;
                transition: height 0.15s ease;
            `;
            indicator.innerHTML = '☁️ Solte para sincronizar';
            document.body.prepend(indicator);
        }
        return indicator;
    }

    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
            pulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const dist = e.touches[0].clientY - startY;
        if (dist > 10 && window.scrollY === 0) {
            const height = Math.min(dist * 0.4, 56);
            getIndicator().style.height = height + 'px';
        }
    }, { passive: true });

    document.addEventListener('touchend', async (e) => {
        if (!pulling) return;
        pulling = false;
        const ind = getIndicator();
        const dist = e.changedTouches[0].clientY - startY;

        if (dist > 70) {
            // Logado → sincronizar com a nuvem
            if (window._currentUserDbId && typeof window.forceLoadFromCloud === 'function') {
                if (!navigator.onLine) {
                    // Offline: não sincroniza, mas garante que os dados locais não se percam.
                    ind.innerHTML = '📴 Offline — não sincronizado';
                    showSystemToast('📴 Você está offline. Seus dados locais estão salvos e subirão quando reconectar.');
                } else {
                    ind.innerHTML = '☁️ Sincronizando...';
                    ind.style.height = '44px';
                    try {
                        await window.forceLoadFromCloud();
                        ind.innerHTML = '✅ Sincronizado!';
                        showSystemToast('☁️ Dados sincronizados com a nuvem.');
                    } catch (err) {
                        ind.innerHTML = '❌ Erro ao sincronizar';
                    }
                }
            } else {
                // Não logado → recarregar normalmente
                ind.innerHTML = '🔄 Recarregando...';
                ind.style.height = '44px';
                setTimeout(() => window.location.reload(), 200);
            }
            setTimeout(() => { ind.style.height = '0'; }, 1200);
        } else {
            ind.style.height = '0';
        }
    });
}

function setupOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (!banner) return;

    const updateOfflineStatus = () => {
        if (navigator.onLine) {
            banner.style.display = 'none';
            if (window._currentUserDbId && typeof window.saveToCloud === 'function') {
                window.saveToCloud();
            }
        } else {
            banner.style.display = 'block';
        }
    };

    window.addEventListener('offline', updateOfflineStatus);
    window.addEventListener('online', updateOfflineStatus);

    // Checagem inicial
    updateOfflineStatus();
}

export {
    registerServiceWorker,
    setupInstallPrompt,
    setupSettingsListeners,
    loadSettingsToUI,
    subscribeUserToPush,
    unsubscribeUserFromPush,
    setupPullToRefresh,
    setupOfflineBanner
};
