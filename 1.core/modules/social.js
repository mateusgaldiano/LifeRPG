// social.js
import { gameState, saveGameData, HABIT_LIBRARY } from './state.js';
import { getRankForLevel, localDateStr, getPlayerTerm } from './utils.js';
import { showSystemToast, updateUI } from './ui.js';
import { addSkillXP } from './game-logic.js';

// ==========================================================================
// BIBLIOTECA DE HÁBITOS & CONVERSA COM MENTOR IA (CLAUDE)
// ==========================================================================

let selectedLibraryHabit = null;
let activeLibraryFilter = 'all';

function setupHabitLibraryAndTabs() {
    const modalSq = document.getElementById('modal-sidequest');
    const tabCreateBtn = document.getElementById('modal-tab-create');
    const tabLibraryBtn = document.getElementById('modal-tab-library');
    const panelCreate = document.getElementById('modal-panel-create');
    const panelLibrary = document.getElementById('modal-panel-library');
    const searchInput = document.getElementById('library-search');

    if (!modalSq || !tabCreateBtn || !tabLibraryBtn || !panelCreate || !panelLibrary) return;

    // Reset when modal opens (Habit Library active by default)
    document.getElementById('btn-add-sidequest')?.addEventListener('click', () => {
        tabLibraryBtn.classList.add('active');
        tabCreateBtn.classList.remove('active');
        panelLibrary.classList.add('active');
        panelLibrary.style.display = 'flex';
        panelCreate.classList.remove('active');
        panelCreate.style.display = 'none';
        activeLibraryFilter = 'all';
        if (searchInput) searchInput.value = '';
        renderHabitLibrary('all', '');
    });

    tabCreateBtn.addEventListener('click', () => {
        tabCreateBtn.classList.add('active');
        tabLibraryBtn.classList.remove('active');
        panelCreate.classList.add('active');
        panelCreate.style.display = 'flex';
        panelLibrary.classList.remove('active');
        panelLibrary.style.display = 'none';
    });

    tabLibraryBtn.addEventListener('click', () => {
        tabLibraryBtn.classList.add('active');
        tabCreateBtn.classList.remove('active');
        panelLibrary.classList.add('active');
        panelLibrary.style.display = 'flex';
        panelCreate.classList.remove('active');
        panelCreate.style.display = 'none';
        renderHabitLibrary('all', '');
    });

    // Filtros de Categoria
    const filterBtns = document.querySelectorAll('.library-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeLibraryFilter = btn.getAttribute('data-filter');
            renderHabitLibrary(activeLibraryFilter, searchInput?.value || '');
        });
    });

    // Busca ao vivo
    searchInput?.addEventListener('input', (e) => {
        renderHabitLibrary(activeLibraryFilter, e.target.value);
    });

    // Confirmation Modal setup
    const modalConfirm = document.getElementById('modal-confirm-habit');
    const closeConfirm = document.getElementById('close-confirm-modal');
    const cancelConfirm = document.getElementById('btn-cancel-add-habit');
    const confirmDailyBtn = document.getElementById('btn-habit-confirm-daily');
    const confirmSideBtn = document.getElementById('btn-habit-confirm-side');
    const confirmWeeklyBtn = document.getElementById('btn-habit-confirm-weekly');
    const confirmWeeklySelector = document.getElementById('confirm-habit-weekly-day');

    const hideConfirm = () => {
        if (modalConfirm) modalConfirm.style.display = 'none';
        if (confirmDailyBtn) confirmDailyBtn.style.display = '';
        if (confirmSideBtn) confirmSideBtn.style.display = '';
        if (confirmWeeklySelector) confirmWeeklySelector.style.display = 'none';
        if (confirmWeeklyBtn) confirmWeeklyBtn.innerText = '📅 SEMANAL';
        confirmWeeklySelector?.querySelectorAll('.weekday-btn').forEach(b => b.classList.remove('active'));
    };

    closeConfirm?.addEventListener('click', hideConfirm);
    cancelConfirm?.addEventListener('click', hideConfirm);
    window.addEventListener('click', (e) => {
        if (e.target === modalConfirm) hideConfirm();
    });

    confirmDailyBtn?.addEventListener('click', () => {
        if (!selectedLibraryHabit) return;
        addHabitFromLibrary(selectedLibraryHabit, 'daily');
    });

    confirmSideBtn?.addEventListener('click', () => {
        if (!selectedLibraryHabit) return;
        addHabitFromLibrary(selectedLibraryHabit, 'side');
    });

    confirmWeeklyBtn?.addEventListener('click', () => {
        if (!selectedLibraryHabit) return;
        if (confirmWeeklySelector && confirmWeeklySelector.style.display === 'none') {
            confirmWeeklySelector.style.display = 'flex';
            if (confirmDailyBtn) confirmDailyBtn.style.display = 'none';
            if (confirmSideBtn) confirmSideBtn.style.display = 'none';
            confirmWeeklyBtn.innerText = '✓ CONFIRMAR';
        } else {
            const activeBtns = confirmWeeklySelector?.querySelectorAll('.weekday-btn.active');
            if (!activeBtns || activeBtns.length === 0) {
                alert('Selecione pelo menos um dia da semana!');
                return;
            }
            const days = Array.from(activeBtns).map(b => parseInt(b.getAttribute('data-day')));
            addHabitFromLibrary(selectedLibraryHabit, 'weekly', days);
        }
    });

    // Toggle button active classes for weekday buttons in confirmation modal
    const confirmDayButtons = document.querySelectorAll('#confirm-habit-weekly-day .weekday-btn');
    confirmDayButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.classList.toggle('active');
        });
    });
}

function addHabitFromLibrary(h, type = 'daily', daysOfWeek = []) {
    // Colisão removida: o usuário pode adicionar qualquer atividade livremente.
    // (A antiga regra por palavras-chave gerava falsos positivos e agregava pouco.)
    const isSq = (type === 'side');

    let xp = 25, gold = 20;
    if (h.difficulty === 'easy') { xp = 10; gold = 10; }
    else if (h.difficulty === 'hard') { xp = 50; gold = 40; }

    const prefix = isSq ? 'sq-lib-' : 'q-lib-';

    const newQuest = {
        id:        prefix + Date.now(),
        title:     h.title,
        type:      type,           // 'daily', 'side' ou 'weekly'
        skill:     h.skill,
        difficulty: h.difficulty,
        duration:  h.duration || 5,
        xp:        xp,
        gold:      gold,
        emoji:     h.icon || '⚔️',
        icon:      h.icon || '⚔️',
        completed: false,
        fromLibrary: true
    };

    if (type === 'weekly') {
        newQuest.daysOfWeek = daysOfWeek;
    }

    if (type === 'side') {
        gameState.sideQuests.push(newQuest);
        showSystemToast(`⚡ "${h.title}" adicionada às Side Quests!`);
    } else {
        const limit = gameState.dailyCommitmentMins || 60;
        const curTotal = (gameState.quests || []).reduce((sum, q) => sum + (q.duration || 5), 0);
        const habDur = h.duration || 5;
        
        gameState.quests.push(newQuest);
        if (type === 'weekly') {
            showSystemToast(`📅 "${h.title}" adicionada às Missões Semanais!`);
        } else {
            showSystemToast(`📅 "${h.title}" adicionada às Missões Diárias!`);
        }
        
        if (curTotal + habDur > limit) {
            setTimeout(() => {
                showSystemToast(`🌟 *EVOLUÇÃO:* Incrível! Parabéns por dedicar mais tempo para se aprimorar!`);
            }, 1200);
        }
    }

    // Outbox: registra a adição p/ subir de forma confiável (online ou offline).
    if (typeof window.queueQuestOp === 'function') window.queueQuestOp(newQuest.id, 'upsert');

    saveGameData();
    if (typeof checkAndProgressTutorialStep1 === 'function') {
        checkAndProgressTutorialStep1();
    }
    renderQuests();

    const modalConfirm = document.getElementById('modal-confirm-habit');
    if (modalConfirm) modalConfirm.style.display = 'none';

    const modalSq = document.getElementById('modal-sidequest');
    if (modalSq) modalSq.style.display = 'none';

    selectedLibraryHabit = null;
    
    // Restaurar estado dos botões
    const confirmDailyBtn = document.getElementById('btn-habit-confirm-daily');
    const confirmSideBtn = document.getElementById('btn-habit-confirm-side');
    const confirmWeeklyBtn = document.getElementById('btn-habit-confirm-weekly');
    const confirmWeeklySelector = document.getElementById('confirm-habit-weekly-day');
    if (confirmDailyBtn) confirmDailyBtn.style.display = '';
    if (confirmSideBtn) confirmSideBtn.style.display = '';
    if (confirmWeeklySelector) confirmWeeklySelector.style.display = 'none';
    if (confirmWeeklyBtn) confirmWeeklyBtn.innerText = '📅 SEMANAL';
    confirmWeeklySelector?.querySelectorAll('.weekday-btn').forEach(b => b.classList.remove('active'));
}

function renderHabitLibrary(filter = 'all', search = '') {
    const listContainer = document.getElementById('library-habits-list');
    if (!listContainer) return;

    const query = search.toLowerCase().trim();
    
    // Filter habits
    const filtered = HABIT_LIBRARY.filter(habit => {
        const matchesFilter = filter === 'all' || habit.skill === filter;
        const matchesSearch = habit.title.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:20px; font-size:11px; color:var(--text-muted);">Nenhum hábito encontrado.</div>';
        return;
    }

    const skillNames = {
        physical: 'Físico',
        mental: 'Mental',
        productivity: 'Foco',
        wisdom: 'Saber',
        routine: 'Rotina',
        social: 'Social'
    };

    let html = '';
    filtered.forEach(habit => {
        let diffLabel = 'MÉDIO', diffClass = 'diff-medium', xp = 25, gold = 20;
        if (habit.difficulty === 'easy') {
            diffLabel = 'FÁCIL'; diffClass = 'diff-easy'; xp = 10; gold = 10;
        } else if (habit.difficulty === 'hard') {
            diffLabel = 'DIFÍCIL'; diffClass = 'diff-hard'; xp = 50; gold = 40;
        }

        html += '<div class="library-item">' +
            '<div class="library-item-main">' +
                '<div class="library-item-icon">' + habit.icon + '</div>' +
                '<div class="library-item-info">' +
                    '<span class="library-item-title">' + habit.title + '</span>' +
                    '<div class="library-item-meta">' +
                        '<span class="library-badge category">' + (skillNames[habit.skill] || habit.skill) + '</span>' +
                        '<span class="library-badge ' + diffClass + '">' + diffLabel + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="btn-library-add" data-id="' + habit.id + '">ADICIONAR</button>' +
        '</div>';
    });

    listContainer.innerHTML = html;

    // Attach click listeners to Add buttons
    listContainer.querySelectorAll('.btn-library-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const habitId = btn.getAttribute('data-id');
            const habit = HABIT_LIBRARY.find(h => h.id === habitId);
            if (habit) {
                selectedLibraryHabit = habit;
                
                const modalConfirm = document.getElementById('modal-confirm-habit');
                const confirmDesc = document.getElementById('confirm-habit-desc');
                if (modalConfirm && confirmDesc) {
                    let diffLabel = 'Médio', xp = 25, gold = 20;
                    if (habit.difficulty === 'easy') { diffLabel = 'Fácil'; xp = 10; gold = 10; }
                    else if (habit.difficulty === 'hard') { diffLabel = 'Difícil'; xp = 50; gold = 40; }

                    let msgExtra = '';
                    const limit = gameState.dailyCommitmentMins || 60;
                    const curTotal = (gameState.quests || []).reduce((sum, q) => sum + (q.duration || 5), 0);
                    const habDur = habit.duration || 5;
                    if (curTotal + habDur > limit) {
                        msgExtra = '<br><br><span style="font-size: 0.75rem; color: #fbbf24; opacity: 0.9; display: block; text-align: center; margin-top: 10px; line-height: 1.3;">🌟 Parabéns por decidir dedicar mais tempo à sua evolução pessoal! Você está estendendo sua rotina diária planejada.</span>';
                    }

                    confirmDesc.innerHTML = 'Deseja adicionar o hábito <b>"' + habit.title + '"</b>?<br><br>Recompensas ao concluir: <b>+' + xp + ' XP</b> · <b>+' + gold + ' Ouro</b> · <b>+' + xp + ' Skill XP</b>' + msgExtra;
                    
                    const confirmDailyBtn = document.getElementById('btn-habit-confirm-daily');
                    const confirmSideBtn = document.getElementById('btn-habit-confirm-side');
                    const confirmWeeklyBtn = document.getElementById('btn-habit-confirm-weekly');
                    const confirmWeeklySelector = document.getElementById('confirm-habit-weekly-day');
                    
                    if (confirmDailyBtn) confirmDailyBtn.style.display = '';
                    if (confirmSideBtn) confirmSideBtn.style.display = '';
                    if (confirmWeeklySelector) confirmWeeklySelector.style.display = 'none';
                    if (confirmWeeklyBtn) confirmWeeklyBtn.innerText = '📅 SEMANAL';
                    confirmWeeklySelector?.querySelectorAll('.weekday-btn').forEach(b => b.classList.remove('active'));

                    if (habit.type === 'weekly') {
                        if (confirmWeeklySelector) {
                            confirmWeeklySelector.style.display = 'flex';
                            const defaultDays = habit.defaultDaysOfWeek || [0];
                            confirmWeeklySelector.querySelectorAll('.weekday-btn').forEach(b => {
                                const d = parseInt(b.getAttribute('data-day'));
                                if (defaultDays.includes(d)) b.classList.add('active');
                            });
                        }
                        if (confirmDailyBtn) confirmDailyBtn.style.display = 'none';
                        if (confirmSideBtn) confirmSideBtn.style.display = 'none';
                        if (confirmWeeklyBtn) confirmWeeklyBtn.innerText = '✓ CONFIRMAR';
                    }

                    modalConfirm.style.display = 'flex';
                }
            }
        });
    });
}




