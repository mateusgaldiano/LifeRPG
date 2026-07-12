// ui.js
import { gameState, saveGameData, APP_VERSION, ALL_HABITS_DATABASE, BOSS_QUESTS } from './state.js';
import {
    localDateStr, getRankForLevel, debounce, hasPerk, calcStreakMultiplier,
    calcStreakGoldMultiplier, calcGroupMultiplier, getSynergyXpBonus,
    getSynergyGoldBonus, getPerkXpBonus, initSkillsState, isQuestActiveOnDay,
    computePlayerTitle, computeSynergies
} from './utils.js';
import { toggleQuest, adjustWater, buyStoreItem, completeDungeon, showQuestCleared, getPendingRankEvaluation, BOSS_QUEST_BY_LEVEL } from './game-logic.js';
import { setupSettingsListeners } from './pwa.js';
import { drawRadarChart } from './radar-chart.js';

function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const unlockedIds = gameState.unlockedAchievements || [];
    const totalUnlocked = unlockedIds.length;
    const totalAchs = ACHIEVEMENTS_DEFS.length;

    // Agrupa por categoria
    const categories = {
        'consistência': { label: 'CONSISTÊNCIA', icon: '🔥' },
        'rank':         { label: 'RANK & NÍVEL', icon: '🌟' },
        'habilidades':  { label: 'HABILIDADES', icon: '✨' },
        'masmorras':    { label: 'MASMORRAS & BOSS', icon: '⚔️' },
        'missões':      { label: 'MISSÕES', icon: '📜' },
        'social':       { label: 'SOCIAL & PVP', icon: '🤝' }
    };

    const rarityColors = {
        'comum':     { bg: 'rgba(120,120,140,0.1)', border: 'rgba(120,120,140,0.3)', label: 'rgba(170,170,190,0.7)' },
        'incomum':   { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.35)',  label: 'rgba(34,197,94,0.8)' },
        'raro':      { bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.4)',  label: 'rgba(129,140,248,0.9)' },
        'lendário':  { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.5)',  label: 'rgba(251,191,36,1)' }
    };

    let html = `
        <div class="ach-summary-bar">
            <span class="ach-summary-count">${totalUnlocked}<span class="ach-summary-total">/${totalAchs}</span></span>
            <span class="ach-summary-label">CONQUISTAS DESBLOQUEADAS</span>
            <div class="ach-summary-track"><div class="ach-summary-fill" style="width:${(totalUnlocked/totalAchs*100).toFixed(0)}%"></div></div>
        </div>
    `;

    Object.entries(categories).forEach(([catKey, catInfo]) => {
        const catAchs = ACHIEVEMENTS_DEFS.filter(a => a.category === catKey);
        const catUnlocked = catAchs.filter(a => unlockedIds.includes(a.id)).length;

        html += `<div class="ach-category">
            <div class="ach-category-header">
                <span class="ach-category-icon">${catInfo.icon}</span>
                <span class="ach-category-label">${catInfo.label}</span>
                <span class="ach-category-count">${catUnlocked}/${catAchs.length}</span>
            </div>
            <div class="ach-cards-row">`;

        catAchs.forEach(ach => {
            const isUnlocked = unlockedIds.includes(ach.id);
            const prog = ach.progress ? ach.progress(gameState) : null;
            const progPct = prog ? Math.min(100, Math.round((prog.cur / prog.max) * 100)) : 0;
            const rc = rarityColors[ach.rarity] || rarityColors['comum'];

            html += `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}" style="
                ${isUnlocked ? `background:${rc.bg}; border-color:${rc.border};` : ''}
            ">
                <div class="ach-icon">${isUnlocked ? ach.icon : '🔒'}</div>
                <div class="ach-title">${ach.title}</div>
                <div class="ach-desc">${ach.desc}</div>
                ${isUnlocked
                    ? `<div class="ach-rarity-badge" style="color:${rc.label}; border-color:${rc.border}">${ach.rarity.toUpperCase()}</div>
                       <div class="ach-reward">+${ach.rewardGold} 💰</div>`
                    : prog ? `<div class="ach-prog-track"><div class="ach-prog-fill" style="width:${progPct}%"></div></div>
                              <div class="ach-prog-label">${prog.cur}/${prog.max}</div>` : ''
                }
            </div>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}

//  Rank Perks 

// ==========================================================================
// TUTORIAIS E ONBOARDING DE NOVAS FEATURES
// ==========================================================================
function showFeatureUnlockModal(title, text) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 420px; padding: 28px; text-align: center; border: 1px solid var(--neon-cyan); box-shadow: 0 0 30px rgba(0, 242, 254, 0.25);">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">🔓</div>
            <h3 style="color: var(--neon-cyan); font-size: 1.2rem; font-family: var(--font-hud); letter-spacing: 1px; margin-bottom: 15px;">${title}</h3>
            <p style="color: #cbd5e1; font-size: 0.85rem; line-height: 1.6; text-align: left; white-space: pre-line; margin-bottom: 25px;">${text}</p>
            <button class="btn-submit" style="width: 100%;" onclick="this.closest('.modal').remove()">ENTENDIDO</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function checkFeatureUnlocks() {
    const level = gameState.level;
    
    if (level >= 5 && localStorage.getItem('tutorial_taverna_seen') !== 'true') {
        localStorage.setItem('tutorial_taverna_seen', 'true');
        showFeatureUnlockModal(
            '⚔️ TAVERNA & BOSS QUESTS LIBERADAS!',
            'Você atingiu o Nível 5 e destravou novas mecânicas do Sistema:\n\n' +
            '• 🍻 **A Taverna**: Use seu Ouro acumulado para comprar Perks (como escudos e pergaminhos de dobro XP) e Skins premium para o seu avatar!\n\n' +
            '• 💀 **Boss Quests**: Sempre que você sobe de Rank, um Chefe de Rank surge. Complete uma série de missões diárias seguidas para derrotá-lo e ganhar bônus gigantes de XP e Ouro!'
        );
        return;
    }
    
    if (level >= 10 && localStorage.getItem('tutorial_dungeons_seen') !== 'true') {
        localStorage.setItem('tutorial_dungeons_seen', 'true');
        showFeatureUnlockModal(
            '🔮 MASMORRAS DE ELITE ATIVADAS!',
            'Você atingiu o Nível 10! Masmorras temporárias agora aparecerão periodicamente sob a sua lista de missões secundárias:\n\n' +
            '• ⏳ **Tempo Limitado**: As Dungeons têm prazos rígidos de 48 horas para serem concluídas.\n\n' +
            '• 🛡️ **Combate de Skill**: Elas estão associadas a um atributo específico e dão recompensas massivas ao serem concluídas, ajudando a especializar seu personagem!'
        );
    }
}


// ==========================================================================
// SELEÇÃO E GERENCIAMENTO DE ABAS
// ==========================================================================
function initTabs() {
    const navButtons = document.querySelectorAll('.tab-link[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            const targetTab = document.getElementById(`tab-${tabName}`);
            
            // Sempre limpar inscrições do chat ao trocar de aba
            if (typeof exitCommunityTab === 'function') {
                exitCommunityTab();
            }

            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            btn.classList.add('active');
            targetTab.classList.add('active');

            // Se for a aba Global, renderiza os gráficos e o heatmap
            if (tabName === 'global') {
                renderGlobalDashboard();
            }
            if (tabName === 'community') {
                if (typeof enterCommunityTab === 'function') {
                    enterCommunityTab();
                }
            }
            /*
            if (tabName === 'chat') {
                renderChat();
            }
            */

            // No Mobile, rola a tela até o conteúdo da aba, respeitando o header fixo
            if (window.innerWidth <= 1023) {
                const offset = targetTab.getBoundingClientRect().top + window.scrollY - 130;
                window.scrollTo({ top: offset, behavior: 'smooth' });
            }
        });
    });

    // Inicializar sub-abas sociais e listeners de perfil/amigos
    if (typeof initSocialSubTabs === 'function') initSocialSubTabs();
    if (typeof initFriendsSearchListeners === 'function') initFriendsSearchListeners();
    if (typeof setupPlayerProfileListeners === 'function') setupPlayerProfileListeners();
}



// ==========================================================================
// SUB-ABAS DA TAVERNA E INVENTÁRIO
// ==========================================================================
function switchTavernaTab(mode) {
    const btnShop      = document.getElementById('subtab-btn-shop');
    const btnInventory = document.getElementById('subtab-btn-inventory');
    const panelShop      = document.getElementById('taverna-shop');
    const panelInventory = document.getElementById('taverna-inventory');

    if (!btnShop || !btnInventory || !panelShop || !panelInventory) return;

    if (mode === 'shop') {
        btnShop.classList.add('active');
        btnInventory.classList.remove('active');
        panelShop.style.display = 'block';
        panelInventory.style.display = 'none';
    } else {
        btnShop.classList.remove('active');
        btnInventory.classList.add('active');
        panelShop.style.display = 'none';
        panelInventory.style.display = 'block';
        renderInventory();
    }
};

function confirmRemoveQuest(id, title) {
    // Pop-up nativo do browser — simples e funcional
    const confirmed = confirm(`Remover "${title}" das suas missões?\n\nEssa ação não pode ser desfeita.`);
    if (!confirmed) return;

    // Remove de quests diárias
    const qIdx = gameState.quests.findIndex(q => q.id === id);
    if (qIdx !== -1) {
        gameState.quests.splice(qIdx, 1);
        saveGameData();
        renderQuests();
        showSystemToast(`✕ Missão removida.`);
        // Outbox: registra a exclusão (sobe no próximo flush; durável mesmo offline).
        if (typeof window.queueQuestOp === 'function') window.queueQuestOp(id, 'delete');
        return;
    }

    // Remove de side quests
    const sqIdx = gameState.sideQuests.findIndex(q => q.id === id);
    if (sqIdx !== -1) {
        gameState.sideQuests.splice(sqIdx, 1);
        saveGameData();
        renderQuests();
        showSystemToast(`✕ Side Quest removida.`);
        // Outbox: registra a exclusão (sobe no próximo flush; durável mesmo offline).
        if (typeof window.queueQuestOp === 'function') window.queueQuestOp(id, 'delete');
    }
};

function equipItem(type, itemId) {
    if (type === 'title') {
        gameState.inventory.activeTitle = gameState.inventory.activeTitle === itemId ? null : itemId;
    } else if (type === 'border') {
        gameState.inventory.activeBorder = gameState.inventory.activeBorder === itemId ? null : itemId;
    } else if (type === 'skin') {
        gameState.inventory.activeSkin = gameState.inventory.activeSkin === itemId ? 'default' : itemId;
    }
    
    saveGameData();
    renderInventory();
    updateUI();
};

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const inv = gameState.inventory || { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' };
    if (!inv.unlockedSkins) inv.unlockedSkins = ['default'];
    if (!inv.activeSkin) inv.activeSkin = 'default';
    
    const catalog = {
        'title_implacavel': { name: 'O Implacável', type: 'title', icon: '🏷️', color: 'var(--neon-purple)' },
        'title_mestre': { name: 'Mestre do Tempo', type: 'title', icon: '⏳', color: 'var(--neon-gold)' },
        'border_neonred': { name: 'Demônio Carmesim', type: 'border', icon: '🖼️', color: 'var(--neon-red)' },
        'default': { name: 'Avatar Padrão do Rank', type: 'skin', icon: '🛡️', color: 'var(--neon-cyan)' },
        'skin_shadow_master': { name: 'Mestre das Sombras', type: 'border', icon: '👤', color: 'var(--neon-purple)' },
        'skin_mist_monarch': { name: 'Monarca da Névoa', type: 'border', icon: '👥', color: 'var(--neon-cyan)' },
        'skin_arise_emperor': { name: 'Imperador Arise', type: 'border', icon: '👑', color: 'var(--neon-gold)' }
    };

    const allUnlocked = [
        'default',
        ...inv.unlockedTitles,
        ...inv.unlockedBorders,
        ...inv.unlockedSkins.filter(s => s !== 'default')
    ];
    
    allUnlocked.forEach(itemId => {
        const item = catalog[itemId];
        if (!item) return;

        const isEquipped = (item.type === 'title' && inv.activeTitle === itemId) || 
                           (item.type === 'border' && inv.activeBorder === itemId) ||
                           (item.type === 'skin' && inv.activeSkin === itemId);

        const card = document.createElement('div');
        card.className = 'reward-card';
        card.style.border = isEquipped ? `1px solid ${item.color}` : '1px solid var(--border-glass)';
        if (isEquipped) {
            card.style.boxShadow = `0 0 10px ${item.color}`;
        }

        const btnLabel = isEquipped ? 'EQUIPADO' : 'EQUIPAR';
        const btnStyle = isEquipped ? `background: ${item.color}; color: #fff;` : '';

        let displayType = 'Título';
        if (item.type === 'border') displayType = 'Borda';
        else if (item.type === 'skin') displayType = 'Avatar';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="color: ${item.color};">${displayType}: ${item.name}</h3>
                </div>
                <span style="font-size: 1.5rem;">${item.icon}</span>
            </div>
            <div class="reward-bottom" style="margin-top: 15px; justify-content: flex-end;">
                <button class="btn-buy" style="${btnStyle}" onclick="equipItem('${item.type}', '${itemId}')">${btnLabel}</button>
            </div>
        `;
        grid.appendChild(card);
    });
};


// ==========================================================================
// ONBOARDING WIZARD
// ==========================================================================
function updateWizardBackBtnVisibility() {
    const btnBack = document.getElementById('btn-wizard-back');
    if (!btnBack) return;
    const step0 = document.getElementById('wizard-step-0');
    if (step0 && step0.style.display !== 'none') {
        btnBack.style.display = 'none';
    } else {
        btnBack.style.display = 'inline-flex';
    }
}

function setWizardStep(stepId) {
    const step0 = document.getElementById('wizard-step-0');
    const step1 = document.getElementById('wizard-step-1');
    const step2 = document.getElementById('wizard-step-2');
    const stepHook = document.getElementById('wizard-step-hook');
    const step3 = document.getElementById('wizard-step-3');

    if (step0) step0.style.display = (stepId === 'wizard-step-0') ? 'block' : 'none';
    if (step1) step1.style.display = (stepId === 'wizard-step-1') ? 'block' : 'none';
    if (step2) step2.style.display = (stepId === 'wizard-step-2') ? 'block' : 'none';
    if (stepHook) stepHook.style.display = (stepId === 'wizard-step-hook') ? 'block' : 'none';
    if (step3) step3.style.display = (stepId === 'wizard-step-3') ? 'block' : 'none';
    
    if (typeof gameState !== 'undefined') {
        gameState.tutorialStep = stepId;
        if (typeof saveGameData === 'function') {
            saveGameData();
        }
    }
    updateWizardBackBtnVisibility();
}

function goBackWizard() {
    const step1 = document.getElementById('wizard-step-1');
    const step2 = document.getElementById('wizard-step-2');
    const stepHook = document.getElementById('wizard-step-hook');
    const step3 = document.getElementById('wizard-step-3');

    if (step1 && step1.style.display === 'block') {
        setWizardStep('wizard-step-0');
    } else if (step2 && step2.style.display === 'block') {
        setWizardStep('wizard-step-1');
    } else if (stepHook && stepHook.style.display === 'block') {
        setWizardStep('wizard-step-2');
    } else if (step3 && step3.style.display === 'block') {
        const otherCard = document.querySelector('.archetype-card-other');
        if (otherCard && otherCard.classList.contains('selected')) {
            setWizardStep('wizard-step-2');
        } else {
            setWizardStep('wizard-step-hook');
        }
    }
}

function initOnboardingWizard() {
    const wizardModal = document.getElementById('onboarding-wizard');
    if (!wizardModal) return;
    
    wizardModal.style.cssText = 'display: flex !important; position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.95); backdrop-filter: blur(8px); justify-content: center; align-items: center; padding: 24px;';
    
    const step0 = document.getElementById('wizard-step-0');
    const step1 = document.getElementById('wizard-step-1');
    const step2 = document.getElementById('wizard-step-2');
    const stepHook = document.getElementById('wizard-step-hook');
    const step3 = document.getElementById('wizard-step-3');
    
    // Intelligent step recovery
    let startStep = 'wizard-step-0';
    if (gameState.tutorialStep && document.getElementById(gameState.tutorialStep)) {
        startStep = gameState.tutorialStep;
        if (startStep === 'wizard-step-hook' && gameState.archetype) {
            setupHookStep(gameState.archetype);
        }
    }
    setWizardStep(startStep);
    
    // Botão Voltar
    const btnBack = document.getElementById('btn-wizard-back');
    if (btnBack) {
        // Clear old event listener to prevent duplicate calls
        const newBtnBack = btnBack.cloneNode(true);
        btnBack.parentNode.replaceChild(newBtnBack, btnBack);
        newBtnBack.addEventListener('click', () => {
            goBackWizard();
        });
    }

    // Botão Já Tenho Conta
    const btnReturning = document.getElementById('btn-returning-user');
    if (btnReturning) {
        btnReturning.addEventListener('click', () => {
            if (typeof window.loginWithGoogle === 'function') {
                window.loginWithGoogle();
            }
        });
    }
    
    // Passo 0: Gênero (ONBOARD-001: inclui opção neutra)
    const selectGender = (gender) => {
        gameState.gender = gender;
        document.querySelectorAll('.gender-card').forEach(c => c.classList.remove('selected'));

        const selCard = document.getElementById(`btn-gender-${gender}`);
        if (selCard) selCard.classList.add('selected');

        const pStep1 = document.getElementById('wizard-step-1-p');
        if (pStep1) {
            const term = gender === 'female' ? 'guerreira' : gender === 'neutral' ? 'guerreiro(a)' : 'guerreiro';
            pStep1.innerText = `O Sistema te escolheu. Qual é o seu nome, ${term}?`;
        }

        setTimeout(() => {
            setWizardStep('wizard-step-1');
        }, 250);
    };

    ['male', 'female', 'neutral'].forEach(g => {
        const btn = document.getElementById(`btn-gender-${g}`);
        if (btn) {
            const fresh = btn.cloneNode(true);
            btn.parentNode.replaceChild(fresh, btn);
            fresh.addEventListener('click', () => selectGender(g));
        }
    });
    
    // Passo 1: Nome
    const btnNext1 = document.getElementById('btn-wizard-next-1');
    const inputName = document.getElementById('wizard-name-input');
    
    if (btnNext1) {
        const newBtnNext1 = btnNext1.cloneNode(true);
        btnNext1.parentNode.replaceChild(newBtnNext1, btnNext1);
        newBtnNext1.addEventListener('click', () => {
            const name = inputName.value.trim();
            if (name) {
                gameState.playerName = name;
                document.getElementById('lbl-player-name').innerText = name.toUpperCase();
                setWizardStep('wizard-step-2');
            } else {
                inputName.style.borderColor = 'red';
            }
        });
    }

    // Passo 2: Arquétipo
    const btnNext2 = document.getElementById('btn-wizard-next-2');
    const newBtnNext2 = btnNext2.cloneNode(true);
    btnNext2.parentNode.replaceChild(newBtnNext2, btnNext2);

    const archCards = document.querySelectorAll('.archetype-card');
    const otherInputContainer = document.getElementById('wizard-other-container');
    const otherInput = document.getElementById('wizard-other-input');
    let selectedArch = gameState.archetype || null;

    archCards.forEach(card => {
        card.addEventListener('click', () => {
            archCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedArch = card.getAttribute('data-arch');
            
            if (selectedArch === 'outros') {
                otherInputContainer.style.display = 'block';
                newBtnNext2.disabled = otherInput.value.trim() === '';
            } else {
                otherInputContainer.style.display = 'none';
                newBtnNext2.disabled = false;
            }
        });
    });

    otherInput.addEventListener('input', () => {
        if (selectedArch === 'outros') {
            newBtnNext2.disabled = otherInput.value.trim() === '';
        }
    });

    newBtnNext2.addEventListener('click', () => {
        if (selectedArch) {
            if (selectedArch === 'outros') {
                gameState.archetype = otherInput.value.trim() || 'Desconhecido';
                setWizardStep('wizard-step-3');
            } else {
                gameState.archetype = selectedArch;
                setupHookStep(selectedArch);
                setWizardStep('wizard-step-hook');
            }
        }
    });

    // Passo Hook
    const btnNextHook = document.getElementById('btn-wizard-next-hook');
    if (btnNextHook) {
        const newBtnNextHook = btnNextHook.cloneNode(true);
        btnNextHook.parentNode.replaceChild(newBtnNextHook, btnNextHook);
        newBtnNextHook.addEventListener('click', () => {
            setWizardStep('wizard-step-3');
        });
    }

    // Passo 3: Comprometimento e Finalização
    const btnFinish = document.getElementById('btn-wizard-finish');
    const hourCards = document.querySelectorAll('.hour-card');
    let selectedHours = null;

    // Clone PRIMEIRO
    const newBtnFinish = btnFinish.cloneNode(true);
    btnFinish.parentNode.replaceChild(newBtnFinish, btnFinish);

    hourCards.forEach(card => {
        card.addEventListener('click', () => {
            hourCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedHours = card.getAttribute('data-hours');
            newBtnFinish.disabled = false;   // ← referencia o botão no DOM
        });
    });

    newBtnFinish.addEventListener('click', () => {
        if (selectedHours) {
            gameState.dailyCommitmentMins = parseInt(selectedHours);
            
            // Coletar dias selecionados
            const dayCheckboxes = document.querySelectorAll('.day-checkbox input:checked');
            const selectedDays = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
            gameState.activeDays = selectedDays.length > 0 ? selectedDays : [0,1,2,3,4,5,6]; // Fallback
            
            // Adapta o deck de missões com base no arquétipo e no tempo
            applyArchetypeDeck(selectedArch, gameState.dailyCommitmentMins);
            
            // FINALIZAR TUTORIAL
            gameState.tutorialCompleted = true;
            gameState.tutorialStep = null;
            
            wizardModal.style.cssText = 'display: none !important;';
            saveGameData();
            updateUI();
            
            setTimeout(() => {
                showSystemToast(`Despertar concluído, ${gameState.playerName}. O Sistema iniciou sua jornada.`);
            }, 1000);

            // ONBOARD-003: oferece instalar o PWA logo após o onboarding
            setTimeout(() => {
                if (typeof window.promptInstallAfterOnboarding === 'function') window.promptInstallAfterOnboarding();
            }, 2200);
        }
    });
}

// ONBOARD-002: 3 micro-hábitos sugeridos por arquétipo (usuário escolhe 1)
const ARCHETYPE_HOOK_HABITS = {
    corpo: [
        { title: 'Beber 1 copo de água ao acordar', skill: 'physical', xp: 10, gold: 5, duration: 2, icon: '💧' },
        { title: 'Treinar 20 minutos', skill: 'physical', xp: 30, gold: 15, duration: 20, icon: '🏋️' },
        { title: 'Caminhar 30 minutos', skill: 'physical', xp: 25, gold: 12, duration: 30, icon: '🚶' },
    ],
    foco: [
        { title: '15 minutos de leitura (sem celular)', skill: 'wisdom', xp: 20, gold: 10, duration: 15, icon: '📚' },
        { title: 'Bloco de 25 min (Pomodoro)', skill: 'productivity', xp: 30, gold: 15, duration: 25, icon: '🧠' },
        { title: 'Planejar o dia em 5 minutos', skill: 'routine', xp: 15, gold: 8, duration: 5, icon: '📅' },
    ],
    zen: [
        { title: 'Meditar por 3 minutos', skill: 'mental', xp: 10, gold: 5, duration: 3, icon: '🧘' },
        { title: 'Journaling — 3 gratidões', skill: 'wisdom', xp: 15, gold: 8, duration: 5, icon: '📝' },
        { title: 'Sem tela 30min antes de dormir', skill: 'routine', xp: 20, gold: 10, duration: 30, icon: '🌙' },
    ],
    rotina: [
        { title: 'Arrumar a cama ao levantar', skill: 'routine', xp: 10, gold: 5, duration: 2, icon: '🛏️' },
        { title: 'Dormir antes das 23h', skill: 'routine', xp: 20, gold: 10, duration: 5, icon: '😴' },
        { title: 'Acordar no horário planejado', skill: 'routine', xp: 25, gold: 12, duration: 5, icon: '⏰' },
    ],
};
const ARCHETYPE_HOOK_NAMES = {
    corpo: 'Alta Performance & Corpo', foco: 'Foco & Produtividade',
    zen: 'Zen & Saúde Mental', rotina: 'Estilo de Vida & Rotina',
};

function setupHookStep(archetype) {
    const lblArch = document.getElementById('hook-arch-name');
    const icon = document.getElementById('hook-icon');
    const optionsEl = document.getElementById('hook-habit-options');
    const habits = ARCHETYPE_HOOK_HABITS[archetype] || ARCHETYPE_HOOK_HABITS.rotina;

    if (lblArch) lblArch.innerText = ARCHETYPE_HOOK_NAMES[archetype] || 'Sua Jornada';
    if (icon) icon.innerText = habits[0].icon || '🎯';
    if (!optionsEl) return;

    optionsEl.innerHTML = '';
    gameState._selectedHookHabit = habits[0]; // primeira pré-selecionada

    habits.forEach((h, i) => {
        const card = document.createElement('div');
        card.className = 'hook-habit-card' + (i === 0 ? ' selected' : '');
        card.innerHTML = `<span style="font-size:1.3rem; margin-right:10px;">${h.icon}</span><strong>${h.title}</strong>`;
        card.addEventListener('click', () => {
            optionsEl.querySelectorAll('.hook-habit-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            gameState._selectedHookHabit = h;
            if (icon) icon.innerText = h.icon;
        });
        optionsEl.appendChild(card);
    });
}

function applyArchetypeDeck(archetype, minutes) {
    let deck = [];
    
    // 1. O Micro-hábito base (ONBOARD-002: usa o hábito escolhido no Hook, se houver; senão fallback por arquétipo)
    let baseQuest = null;
    const hook = gameState._selectedHookHabit;
    if (archetype !== 'outros' && hook && hook.title) {
        const sk = hook.skill || 'routine';
        baseQuest = { id: 'q-hook-' + sk, title: `${hook.title} (${hook.duration || 5} min)`, type: 'daily', icon: hook.icon || '🎯', completed: false, xp: hook.xp || 10, gold: hook.gold || 5, duration: hook.duration || 5, minLevel: 1, skill: sk };
    } else if (archetype === 'corpo') {
        baseQuest = { id: 'q-agua', title: 'Beber 1 copo de água ao acordar (2 min)', type: 'daily', icon: '💧', completed: false, xp: 10, gold: 5, duration: 2, minLevel: 1, skill: 'physical' };
    } else if (archetype === 'foco') {
        baseQuest = { id: 'q-ler', title: 'Leitura (15 min)', type: 'daily', icon: '📚', completed: false, xp: 20, gold: 10, duration: 15, minLevel: 1, skill: 'wisdom' };
    } else if (archetype === 'zen') {
        baseQuest = { id: 'q-meditar', title: 'Meditar por 3 minutos (3 min)', type: 'daily', icon: '🧘', completed: false, xp: 10, gold: 5, duration: 3, minLevel: 1, skill: 'mental' };
    } else if (archetype === 'rotina') {
        baseQuest = { id: 'q-cama', title: 'Arrumei a cama ao levantar (2 min)', type: 'daily', icon: '🛏️', completed: false, xp: 10, gold: 5, duration: 2, minLevel: 1, skill: 'routine' };
    } else {
        baseQuest = { id: 'q-planejar', title: 'Planejar tarefas do dia seguinte (10 min)', type: 'daily', icon: '📅', completed: false, xp: 15, gold: 8, duration: 10, minLevel: 1, skill: 'productivity' };
    }
    
    deck.push(baseQuest);
    let currentTotal = baseQuest.duration;

    // Pool de candidatos a hábitos fáceis (Nível 1)
    let candidates = [
        { id: 'q-caminhada-easy', title: 'Caminhada ao Ar Livre (30 min)', type: 'daily', icon: '🚶', completed: false, xp: 25, gold: 12, duration: 30, minLevel: 1, skill: 'physical' },
        { id: 'q-podcast-easy', title: 'Ouvir Podcast ou Aula (30 min)', type: 'daily', icon: '🎧', completed: false, xp: 25, gold: 12, duration: 30, minLevel: 1, skill: 'wisdom' },
        { id: 'q-ler', title: 'Leitura (15 min)', type: 'daily', icon: '📚', completed: false, xp: 20, gold: 10, duration: 15, minLevel: 1, skill: 'wisdom' },
        { id: 'q-faxina', title: 'Faxina rápida / Organizar a casa (15 min)', type: 'daily', icon: '🧹', completed: false, xp: 20, gold: 10, duration: 15, minLevel: 1, skill: 'productivity' },
        { id: 'q-conversa', title: 'Conversa/ligação curta com familiar ou amigo (15 min)', type: 'daily', icon: '📞', completed: false, xp: 20, gold: 10, duration: 15, minLevel: 1, skill: 'social' },
        { id: 'q-planejar', title: 'Planejar tarefas do dia seguinte (10 min)', type: 'daily', icon: '📅', completed: false, xp: 15, gold: 8, duration: 10, minLevel: 1, skill: 'productivity' },
        { id: 'q-alongamento', title: 'Alongamento / Mobilidade (10 min)', type: 'daily', icon: '🧘', completed: false, xp: 15, gold: 8, duration: 10, minLevel: 1, skill: 'physical' },
        { id: 'q-acordar', title: 'Acordar Cedo (Horário Fixo) (5 min)', type: 'daily', icon: '🌅', completed: false, xp: 15, gold: 8, duration: 5, minLevel: 1, skill: 'routine' },
        { id: 'q-agua2', title: 'Beber Água (8 copos - 5 min)', type: 'daily', icon: '💧', completed: false, xp: 15, gold: 8, target: 8, current: 0, duration: 5, minLevel: 1, skill: 'physical' },
        { id: 'q-checkin', title: 'Check-in Emocional no Diário (5 min)', type: 'daily', icon: '📝', completed: false, xp: 15, gold: 8, duration: 5, minLevel: 1, skill: 'mental' },
        { id: 'q-meditar', title: 'Meditar por 3 minutos (3 min)', type: 'daily', icon: '🧘', completed: false, xp: 10, gold: 5, duration: 3, minLevel: 1, skill: 'mental' },
        { id: 'q-familia', title: 'Mensagem carinhosa para família (3 min)', type: 'daily', icon: '❤️', completed: false, xp: 10, gold: 5, duration: 3, minLevel: 1, skill: 'social' },
        { id: 'q-cama', title: 'Arrumei a cama ao levantar (2 min)', type: 'daily', icon: '🛏️', completed: false, xp: 10, gold: 5, duration: 2, minLevel: 1, skill: 'routine' },
        { id: 'q-agua', title: 'Beber 1 copo de água ao acordar (2 min)', type: 'daily', icon: '💧', completed: false, xp: 10, gold: 5, duration: 2, minLevel: 1, skill: 'physical' }
    ];

    // Se o comprometimento for menor que 120 minutos, priorizamos hábitos mais curtos primeiro para dar variedade.
    if (minutes < 120) {
        candidates.reverse();
    }

    // Adiciona candidatos de forma orçamentada até atingir o limite
    candidates.forEach(cand => {
        // Evita duplicar o hábito base
        if (cand.id === baseQuest.id) return;
        // Evita colisão lógica de copos de água
        if (baseQuest.id === 'q-agua' && cand.id === 'q-agua2') return;

        if (currentTotal + cand.duration <= minutes) {
            deck.push({ ...cand });
            currentTotal += cand.duration;
        }
    });

    gameState.quests = deck;
    renderQuests();
}



// ==========================================================================
// RENDERIZADORES DE INTERFACE (UI)
// ==========================================================================

// Atualiza informações gerais do Personagem
// GAME-003: countdown até o reset diário (meia-noite local)
function updateResetCountdown() {
    const el = document.getElementById('reset-countdown');
    if (!el) return;
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    el.textContent = `🔄 Reset diário em ${h}h ${m}m`;
}
setInterval(updateResetCountdown, 60000);

// Banner da Reavaliação de Rank (aparece quando há uma disponível)
function renderRankEvaluationBanner() {
    const banner = document.getElementById('rank-evaluation-banner');
    if (!banner) return;
    const ev = (typeof getPendingRankEvaluation === 'function') ? getPendingRankEvaluation() : null;
    if (!ev) { banner.style.display = 'none'; banner.innerHTML = ''; return; }
    const canAfford = (gameState.gold || 0) >= ev.cost;
    banner.style.display = 'block';
    banner.innerHTML = `
        <div class="rank-eval-card">
            <div class="rank-eval-info">
                <div class="rank-eval-label">⚜️ REAVALIAÇÃO DE RANK ${ev.key.toUpperCase()} DISPONÍVEL</div>
                <div class="rank-eval-desc">Reivindique sua promoção e receba o título <strong>"${ev.titleLabel}"</strong>.</div>
            </div>
            <button class="rank-eval-btn" ${canAfford ? '' : 'disabled'} onclick="buyRankEvaluation('${ev.key}')">${ev.cost} 🪙</button>
        </div>`;
}

function updateUI() {
    const lvlEl = document.getElementById('lbl-level');
    if (lvlEl) lvlEl.innerText = gameState.level;
    const goldEl = document.getElementById('lbl-gold');
    if (goldEl) goldEl.innerText = gameState.gold;
    if (gameState.playerName) {
        const playerNameEl = document.getElementById('lbl-player-name');
        if (playerNameEl) playerNameEl.innerText = gameState.playerName.toUpperCase();
    }
    
    // RANK badge
    const rankInfo = getRankForLevel(gameState.level);
    const rankBadge = document.getElementById('lbl-rank');
    if (rankBadge) {
        rankBadge.innerText = rankInfo.rank;
        rankBadge.className = 'rank-badge ' + rankInfo.css;
    }

    // COSMÉTICOS (Títulos e Bordas)
    const titleLabels = {
        'title_implacavel': 'O Implacável',
        'title_mestre': 'Mestre do Tempo',
        'rank_d': 'O Iniciado', 'rank_c': 'O Caçador', 'rank_b': 'A Elite',
        'rank_a': 'O Herói', 'rank_s': 'Soberano',
        'rank_nacional': 'Lendário', 'rank_monarca': 'O Monarca'
    };
    const playerTitle = document.getElementById('lbl-player-title');
    if (playerTitle) {
        if (gameState.inventory && gameState.inventory.activeTitle) {
            const at = gameState.inventory.activeTitle;
            playerTitle.innerText = titleLabels[at] || 'Desperto';
            if (at === 'title_implacavel') playerTitle.style.color = 'var(--neon-purple)';
            else if (at === 'title_mestre') playerTitle.style.color = 'var(--neon-gold)';
            else if (at.startsWith('rank_')) playerTitle.style.color = 'var(--neon-gold)';
        } else {
            playerTitle.innerText = 'Desperto';
            playerTitle.style.color = 'var(--text-muted)';
        }
    }

    const avatarBorder = document.querySelector('.avatar-hex-border');
    const avatarWrapper = document.querySelector('.avatar-hex-wrapper');
    if (avatarBorder && avatarWrapper) {
        avatarBorder.className = 'avatar-hex-border';
        avatarWrapper.className = 'avatar-hex-wrapper';
        
        const activeBorder = gameState.inventory?.activeBorder;
        if (activeBorder === 'border_neonred') {
            avatarBorder.classList.add('border-neonred');
            avatarWrapper.classList.add('glow-neonred');
        } else if (activeBorder === 'skin_shadow_master') {
            avatarBorder.classList.add('border-shadow-master');
            avatarWrapper.classList.add('glow-shadow-master');
        } else if (activeBorder === 'skin_mist_monarch') {
            avatarBorder.classList.add('border-mist-monarch');
            avatarWrapper.classList.add('glow-mist-monarch');
        } else if (activeBorder === 'skin_arise_emperor') {
            avatarBorder.classList.add('border-arise-emperor');
            avatarWrapper.classList.add('glow-arise-emperor');
        }
    }

    // Display estendido do streak: dias + multiplicador + escudos
    const streakEl = document.getElementById('lbl-streak');
    if (streakEl) {
        if (typeof gameState.streak !== 'number') {
            gameState.streak = parseInt(gameState.streak) || 0;
        }
        const mult = calcStreakMultiplier();
        const multStr = mult > 1 ? ` · x${mult.toFixed(2)}` : '';
        const shields = gameState.shields || 0;
        const shieldStr = shields > 0
            ? '  ' + '🛡️'.repeat(shields) + '░'.repeat(3 - shields)
            : '';
        streakEl.innerText = `${gameState.streak}${multStr}${shieldStr}`;

        // Animação/badges com base no tier do streak
        const streakChip = streakEl.closest('.streak-chip');
        if (streakChip) {
            streakChip.classList.remove('streak-tier-3', 'streak-tier-7', 'streak-tier-14', 'streak-tier-30');
            const streak = gameState.streak || 0;
            if (streak >= 30) streakChip.classList.add('streak-tier-30');
            else if (streak >= 14) streakChip.classList.add('streak-tier-14');
            else if (streak >= 7) streakChip.classList.add('streak-tier-7');
            else if (streak >= 3) streakChip.classList.add('streak-tier-3');
        }
    }

    // Barra de XP
    const xpCurEl = document.getElementById('lbl-xp-current');
    if (xpCurEl) xpCurEl.innerText = gameState.xp;
    const xpNextEl = document.getElementById('lbl-xp-next');
    if (xpNextEl) xpNextEl.innerText = gameState.xpToNext;
    const xpBarInnerEl = document.getElementById('xp-bar-inner');
    if (xpBarInnerEl) {
        const xpPercent = Math.min((gameState.xp / gameState.xpToNext) * 100, 100);
        xpBarInnerEl.style.width = `${xpPercent}%`;
    }

    // Tooltip de XP Faltante (GAME-006)
    const xpSectionEl = document.querySelector('.xp-section');
    if (xpSectionEl) {
        const xpRemaining = Math.max(0, gameState.xpToNext - gameState.xp);
        const nextLevel = (gameState.level || 1) + 1;
        xpSectionEl.title = `Faltam ${xpRemaining} XP para o Nível ${nextLevel}`;
    }

    // GAME-002: indicador persistente de buff ativo (visível enquanto o buff durar)
    const buffIndEl = document.getElementById('buff-indicator');
    if (buffIndEl) {
        const b = gameState.buffs || {};
        const dxpActive = (b.doubleXpExpiresAt && Date.now() < b.doubleXpExpiresAt) || b.doubleXp === true;
        const parts = [];
        if (dxpActive) parts.push(`<span class="buff-badge buff-xp">⚡ ${b.xpMult || 2}x XP</span>`);
        if (b.legendaryFocus) parts.push('<span class="buff-badge buff-gold">x3 💰</span>');
        buffIndEl.innerHTML = parts.join('');
        buffIndEl.style.display = parts.length ? '' : 'none';
    }

    updateResetCountdown(); // GAME-003
    renderRankEvaluationBanner();

    // Grupo Multiplier Chip (BUG-007)
    const groupChipEl = document.getElementById('group-multiplier-chip');
    const groupMultEl = document.getElementById('lbl-group-mult');
    if (groupChipEl && groupMultEl) {
        const friendsCount = gameState.friendsCount || 0;
        if (friendsCount > 0) {
            const mult = calcGroupMultiplier();
            groupMultEl.innerText = `x${mult.toFixed(2)}`;
            groupChipEl.style.display = 'flex';
        } else {
            groupChipEl.style.display = 'none';
        }
    }

    // Progresso diário
    const todayDayOfWeek = new Date().getDay();
    const activeToday = (gameState.quests || []).filter(q =>
        isQuestActiveOnDay(q, todayDayOfWeek)
    );
    const totalDailies = activeToday.length;
    const completedDailies = activeToday.filter(q => q.completed).length;
    const lblDailyProg = document.getElementById('lbl-daily-progress');
    if (lblDailyProg) lblDailyProg.innerText = `${completedDailies}/${totalDailies}`;

    // RANK badge

    // Player Title Dinâmico — só quando não há título cosmético da Taverna equipado
    // (o bloco COSMÉTICOS acima já preencheu texto e cor nesse caso)
    const titleLabel = document.getElementById('lbl-player-title');
    if (titleLabel && !gameState.inventory?.activeTitle) {
        titleLabel.innerText = computePlayerTitle(gameState.skills, gameState.gender);
    }

    // Avatar e radar chart
    updateAvatarImage();
    renderSkills();

    //  Sinergias ativas 
    renderSynergies();
    renderRankPerks();
    renderWeeklyBoss();
    renderAchievements();
    if (typeof renderTutorialBanner === 'function') {
        renderTutorialBanner();
    }

    // Renderiza Buffs Ativos no HUD
    const buffsListEl = document.getElementById('active-buffs-list');
    if (buffsListEl) {
        let buffsHtml = '';
        if (gameState.buffs) {
            if (gameState.buffs.autoHeal) {
                buffsHtml += `
                    <div class="buff-chip buff-auto-heal" title="Anula a penalidade caso você perca a ofensiva um dia.">
                        <span class="buff-chip-icon">🧪</span>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span class="buff-chip-title">Auto-Cura</span>
                            <span class="buff-chip-desc">Ativo</span>
                        </div>
                    </div>
                `;
            }
            if (gameState.buffs.doubleXp) {
                buffsHtml += `
                    <div class="buff-chip buff-double-xp" title="Ganha o dobro de XP em tudo até a meia-noite.">
                        <span class="buff-chip-icon">📜</span>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span class="buff-chip-title">Sabedoria</span>
                            <span class="buff-chip-desc">Double XP</span>
                        </div>
                    </div>
                `;
            }
            if (gameState.buffs.legendaryFocus) {
                buffsHtml += `
                    <div class="buff-chip buff-legendary-focus" title="Sua próxima missão concluída concede o triplo (x3) de Ouro.">
                        <span class="buff-chip-icon">⚡</span>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span class="buff-chip-title">Foco Lendário</span>
                            <span class="buff-chip-desc">x3 Ouro</span>
                        </div>
                    </div>
                `;
            }
        }
        buffsListEl.innerHTML = buffsHtml;
    }
}

// Renderiza badges de sinergias ativas abaixo das barras de atributo
function renderSynergies() {
    const container = document.getElementById('synergies-container');
    if (!container) return; // Elemento ainda não existe no HTML — seguro ignorar

    const active = computeSynergies();
    if (active.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '<div style="width:100%; font-size:10px; color:#fbbf24; font-family:var(--font-hud); letter-spacing:2px; margin-bottom:4px; border-bottom: 1px solid rgba(251,191,36,0.3); padding-bottom: 2px;">⚡ SINERGIAS ATIVAS</div>' + active.map(s => `
        <div class="synergy-badge" title="${s.description}">
            <span class="synergy-icon">${s.icon}</span>
            <span class="synergy-name">${s.name}</span>
        </div>
    `).join('');
}

// Renderiza badges de rank perks ativos abaixo das sinergias
function renderRankPerks() {
    const container = document.getElementById('rank-perks-container');
    if (!container) return;

    const active = getActivePerks();
    if (active.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '<div style="width:100%; font-size:10px; color:#00f0ff; font-family:var(--font-hud); letter-spacing:2px; margin-bottom:4px; margin-top:8px; border-bottom: 1px solid rgba(0,240,255,0.3); padding-bottom: 2px;">P RANK PERKS</div>' + active.map(p => `
        <div class="perk-badge" title="${p.description}">
            <span class="perk-icon">${p.icon}</span>
            <span class="perk-name">${p.name}</span>
        </div>
    `).join('');
}

function updateAvatarImage() {
    const avatarEl = document.getElementById('char-avatar-img');
    if (!avatarEl) return;
    
    const gender = gameState.gender || 'male';
    const folder = gender === 'female' ? '0 - female' : '1 - male';
    
    const rank = getRankForLevel(gameState.level);
    const rankKey = rank.css.replace('rank-', '');
    
    const avatarFileMap = {
        candidato:  { num: '1', name: 'e' },
        e:          { num: '1', name: 'e' },
        d:          { num: '2', name: 'd' },
        c:          { num: '3', name: 'c' },
        b:          { num: '4', name: 'b' },
        a:          { num: '5', name: 'a' },
        s:          { num: '6', name: 's' },
        nacional:   { num: '6', name: 's' },
        monarca:    { num: '6', name: 's' }
    };
    
    const mapping = avatarFileMap[rankKey] || { num: '1', name: 'e' };
    avatarEl.src = `2.assets/avatars/${folder}/${mapping.num}.rank-${mapping.name}.webp`;
    avatarEl.onerror = () => { avatarEl.src = `2.assets/avatars/${folder}/1.rank-e.png`; };
}

// Renderiza a árvore de atributos (Hexagonal Radar Chart) dinamicamente
function renderSkills() {
    // Inicializa se não existir no save
    initSkillsState();
    
    // Desenha o gráfico Radar Hexagonal no Canvas (debounced)
    debouncedDrawRadarChart();
}

// Inicializa a árvore de skills caso não esteja presente no estado (retrocompatibilidade robusta)

function renderQuests() {
    const colPhysical     = document.getElementById('quests-list-physical');
    const colWisdom       = document.getElementById('quests-list-wisdom');
    const colProductivity = document.getElementById('quests-list-productivity');
    const colSocial       = document.getElementById('quests-list-social');
    const colMental       = document.getElementById('quests-list-mental');
    const colRoutine      = document.getElementById('quests-list-routine');

    [colPhysical, colWisdom, colProductivity, colSocial, colMental, colRoutine].forEach(c => {
        if (c) c.innerHTML = '';
    });

    // Renderiza Masmorras (se houver ativa)
    const dungeonBanner = document.getElementById('dungeon-active-banner');
    if (gameState.activeDungeon && dungeonBanner) {
        const rarity = gameState.activeDungeon.rarity || 'comum';
        const rarityStyles = {
            comum: {
                bg: 'linear-gradient(135deg, rgba(0,240,255,0.03) 0%, rgba(0,240,255,0.1) 100%)',
                border: '1px solid var(--neon-cyan)',
                color: 'var(--neon-cyan)',
                shadow: '0 0 12px rgba(0,240,255,0.15)',
                label: 'COMUM'
            },
            raro: {
                bg: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0.15) 100%)',
                border: '1px solid #3b82f6',
                color: '#3b82f6',
                shadow: '0 0 15px rgba(59,130,246,0.2)',
                label: 'RARA'
            },
            epico: {
                bg: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(168,85,247,0.2) 100%)',
                border: '1px solid var(--neon-purple)',
                color: 'var(--neon-purple)',
                shadow: '0 0 20px rgba(168,85,247,0.3)',
                label: 'ÉPICA'
            }
        };
        const rStyle = rarityStyles[rarity];

        dungeonBanner.style.display = 'block';
        dungeonBanner.innerHTML = `
            <div class="dungeon-card" style="background: ${rStyle.bg}; border: ${rStyle.border}; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: ${rStyle.shadow};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 10px; color: ${rStyle.color}; font-family: var(--font-hud); letter-spacing: 1px;">MASMORRA ${rStyle.label} ATIVA</div>
                        <div style="font-size: 16px; font-weight: bold; margin-top: 5px; color: white;">${gameState.activeDungeon.title}</div>
                    </div>
                    <div style="text-align:right; color:${rStyle.color}; font-family:var(--font-hud); line-height:1.1;"><div style="font-size:20px; font-weight:bold;">${gameState.activeDungeon.progress||0}/${gameState.activeDungeon.target||'?'}</div><div style="font-size:8px; letter-spacing:1px; opacity:0.8;">${({physical:'FÍSICO',mental:'MENTAL',productivity:'FOCO',wisdom:'SABEDORIA',social:'CONEXÃO',routine:'ROTINA'})[gameState.activeDungeon.skill]||''}</div></div>
                </div>
            </div>
        `;
    } else if (dungeonBanner) {
        dungeonBanner.style.display = 'none';
    }

    // Renderiza Desafio Semanal (se houver ativo)
    const weeklyChallengeBanner = document.getElementById('weekly-challenge-banner');
    if (gameState.weeklyChallenge && !gameState.weeklyChallenge.completed && weeklyChallengeBanner) {
        const wc = gameState.weeklyChallenge;
        weeklyChallengeBanner.style.display = 'block';
        
        const percent = Math.min(100, Math.round((wc.current / wc.target) * 100));
        
        weeklyChallengeBanner.innerHTML = `
            <div class="weekly-challenge-card" style="background: linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(59,130,246,0.1) 100%); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 15px; box-shadow: 0 0 10px rgba(59,130,246,0.1);">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 10px; color: #3b82f6; font-family: var(--font-hud); letter-spacing: 1px;">DESAFIO SEMANAL (SEMANA ${wc.week})</div>
                            <div style="font-size: 15px; font-weight: bold; margin-top: 3px; color: white;">${wc.title}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">${wc.description}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="font-hud" style="font-size: 16px; font-weight: bold; color: #3b82f6;">${wc.current}/${wc.target}</div>
                            <div style="font-size: 9px; color: var(--text-secondary); margin-top: 2px;">+${wc.xpReward} XP · +${wc.goldReward} 💰</div>
                        </div>
                    </div>
                    <div class="progress-bar-track" style="width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; margin-top: 4px;">
                        <div class="progress-bar-fill" style="width: ${percent}%; background: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,0.6); height: 100%; transition: width 0.3s ease-in-out;"></div>
                    </div>
                </div>
            </div>
        `;
    } else if (weeklyChallengeBanner) {
        weeklyChallengeBanner.style.display = 'none';
    }

    // Helper para mapeamento direto de skill para coluna
    const SKILL_COLUMN_MAP = {
        physical: colPhysical, wisdom: colWisdom, productivity: colProductivity,
        social: colSocial, mental: colMental, routine: colRoutine
    };
    function getContainer(skill) {
        return SKILL_COLUMN_MAP[skill] || colRoutine;
    }

    // Dungeon ativa
    checkDungeonExpiry();
    const _d = gameState.activeDungeon;
    if (_d && !_d.completed) {
        const _now = Date.now();
        const _remMs  = Math.max(0, _d.expiresAt - _now);
        const _remH   = Math.floor(_remMs / 3600000);
        const _remMin = Math.floor((_remMs % 3600000) / 60000);
        const _timeLabel = _remMs <= 0 ? 'EXPIRADA' : `${_remH}h ${_remMin}min restantes`;
        const _urgent    = _remMs > 0 && _remMs < 6 * 3600000;

        const rarity = _d.rarity || 'comum';
        const rarityStyles = {
            comum: { border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', shadow: '0 0 10px rgba(0,240,255,0.15)', label: 'COMUM' },
            raro: { border: '1px solid #3b82f6', color: '#3b82f6', shadow: '0 0 12px rgba(59,130,246,0.2)', label: 'RARA' },
            epico: { border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)', shadow: '0 0 15px rgba(168,85,247,0.25)', label: 'ÉPICA' }
        };
        const rStyle = rarityStyles[rarity];

        const _dc = document.createElement('div');
        _dc.className = `quest-card dungeon-card${_urgent ? ' dungeon-urgent' : ''}`;
        _dc.style.border = rStyle.border;
        _dc.style.boxShadow = rStyle.shadow;
        _dc.setAttribute('data-skill', _d.skill || 'productivity');
        _dc.innerHTML = `
            <div class="quest-details">
                <div class="quest-icon">⚔️</div>
                <div class="quest-title-wrap">
                    <span class="quest-title">${_d.title}</span>
                    <div class="quest-payouts">
                        <span class="diff-badge dungeon-badge" style="background: ${rStyle.color}15; color: ${rStyle.color}; border: 1px solid ${rStyle.color}33;">${rStyle.label}</span>
                        <span class="payout-xp">+${_d.xp} XP</span>
                        <span class="payout-gold">+${_d.gold} 💰</span>
                    </div>
                    <div style="font-size:11px; color:${rStyle.color}; margin-top:3px;">🎯 ${(_d.progress||0)}/${(_d.target||'?')} hábitos de ${({physical:'Físico',mental:'Mental',productivity:'Foco',wisdom:'Sabedoria',social:'Conexão',routine:'Rotina'})[_d.skill]||_d.skill||''}</div>
                    <div class="dungeon-timer${_urgent ? ' dungeon-timer-urgent' : ''}">⏳ ${_timeLabel}</div>
                </div>
            </div>
            <div style="align-self:center; padding-right:8px; color:${rStyle.color}; font-family:var(--font-hud); font-size:15px; font-weight:bold;">${(_d.progress||0)}/${(_d.target||'?')}</div>
        `;
        const container = getContainer(_d.skill);
        if (container) container.appendChild(_dc);
    }

    // Daily Quests
    if (gameState.quests) {
        const todayDayOfWeek = new Date().getDay();
        const activeToday = gameState.quests.filter(q =>
            isQuestActiveOnDay(q, todayDayOfWeek)
        );
        activeToday.forEach(quest => {
            const card = document.createElement('div');
            card.className = `quest-card ${quest.completed ? 'completed' : ''}`;
            card.setAttribute('data-skill', quest.skill || 'routine');

            const diffMap = {
                easy: 'Fácil',
                medium: 'Intermediário',
                hard: 'Difícil',
                rank_b: 'Muito Difícil',
                rank_a: 'Heroico',
                rank_s: 'Lendário'
            };
            const skillFallbackMap = { routine: 'Fácil', physical: 'Fácil', wisdom: 'Intermediário', mental: 'Intermediário', productivity: 'Difícil', social: 'Intermediário' };
            const diffLabel = diffMap[quest.difficulty] || skillFallbackMap[quest.skill] || 'Fácil';

            let extraHTML = '';
            const isWater = quest.id?.includes('agua') ||
                            quest.title?.toLowerCase().includes('água') ||
                            quest.title?.toLowerCase().includes('agua') ||
                            quest.icon === '💧' ||
                            quest.emoji === '💧';
            const hasCounter = quest.current !== undefined && quest.target !== undefined && quest.target > 1;
            if (hasCounter) {
                const label = isWater ? ` copos` : '';
                extraHTML = `<div class="water-adjust-row">
                    <button class="water-btn btn-minus" data-id="${quest.id}">−</button>
                    <span class="water-val">${quest.current || 0}/${quest.target}${label}</span>
                    <button class="water-btn btn-plus" data-id="${quest.id}">+</button>
                </div>`;
            }


            card.innerHTML = `
                <button class="quest-remove-btn"
                        data-id="${quest.id}"
                        onclick="confirmRemoveQuest('${quest.id}', '${quest.title.replace(/'/g, "\\'")}')">
                    ✕
                </button>
                <div class="quest-details">
                    <div class="quest-icon">${quest.icon || '📅'}</div>
                    <div class="quest-title-wrap">
                        <span class="quest-title">${quest.title}</span>
                        <div class="quest-payouts">
                            <span class="diff-badge">${diffLabel}</span>
                            <span class="payout-xp">+${quest.xp} XP</span>
                            <span class="payout-gold">+${quest.gold} 🪙</span>
                        </div>
                        ${extraHTML}
                    </div>
                </div>
                <button class="quest-complete-btn" data-id="${quest.id}">✓</button>
            `;
            const container = getContainer(quest.skill || 'routine');
            if (container) container.appendChild(card);
        });
    }

    // Side Quests
    if (gameState.sideQuests) {
        gameState.sideQuests.forEach(quest => {
            const card = document.createElement('div');
            card.className = `quest-card ${quest.completed ? 'completed' : ''}`;
            card.setAttribute('data-skill', quest.skill || 'productivity');
            const diffMap = {
                easy: 'Fácil',
                medium: 'Intermediário',
                hard: 'Difícil',
                rank_b: 'Muito Difícil',
                rank_a: 'Heroico',
                rank_s: 'Lendário'
            };
            const diffLabel = diffMap[quest.difficulty] || quest.difficulty?.toUpperCase() || 'Fácil';
            card.innerHTML = `
                <button class="quest-remove-btn"
                        data-id="${quest.id}"
                        onclick="confirmRemoveQuest('${quest.id}', '${quest.title.replace(/'/g, "\\'")}')">
                    ✕
                </button>
                <div class="quest-details">
                    <div class="quest-icon">${quest.icon || '⚔️'}</div>
                    <div class="quest-title-wrap">
                        <span class="quest-title">${quest.title}</span>
                        <div class="quest-payouts">
                            <span class="diff-badge">${diffLabel}</span>
                            <span class="payout-xp">+${quest.xp} XP</span>
                            <span class="payout-gold">+${quest.gold} 🪙</span>
                        </div>
                    </div>
                </div>
                <button class="quest-complete-btn" data-id="${quest.id}">✓</button>
            `;
            const container = getContainer(quest.skill || 'productivity');
            if (container) container.appendChild(card);
        });
    }

    // Mensagem de placeholder se coluna estiver vazia
    [
        { el: colPhysical,     label: 'NENHUMA MISSÃO ATIVA' },
        { el: colWisdom,       label: 'NENHUMA MISSÃO ATIVA' },
        { el: colProductivity, label: 'NENHUMA MISSÃO ATIVA' },
        { el: colSocial,       label: 'NENHUMA MISSÃO ATIVA' },
        { el: colMental,       label: 'NENHUMA MISSÃO ATIVA' },
        { el: colRoutine,      label: 'NENHUMA MISSÃO ATIVA' }
    ].forEach(colObj => {
        if (colObj.el && colObj.el.children.length === 0) {
            colObj.el.innerHTML = `<div style="text-align:center;color:rgba(15,31,53,0.35);font-size:11px;padding:20px;font-family:var(--font-hud);letter-spacing:1px">${colObj.label}</div>`;
        }
    });

    renderAddictions();
}

// ── SEÇÃO VÍCIOS ───────────────────────────────────────────────────────────
// Vícios têm lógica invertida: nascem completos (abstinência) todo dia. O check
// verde significa "não cedi hoje". Desmarcar = recaída (aplica debuff).
function renderAddictions() {
    const section = document.getElementById('addictions-section');
    if (!section) return;

    const addictions = (gameState.quests || []).filter(q => q.type === 'addiction');
    if (addictions.length === 0) {
        section.style.display = 'none';
        section.innerHTML = '';
        return;
    }

    section.style.display = 'block';
    const streak = gameState.addictionStreak || 0;
    const b = gameState.buffs;
    const debuffActive = !!(b && b.addictionPenalty && b.addictionPenaltyExpiresAt && Date.now() < b.addictionPenaltyExpiresAt);

    let cards = '';
    addictions.forEach(quest => {
        const abstinent = !!quest.completed; // true = não cedeu hoje
        const safeTitle = (quest.title || '').replace(/'/g, "\\'");
        cards += `
            <div class="quest-card addiction-card ${abstinent ? 'abstinent' : 'relapsed'}">
                <button class="quest-remove-btn" data-id="${quest.id}"
                        onclick="confirmRemoveQuest('${quest.id}', '${safeTitle}')">✕</button>
                <div class="quest-details">
                    <div class="quest-icon">${quest.icon || '🚫'}</div>
                    <div class="quest-title-wrap">
                        <span class="quest-title">${quest.title}</span>
                        <div class="quest-payouts">
                            <span class="addiction-status">${abstinent ? '✅ Limpo hoje' : '⚠️ Recaída — remarque para se recuperar'}</span>
                        </div>
                    </div>
                </div>
                <button class="quest-complete-btn addiction-toggle" data-id="${quest.id}" title="${abstinent ? 'Desmarcar = registrar recaída' : 'Remarcar = arrependimento'}">${abstinent ? '✓' : '↩'}</button>
            </div>`;
    });

    const streakLabel = `${streak} ${streak === 1 ? 'dia' : 'dias'}`;
    section.innerHTML = `
        <div class="addiction-header">
            <h3>VÍCIOS</h3>
            <span class="addiction-streak">🔥 ${streakLabel}</span>
        </div>
        ${debuffActive ? '<div class="addiction-debuff-banner">⚠️ Debuff de recaída ativo — XP reduzido em 30%</div>' : ''}
        <div class="addiction-list">${cards}</div>`;
}

// Renderiza a Taverna (Recompensas)

/**
 * @deprecated Esta função é legada e foi substituída pelos cards estáticos no index.html.
 * Mantida apenas para compatibilidade de depuração ou inicialização secundária.
 */
function renderRewards() {
    const rewardsContainer = document.getElementById('rewards-list');
    if (!rewardsContainer) return;
    rewardsContainer.innerHTML = `
        <div class="store-item" onclick="buyStoreItem('buff_autoHeal')">
            <div class="store-info"><span>🧪 Poção de Cura</span><small>Protege o streak por 1 erro</small></div>
            <button>800 🪙</button>
        </div>
        <div class="store-item" onclick="buyStoreItem('buff_doubleXp')">
            <div class="store-info"><span>📜 Pergaminho de Dobro XP</span><small>XP x2 por um dia</small></div>
            <button>500 🪙</button>
        </div>
        <div class="store-item" onclick="buyStoreItem('buff_shield')">
            <div class="store-info"><span>🛡️ Carga de Escudo</span><small>Reforce sua defesa</small></div>
            <button>1000 🪙</button>
        </div>
    `;
}


function triggerLevelUpOverlay() {
    const oldRank = getRankForLevel(gameState.level - 1);
    const newRank = getRankForLevel(gameState.level);
    const rankChanged = oldRank.rank !== newRank.rank;

    document.getElementById('overlay-lvl').innerText = gameState.level;

    const rankUpEl = document.getElementById('overlay-rank-up');
    if (rankChanged) {
        document.getElementById('overlay-old-rank').innerText = oldRank.rank;
        document.getElementById('overlay-new-rank').innerText = newRank.rank;
        rankUpEl.style.display = 'block';
    } else {
        rankUpEl.style.display = 'none';
    }

    // --- UX-004: Detectar e renderizar desbloqueios ---
    const unlocksContainer = document.getElementById('levelup-unlocks');
    const unlocksList = document.getElementById('levelup-unlocks-list');
    
    if (unlocksContainer && unlocksList) {
        unlocksList.innerHTML = '';
        const unlockedItems = [];

        // 1. Procurar novos hábitos em ALL_HABITS_DATABASE
        if (Array.isArray(ALL_HABITS_DATABASE)) {
            const newHabits = ALL_HABITS_DATABASE.filter(h => h.minLevel === gameState.level);
            newHabits.forEach(h => {
                const icon = h.icon || '📜';
                // Limpa o sufixo " (X min)" do título para exibição mais concisa
                const cleanTitle = h.title.replace(/\s*\(\d+\s*min\)/gi, '');
                unlockedItems.push(`${icon} Hábito: <strong>${cleanTitle}</strong>`);
            });
        }

        // 2. Procurar se ativou Boss Quest
        if (BOSS_QUEST_BY_LEVEL && BOSS_QUESTS) {
            const bossId = BOSS_QUEST_BY_LEVEL[gameState.level];
            if (bossId && BOSS_QUESTS[bossId]) {
                const bq = BOSS_QUESTS[bossId];
                unlockedItems.push(`⚔️ Chefe: <strong>${bq.title}</strong>`);
            }
        }

        if (unlockedItems.length > 0) {
            unlockedItems.forEach(itemText => {
                const li = document.createElement('li');
                li.style.marginBottom = '6px';
                li.innerHTML = itemText;
                unlocksList.appendChild(li);
            });
            unlocksContainer.style.display = 'block';
        } else {
            unlocksContainer.style.display = 'none';
        }
    }

    document.getElementById('level-up-overlay').style.display = 'flex';

    setTimeout(() => {
        const msg = rankChanged
            ? `⚡ LEVEL UP! Nível ${gameState.level} atingido! E mais: ${oldRank.rank} → ${newRank.rank}! O Sistema reconhece sua evolução!`
            : `⚡ LEVEL UP! Nível ${gameState.level}! O Sistema reconhece sua evolução!`;
        showSystemToast(msg);

    }, 1200);
}

// ==========================================================================
// SISTEMA DE NOTIFICAÇÕES (TOASTS) E IMPACT QUOTES
// ==========================================================================

let floatingTextQueue = [];
let isFloatingTextProcessing = false;

function spawnFloatingText(amount, type = 'gold') {
    floatingTextQueue.push({ amount, type });
    processFloatingTextQueue();
}

function processFloatingTextQueue() {
    if (isFloatingTextProcessing || floatingTextQueue.length === 0) return;
    isFloatingTextProcessing = true;

    const { amount, type } = floatingTextQueue.shift();
    const chipSelector = type === 'gold' ? '.gold-chip' : '.xp-section';
    const container = document.querySelector(chipSelector);
    
    if (container) {
        const floatText = document.createElement('span');
        floatText.className = `floating-reward-text ${type}`;
        floatText.textContent = `+${amount}${type === 'gold' ? ' 🪙' : ' XP'}`;
        
        container.style.position = 'relative';
        container.appendChild(floatText);

        setTimeout(() => {
            floatText.remove();
        }, 1200);
    }

    setTimeout(() => {
        isFloatingTextProcessing = false;
        processFloatingTextQueue();
    }, 300);
}

function animateGoldGain() {
    const goldEl = document.getElementById('lbl-gold');
    if (goldEl) {
        goldEl.classList.remove('gold-animating');
        void goldEl.offsetWidth; // Force reflow
        goldEl.classList.add('gold-animating');
        setTimeout(() => goldEl.classList.remove('gold-animating'), 600);
    }
}

function showSystemToast(text, type = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let formattedText = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                            .replace(/_(.*?)_/g, '<em>$1</em>')
                            .replace(/\n/g, '<br>');
    
    toast.innerHTML = formattedText;

    // Botão de fechar (X) em todo toast — permite dispensar manualmente.
    const dismiss = () => { if (toast.parentNode) toast.parentNode.removeChild(toast); };
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', dismiss);
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    // Toasts de alerta (falha/penalidade) PERSISTEM até o X — a pessoa precisa
    // ler o motivo da falha e a punição. A CSS .toast-alert já tira o fade-out.
    if (type.split(' ').includes('toast-alert')) return;

    // UX-003: toasts longos (mensagens do Iroh) ficam mais tempo na tela
    const plainLen = text.replace(/[*_\n]/g, '').length;
    const duration = plainLen > 160 ? 8500 : plainLen > 90 ? 6000 : 3500;

    setTimeout(dismiss, duration);
}

function showImpactQuote() {
    const modal = document.getElementById('modal-impact-quote');
    if (!modal) return;
    const textEl = document.getElementById('impact-quote-text');
    const authorEl = document.getElementById('impact-quote-author');
    
    const randomQuote = IMPACT_QUOTES[Math.floor(Math.random() * IMPACT_QUOTES.length)];
    textEl.innerText = `"${randomQuote.text}"`;
    authorEl.innerText = `— ${randomQuote.author}`;
    
    modal.style.display = 'flex';
}

document.getElementById('btn-quote-acknowledge')?.addEventListener('click', () => {
    document.getElementById('modal-impact-quote').style.display = 'none';
});
document.getElementById('close-quote-modal')?.addEventListener('click', () => {
    document.getElementById('modal-impact-quote').style.display = 'none';
});




// ==========================================================================
// PROCESSAMENTO DE EVENTOS E MODAIS
// ==========================================================================
function setupEventListeners() {
    // Quests
    document.getElementById('quests-list-physical')?.addEventListener('click', handleQuestAction);
    document.getElementById('quests-list-wisdom')?.addEventListener('click', handleQuestAction);
    document.getElementById('quests-list-productivity')?.addEventListener('click', handleQuestAction);
    document.getElementById('quests-list-social')?.addEventListener('click', handleQuestAction);
    document.getElementById('quests-list-mental')?.addEventListener('click', handleQuestAction);
    document.getElementById('quests-list-routine')?.addEventListener('click', handleQuestAction);
    document.getElementById('addictions-section')?.addEventListener('click', handleQuestAction);

    // Inject App Version + Persons data on settings open
    document.getElementById('btn-open-settings')?.addEventListener('click', async () => {
        const lbl = document.getElementById('app-version-label');
        if (lbl) lbl.textContent = APP_VERSION;

        const personsGroup = document.getElementById('settings-group-persons');
        if (!personsGroup || !window._currentUserDbId) return;

        const { data: person } = await window.supabaseClient
            .from('persons')
            .select('email, name, username')
            .eq('id', (await window.supabaseClient.auth.getUser()).data?.user?.id)
            .maybeSingle();

        if (person) {
            document.getElementById('person-email').textContent    = person.email    || '—';
            document.getElementById('person-name').textContent     = person.name     || '—';
            document.getElementById('person-username').textContent = person.username || '—';
            personsGroup.style.display = '';
        }
    });

    // Taverna
    // Modais
    const modalSq  = document.getElementById('modal-sidequest');
    const modalAv  = document.getElementById('modal-avatar-zoom');

    document.getElementById('btn-add-sidequest')?.addEventListener('click', () => {
        if (modalSq) modalSq.style.display = 'flex';
        const form = document.getElementById('form-sidequest');
        if (form) {
            form.reset();
            const weeklySelector = document.getElementById('weekly-day-selector');
            if (weeklySelector) weeklySelector.style.display = 'none';
            document.querySelectorAll('#weekly-day-selector .weekday-btn').forEach(btn => btn.classList.remove('active'));
            // Restaura campos que o modo Vício oculta (reset() não dispara 'change').
            const fSkill = document.getElementById('sq-field-skill');
            const fDiff = document.getElementById('sq-field-difficulty');
            if (fSkill) fSkill.style.display = '';
            if (fDiff) fDiff.style.display = '';
        }
    });
    document.getElementById('close-sq-modal')?.addEventListener('click', () => { if (modalSq) modalSq.style.display = 'none'; });

    const modalRw = document.getElementById('modal-reward');
    if (modalRw) {
        document.getElementById('close-rw-modal')?.addEventListener('click', () => modalRw.style.display = 'none');
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalSq) modalSq.style.display = 'none';
        if (e.target === modalAv) modalAv.style.display = 'none';
        if (modalRw && e.target === modalRw) modalRw.style.display = 'none';
        const modalWr = document.getElementById('modal-weekly-report');
        if (modalWr && e.target === modalWr) modalWr.style.display = 'none';
        const modalRoadmap = document.getElementById('modal-roadmap');
        if (modalRoadmap && e.target === modalRoadmap) modalRoadmap.style.display = 'none';
    });

    // Form: Side Quest Toggle display for weekly selector
    const typeRadios = document.querySelectorAll('input[name="sq-type"]');
    const weeklySelector = document.getElementById('weekly-day-selector');
    const fieldSkill = document.getElementById('sq-field-skill');
    const fieldDifficulty = document.getElementById('sq-field-difficulty');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (!radio.checked) return;
            const isAddiction = radio.value === 'addiction';
            // Vício não tem skill nem XP/gold (derivados de dificuldade) — oculta ambos.
            if (fieldSkill) fieldSkill.style.display = isAddiction ? 'none' : '';
            if (fieldDifficulty) fieldDifficulty.style.display = isAddiction ? 'none' : '';
            if (weeklySelector) weeklySelector.style.display = (radio.value === 'weekly') ? 'block' : 'none';
        });
    });

    // Toggle button active classes for weekday buttons
    const dayButtons = document.querySelectorAll('#weekly-day-selector .weekday-btn');
    dayButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.classList.toggle('active');
        });
    });

    // Form: Side Quest
    document.getElementById('form-sidequest')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('sq-title').value;
        const difficulty = document.getElementById('sq-difficulty').value;
        const skill = document.getElementById('sq-skill')?.value || 'routine';
        // Ícone derivado da categoria (o campo de ícone foi removido — redundante).
        const SKILL_ICONS = { physical: '💪', wisdom: '📚', productivity: '🎯', social: '🤝', mental: '🧠', routine: '🛏️' };
        const icon = SKILL_ICONS[skill] || '⚔️';
        const type = document.querySelector('input[name="sq-type"]:checked').value;

        let xp = 25, gold = 20;
        if (difficulty === 'easy') { xp = 10; gold = 10; }
        else if (difficulty === 'hard') { xp = 50; gold = 40; }

        if (type === 'addiction') {
            // Vício: sem skill, sem XP/gold. Nasce completo (abstinência por padrão).
            gameState.quests.push({
                id: 'q-addiction-' + Date.now(),
                title,
                type: 'addiction',
                icon: '🚫',
                skill: null,
                completed: true,
                xp: 0,
                gold: 0
            });
        } else if (type === 'side') {
            gameState.sideQuests.push({ id: 'sq-' + Date.now(), title, type: 'side', icon, difficulty, skill, completed: false, xp, gold });
        } else if (type === 'weekly') {
            const activeButtons = document.querySelectorAll('#weekly-day-selector .weekday-btn.active');
            if (activeButtons.length === 0) {
                alert('Selecione pelo menos um dia da semana!');
                return;
            }
            const daysOfWeek = Array.from(activeButtons).map(btn => parseInt(btn.getAttribute('data-day')));
            gameState.quests.push({
                id: 'q-custom-' + Date.now(),
                title,
                type: 'weekly',
                daysOfWeek,
                icon,
                difficulty,
                skill,
                completed: false,
                xp,
                gold,
                current: icon === '💧' ? 0 : undefined,
                target: icon === '💧' ? 8 : undefined
            });
        } else {
            // daily
            gameState.quests.push({
                id: 'q-custom-' + Date.now(),
                title,
                type: 'daily',
                icon,
                difficulty,
                skill,
                completed: false,
                xp,
                gold,
                current: icon === '💧' ? 0 : undefined,
                target: icon === '💧' ? 8 : undefined
            });
        }

        // Outbox: registra a adição (pega o id da quest recém-inserida na lista).
        const targetList = (type === 'side') ? gameState.sideQuests : gameState.quests;
        const addedId = targetList.length ? targetList[targetList.length - 1].id : null;
        if (addedId && typeof window.queueQuestOp === 'function') window.queueQuestOp(addedId, 'upsert');

        saveGameData();
        renderQuests();
        updateUI();
        if (typeof checkAndProgressTutorialStep1 === 'function') {
            checkAndProgressTutorialStep1();
        }
        modalSq.style.display = 'none';
        
        document.getElementById('form-sidequest').reset();
        document.querySelectorAll('#weekly-day-selector .weekday-btn').forEach(btn => btn.classList.remove('active'));
        if (weeklySelector) weeklySelector.style.display = 'none';
    });

    // Form: Recompensa


    // Level Up Overlay
    document.getElementById('btn-close-levelup')?.addEventListener('click', () => {
        document.getElementById('level-up-overlay').style.display = 'none';
        saveGameData(); updateUI();
    });

    // Penalty Overlay
    document.getElementById('btn-close-penalty')?.addEventListener('click', () => {
        document.getElementById('penalty-overlay').style.display = 'none';
    });

    // Avatar Zoom
    document.getElementById('char-avatar-img')?.addEventListener('click', openAvatarZoom);
    document.getElementById('close-avatar-zoom')?.addEventListener('click', () => { if (modalAv) modalAv.style.display = 'none'; });

    // Relatório Semanal (Weekly Report)
    document.getElementById('btn-close-weekly-report')?.addEventListener('click', () => {
        document.getElementById('modal-weekly-report').style.display = 'none';
    });

    document.getElementById('btn-claim-weekly-report')?.addEventListener('click', () => {
        const btn = document.getElementById('btn-claim-weekly-report');
        if (btn) {
            const rewards = JSON.parse(btn.dataset.rewards || '{}');
            const weekStr = btn.dataset.week || '';
            claimWeeklyReport(rewards, weekStr);
        }
    });

    // Roadmap (NEXUS)
    document.getElementById('btn-header-roadmap')?.addEventListener('click', () => {
        const modalRoadmap = document.getElementById('modal-roadmap');
        if (modalRoadmap) modalRoadmap.style.display = 'flex';
    });
    document.getElementById('btn-close-roadmap')?.addEventListener('click', () => {
        const modalRoadmap = document.getElementById('modal-roadmap');
        if (modalRoadmap) modalRoadmap.style.display = 'none';
    });
    document.getElementById('btn-close-roadmap-ok')?.addEventListener('click', () => {
        const modalRoadmap = document.getElementById('modal-roadmap');
        if (modalRoadmap) modalRoadmap.style.display = 'none';
    });

    if (typeof setupRadarToggle === 'function') {
        setupRadarToggle();
    }
}

// Abre o modal de zoom do avatar com o título correto e imagem ampliada
function openAvatarZoom() {
    const modal = document.getElementById('modal-avatar-zoom');
    const imgLarge = document.getElementById('img-avatar-large');
    const titleEl = document.getElementById('avatar-zoom-title');
    
    if (!modal || !imgLarge || !titleEl) return;
    
    const gender = gameState.gender || 'male';
    const folder = gender === 'female' ? '0 - female' : '1 - male';
    let level = gameState.level;
    const rank = getRankForLevel(level);
    const rankKey = rank.css.replace('rank-', '');
    
    const prefixMap = { e: '1', d: '2', c: '3', b: '4', a: '5', s: '6' };
    const num = prefixMap[rankKey] || '1';
    const src = `2.assets/avatars/${folder}/${num}.rank-${rankKey}.webp`;
    const titleMap = {
        male: { e: 'Recruta', d: 'Aventureiro', c: 'Caçador', b: 'Elite', a: 'Herói Lendário', s: 'O Sistema' },
        female: { e: 'Recruta', d: 'Aventureira', c: 'Caçadora', b: 'Elite', a: 'Heroína Lendária', s: 'O Sistema' }
    };
    const titleName = titleMap[gender]?.[rankKey] || 'Recruta';
    
    imgLarge.src = src;
    imgLarge.onerror = () => { imgLarge.src = `2.assets/avatars/${folder}/1.rank-e.png`; };
    titleEl.innerText = `${titleName.toUpperCase()} (${rank.rank})`;
    modal.style.display = 'flex';
}
function handleQuestAction(e) {
    const target = e.target;
    
    // (Masmorra conclui sozinha ao bater o alvo de habitos - sem clique manual.)

    // Se for clique nos botões de ajustar água
    if (target.classList.contains('water-btn')) {
        const id = target.getAttribute('data-id');
        const operation = target.classList.contains('btn-plus') ? 'plus' : 'minus';
        adjustWater(id, operation);
        return;
    }
    
    // Caso contrário, se clicou em qualquer lugar no card, completa a quest
    const card = target.closest('.quest-card');
    if (card) {
        const btn = card.querySelector('.quest-complete-btn');
        if (btn) {
            const id = btn.getAttribute('data-id');
            toggleQuest(id);
        }
    }
}


// ==========================================================================
// ABA VISÃO GLOBAL E HEATMAP
// ==========================================================================
function renderGlobalDashboard() {
    const tabGlobal = document.getElementById('tab-global');
    if (!tabGlobal || !tabGlobal.classList.contains('active')) return;

    // Inclui o progresso REAL de HOJE (que só entra no history no rollover diário),
    // computado ao vivo do estado atual das quests — sem gravar, só p/ exibição.
    // Assim o dashboard reflete a atividade de hoje na hora.
    const history = { ...(gameState.history || {}) };
    const todayKey = localDateStr(new Date());
    if (!history[todayKey]) {
        const dow = new Date().getDay();
        const activeToday = (gameState.quests || []).filter(q => isQuestActiveOnDay(q, dow));
        const total = activeToday.length;
        const doneList = activeToday.filter(q => q.completed);
        const done = doneList.length;
        if (total > 0 && done > 0) { // só marca hoje se houve alguma conclusão real
            const pct = done / total;
            const status = pct >= 1 ? 'perfect' : pct >= 0.5 ? 'good' : 'bad';
            history[todayKey] = {
                status, count: done, total,
                completedIds: doneList.map(q => ({ id: q.id, title: q.title, skill: q.skill || 'routine', duration: q.duration || 5 }))
            };
        }
    }
    const dates = Object.keys(history).sort((a,b) => new Date(a) - new Date(b));

    const emptyStateEl = document.getElementById('global-empty-state');
    if (dates.length === 0) {
        if (emptyStateEl) emptyStateEl.style.display = 'block';
        Array.from(tabGlobal.children).forEach(child => {
            if (child.id !== 'global-empty-state' && !child.classList.contains('section-title')) {
                child.style.display = 'none';
            }
        });
        return;
    } else {
        if (emptyStateEl) emptyStateEl.style.display = 'none';
        Array.from(tabGlobal.children).forEach(child => {
            if (child.id !== 'global-empty-state' && !child.classList.contains('section-title')) {
                if (child.classList.contains('dashboard-metrics-grid')) {
                    child.style.display = 'grid';
                } else if (child.classList.contains('pwa-install-mobile-footer')) {
                    child.style.display = '';
                } else {
                    child.style.display = 'block';
                }
            }
        });
    }
    
    // 1. Preencher Heatmap Anual (365 dias)
    const heatmapGrid = document.getElementById('heatmap-grid');
    if(heatmapGrid) heatmapGrid.innerHTML = '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Dia inicial (364 dias atrás + hoje = 365)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    // Padding para alinhar verticalmente (Semana começa domingo = 0)
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyBlock = document.createElement('div');
        emptyBlock.className = 'hm-block hm-empty';
        if(heatmapGrid) heatmapGrid.appendChild(emptyBlock);
    }

    for (let i = 0; i < 365; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        
        // CLAUDE.md: history é chaveado por localDateStr (YYYY-MM-DD). Usar
        // d.toDateString() (ex.: "Mon Jul 06 2026") NUNCA batia → heatmap vazio.
        const dateStr = localDateStr(d);
        const log = history[dateStr];

        const block = document.createElement('div');
        block.className = 'hm-block';

        if (log) {
            block.classList.add(`hm-${log.status}`);
            block.title = `${dateStr}: ${log.count}/${log.total} completos`;
        } else {
            block.title = `${dateStr}: Sem dados`;
        }
        if(heatmapGrid) heatmapGrid.appendChild(block);
    }

    // Rola para o final para mostrar "hoje"
    if (heatmapGrid && heatmapGrid.parentElement) {
        // setTimeout para garantir que a renderização no DOM rolou antes do scroll
        setTimeout(() => {
            heatmapGrid.parentElement.scrollLeft = heatmapGrid.parentElement.scrollWidth;
        }, 10);
    }

    // 2. Preencher Métricas de Topo
    let totalHabitsDone = 0;
    let totalMissed = 0;
    let perfectDays = 0;
    let totalDaysLogged = dates.length;

    let monthlyData = new Array(12).fill(0); // [Jan, Fev, ... Dez]
    let habitCounts = {};

    dates.forEach(d => {
        const log = history[d];
        totalHabitsDone += log.count;
        totalMissed += (log.total - log.count);
        if (log.status === 'perfect') perfectDays++;
        
        const month = new Date(d).getMonth();
        monthlyData[month] += log.count;

        (log.completedIds || []).forEach(entry => {
            // Objeto denormalizado {id,title,skill,duration} (novo) ou string (legado).
            const habitTitle = (entry && typeof entry === 'object') ? entry.title : entry;
            if (habitTitle) habitCounts[habitTitle] = (habitCounts[habitTitle] || 0) + 1;
        });
    });

    const elHabits = document.getElementById('dash-total-habits');
    const elPerfect = document.getElementById('dash-perfect-days');
    const elMissed = document.getElementById('dash-total-missed');
    const elRhythm = document.getElementById('dash-rhythm');
    
    if(elHabits) elHabits.innerText = totalHabitsDone;
    if(elPerfect) elPerfect.innerText = perfectDays;
    if(elMissed) elMissed.innerText = totalMissed;
    
    const rhythm = totalDaysLogged > 0 ? Math.round((perfectDays / totalDaysLogged) * 100) : 0;
    if(elRhythm) elRhythm.innerText = rhythm + '%';

    // 3. Gráfico de Barras Mensais
    const barChart = document.getElementById('dash-bar-chart');
    if(barChart) {
        barChart.innerHTML = '';
        const monthsNames = ['J','F','M','A','M','J','J','A','S','O','N','D'];
        const maxMonthly = Math.max(...monthlyData, 1); // Evita divisão por zero

        for (let i = 0; i < 12; i++) {
            const hPercent = (monthlyData[i] / maxMonthly) * 100;
            
            const col = document.createElement('div');
            col.className = 'dash-bar-col';
            col.innerHTML = `
                <div class="dash-bar-fill" style="height: ${hPercent}%" title="${monthlyData[i]} hábitos em ${monthsNames[i]}"></div>
                <div class="dash-bar-lbl">${monthsNames[i]}</div>
            `;
            barChart.appendChild(col);
        }
    }

    // 4. Top Hábitos
    const topHabitsContainer = document.getElementById('dash-top-habits');
    if(topHabitsContainer) {
        topHabitsContainer.innerHTML = '';
        
        const sortedHabits = Object.entries(habitCounts).sort((a,b) => b[1] - a[1]);
        const top5 = sortedHabits.slice(0, 5);
        const maxHabitCount = top5.length > 0 ? top5[0][1] : 1;

        if (top5.length === 0) {
            topHabitsContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; text-align:center;">Nenhum dado registrado ainda.</p>';
        } else {
            top5.forEach(([name, count]) => {
                const wPercent = (count / maxHabitCount) * 100;
                const row = document.createElement('div');
                row.className = 'dash-habit-row';
                row.innerHTML = `
                    <div class="dash-habit-name" title="${name}">${name}</div>
                    <div class="dash-habit-bar-bg">
                        <div class="dash-habit-bar-fill" style="width: ${wPercent}%"></div>
                    </div>
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-left:8px; width:20px; text-align:right;">${count}</div>
                `;
                topHabitsContainer.appendChild(row);
            });
        }
    }
}


const debouncedDrawRadarChart = debounce(drawRadarChart, 50);

// Oculta/exibe o bloco inteiro de Atributos (radar + barras + sinergias + rank perks) de uma vez
function setupRadarToggle() {
    const btnToggleRadar = document.getElementById('btn-toggle-radar');
    const attrsWrapper = document.getElementById('attrs-collapsible-wrapper');
    if (!btnToggleRadar || !attrsWrapper) return;

    // Função interna para aplicar o estado visual de acordo com o collapsed
    const setRadarState = (collapsed) => {
        if (collapsed) {
            attrsWrapper.style.display = 'none';
            btnToggleRadar.innerText = 'VER ATRIBUTOS';
        } else {
            attrsWrapper.style.display = '';
            btnToggleRadar.innerText = 'OCULTAR ATRIBUTOS';
            // Redesenha o radar para garantir correto posicionamento após voltar a exibir
            drawRadarChart();
        }
    };

    // Inicializa no boot verificando o localStorage
    const isCollapsed = localStorage.getItem('lifeRPG_attrsCollapsed') === 'true';
    setRadarState(isCollapsed);

    // Adiciona o listener de click
    btnToggleRadar.addEventListener('click', () => {
        const nowCollapsed = attrsWrapper.style.display !== 'none';
        localStorage.setItem('lifeRPG_attrsCollapsed', nowCollapsed ? 'true' : 'false');
        setRadarState(nowCollapsed);
    });
}

function switchTrophiesTab(tabName) {
    const btnTrophies = document.getElementById('subtab-btn-trophies');
    const btnRanking = document.getElementById('subtab-btn-trophies-ranking');
    const panelTrophies = document.getElementById('panel-trophies');
    const panelRanking = document.getElementById('panel-ranking');

    if (!btnTrophies || !btnRanking || !panelTrophies || !panelRanking) return;

    if (tabName === 'trophies') {
        btnTrophies.classList.add('active');
        btnRanking.classList.remove('active');
        panelTrophies.classList.add('active');
        panelTrophies.style.display = '';
        panelRanking.classList.remove('active');
        panelRanking.style.display = 'none';
    } else {
        btnTrophies.classList.remove('active');
        btnRanking.classList.add('active');
        panelTrophies.classList.remove('active');
        panelTrophies.style.display = 'none';
        panelRanking.classList.add('active');
        panelRanking.style.display = '';
        
        if (typeof window.switchRankingMode === 'function') {
            window.switchRankingMode(window.currentRankingMode || 'global');
        }
    }
}

export {
    renderAchievements,
    drawRadarChart,
    showFeatureUnlockModal,
    initTabs,
    switchTavernaTab,
    switchTrophiesTab,
    confirmRemoveQuest,
    equipItem,
    renderInventory,
    updateWizardBackBtnVisibility,
    goBackWizard,
    initOnboardingWizard,
    updateUI,
    renderSynergies,
    renderRankPerks,
    updateAvatarImage,
    renderSkills,
    renderQuests,
    renderRewards,
    showSystemToast,
    spawnFloatingText,
    animateGoldGain,
    triggerLevelUpOverlay,
    showImpactQuote,
    setupEventListeners,
    handleQuestAction,
    renderGlobalDashboard,
    debouncedDrawRadarChart,
    setupRadarToggle,
    checkFeatureUnlocks
};
