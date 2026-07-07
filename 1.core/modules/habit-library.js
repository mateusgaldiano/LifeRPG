// habit-library.js
// Biblioteca de Hábitos do modal "Nova Quest" — busca/filtro/render da curadoria,
// modal de confirmação (diária/semanal/avulsa/vício) e adição ao gameState.
// Extraído de social.js (era ~380 linhas que não tinham nada de "social").
import { gameState, saveGameData, HABIT_LIBRARY } from './state.js';
import { showSystemToast } from './ui.js';

// renderQuests e checkAndProgressTutorialStep1 vivem em outros módulos e são
// expostos em window.* pelo app.js — acessados via window.* para evitar ciclos
// de import (a UI e o tutorial dependem, direta ou indiretamente, deste fluxo).

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
    // Vício: sem skill, sem XP/gold. Nasce completo (abstinência por padrão).
    if (type === 'addiction') {
        const addictionQuest = {
            id: 'q-addiction-' + Date.now(),
            title: h.title,
            type: 'addiction',
            skill: null,
            icon: h.icon || '🚫',
            emoji: h.icon || '🚫',
            completed: true,
            xp: 0,
            gold: 0,
            fromLibrary: true
        };
        gameState.quests.push(addictionQuest);
        if (typeof window.queueQuestOp === 'function') window.queueQuestOp(addictionQuest.id, 'upsert');
        saveGameData();
        if (typeof window.renderQuests === 'function') window.renderQuests();
        showSystemToast(`🔥 Vício "${h.title}" adicionado! Ele nasce limpo todo dia — desmarque só se tiver uma recaída.`);
        const modalConfirmEl = document.getElementById('modal-confirm-habit');
        if (modalConfirmEl) modalConfirmEl.style.display = 'none';
        const modalSqEl = document.getElementById('modal-sidequest');
        if (modalSqEl) modalSqEl.style.display = 'none';
        selectedLibraryHabit = null;
        return;
    }

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
    if (typeof window.checkAndProgressTutorialStep1 === 'function') {
        window.checkAndProgressTutorialStep1();
    }
    if (typeof window.renderQuests === 'function') window.renderQuests();

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

    // Títulos que o usuário já possui como quest ativa (não repetir na biblioteca)
    const ownedTitles = new Set(
        [...(gameState.quests || []), ...(gameState.sideQuests || [])]
            .map(q => (q.title || '').toLowerCase().trim())
    );

    // Filter habits
    const filtered = HABIT_LIBRARY.filter(habit => {
        const matchesFilter = filter === 'all' || habit.skill === filter;
        const matchesSearch = habit.title.toLowerCase().includes(query);
        const notOwned = !ownedTitles.has(habit.title.toLowerCase().trim());
        return matchesFilter && matchesSearch && notOwned;
    });

    // Ordena: tipos na MESMA ordem da tela inicial (hexágono) e, dentro de cada
    // tipo, por dificuldade (Fácil → Intermediário → Difícil).
    const SKILL_ORDER = { physical: 0, wisdom: 1, productivity: 2, social: 3, mental: 4, routine: 5 };
    const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };
    filtered.sort((a, b) => {
        const s = (SKILL_ORDER[a.skill] ?? 99) - (SKILL_ORDER[b.skill] ?? 99);
        if (s !== 0) return s;
        return (DIFF_ORDER[a.difficulty] ?? 99) - (DIFF_ORDER[b.difficulty] ?? 99);
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
        social: 'Social',
        addiction: 'Vício'
    };

    let html = '';
    filtered.forEach(habit => {
        // Vícios: sem dificuldade/XP. Item com badge própria e botão de adicionar direto.
        if (habit.skill === 'addiction') {
            html += '<div class="library-item">' +
                '<div class="library-item-main">' +
                    '<div class="library-item-icon">' + habit.icon + '</div>' +
                    '<div class="library-item-info">' +
                        '<span class="library-item-title">' + habit.title + '</span>' +
                        '<div class="library-item-meta">' +
                            '<span class="library-badge category" style="background:#991b1b22; color:#ef4444; border-color:#991b1b55;">🔥 Vício</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="btn-library-add" data-id="' + habit.id + '">ADICIONAR</button>' +
            '</div>';
            return;
        }

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
                // Vício: sem escolha de tipo (diária/semanal/avulsa) — adiciona direto.
                if (habit.skill === 'addiction') {
                    addHabitFromLibrary(habit, 'addiction');
                    return;
                }

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

export {
    setupHabitLibraryAndTabs,
    addHabitFromLibrary,
    renderHabitLibrary
};