// ==========================================================================
// CENTRAL DA COMUNIDADE — CHAT GLOBAL E ONLINE PRESENCE
// ==========================================================================
let chatChannel = null;
let lastMessageTime = 0; // Para controle de rate limit local (2s)

async function enterCommunityTab() {
    // 1. Inicializar interface com base na autenticação
    updateChatInputState();
    
    // 2. Carregar últimas 50 mensagens
    await loadChatMessages();
    
    // 3. Inscrever nas mudanças em tempo real (Postgres Changes)
    setupRealtimeChat();

    // 4. Forçar render da lista de online (Presence já roda no boot/sessão)
    updateOnlinePlayersUI();
    
    // Configurar listeners de clique e envio se for a primeira vez
    setupChatListeners();
}

function exitCommunityTab() {
    if (chatChannel) {
        chatChannel.unsubscribe();
        chatChannel = null;
    }
}

function updateChatInputState() {
    const input = document.getElementById('chat-message-input');
    const btn = document.getElementById('btn-send-message');
    if (!input || !btn) return;

    if (window._currentUserDbId) {
        input.disabled = false;
        btn.disabled = false;
        input.placeholder = "Digite sua mensagem para a comunidade...";
    } else {
        input.disabled = true;
        btn.disabled = true;
        input.placeholder = "Faça login com o Google para enviar mensagens e aparecer online";
        input.value = "";
    }
}

async function loadChatMessages() {
    const chatContainer = document.getElementById('chat-messages-list');
    if (!chatContainer) return;

    // Carregar do cache local primeiro para exibição instantânea (com TTL de 6h)
    const cachedData = localStorage.getItem('lifeRPG_chatCache');
    let cacheLoaded = false;
    if (cachedData) {
        try {
            const cache = JSON.parse(cachedData);
            const isFresh = (Date.now() - (cache.cachedAt || 0)) < 6 * 3600 * 1000;
            if (isFresh && Array.isArray(cache.messages) && cache.messages.length > 0) {
                chatContainer.innerHTML = '';
                // Inverter para mostrar em ordem cronológica (mais antigas em cima, mais novas embaixo)
                const cronoMessages = [...cache.messages].reverse();
                cronoMessages.forEach(msg => {
                    appendMessageUI(msg);
                });
                scrollChatToBottom();
                cacheLoaded = true;
            } else if (!isFresh) {
                console.log('[Chat Cache] Cache expirou (mais de 6h). Removendo.');
                localStorage.removeItem('lifeRPG_chatCache');
            }
        } catch (e) {
            console.warn('[Chat Cache] Falha ao ler cache:', e);
        }
    }

    // Buscar mensagens mais recentes do canal global
    const { data: messages, error } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('channel', 'global')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Erro ao buscar mensagens do chat:', error.message);
        if (!cacheLoaded) {
            chatContainer.innerHTML = `<div class="chat-empty-state" style="color: var(--neon-red);">⚠️ Erro ao carregar mensagens.</div>`;
        }
        return;
    }

    // Salvar no cache local para futuras leituras rápidas
    try {
        localStorage.setItem('lifeRPG_chatCache', JSON.stringify({
            cachedAt: Date.now(),
            messages: messages
        }));
    } catch (e) {
        console.warn('[Chat Cache] Falha ao gravar no cache:', e);
    }

    chatContainer.innerHTML = '';
    
    if (messages.length === 0) {
        chatContainer.innerHTML = `<div class="chat-empty-state">Nenhuma mensagem no chat ainda. Envie a primeira!</div>`;
        return;
    }

    // Inverter para mostrar em ordem cronológica (mais antigas em cima, mais novas embaixo)
    const cronoMessages = [...messages].reverse();
    cronoMessages.forEach(msg => {
        appendMessageUI(msg);
    });

    scrollChatToBottom();
}

function setupRealtimeChat() {
    if (chatChannel) return;

    chatChannel = supabaseClient
        .channel('global-chat')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages'
            },
            (payload) => {
                if (payload.new && payload.new.channel === 'global') {
                    const chatContainer = document.getElementById('chat-messages-list');
                    if (chatContainer) {
                        // Remover empty state se houver
                        const emptyState = chatContainer.querySelector('.chat-empty-state');
                        if (emptyState) emptyState.remove();
                        
                        appendMessageUI(payload.new);
                        scrollChatToBottom();
                    }
                }
            }
        )
        .subscribe((status) => {
            console.log('[Realtime Chat Status]', status);
        });
}

function appendMessageUI(msg) {
    const chatContainer = document.getElementById('chat-messages-list');
    if (!chatContainer) return;

    // Evitar duplicados caso a inserção local e o evento de Realtime aconteçam quase juntos
    if (msg.id && document.querySelector(`[data-msg-id="${msg.id}"]`)) {
        return;
    }

    const isSelf = msg.user_id === window._currentUserDbId;
    
    // Criar elementos de forma segura contra XSS
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg${isSelf ? ' self' : ''}`;
    if (msg.id) {
        msgDiv.setAttribute('data-msg-id', msg.id);
    }

    const headerDiv = document.createElement('div');
    headerDiv.className = 'chat-msg-header';

    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'chat-msg-username';
    usernameSpan.textContent = msg.username;
    usernameSpan.style.cursor = 'pointer';
    usernameSpan.addEventListener('click', () => {
        if (msg.user_id) {
            openPlayerProfile(msg.user_id);
        }
    });

    const levelSpan = document.createElement('span');
    levelSpan.className = 'chat-msg-level';
    levelSpan.textContent = `Lvl ${msg.level}`;

    const rankSpan = document.createElement('span');
    const rankClass = msg.rank ? msg.rank.toLowerCase() : 'e';
    rankSpan.className = `rank-badge rank-${rankClass} chat-msg-rank`;
    rankSpan.textContent = `RANK ${msg.rank || 'E'}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'chat-msg-time';
    
    // Formatar hora (created_at)
    try {
        const date = new Date(msg.created_at);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        timeSpan.textContent = `${hours}:${minutes}`;
    } catch (e) {
        timeSpan.textContent = '';
    }

    // Montar cabeçalho
    headerDiv.appendChild(usernameSpan);
    headerDiv.appendChild(levelSpan);
    headerDiv.appendChild(rankSpan);
    headerDiv.appendChild(timeSpan);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'chat-msg-content';
    contentDiv.textContent = msg.content; // IMPEDIR XSS

    msgDiv.appendChild(headerDiv);
    msgDiv.appendChild(contentDiv);

    chatContainer.appendChild(msgDiv);
}

function scrollChatToBottom() {
    const chatContainer = document.getElementById('chat-messages-list');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function setupChatListeners() {
    const input = document.getElementById('chat-message-input');
    const btn = document.getElementById('btn-send-message');
    if (!input || !btn) return;

    // Remover listeners anteriores
    input.replaceWith(input.cloneNode(true));
    btn.replaceWith(btn.cloneNode(true));

    const newInput = document.getElementById('chat-message-input');
    const newBtn = document.getElementById('btn-send-message');

    newBtn.addEventListener('click', handleSendMessage);
    newInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
}

async function handleSendMessage() {
    const input = document.getElementById('chat-message-input');
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    // Rate limit local de 2 segundos
    const now = Date.now();
    if (now - lastMessageTime < 2000) {
        showSystemToast('⏳ Sistema em resfriamento. Aguarde 2 segundos.');
        return;
    }

    if (!window._currentUserDbId) {
        showSystemToast('⚠️ Faça login para enviar mensagens.');
        return;
    }

    // Desabilitar durante o envio
    input.disabled = true;
    const btn = document.getElementById('btn-send-message');
    if (btn) btn.disabled = true;

    const userRankLetter = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
    const { data, error } = await supabaseClient
        .from('chat_messages')
        .insert({
            user_id: window._currentUserDbId,
            username: gameState.playerName || 'Desperto',
            level: gameState.level,
            rank: userRankLetter,
            channel: 'global',
            content: content
        })
        .select();

    input.disabled = false;
    if (btn) btn.disabled = false;
    input.focus();

    if (error) {
        console.error('Erro ao enviar mensagem:', error.message);
        showSystemToast('⚠️ Falha ao transmitir mensagem ao chat.');
    } else {
        input.value = '';
        lastMessageTime = Date.now();
        if (data && data.length > 0) {
            // Remover empty state se houver
            const chatContainer = document.getElementById('chat-messages-list');
            if (chatContainer) {
                const emptyState = chatContainer.querySelector('.chat-empty-state');
                if (emptyState) emptyState.remove();
            }
            appendMessageUI(data[0]);
            scrollChatToBottom();
        }
    }
}

// --------------------------------------------------------------------------
// UI PRESENCE — Renderizar a lista de online sidebar
// --------------------------------------------------------------------------
function updateOnlinePlayersUI() {
    const countEl = document.getElementById('online-users-count');
    const listEl = document.getElementById('online-users-list');
    if (!listEl) return;

    const state = window.onlineUsersState || {};
    const presenceKeys = Object.keys(state);

    listEl.innerHTML = '';

    const uniquePlayersMap = new Map();

    presenceKeys.forEach(key => {
        const presences = state[key];
        if (Array.isArray(presences)) {
            presences.forEach(pres => {
                if (pres.user_id && !uniquePlayersMap.has(pres.user_id)) {
                    uniquePlayersMap.set(pres.user_id, pres);
                }
            });
        }
    });

    const uniquePlayers = Array.from(uniquePlayersMap.values());

    if (countEl) countEl.textContent = uniquePlayers.length;

    if (uniquePlayers.length === 0) {
        listEl.innerHTML = `<div style="text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 20px 0;">Nenhum jogador online.</div>`;
        return;
    }

    uniquePlayers.forEach(player => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'online-user-item';
        itemDiv.style.cursor = 'pointer';
        itemDiv.addEventListener('click', () => {
            if (player.user_id) {
                openPlayerProfile(player.user_id);
            }
        });

        const statusDot = document.createElement('span');
        statusDot.className = 'online-user-status';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'online-user-info';

        const topDiv = document.createElement('div');
        topDiv.className = 'online-user-top';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'online-user-name';
        nameSpan.textContent = player.username || 'Desperto';

        const rankSpan = document.createElement('span');
        const rankLetter = player.rank ? player.rank.toLowerCase() : 'e';
        rankSpan.className = `rank-badge rank-${rankLetter} online-user-rank`;
        rankSpan.textContent = `RANK ${player.rank || 'E'}`;

        const levelSpan = document.createElement('span');
        levelSpan.className = 'online-user-level';
        levelSpan.textContent = `Nível ${player.level || 1}`;

        topDiv.appendChild(nameSpan);
        topDiv.appendChild(rankSpan);
        
        infoDiv.appendChild(topDiv);
        infoDiv.appendChild(levelSpan);

        itemDiv.appendChild(statusDot);
        itemDiv.appendChild(infoDiv);

        listEl.appendChild(itemDiv);
    });
};


// ==========================================================================
// RECURSOS SOCIAIS: SUB-ABAS, BUSCA DE AMIGOS E PERFIS DE JOGADORES
// ==========================================================================

// Alternância de Sub-abas da Área Social (Chat, Amigos, Clã)
function initSocialSubTabs() {
    const subTabButtons = document.querySelectorAll('.sub-tab-btn[data-subtab]');
    const subTabContents = document.querySelectorAll('.sub-tab-content');
    
    subTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const subtabName = btn.getAttribute('data-subtab');
            
            subTabButtons.forEach(b => b.classList.remove('active'));
            subTabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            btn.classList.add('active');
            const targetContent = document.getElementById(`subtab-${subtabName}`);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = '';
            }
            
            if (subtabName === 'friends') {
                loadFriendsList();
            } else if (subtabName === 'duels') {
                loadDuelsList();
            } else if (subtabName === 'ranking') {
                if (window.currentRankingMode === 'friends') {
                    loadFriendsRanking();
                } else {
                    loadGlobalRanking();
                }
            }
        });
    });
}

// Retorna o endereço correto do avatar baseado na Skin ativa e Rank
function getPlayerAvatarSrc(activeSkin, rank, username) {
    const rankKey = (rank || 'candidato').toLowerCase();
    
    const avatarFileMap = {
        candidato:  { num: '1', name: 'e' },
        e:          { num: '1', name: 'e' },
        d:          { num: '2', name: 'd' },
        c:          { num: '3', name: 'c' },
        b:          { num: '4', name: 'b' },
        s:          { num: '6', name: 's' },
        nacional:   { num: '6', name: 's' },
        governante: { num: '6', name: 's' },
        monarca:    { num: '6', name: 's' }
    };
    
    const mapping = avatarFileMap[rankKey] || { num: '1', name: 'e' };
    
    let g = 'male';
    if (typeof gameState !== 'undefined') {
        if (!username || username === gameState.playerName) {
            g = gameState.gender || 'male';
        }
    }
    const folder = g === 'female' ? '0 - female' : '1 - male';
    return `2.assets/avatars/${folder}/${mapping.num}.rank-${mapping.name}.png`;
}

// Inicializar ouvintes do buscador de amigos
function initFriendsSearchListeners() {
    const btnSearch = document.getElementById('btn-friend-search');
    const inputSearch = document.getElementById('input-friend-search');
    if (btnSearch && inputSearch) {
        btnSearch.addEventListener('click', () => {
            handleFriendSearch();
        });
        inputSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleFriendSearch();
            }
        });
    }
}

// Pesquisa jogador pelo nome exato no Supabase
async function handleFriendSearch() {
    const input = document.getElementById('input-friend-search');
    const resultsDiv = document.getElementById('friend-search-results');
    if (!input || !resultsDiv) return;

    const query = input.value.trim();
    if (!query) return;

    if (!window._currentUserDbId) {
        showSystemToast('⚠️ Faça login para buscar jogadores.');
        return;
    }

    resultsDiv.innerHTML = '<div class="friends-empty-state">Buscando jogador...</div>';
    resultsDiv.style.display = 'block';

    const { data: users, error } = await supabaseClient
        .from('users')
        .select('id, username, level, rank, active_skin')
        .ilike('username', `%${query}%`)
        .limit(5);

    if (error) {
        console.error('Erro na busca de amigo:', error.message);
        resultsDiv.innerHTML = '<div class="friends-empty-state" style="color: var(--neon-red);">⚠️ Erro ao buscar jogador.</div>';
        return;
    }

    if (users.length === 0) {
        resultsDiv.innerHTML = '<div class="friends-empty-state">Nenhum jogador encontrado com este nome.</div>';
        return;
    }

    const filteredUsers = users.filter(u => u.id !== window._currentUserDbId);
    resultsDiv.innerHTML = '';

    if (users.length === 1 && users[0].id === window._currentUserDbId) {
        resultsDiv.innerHTML = '<div class="friends-empty-state">Você encontrou a si mesmo! 🌌</div>';
        return;
    }

    if (filteredUsers.length === 0) {
        resultsDiv.innerHTML = '<div class="friends-empty-state">Nenhum jogador encontrado com este nome.</div>';
        return;
    }

    filteredUsers.forEach(u => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'online-user-item';
        itemDiv.style.cursor = 'pointer';
        itemDiv.style.margin = '10px 20px';
        itemDiv.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        itemDiv.style.borderRadius = 'var(--radius-md)';
        itemDiv.style.background = 'rgba(255, 255, 255, 0.01)';
        itemDiv.style.padding = '12px 16px';
        itemDiv.style.display = 'flex';
        itemDiv.style.alignItems = 'center';

        itemDiv.addEventListener('click', () => {
            openPlayerProfile(u.id);
            resultsDiv.style.display = 'none';
            input.value = '';
        });

        const avatar = document.createElement('img');
        avatar.src = getPlayerAvatarSrc(u.active_skin, u.rank, u.username);
        avatar.style.width = '36px';
        avatar.style.height = '36px';
        avatar.style.borderRadius = '50%';
        avatar.style.border = '1px solid var(--neon-cyan)';
        
        const info = document.createElement('div');
        info.className = 'online-user-info';
        info.style.marginLeft = '12px';
        info.style.flex = '1';

        const top = document.createElement('div');
        top.className = 'online-user-top';
        top.style.display = 'flex';
        top.style.alignItems = 'center';
        top.style.gap = '8px';

        const name = document.createElement('span');
        name.className = 'online-user-name';
        name.style.fontWeight = 'bold';
        name.style.color = 'white';
        name.textContent = u.username;

        const rank = document.createElement('span');
        const rLetter = u.rank ? u.rank.toLowerCase() : 'e';
        rank.className = `rank-badge rank-${rLetter} online-user-rank`;
        rank.textContent = `RANK ${u.rank || 'E'}`;

        const lvl = document.createElement('div');
        lvl.className = 'online-user-level';
        lvl.style.fontSize = '11px';
        lvl.style.color = 'var(--text-secondary)';
        lvl.textContent = `Nível ${u.level || 1}`;

        top.appendChild(name);
        top.appendChild(rank);
        info.appendChild(top);
        info.appendChild(lvl);
        itemDiv.appendChild(avatar);
        itemDiv.appendChild(info);
        
        resultsDiv.appendChild(itemDiv);
    });
}

// Carrega amigos e solicitações de amizade do Supabase
async function loadFriendsList() {
    const friendsContainer = document.getElementById('friends-list-container');
    const pendingContainer = document.getElementById('pending-requests-list');
    const pendingCard = document.getElementById('card-pending-requests');
    const tabBadge = document.getElementById('pending-requests-badge');

    if (!friendsContainer || !pendingContainer || !pendingCard) return;

    if (!window._currentUserDbId) {
        friendsContainer.innerHTML = '<div class="friends-empty-state">Faça login com o Google para ver sua lista de amigos.</div>';
        pendingContainer.innerHTML = '';
        pendingCard.style.display = 'none';
        if (tabBadge) tabBadge.style.display = 'none';
        return;
    }

    // 1. Buscar todas as relações da tabela friendships onde eu esteja envolvido
    const { data: friendships, error } = await supabaseClient
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${window._currentUserDbId},target_id.eq.${window._currentUserDbId}`);

    if (error) {
        console.error('Erro ao buscar amizades:', error.message);
        friendsContainer.innerHTML = '<div class="friends-empty-state" style="color: var(--neon-red);">⚠️ Erro ao carregar amigos.</div>';
        return;
    }

    friendsContainer.innerHTML = '';
    pendingContainer.innerHTML = '';

    const pendingRequests = [];
    const activeFriendsIds = [];
    const friendshipMap = new Map(); // mapear userId -> friendship object

    friendships.forEach(f => {
        if (f.status === 'pending') {
            if (f.target_id === window._currentUserDbId) {
                // Solicitação recebida pendente
                pendingRequests.push(f);
            }
        } else if (f.status === 'accepted') {
            const friendId = f.requester_id === window._currentUserDbId ? f.target_id : f.requester_id;
            activeFriendsIds.push(friendId);
            friendshipMap.set(friendId, f);
        }
    });

    // Atualizar badge de solicitações recebidas
    if (tabBadge) {
        if (pendingRequests.length > 0) {
            tabBadge.textContent = pendingRequests.length;
            tabBadge.style.display = 'inline-flex';
        } else {
            tabBadge.style.display = 'none';
        }
    }

    // 2. Renderizar solicitações pendentes recebidas
    if (pendingRequests.length > 0) {
        pendingCard.style.display = 'block';
        
        // Buscar detalhes dos usuários solicitantes
        const requesterIds = pendingRequests.map(r => r.requester_id);
        const { data: requesters, error: reqError } = await supabaseClient
            .from('users')
            .select('id, username, level, rank, active_skin')
            .in('id', requesterIds);

        if (!reqError && requesters) {
            requesters.forEach(user => {
                const relation = pendingRequests.find(r => r.requester_id === user.id);
                if (!relation) return;

                const row = document.createElement('div');
                row.className = 'online-user-item';
                row.style.background = 'rgba(251, 191, 36, 0.02)';
                row.style.border = '1px solid rgba(251, 191, 36, 0.1)';
                row.style.borderRadius = 'var(--radius-md)';
                row.style.padding = '10px 14px';
                row.style.marginBottom = '8px';

                row.addEventListener('click', () => {
                    openPlayerProfile(user.id);
                });

                const avatar = document.createElement('img');
                avatar.src = getPlayerAvatarSrc(user.active_skin, user.rank, user.username);
                avatar.style.width = '36px';
                avatar.style.height = '36px';
                avatar.style.borderRadius = '50%';
                avatar.style.cursor = 'pointer';
                
                const info = document.createElement('div');
                info.className = 'online-user-info';
                info.style.marginLeft = '12px';
                info.style.flex = '1';
                info.style.cursor = 'pointer';

                const top = document.createElement('div');
                top.className = 'online-user-top';
                const name = document.createElement('span');
                name.className = 'online-user-name';
                name.textContent = user.username;
                top.appendChild(name);
                
                const lvl = document.createElement('div');
                lvl.className = 'online-user-level';
                lvl.textContent = `Lvl ${user.level || 1}`;
                info.appendChild(top);
                info.appendChild(lvl);

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '8px';

                const btnAccept = document.createElement('button');
                btnAccept.className = 'btn-toggle-pill active';
                btnAccept.style.background = 'rgba(16, 185, 129, 0.2)';
                btnAccept.style.border = '1px solid rgba(16, 185, 129, 0.4)';
                btnAccept.style.color = '#10b981';
                btnAccept.textContent = 'Aceitar';
                btnAccept.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    btnAccept.disabled = true;
                    const { error } = await supabaseClient
                        .from('friendships')
                        .update({ status: 'accepted' })
                        .eq('id', relation.id);
                    if (!error) {
                        showSystemToast('🤝 Amizade aceita!');
                        loadFriendsList();
                    } else {
                        showSystemToast('⚠️ Erro ao aceitar.');
                        btnAccept.disabled = false;
                    }
                });

                const btnDecline = document.createElement('button');
                btnDecline.className = 'btn-toggle-pill';
                btnDecline.style.background = 'rgba(239, 68, 68, 0.1)';
                btnDecline.style.border = '1px solid rgba(239, 68, 68, 0.2)';
                btnDecline.style.color = 'var(--text-muted)';
                btnDecline.textContent = 'Recusar';
                btnDecline.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    btnDecline.disabled = true;
                    const { error } = await supabaseClient
                        .from('friendships')
                        .delete()
                        .eq('id', relation.id);
                    if (!error) {
                        showSystemToast('Solicitação recusada.');
                        loadFriendsList();
                    } else {
                        showSystemToast('⚠️ Erro ao recusar.');
                        btnDecline.disabled = false;
                    }
                });

                actions.appendChild(btnAccept);
                actions.appendChild(btnDecline);
                row.appendChild(avatar);
                row.appendChild(info);
                row.appendChild(actions);

                pendingContainer.appendChild(row);
            });
        }
    } else {
        pendingCard.style.display = 'none';
    }

    // 3. Renderizar Amigos Aceitos
    if (activeFriendsIds.length > 0) {
        const { data: friends, error: friendsError } = await supabaseClient
            .from('users')
            .select('id, username, level, rank, active_skin')
            .in('id', activeFriendsIds);

        if (friendsError) {
            console.error('Erro ao carregar detalhes dos amigos:', friendsError.message);
            friendsContainer.innerHTML = '<div class="friends-empty-state" style="color: var(--neon-red);">⚠️ Erro ao carregar detalhes dos amigos.</div>';
            return;
        }

        if (friends && friends.length > 0) {
            // Ordenar por status online e depois por nome
            const onlinePresenceState = window.onlineUsersState || {};
            const onlineUserIds = new Set(
                Object.values(onlinePresenceState)
                    .flat()
                    .map(p => p.user_id)
            );

            friends.sort((a, b) => {
                const aOnline = onlineUserIds.has(a.id);
                const bOnline = onlineUserIds.has(b.id);
                if (aOnline && !bOnline) return -1;
                if (!aOnline && bOnline) return 1;
                return a.username.localeCompare(b.username);
            });

            friends.forEach(user => {
                const isOnline = onlineUserIds.has(user.id);

                const row = document.createElement('div');
                row.className = 'online-user-item';
                row.style.cursor = 'pointer';
                row.style.padding = '10px 14px';
                row.style.border = '1px solid var(--border-color)';
                row.style.borderRadius = 'var(--radius-md)';
                row.style.marginBottom = '8px';
                row.style.background = isOnline ? 'rgba(0, 242, 254, 0.01)' : 'rgba(0, 0, 0, 0.1)';

                row.addEventListener('click', () => {
                    openPlayerProfile(user.id);
                });

                const statusDot = document.createElement('span');
                statusDot.className = `online-user-status${isOnline ? '' : ' offline'}`;
                statusDot.style.background = isOnline ? 'var(--neon-cyan)' : '#4b5563';
                statusDot.style.boxShadow = isOnline ? '0 0 8px var(--neon-cyan)' : 'none';

                const avatar = document.createElement('img');
                avatar.src = getPlayerAvatarSrc(user.active_skin, user.rank, user.username);
                avatar.style.width = '36px';
                avatar.style.height = '36px';
                avatar.style.borderRadius = '50%';
                avatar.style.marginLeft = '8px';

                const info = document.createElement('div');
                info.className = 'online-user-info';
                info.style.marginLeft = '12px';
                info.style.flex = '1';

                const top = document.createElement('div');
                top.className = 'online-user-top';
                const name = document.createElement('span');
                name.className = 'online-user-name';
                name.textContent = user.username;
                top.appendChild(name);
                
                const lvl = document.createElement('div');
                lvl.className = 'online-user-level';
                lvl.textContent = `Nível ${user.level || 1} | RANK ${(user.rank || 'E').toUpperCase()}`;
                info.appendChild(top);
                info.appendChild(lvl);

                const rightContainer = document.createElement('div');
                rightContainer.style.display = 'flex';
                rightContainer.style.alignItems = 'center';
                rightContainer.style.gap = '10px';

                const statusText = document.createElement('span');
                statusText.style.fontSize = '9px';
                statusText.style.color = isOnline ? 'var(--neon-cyan)' : 'var(--text-muted)';
                statusText.style.fontFamily = 'var(--font-hud)';
                statusText.style.fontWeight = 'bold';
                statusText.textContent = isOnline ? 'ONLINE' : 'OFFLINE';
                rightContainer.appendChild(statusText);

                // Botao Desafiar PvP
                const btnChallenge = document.createElement('button');
                btnChallenge.className = 'btn-toggle-pill';
                btnChallenge.style.background = 'rgba(251, 191, 36, 0.1)';
                btnChallenge.style.border = '1px solid rgba(251, 191, 36, 0.3)';
                btnChallenge.style.color = 'var(--neon-gold)';
                btnChallenge.style.padding = '4px 10px';
                btnChallenge.style.fontSize = '10px';
                btnChallenge.style.fontWeight = 'bold';
                btnChallenge.style.fontFamily = 'var(--font-hud)';
                btnChallenge.textContent = '⚔️ DESAFIAR';
                btnChallenge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openPvpChallengeModal(user.id);
                });
                rightContainer.appendChild(btnChallenge);

                row.appendChild(statusDot);
                row.appendChild(avatar);
                row.appendChild(info);
                row.appendChild(rightContainer);

                friendsContainer.appendChild(row);
            });
        } else {
            friendsContainer.innerHTML = '<div class="friends-empty-state">Nenhum amigo ativo. Que tal adicionar alguns no Chat Global?</div>';
        }
    } else {
        friendsContainer.innerHTML = '<div class="friends-empty-state">Nenhum amigo ativo. Que tal adicionar alguns no Chat Global?</div>';
    }
}

// Abre o perfil do jogador e carrega as estatísticas, atributos e atividades recorrentes
async function openPlayerProfile(userId) {
    const modal = document.getElementById('modal-player-profile');
    if (!modal) return;

    // Elementos da UI
    const avatarImg = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-username');
    const titleEl = document.getElementById('profile-title');
    const lvlRankEl = document.getElementById('profile-level-rank');
    const streakEl = document.getElementById('profile-stat-streak');
    const goldEl = document.getElementById('profile-stat-gold');
    const xpEl = document.getElementById('profile-stat-xp');
    const skillsList = document.getElementById('profile-skills-list');
    const activitiesList = document.getElementById('profile-activities-list');
    const actionBtn = document.getElementById('btn-profile-friend-action');
    const declineBtn = document.getElementById('btn-profile-friend-decline');
    const pvpChallengeBtn = document.getElementById('btn-profile-pvp-challenge');

    if (!nameEl || !actionBtn || !declineBtn) return;

    // Estado de Carregamento Inicial
    nameEl.textContent = 'Carregando...';
    if (lvlRankEl) lvlRankEl.textContent = '';
    if (streakEl) streakEl.textContent = '—';
    if (goldEl) goldEl.textContent = '—';
    if (xpEl) xpEl.textContent = '—';
    if (skillsList) skillsList.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.75rem;">Carregando atributos...</div>';
    if (activitiesList) activitiesList.innerHTML = '<div class="profile-activities-placeholder">Carregando atividades...</div>';
    actionBtn.style.display = 'none';
    declineBtn.style.display = 'none';
    if (pvpChallengeBtn) pvpChallengeBtn.style.display = 'none';

    modal.style.display = 'block';

    // 1. Carregar perfil do banco
    const { data: user, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        console.error('Erro ao carregar perfil:', error?.message);
        nameEl.textContent = 'Erro';
        if (skillsList) skillsList.innerHTML = '<div style="text-align:center; color:var(--neon-red); font-size:0.75rem;">Erro ao carregar perfil.</div>';
        return;
    }

    // Preencher dados básicos
    nameEl.textContent = user.username;
    avatarImg.src = getPlayerAvatarSrc(user.active_skin, user.rank, user.username);
    
    if (user.active_title) {
        titleEl.textContent = user.active_title;
        titleEl.style.display = 'inline-block';
    } else {
        const defaultTitles = {
            candidato: 'Candidato',
            e: 'Recruta',
            d: 'Aventureiro',
            c: 'Caçador',
            b: 'Elite',
            s: 'O Sistema',
            nacional: 'Caçador Nacional',
            governante: 'Governante',
            monarca: 'Monarca'
        };
        const rKey = (user.rank || 'candidato').toLowerCase();
        titleEl.textContent = defaultTitles[rKey] || 'Candidato';
        titleEl.style.display = 'inline-block';
    }

    lvlRankEl.textContent = `Nível ${user.level || 1} | RANK ${(user.rank || 'E').toUpperCase()}`;
    streakEl.textContent = user.streak || 0;
    goldEl.textContent = user.gold || 0;
    xpEl.textContent = user.xp || 0;

    // Renderizar Atributos/Skills
    if (skillsList) {
        skillsList.innerHTML = '';
        const skillNamesMap = {
            physical: 'Força 💪',
            routine:  'Rotina 🛏️',
            mental:   'Mente 🧠',
            wisdom:   'Sabedoria 📚',
            focus:    'Foco 🎯',
            social:   'Social 🤝'
        };
        const skillColorsMap = {
            physical: '#ef4444',
            routine:  '#3b82f6',
            mental:   '#a855f7',
            wisdom:   '#eab308',
            focus:    '#06b6d4',
            social:   '#10b981'
        };

        const userSkills = user.skills || {};
        Object.entries(skillNamesMap).forEach(([key, label]) => {
            const val = userSkills[key] || 0;
            const lvl = Math.floor(val / 100) + 1;
            const percent = val % 100;

            const row = document.createElement('div');
            row.className = 'profile-skill-row';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'profile-skill-name';
            nameSpan.textContent = label;

            const barWrap = document.createElement('div');
            barWrap.className = 'profile-skill-bar-wrap';

            const barFill = document.createElement('div');
            barFill.className = 'profile-skill-bar-fill';
            barFill.style.width = `${percent}%`;
            barFill.style.backgroundColor = skillColorsMap[key] || 'var(--neon-cyan)';
            barFill.style.boxShadow = `0 0 8px ${skillColorsMap[key] || 'var(--neon-cyan)'}`;

            const lvlSpan = document.createElement('span');
            lvlSpan.className = 'profile-skill-level';
            lvlSpan.textContent = `Lvl ${lvl}`;

            barWrap.appendChild(barFill);
            row.appendChild(nameSpan);
            row.appendChild(barWrap);
            row.appendChild(lvlSpan);

            skillsList.appendChild(row);
        });
    }

    // 2. Checar status da amizade com o usuário atual
    let relationship = null;
    let isSelf = userId === window._currentUserDbId;
    window._profileViewTarget = userId;

    if (window._currentUserDbId && !isSelf) {
        const { data: rel, error: relError } = await supabaseClient
            .from('friendships')
            .select('*')
            .or(`and(requester_id.eq.${window._currentUserDbId},target_id.eq.${userId}),and(requester_id.eq.${userId},target_id.eq.${window._currentUserDbId})`)
            .maybeSingle();
        
        if (!relError) {
            relationship = rel;
        }
    }

    // 3. Atualizar botões de amizade baseado no status
    actionBtn.style.display = 'block';
    actionBtn.disabled = false;
    actionBtn.style.background = '';
    actionBtn.style.border = '';
    actionBtn.style.color = '';

    if (pvpChallengeBtn) {
        pvpChallengeBtn.style.display = isSelf ? 'none' : 'block';
    }

    // Remover antigos event listeners clonando os botões
    const newActionBtn = actionBtn.cloneNode(true);
    actionBtn.replaceWith(newActionBtn);
    const newDeclineBtn = declineBtn.cloneNode(true);
    declineBtn.replaceWith(newDeclineBtn);

    if (isSelf) {
        newActionBtn.style.display = 'none';
        newDeclineBtn.style.display = 'none';
        
        // Se for você mesmo, pode ver suas próprias atividades!
        await loadProfileActivities(window._currentUserDbId, activitiesList, true);
    } else if (!window._currentUserDbId) {
        newActionBtn.style.display = 'block';
        newActionBtn.textContent = 'FAÇA LOGIN PARA ADICIONAR';
        newActionBtn.disabled = true;
        activitiesList.innerHTML = '<div class="profile-activities-placeholder">Faça login para adicionar este amigo e ver suas atividades.</div>';
    } else if (!relationship) {
        // Sem relação ainda
        newActionBtn.style.display = 'block';
        newActionBtn.textContent = 'ADICIONAR AMIGO';
        newActionBtn.addEventListener('click', async () => {
            newActionBtn.disabled = true;
            newActionBtn.textContent = 'Enviando...';
            const { error: insertError } = await supabaseClient
                .from('friendships')
                .insert({
                    requester_id: window._currentUserDbId,
                    target_id: userId,
                    status: 'pending'
                });
            if (!insertError) {
                showSystemToast('✉️ Solicitação enviada!');
                openPlayerProfile(userId); // Recarregar perfil
                if (typeof loadFriendsList === 'function') loadFriendsList();
            } else {
                showSystemToast('⚠️ Erro ao enviar solicitação.');
                newActionBtn.disabled = false;
                newActionBtn.textContent = 'ADICIONAR AMIGO';
            }
        });
        activitiesList.innerHTML = '<div class="profile-activities-placeholder">Adicione este jogador como amigo para ver suas atividades recorrentes.</div>';
    } else if (relationship.status === 'pending') {
        if (relationship.requester_id === window._currentUserDbId) {
            // Eu enviei o convite
            newActionBtn.style.display = 'block';
            newActionBtn.textContent = 'SOLICITAÇÃO PENDENTE';
            newActionBtn.disabled = true;
            newActionBtn.style.background = 'rgba(255,255,255,0.05)';
            newActionBtn.style.border = '1px solid rgba(255,255,255,0.1)';
            newActionBtn.style.color = 'var(--text-muted)';
            activitiesList.innerHTML = '<div class="profile-activities-placeholder">Aguardando este jogador aceitar seu convite de amizade.</div>';
        } else {
            // Eu recebi o convite
            newActionBtn.style.display = 'block';
            newActionBtn.textContent = 'ACEITAR SOLICITAÇÃO';
            newActionBtn.style.background = 'rgba(16, 185, 129, 0.2)';
            newActionBtn.style.border = '1px solid rgba(16, 185, 129, 0.4)';
            newActionBtn.style.color = '#10b981';

            newActionBtn.addEventListener('click', async () => {
                newActionBtn.disabled = true;
                const { error: updateError } = await supabaseClient
                    .from('friendships')
                    .update({ status: 'accepted' })
                    .eq('id', relationship.id);
                if (!updateError) {
                    showSystemToast('🤝 Amizade iniciada!');
                    openPlayerProfile(userId); // Recarregar
                    if (typeof loadFriendsList === 'function') loadFriendsList();
                } else {
                    showSystemToast('⚠️ Erro ao aceitar.');
                    newActionBtn.disabled = false;
                }
            });

            newDeclineBtn.style.display = 'block';
            newDeclineBtn.textContent = 'RECUSAR SOLICITAÇÃO';
            newDeclineBtn.addEventListener('click', async () => {
                newDeclineBtn.disabled = true;
                const { error: deleteError } = await supabaseClient
                    .from('friendships')
                    .delete()
                    .eq('id', relationship.id);
                if (!deleteError) {
                    showSystemToast('Solicitação recusada.');
                    modal.style.display = 'none'; // Fecha o modal
                    if (typeof loadFriendsList === 'function') loadFriendsList();
                } else {
                    showSystemToast('⚠️ Erro ao recusar.');
                    newDeclineBtn.disabled = false;
                }
            });

            activitiesList.innerHTML = '<div class="profile-activities-placeholder">Aceite a solicitação de amizade para ver as atividades recorrentes.</div>';
        }
    } else if (relationship.status === 'accepted') {
        // Amigos ativos
        newActionBtn.style.display = 'block';
        newActionBtn.textContent = 'DESFAZER AMIZADE';
        newActionBtn.className = 'btn-submit btn-danger';
        newActionBtn.style.background = 'rgba(239, 68, 68, 0.15)';
        newActionBtn.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        newActionBtn.style.color = '#ef4444';

        newActionBtn.addEventListener('click', async () => {
            if (!confirm('Deseja realmente remover este amigo? Você perderá o acesso às atividades dele.')) return;
            newActionBtn.disabled = true;
            const { error: deleteError } = await supabaseClient
                .from('friendships')
                .delete()
                .eq('id', relationship.id);
            if (!deleteError) {
                showSystemToast('Amizade desfeita.');
                modal.style.display = 'none'; // Fecha
                if (typeof loadFriendsList === 'function') loadFriendsList();
            } else {
                showSystemToast('⚠️ Erro ao desfazer amizade.');
                newActionBtn.disabled = false;
            }
        });

        // Carregar atividades recorrentes do amigo!
        await loadProfileActivities(userId, activitiesList, false);
    }
}

// Busca e renderiza as atividades do perfil do jogador
async function loadProfileActivities(userId, container, isSelf) {
    if (!container) return;

    // Buscar missões recorrentes (hábitos/diárias) no Supabase
    const { data: quests, error } = await supabaseClient
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .eq('recurring', true);

    if (error) {
        console.error('Erro ao buscar atividades do perfil:', error.message);
        container.innerHTML = '<div class="profile-activities-placeholder" style="color: var(--neon-red);">⚠️ Falha ao ler atividades.</div>';
        return;
    }

    if (!quests || quests.length === 0) {
        container.innerHTML = `<div class="profile-activities-placeholder">${isSelf ? 'Você' : 'O jogador'} não possui hábitos ou atividades recorrentes ativas.</div>`;
        return;
    }

    container.innerHTML = '';

    // Ordenar: incompletas primeiro
    quests.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);

    quests.forEach(quest => {
        const item = document.createElement('div');
        item.className = 'profile-quest-item';
        
        // Estilizar se concluído
        if (quest.completed) {
            item.style.opacity = '0.6';
            item.style.borderLeft = '3px solid #10b981';
        } else {
            const skillColors = { physical: '#ef4444', routine: '#3b82f6', mental: '#a855f7', wisdom: '#eab308', focus: '#06b6d4', social: '#10b981' };
            const color = skillColors[quest.skill] || 'var(--neon-cyan)';
            item.style.borderLeft = `3px solid ${color}`;
        }

        const titleBox = document.createElement('div');
        titleBox.className = 'profile-quest-title-box';

        const emoji = document.createElement('span');
        emoji.className = 'profile-quest-emoji';
        emoji.textContent = quest.emoji || '⚔️';

        const title = document.createElement('span');
        title.className = 'profile-quest-title';
        title.textContent = quest.title;

        titleBox.appendChild(emoji);
        titleBox.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'profile-quest-meta';
        
        // Mostrar status de progresso se for numérica/streak
        if (quest.target && quest.target > 1) {
            meta.textContent = `${quest.current || 0}/${quest.target} (${quest.difficulty})`;
        } else {
            meta.textContent = quest.completed ? `Concluído` : `${quest.difficulty}`;
        }

        item.appendChild(titleBox);
        item.appendChild(meta);

        container.appendChild(item);
    });
}

// Ouvintes de fechamento do Modal de Perfil
function setupPlayerProfileListeners() {
    const modal = document.getElementById('modal-player-profile');
    const closeBtn = document.getElementById('close-profile-modal');
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        // Fechar ao clicar fora da caixa do modal
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Ouvinte para desafiar jogador direto do perfil
    const pvpChallengeBtn = document.getElementById('btn-profile-pvp-challenge');
    if (pvpChallengeBtn && modal) {
        pvpChallengeBtn.addEventListener('click', () => {
            if (window._profileViewTarget) {
                modal.style.display = 'none';
                if (typeof openPvpChallengeModal === 'function') {
                    openPvpChallengeModal(window._profileViewTarget);
                }
            }
        });
    }
}

// Ouvintes do Modal Social (Chat, Amigos, Clã)
function setupSocialModalListeners() {
    const modalSocial = document.getElementById('modal-social');
    const btnOpenSocial = document.getElementById('btn-header-social');
    const btnCloseSocial = document.getElementById('close-social-modal');

    if (btnOpenSocial && modalSocial && btnCloseSocial) {
        btnOpenSocial.addEventListener('click', () => {
            modalSocial.style.display = 'flex';
            
            // Inicializar sub-abas sociais
            const activeSubtab = document.querySelector('.sub-tab-btn.active');
            const subtabName = activeSubtab ? activeSubtab.getAttribute('data-subtab') : 'chat';
            
            if (subtabName === 'chat') {
                if (typeof enterCommunityTab === 'function') {
                    enterCommunityTab();
                }
            } else if (subtabName === 'friends') {
                if (typeof loadFriendsList === 'function') {
                    loadFriendsList();
                }
            } else if (subtabName === 'duels') {
                if (typeof loadDuelsList === 'function') {
                    loadDuelsList();
                }
            }
        });

        // Configurar botoes do modal PvP
        const btnClosePvp = document.getElementById('close-pvp-modal');
        if (btnClosePvp) {
            btnClosePvp.addEventListener('click', () => {
                closePvpChallengeModal();
            });
        }

        const btnSubmitPvp = document.getElementById('btn-submit-pvp-challenge');
        if (btnSubmitPvp) {
            btnSubmitPvp.addEventListener('click', () => {
                submitPvpChallenge();
            });
        }

        btnCloseSocial.addEventListener('click', () => {
            modalSocial.style.display = 'none';
            if (typeof exitCommunityTab === 'function') {
                exitCommunityTab();
            }
        });

        // Clique fora do modal para fechar
        window.addEventListener('click', (e) => {
            if (e.target === modalSocial) {
                modalSocial.style.display = 'none';
                if (typeof exitCommunityTab === 'function') {
                    exitCommunityTab();
                }
            }
        });

        // PWA-001: Resize do visualViewport para contornar teclado virtual no iOS Safari
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const chatBox = document.querySelector('.social-modal-body');
                if (chatBox) chatBox.style.height = window.visualViewport.height * 0.75 + 'px';
            });
        }
    }
}

// Renderiza o banner dinâmico do tutorial questline
function renderTutorialBanner() {
    const banner = document.getElementById('tutorial-questline-banner');
    
    // Atualiza a visualização do card da skin "Mestre das Sombras" se estiver na etapa 2
    const shadowMasterCard = document.querySelector('div[onclick="buyStoreItem(\'skin_shadow_master\')"]');
    if (shadowMasterCard) {
        const costEl = shadowMasterCard.querySelector('.reward-cost');
        const descEl = shadowMasterCard.querySelector('p');
        if (gameState.tutorialStep === 2) {
            if (costEl) costEl.innerText = '50 OURO';
            if (descEl) descEl.innerHTML = `Moldura roxa com brilho sombrio de alta intensidade. <span style="color: var(--neon-gold); font-weight: bold;">(Promoção do Tutorial - Sem trava de nível!)</span>`;
        } else {
            if (costEl) costEl.innerText = '2000 OURO';
            if (descEl) descEl.innerText = `Moldura roxa com brilho sombrio de alta intensidade. (Requer Rank C)`;
        }
    }

    if (!banner) return;

    if (gameState.tutorialCompleted || !gameState.tutorialStep) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'block';

    if (gameState.tutorialStep === 1) {
        banner.innerHTML = `
            <div class="tutorial-banner">
                <div class="tutorial-header">
                    <span class="tutorial-badge">QUEST DE APRENDIZADO</span>
                    <span class="tutorial-step">ETAPA 1 de 2</span>
                </div>
                <h3 class="tutorial-title">⚔️ O Despertar da Produtividade</h3>
                <p class="tutorial-desc">Comece sua jornada criando sua primeira tarefa! Adicione um hábito da biblioteca ou clique em <b>"+"</b> abaixo do radar para criar uma Side Quest personalizada.</p>
                <div class="tutorial-footer">
                    <span class="tutorial-reward">🎁 RECOMPENSA: <b>+50 Ouro 🪙</b></span>
                </div>
            </div>
        `;
    } else if (gameState.tutorialStep === 2) {
        banner.innerHTML = `
            <div class="tutorial-banner">
                <div class="tutorial-header">
                    <span class="tutorial-badge" style="color: var(--neon-purple); border-color: var(--neon-purple);">QUEST DE APRENDIZADO</span>
                    <span class="tutorial-step">ETAPA 2 de 2</span>
                </div>
                <h3 class="tutorial-title">🎭 A Taverna e a Identidade</h3>
                <p class="tutorial-desc">Excelente! Você ganhou 50 moedas de Ouro. Agora, navegue até a aba <b>TAVERNA</b> (no rodapé) e compre a <b>Borda: Mestre das Sombras</b> (liberada por apenas 50 Ouro e sem exigência de nível de compra durante o tutorial!). Ela será equipada imediatamente em volta do seu avatar do nível atual.</p>
                <div class="tutorial-footer">
                    <span class="tutorial-reward">🎁 RECOMPENSA FINAL: <b>+50 XP ⚡ +20 Ouro 🪙</b></span>
                </div>
            </div>
        `;
    }
}

// Progride o tutorial para a etapa 2 ao criar a primeira missão
function checkAndProgressTutorialStep1() {
    if (gameState.tutorialStep === 1) {
        gameState.tutorialStep = 2;
        gameState.gold = (gameState.gold || 0) + 50;
        saveGameData();
        updateUI();
        
        // Efeitos visuais
        animateGoldGain();
        spawnFloatingText(50, 'gold');
        
        showSystemToast("🏆 *TUTORIAL:* Missão criada! Você recebeu +50 🪙. Agora compre e equipe sua primeira skin na Taverna!");
    }
}

// Conclui o tutorial ao comprar a skin Shadow Master no passo 2
function completeTutorialQuestline() {
    gameState.tutorialStep = null;
    gameState.tutorialCompleted = true;
    
    // Concede recompensas finais
    gameState.xp = (gameState.xp || 0) + 50;
    gameState.gold = (gameState.gold || 0) + 20;
    
    // Verifica level up
    if (gameState.xp >= gameState.xpToNext) {
        gameState.level++;
        gameState.xp = gameState.xp - gameState.xpToNext;
        gameState.xpToNext = getXpToNextForLevel(gameState.level);
        syncQuestsByLevel();
        triggerLevelUpOverlay();
        checkAndActivateBossQuest();
    }
    
    saveGameData();
    updateUI();
    
    // Efeitos visuais
    spawnFloatingText(50, 'xp');
    spawnFloatingText(20, 'gold');
    
    showSystemToast("🎉 *TUTORIAL CONCLUÍDO!* Você aprendeu os caminhos do Sistema e recebeu +50 XP e +20 🪙!");
}



// Carrega a classificação global do ranking do Supabase e renderiza na UI
async function loadGlobalRanking() {
    const rankingContainer = document.getElementById('ranking-list-container');
    if (!rankingContainer) return;

    if (!window._currentUserDbId) {
        rankingContainer.innerHTML = '<div class="friends-empty-state">Faça login com o Google para ver a classificação global.</div>';
        return;
    }

    rankingContainer.innerHTML = '<div class="friends-empty-state">Carregando classificação do Sistema...</div>';

    // 1. Obter ranking ordenado por level DESC, xp DESC, username ASC da view pública
    const { data: ranking, error } = await supabaseClient
        .from('public_profiles')
        .select('id, username, level, rank, xp, active_skin')
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .order('username', { ascending: true })
        .limit(50);

    if (error) {
        console.error('Erro ao carregar ranking:', error.message);
        rankingContainer.innerHTML = '<div class="friends-empty-state" style="color: var(--neon-red);">⚠️ Erro ao carregar ranking.</div>';
        return;
    }

    if (!ranking || ranking.length === 0) {
        rankingContainer.innerHTML = '<div class="friends-empty-state">Nenhum jogador registrado no Sistema.</div>';
        return;
    }

    rankingContainer.innerHTML = '';

    // Mapear status dos jogadores online cruzando com Presence
    // Observação: Status depende do Presence Store ativo (rastreia apenas quem está com modal social aberto)
    const onlinePresenceState = window.onlineUsersState || {};
    const onlineUserIds = new Set(
        Object.values(onlinePresenceState)
            .flat()
            .map(p => p.user_id)
    );

    ranking.forEach((user, index) => {
        const isOnline = onlineUserIds.has(user.id);
        const position = index + 1;

        const row = document.createElement('div');
        row.className = 'online-user-item';
        row.style.cursor = 'pointer';
        row.style.padding = '10px 14px';
        row.style.border = '1px solid var(--border-color)';
        row.style.borderRadius = 'var(--radius-md)';
        row.style.marginBottom = '8px';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        
        // Destacar o próprio usuário no ranking
        if (user.id === window._currentUserDbId) {
            row.style.border = '1px solid var(--neon-purple)';
            row.style.background = 'rgba(139, 92, 246, 0.05)';
        } else {
            row.style.background = isOnline ? 'rgba(0, 242, 254, 0.01)' : 'rgba(0, 0, 0, 0.1)';
        }

        row.addEventListener('click', () => {
            openPlayerProfile(user.id);
        });

        // Posição no ranking (medalhas para Top 3)
        const posSpan = document.createElement('span');
        posSpan.style.fontFamily = 'var(--font-hud)';
        posSpan.style.fontSize = '12px';
        posSpan.style.fontWeight = 'bold';
        posSpan.style.width = '24px';
        posSpan.style.textAlign = 'center';
        posSpan.style.marginRight = '8px';
        posSpan.style.display = 'inline-block';

        if (position === 1) {
            posSpan.textContent = '🥇';
            posSpan.style.fontSize = '15px';
        } else if (position === 2) {
            posSpan.textContent = '🥈';
            posSpan.style.fontSize = '15px';
        } else if (position === 3) {
            posSpan.textContent = '🥉';
            posSpan.style.fontSize = '15px';
        } else {
            posSpan.textContent = `#${position}`;
            posSpan.style.color = 'var(--text-muted)';
        }

        const avatar = document.createElement('img');
        avatar.src = getPlayerAvatarSrc(user.active_skin, user.rank, user.username);
        avatar.style.width = '36px';
        avatar.style.height = '36px';
        avatar.style.borderRadius = '50%';
        avatar.style.marginLeft = '4px';

        const info = document.createElement('div');
        info.className = 'online-user-info';
        info.style.marginLeft = '12px';
        info.style.flex = '1';

        const top = document.createElement('div');
        top.className = 'online-user-top';
        const name = document.createElement('span');
        name.className = 'online-user-name';
        name.textContent = user.username;
        top.appendChild(name);
        
        const lvl = document.createElement('div');
        lvl.className = 'online-user-level';
        lvl.textContent = `Nível ${user.level || 1} | RANK ${(user.rank || 'E').toUpperCase()} | ${user.xp || 0} XP`;
        info.appendChild(top);
        info.appendChild(lvl);

        const statusText = document.createElement('span');
        statusText.style.fontSize = '9px';
        statusText.style.color = isOnline ? 'var(--neon-cyan)' : 'var(--text-muted)';
        statusText.style.fontFamily = 'var(--font-hud)';
        statusText.style.fontWeight = 'bold';
        statusText.textContent = isOnline ? 'ONLINE' : 'OFFLINE';

        row.appendChild(posSpan);
        row.appendChild(avatar);
        row.appendChild(info);
        row.appendChild(statusText);

        rankingContainer.appendChild(row);
    });
}

// Alternar entre ranking Global e Amigos
function switchRankingMode(mode) {
    window.currentRankingMode = mode;
    const btnGlobal = document.getElementById('btn-ranking-global');
    const btnFriends = document.getElementById('btn-ranking-friends');
    
    if (btnGlobal && btnFriends) {
        if (mode === 'global') {
            btnGlobal.classList.add('active');
            btnFriends.classList.remove('active');
            loadGlobalRanking();
        } else {
            btnGlobal.classList.remove('active');
            btnFriends.classList.add('active');
            loadFriendsRanking();
        }
    }
}

// Expor à janela global
window.switchRankingMode = switchRankingMode;
window.loadFriendsRanking = loadFriendsRanking;
window.currentRankingMode = 'global';

// Carrega a classificação de amigos do Supabase (bidirecional) e renderiza na UI
async function loadFriendsRanking() {
    const rankingContainer = document.getElementById('ranking-list-container');
    if (!rankingContainer) return;

    if (!window._currentUserDbId) {
        rankingContainer.innerHTML = '<div class="friends-empty-state">Faça login com o Google para ver a classificação de amigos.</div>';
        return;
    }

    rankingContainer.innerHTML = '<div class="friends-empty-state">Carregando classificação de amigos...</div>';

    try {
        // 1. Obter amizades aceitas do usuário logado (bidirecional: requester ou target)
        const { data: friendships, error: friendError } = await supabaseClient
            .from('friendships')
            .select('requester_id, target_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${window._currentUserDbId},target_id.eq.${window._currentUserDbId}`);

        if (friendError) {
            console.error('Erro ao carregar amizades:', friendError.message);
            rankingContainer.innerHTML = '<div class="friends-empty-state" style="color: var(--neon-red);">⚠️ Erro ao carregar amizades.</div>';
            return;
        }

        // 2. Coletar os IDs únicos (o usuário atual + os amigos)
        const participantIds = [window._currentUserDbId];
        if (friendships && friendships.length > 0) {
            friendships.forEach(f => {
                const friendId = f.requester_id === window._currentUserDbId ? f.target_id : f.requester_id;
                if (!participantIds.includes(friendId)) {
                    participantIds.push(friendId);
                }
            });
        }

        // 3. Consultar os perfis públicos (public_profiles) para esses IDs
        const { data: ranking, error: profileError } = await supabaseClient
            .from('public_profiles')
            .select('id, username, level, rank, xp, active_skin')
            .in('id', participantIds);

        if (profileError) {
            console.error('Erro ao carregar perfis do ranking:', profileError.message);
            rankingContainer.innerHTML = '<div class="friends-empty-state" style="color: var(--neon-red);">⚠️ Erro ao carregar perfis de amigos.</div>';
            return;
        }

        if (!ranking || ranking.length === 0) {
            rankingContainer.innerHTML = '<div class="friends-empty-state">Nenhum jogador encontrado.</div>';
            return;
        }

        // 4. Ordenar deterministicamente por level DESC, xp DESC, username ASC
        ranking.sort((a, b) => {
            if ((b.level || 0) !== (a.level || 0)) {
                return (b.level || 0) - (a.level || 0);
            }
            if ((b.xp || 0) !== (a.xp || 0)) {
                return (b.xp || 0) - (a.xp || 0);
            }
            return (a.username || '').localeCompare(b.username || '');
        });

        rankingContainer.innerHTML = '';

        // Mapear status dos jogadores online cruzando com Presence
        const onlinePresenceState = window.onlineUsersState || {};
        const onlineUserIds = new Set(
            Object.values(onlinePresenceState)
                .flat()
                .map(p => p.user_id)
        );

        ranking.forEach((user, index) => {
            const isOnline = onlineUserIds.has(user.id);
            const position = index + 1;

            const row = document.createElement('div');
            row.className = 'online-user-item';
            row.style.cursor = 'pointer';
            row.style.padding = '10px 14px';
            row.style.border = '1px solid var(--border-color)';
            row.style.borderRadius = 'var(--radius-md)';
            row.style.marginBottom = '8px';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            
            // Destacar o próprio usuário no ranking
            if (user.id === window._currentUserDbId) {
                row.style.border = '1px solid var(--neon-purple)';
                row.style.background = 'rgba(139, 92, 246, 0.05)';
            } else {
                row.style.background = isOnline ? 'rgba(0, 242, 254, 0.01)' : 'rgba(0, 0, 0, 0.1)';
            }

            row.addEventListener('click', () => {
                openPlayerProfile(user.id);
            });

            // Posição no ranking (medalhas para Top 3)
            const posSpan = document.createElement('span');
            posSpan.style.fontFamily = 'var(--font-hud)';
            posSpan.style.fontSize = '12px';
            posSpan.style.fontWeight = 'bold';
            posSpan.style.width = '24px';
            posSpan.style.textAlign = 'center';
            posSpan.style.marginRight = '8px';
            posSpan.style.display = 'inline-block';

            if (position === 1) {
                posSpan.textContent = '🥇';
                posSpan.style.fontSize = '15px';
            } else if (position === 2) {
                posSpan.textContent = '🥈';
                posSpan.style.fontSize = '15px';
            } else if (position === 3) {
                posSpan.textContent = '🥉';
                posSpan.style.fontSize = '15px';
            } else {
                posSpan.textContent = `#${position}`;
                posSpan.style.color = 'var(--text-muted)';
            }

            const avatar = document.createElement('img');
            avatar.src = getPlayerAvatarSrc(user.active_skin, user.rank, user.username);
            avatar.style.width = '36px';
            avatar.style.height = '36px';
            avatar.style.borderRadius = '50%';
            avatar.style.marginLeft = '4px';

            const info = document.createElement('div');
            info.className = 'online-user-info';
            info.style.marginLeft = '12px';
            info.style.flex = '1';

            const top = document.createElement('div');
            top.className = 'online-user-top';
            const name = document.createElement('span');
            name.className = 'online-user-name';
            name.textContent = user.username;
            top.appendChild(name);
            
            const lvl = document.createElement('div');
            lvl.className = 'online-user-level';
            lvl.textContent = `Nível ${user.level || 1} | RANK ${(user.rank || 'E').toUpperCase()} | ${user.xp || 0} XP`;
            info.appendChild(top);
            info.appendChild(lvl);

            const statusText = document.createElement('span');
            statusText.style.fontSize = '9px';
            statusText.style.color = isOnline ? 'var(--neon-cyan)' : 'var(--text-muted)';
            statusText.style.fontFamily = 'var(--font-hud)';
            statusText.style.fontWeight = 'bold';
            statusText.textContent = isOnline ? 'ONLINE' : 'OFFLINE';

            row.appendChild(posSpan);
            row.appendChild(avatar);
            row.appendChild(info);
            row.appendChild(statusText);

            rankingContainer.appendChild(row);
        });
    } catch (err) {
        console.error('Erro geral ao carregar ranking de amigos:', err);
        rankingContainer.innerHTML = '<div class="friends-empty-state" style="color: var(--neon-red);">⚠️ Erro inesperado ao carregar ranking de amigos.</div>';
    }
}

// ──────────────────────────────────────────────────────────────────────────
// WEB PUSH NOTIFICATIONS (VAPID + SUPABASE INTEGRATION)
// ──────────────────────────────────────────────────────────────────────────

function receiveMessage(content) {
    if (typeof appendMessageUI === 'function') {
        appendMessageUI({
            username: 'SISTEMA',
            level: 99,
            rank: 'S',
            created_at: new Date().toISOString(),
            content: content,
            user_id: null
        });
        if (typeof scrollChatToBottom === 'function') {
            scrollChatToBottom();
        }
    }
};

function showChatBadge() {
    console.log('[Chat] showChatBadge called');
};

// ──────────────────────────────────────────────────────────────────────────
// DUELOS PVP (FASE 5)
// ──────────────────────────────────────────────────────────────────────────

let _pvpOpponentId = null;

function openPvpChallengeModal(opponentId) {
    _pvpOpponentId = opponentId;
    const modal = document.getElementById('modal-pvp-challenge');
    if (modal) {
        modal.style.display = 'flex';
        const inputBet = document.getElementById('pvp-gold-bet');
        if (inputBet) {
            inputBet.value = 50;
        }
    }
}

function closePvpChallengeModal() {
    _pvpOpponentId = null;
    const modal = document.getElementById('modal-pvp-challenge');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitPvpChallenge() {
    if (!_pvpOpponentId) return;

    const inputBet = document.getElementById('pvp-gold-bet');
    const bet = inputBet ? parseInt(inputBet.value, 10) : 50;

    // Validacao de entrada no frontend
    if (isNaN(bet) || bet <= 0) {
        showSystemToast('⚠️ Insira um valor valido de ouro maior que zero.');
        return;
    }

    if (bet > gameState.gold) {
        showSystemToast('⚠️ Ouro insuficiente para realizar esta aposta.');
        return;
    }

    const btnSubmit = document.getElementById('btn-submit-pvp-challenge');
    if (btnSubmit) btnSubmit.disabled = true;

    try {
        const { data, error } = await window.createPvpChallenge(_pvpOpponentId, bet);
        if (error) {
            let msg = 'Erro ao enviar desafio.';
            if (error.message.includes('DUEL_EXISTS')) {
                msg = '⚠️ Ja existe um duelo ativo ou pendente com este amigo.';
            } else if (error.message.includes('INSUFFICIENT_GOLD')) {
                msg = '⚠️ Ouro insuficiente para aposta.';
            } else if (error.message.includes('NOT_FRIENDS')) {
                msg = '⚠️ Vocês precisam ser amigos aceitos para duelar.';
            }
            showSystemToast(msg);
        } else {
            showSystemToast('⚔️ Desafio enviado com sucesso!');
            closePvpChallengeModal();
            
            // Saldo autoritativo: a RPC já debitou server-side; re-busca o ouro real.
            await window.refreshGoldFromCloud();
            
            // Recarregar aba/dados
            const activeSubtab = document.querySelector('.sub-tab-btn.active');
            const subtabName = activeSubtab ? activeSubtab.getAttribute('data-subtab') : 'chat';
            if (subtabName === 'duels') {
                loadDuelsList();
            } else if (subtabName === 'friends') {
                loadFriendsList();
            }
        }
    } catch (err) {
        console.error('[PvP] Erro ao enviar desafio:', err);
        showSystemToast('⚠️ Erro inesperado ao enviar desafio.');
    } finally {
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

async function loadDuelsList() {
    const challengesList = document.getElementById('pvp-challenges-list');
    const activeList = document.getElementById('pvp-active-list');
    const historyList = document.getElementById('pvp-history-list');

    if (!challengesList || !activeList || !historyList) return;

    if (!window._currentUserDbId) {
        const msg = '<div class="friends-empty-state">Faça login com o Google para gerenciar duelos.</div>';
        challengesList.innerHTML = msg;
        activeList.innerHTML = msg;
        historyList.innerHTML = msg;
        return;
    }

    challengesList.innerHTML = '<div class="friends-empty-state">Carregando desafios...</div>';
    activeList.innerHTML = '<div class="friends-empty-state">Carregando duelos ativos...</div>';
    historyList.innerHTML = '<div class="friends-empty-state">Carregando histórico...</div>';

    try {
        const { data: duels, error } = await window.getUserDuelsWithScores();
        if (error) {
            console.error('[PvP] Erro ao carregar duelos:', error.message);
            const errMsg = '<div class="friends-empty-state" style="color:var(--neon-red);">⚠️ Erro ao carregar duelos.</div>';
            challengesList.innerHTML = errMsg;
            activeList.innerHTML = errMsg;
            historyList.innerHTML = errMsg;
            return;
        }

        challengesList.innerHTML = '';
        activeList.innerHTML = '';
        historyList.innerHTML = '';

        const pendingDuels = duels.filter(d => d.status === 'pending');
        const activeDuels = duels.filter(d => d.status === 'active');
        const historyDuels = duels.filter(d => d.status === 'finished' || d.status === 'rejected');

        // META-001: rastreia vitórias PvP (winner_id === eu) p/ o achievement "Gladiador".
        // Idempotente — recalcula da fonte (lista de duelos) e só persiste se mudou.
        const _pvpWins = historyDuels.filter(d => d.winner_id === window._currentUserDbId).length;
        if (_pvpWins !== (gameState._pvpWins || 0)) {
            gameState._pvpWins = _pvpWins;
            if (typeof window.saveGameData === 'function') window.saveGameData();
        }

        // 1. Renderizar Desafios
        if (pendingDuels.length > 0) {
            pendingDuels.forEach(d => {
                const card = document.createElement('div');
                card.className = 'online-user-item';
                card.style.background = 'rgba(251, 191, 36, 0.02)';
                card.style.border = '1px solid rgba(251, 191, 36, 0.1)';
                card.style.borderRadius = 'var(--radius-md)';
                card.style.padding = '12px 16px';
                card.style.marginBottom = '8px';
                card.style.display = 'flex';
                card.style.alignItems = 'center';
                card.style.justifyContent = 'space-between';

                const info = document.createElement('div');
                info.style.flex = '1';

                const title = document.createElement('div');
                title.style.fontWeight = 'bold';
                title.style.fontSize = '12px';
                
                const desc = document.createElement('div');
                desc.style.fontSize = '10px';
                desc.style.color = 'var(--text-muted)';
                desc.style.marginTop = '4px';

                if (d.challenger_id === window._currentUserDbId) {
                    title.textContent = `⚔️ Desafio enviado para ${d.opponent_username}`;
                    desc.textContent = `Aposta: ${d.gold_bet} Ouro | Status: Aguardando resposta...`;
                    info.appendChild(title);
                    info.appendChild(desc);
                    
                    const btnCancel = document.createElement('button');
                    btnCancel.className = 'btn-toggle-pill';
                    btnCancel.style.background = 'rgba(239, 68, 68, 0.1)';
                    btnCancel.style.border = '1px solid rgba(239, 68, 68, 0.2)';
                    btnCancel.style.color = 'var(--text-muted)';
                    btnCancel.textContent = 'Cancelar';
                    btnCancel.style.padding = '4px 10px';
                    btnCancel.style.fontSize = '10px';
                    btnCancel.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        btnCancel.disabled = true;
                        const { error: rejectError } = await window.rejectPvpChallenge(d.id);
                        if (!rejectError) {
                            showSystemToast('Desafio cancelado e ouro devolvido!');
                            
                            // Saldo autoritativo: o reembolso ocorreu server-side; re-busca o ouro real.
                            await window.refreshGoldFromCloud();
                            
                            loadDuelsList();
                        } else {
                            showSystemToast('Erro ao cancelar desafio.');
                            btnCancel.disabled = false;
                        }
                    });
                    card.appendChild(info);
                    card.appendChild(btnCancel);
                } else {
                    title.textContent = `⚔️ Desafio recebido de ${d.challenger_username}`;
                    desc.textContent = `Aposta: ${d.gold_bet} Ouro`;
                    info.appendChild(title);
                    info.appendChild(desc);

                    const actions = document.createElement('div');
                    actions.style.display = 'flex';
                    actions.style.gap = '8px';

                    const btnAccept = document.createElement('button');
                    btnAccept.className = 'btn-toggle-pill active';
                    btnAccept.style.background = 'rgba(16, 185, 129, 0.2)';
                    btnAccept.style.border = '1px solid rgba(16, 185, 129, 0.4)';
                    btnAccept.style.color = '#10b981';
                    btnAccept.textContent = 'Aceitar';
                    btnAccept.style.padding = '4px 10px';
                    btnAccept.style.fontSize = '10px';
                    btnAccept.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        btnAccept.disabled = true;
                        btnReject.disabled = true;
                        
                        if (gameState.gold < d.gold_bet) {
                            showSystemToast('⚠️ Ouro insuficiente para cobrir a aposta.');
                            btnAccept.disabled = false;
                            btnReject.disabled = false;
                            return;
                        }

                        const { error: acceptError } = await window.acceptPvpChallenge(d.id);
                        if (!acceptError) {
                            showSystemToast('⚔️ Duelo aceito! Que vença o mais consistente.');
                            
                            // Saldo autoritativo: a RPC já debitou server-side; re-busca o ouro real.
                            await window.refreshGoldFromCloud();
                            
                            loadDuelsList();
                        } else {
                            showSystemToast('Erro ao aceitar desafio.');
                            btnAccept.disabled = false;
                            btnReject.disabled = false;
                        }
                    });

                    const btnReject = document.createElement('button');
                    btnReject.className = 'btn-toggle-pill';
                    btnReject.style.background = 'rgba(239, 68, 68, 0.1)';
                    btnReject.style.border = '1px solid rgba(239, 68, 68, 0.2)';
                    btnReject.style.color = 'var(--text-muted)';
                    btnReject.textContent = 'Rejeitar';
                    btnReject.style.padding = '4px 10px';
                    btnReject.style.fontSize = '10px';
                    btnReject.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        btnAccept.disabled = true;
                        btnReject.disabled = true;
                        const { error: rejectError } = await window.rejectPvpChallenge(d.id);
                        if (!rejectError) {
                            showSystemToast('Desafio rejeitado.');
                            loadDuelsList();
                        } else {
                            showSystemToast('Erro ao rejeitar desafio.');
                            btnAccept.disabled = false;
                            btnReject.disabled = false;
                        }
                    });

                    actions.appendChild(btnAccept);
                    actions.appendChild(btnReject);
                    card.appendChild(info);
                    card.appendChild(actions);
                }

                challengesList.appendChild(card);
            });
        } else {
            challengesList.innerHTML = '<div class="friends-empty-state">Nenhum desafio pendente.</div>';
        }

        // 2. Renderizar Duelos Ativos
        if (activeDuels.length > 0) {
            activeDuels.forEach(d => {
                const card = document.createElement('div');
                card.className = 'online-user-item';
                card.style.background = 'rgba(0, 242, 254, 0.02)';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-md)';
                card.style.padding = '12px 16px';
                card.style.marginBottom = '8px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '8px';

                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                
                const title = document.createElement('span');
                title.style.fontWeight = 'bold';
                title.style.fontSize = '12px';
                title.style.color = 'var(--text-primary)';
                
                const isChallenger = d.challenger_id === window._currentUserDbId;
                const myScore = isChallenger ? d.challenger_score : d.opponent_score;
                const opponentScore = isChallenger ? d.opponent_score : d.challenger_score;
                const opponentName = isChallenger ? d.opponent_username : d.challenger_username;

                title.textContent = `⚔️ Duelo contra ${opponentName}`;

                const betSpan = document.createElement('span');
                betSpan.style.fontFamily = 'var(--font-hud)';
                betSpan.style.fontSize = '9px';
                betSpan.style.color = 'var(--neon-gold)';
                betSpan.textContent = `Aposta: ${d.gold_bet} Ouro`;

                header.appendChild(title);
                header.appendChild(betSpan);

                const scoreboard = document.createElement('div');
                scoreboard.style.display = 'flex';
                scoreboard.style.justifyContent = 'space-between';
                scoreboard.style.alignItems = 'center';
                scoreboard.style.background = 'var(--bg-input)';
                scoreboard.style.padding = '8px 12px';
                scoreboard.style.borderRadius = 'var(--radius-sm)';
                scoreboard.style.fontSize = '11px';

                const mySide = document.createElement('div');
                mySide.innerHTML = `Você: <strong style="color: var(--neon-cyan); font-size: 13px;">${myScore}</strong> / 7 dias`;

                const VS = document.createElement('div');
                VS.style.fontFamily = 'var(--font-hud)';
                VS.style.fontSize = '10px';
                VS.style.color = 'var(--text-muted)';
                VS.textContent = 'VS';

                const opponentSide = document.createElement('div');
                opponentSide.innerHTML = `${opponentName}: <strong style="color: var(--neon-purple); font-size: 13px;">${opponentScore}</strong> / 7 dias`;

                scoreboard.appendChild(mySide);
                scoreboard.appendChild(VS);
                scoreboard.appendChild(opponentSide);

                const footer = document.createElement('div');
                footer.style.display = 'flex';
                footer.style.justifyContent = 'space-between';
                footer.style.fontSize = '9px';
                footer.style.color = 'var(--text-muted)';

                const endDateObj = new Date(d.end_date);
                const endFormatted = endDateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: '2-digit' });
                
                const endSpan = document.createElement('span');
                endSpan.textContent = `Término: ${endFormatted}`;

                const statusIndicator = document.createElement('span');
                statusIndicator.style.fontWeight = 'bold';
                if (myScore > opponentScore) {
                    statusIndicator.style.color = 'var(--neon-green)';
                    statusIndicator.textContent = '🏆 VOCÊ ESTÁ NA FRENTE';
                } else if (opponentScore > myScore) {
                    statusIndicator.style.color = '#ef4444';
                    statusIndicator.textContent = '💀 ADVERSÁRIO NA FRENTE';
                } else {
                    statusIndicator.style.color = 'var(--neon-gold)';
                    statusIndicator.textContent = '⚖️ EMPATE TEMPORÁRIO';
                }

                footer.appendChild(endSpan);
                footer.appendChild(statusIndicator);

                card.appendChild(header);
                card.appendChild(scoreboard);
                card.appendChild(footer);

                activeList.appendChild(card);
            });
        } else {
            activeList.innerHTML = '<div class="friends-empty-state">Nenhum duelo em andamento.</div>';
        }

        // 3. Renderizar Histórico
        if (historyDuels.length > 0) {
            historyDuels.forEach(d => {
                const card = document.createElement('div');
                card.className = 'online-user-item';
                card.style.background = 'rgba(0, 0, 0, 0.2)';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-md)';
                card.style.padding = '10px 14px';
                card.style.marginBottom = '8px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '4px';

                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                header.style.fontSize = '11px';

                const isChallenger = d.challenger_id === window._currentUserDbId;
                const opponentName = isChallenger ? d.opponent_username : d.challenger_username;
                
                const title = document.createElement('span');
                title.style.fontWeight = 'bold';
                title.style.textContent = `Duelo contra ${opponentName}`;

                const betSpan = document.createElement('span');
                betSpan.style.fontFamily = 'var(--font-hud)';
                betSpan.style.fontSize = '8px';
                betSpan.style.color = 'var(--text-muted)';
                betSpan.textContent = `Aposta: ${d.gold_bet} Ouro`;

                header.appendChild(title);
                header.appendChild(betSpan);

                const resultLine = document.createElement('div');
                resultLine.style.fontSize = '10px';
                resultLine.style.display = 'flex';
                resultLine.style.justifyContent = 'space-between';
                resultLine.style.marginTop = '2px';

                const scoreSpan = document.createElement('span');
                scoreSpan.style.color = 'var(--text-secondary)';

                const statusSpan = document.createElement('span');
                statusSpan.style.fontWeight = 'bold';

                if (d.status === 'rejected') {
                    scoreSpan.textContent = 'Recusado ou Cancelado';
                    statusSpan.textContent = '🚫 REJEITADO';
                    statusSpan.style.color = 'var(--text-muted)';
                } else {
                    const myScore = isChallenger ? d.challenger_score : d.opponent_score;
                    const opponentScore = isChallenger ? d.opponent_score : d.challenger_score;
                    scoreSpan.textContent = `Placar: ${myScore} a ${opponentScore}`;

                    if (d.winner_id === window._currentUserDbId) {
                        statusSpan.textContent = `🏆 VITÓRIA (+${d.gold_bet} Ouro)`;
                        statusSpan.style.color = 'var(--neon-green)';
                    } else if (d.winner_id === null) {
                        statusSpan.textContent = '⚖️ EMPATE (Devolvido)';
                        statusSpan.style.color = 'var(--neon-gold)';
                    } else {
                        statusSpan.textContent = `💀 DERROTA (-${d.gold_bet} Ouro)`;
                        statusSpan.style.color = '#ef4444';
                    }
                }

                resultLine.appendChild(scoreSpan);
                resultLine.appendChild(statusSpan);
                card.appendChild(header);
                card.appendChild(resultLine);

                historyList.appendChild(card);
            });
        } else {
            historyList.innerHTML = '<div class="friends-empty-state">Nenhum duelo finalizado ainda.</div>';
        }

    } catch (err) {
        console.error('[PvP] Erro inesperado ao carregar lista de duelos:', err);
        const errHtml = '<div class="friends-empty-state" style="color:var(--neon-red);">⚠️ Erro inesperado ao carregar duelos.</div>';
        challengesList.innerHTML = errHtml;
        activeList.innerHTML = errHtml;
        historyList.innerHTML = errHtml;
    }
}

function refreshActiveSocialTab() {
    updateChatInputState();

    const modalSocial = document.getElementById('modal-social');
    const isSocialVisible = modalSocial && window.getComputedStyle(modalSocial).display === 'flex';
    if (!isSocialVisible) return;

    const activeSubtab = document.querySelector('.sub-tab-btn.active');
    const subtabName = activeSubtab ? activeSubtab.getAttribute('data-subtab') : 'chat';
    
    if (subtabName === 'chat') {
        loadChatMessages();
    } else if (subtabName === 'friends') {
        loadFriendsList();
    } else if (subtabName === 'duels') {
        loadDuelsList();
    } else if (subtabName === 'ranking') {
        const activeRankingMode = document.querySelector('.ranking-toggle-btn.active');
        const mode = activeRankingMode ? activeRankingMode.dataset.mode : 'global';
        switchRankingMode(mode);
    }
}
window.refreshActiveSocialTab = refreshActiveSocialTab;

window.openPvpChallengeModal = openPvpChallengeModal;
window.closePvpChallengeModal = closePvpChallengeModal;
window.submitPvpChallenge = submitPvpChallenge;
window.loadDuelsList = loadDuelsList;

window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-pvp-challenge');
    if (e.target === modal) {
        closePvpChallengeModal();
    }
});

export {
    setupHabitLibraryAndTabs,
    addHabitFromLibrary,
    receiveMessage,
    showChatBadge,
    enterCommunityTab,
    exitCommunityTab,
    loadChatMessages,
    initSocialSubTabs,
    loadFriendsList,
    loadFriendsRanking,
    loadGlobalRanking,
    openPlayerProfile,
    setupSocialModalListeners,
    initFriendsSearchListeners,
    handleFriendSearch,
    updateOnlinePlayersUI,
    switchRankingMode,
    renderTutorialBanner,
    checkAndProgressTutorialStep1,
    completeTutorialQuestline,
    openPvpChallengeModal,
    closePvpChallengeModal,
    submitPvpChallenge,
    loadDuelsList,
    refreshActiveSocialTab
};
