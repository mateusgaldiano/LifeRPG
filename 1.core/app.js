/* ==========================================================================
   LIFERPG - ES MODULE LOADER & ENTRYPOINT
   ========================================================================== */

import {
    ALL_HABITS_DATABASE,
    HABIT_LIBRARY,
    IMPACT_QUOTES,
    RANK_THRESHOLDS,
    BOSS_QUESTS,
    DUNGEON_POOL,
    DUNGEON_DURATION_MS,
    gameState,
    loadGameData,
    saveGameData,
    resetGameState,
    updateSWQuestStatus
} from './modules/state.js';

import {
    localDateStr,
    hasSkillLV3,
    getRankForLevel,
    computeAttributes,
    computePlayerTitle,
    SYNERGY_DEFS,
    computeSynergies,
    getSynergyXpBonus,
    getSynergySkillXpBonus,
    getSynergyGoldBonus,
    hasSynergyShieldBonus,
    initSkillsState,
    calcSkillXpToNext,
    calcSkillXpGain,
    calcStreakMultiplier,
    getXpToNextForLevel,
    calcGroupMultiplier,
    calcStreakGoldMultiplier,
    RANK_PERKS,
    getActivePerks,
    hasPerk,
    getPerkXpBonus,
    debounce,
    getPlayerTerm,
    isQuestActiveOnDay
} from './modules/utils.js';

import {
    renderAchievements,
    drawRadarChart,
    showFeatureUnlockModal,
    initTabs,
    switchTavernaTab,
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
    checkFeatureUnlocks,
    switchTrophiesTab
} from './modules/ui.js';

import {
    spawnDungeon,
    checkDungeonExpiry,
    completeDungeon,
    spawnWeeklyBoss,
    checkWeeklyBossExpiry,
    hitWeeklyBoss,
    showWeeklyBossModal,
    renderWeeklyBoss,
    BOSS_QUEST_BY_LEVEL,
    checkAndActivateBossQuest,
    getBossVictoryQuote,
    checkAchievements,
    addSkillXP,
    deductSkillXP,
    toggleQuest,
    adjustWater,
    addRewards,
    deductRewards,
    applyDailyPenalty,
    checkAllDailies,
    buyStoreItem,
    saveToCloud,
    ACHIEVEMENTS_DEFS,
    showQuestCleared,
    syncQuestsByLevel
} from './modules/game-logic.js';

import {
    getISOWeekString,
    getPreviousWeekDates,
    checkAndShowWeeklyReport,
    claimWeeklyReport
} from './modules/weekly-report.js';

// ENG-002: social.js (modal social + biblioteca de hábitos + tutorial, ~110KB) é
// carregado dinamicamente em idle (ver loadSocialModule), fora do caminho do 1º paint.

import {
    registerServiceWorker,
    setupInstallPrompt,
    setupSettingsListeners,
    loadSettingsToUI,
    subscribeUserToPush,
    unsubscribeUserFromPush,
    setupPullToRefresh
} from './modules/pwa.js';

// Bind State
window.gameState = gameState;
window.ALL_HABITS_DATABASE = ALL_HABITS_DATABASE;
window.HABIT_LIBRARY = HABIT_LIBRARY;
window.IMPACT_QUOTES = IMPACT_QUOTES;
window.RANK_THRESHOLDS = RANK_THRESHOLDS;
window.BOSS_QUESTS = BOSS_QUESTS;
window.DUNGEON_POOL = DUNGEON_POOL;
window.DUNGEON_DURATION_MS = DUNGEON_DURATION_MS;
window.loadGameData = loadGameData;
window.saveGameData = saveGameData;
window.resetGameState = resetGameState;
window.updateSWQuestStatus = updateSWQuestStatus;

// Bind Utils
window.localDateStr = localDateStr;
window.hasSkillLV3 = hasSkillLV3;
window.getRankForLevel = getRankForLevel;
window.computeAttributes = computeAttributes;
window.computePlayerTitle = computePlayerTitle;
window.SYNERGY_DEFS = SYNERGY_DEFS;
window.computeSynergies = computeSynergies;
window.getSynergyXpBonus = getSynergyXpBonus;
window.getSynergySkillXpBonus = getSynergySkillXpBonus;
window.getSynergyGoldBonus = getSynergyGoldBonus;
window.hasSynergyShieldBonus = hasSynergyShieldBonus;
window.initSkillsState = initSkillsState;
window.calcSkillXpToNext = calcSkillXpToNext;
window.calcSkillXpGain = calcSkillXpGain;
window.calcStreakMultiplier = calcStreakMultiplier;
window.getXpToNextForLevel = getXpToNextForLevel;
window.calcGroupMultiplier = calcGroupMultiplier;
window.calcStreakGoldMultiplier = calcStreakGoldMultiplier;
window.RANK_PERKS = RANK_PERKS;
window.getActivePerks = getActivePerks;
window.hasPerk = hasPerk;
window.getPerkXpBonus = getPerkXpBonus;
window.debounce = debounce;
window.getPlayerTerm = () => getPlayerTerm(gameState.gender);
window.isQuestActiveOnDay = isQuestActiveOnDay;

// Bind UI
window.renderAchievements = renderAchievements;
window.drawRadarChart = drawRadarChart;
window.showFeatureUnlockModal = showFeatureUnlockModal;
window.initTabs = initTabs;
window.switchTavernaTab = switchTavernaTab;
window.confirmRemoveQuest = confirmRemoveQuest;
window.equipItem = equipItem;
window.renderInventory = renderInventory;
window.updateWizardBackBtnVisibility = updateWizardBackBtnVisibility;
window.goBackWizard = goBackWizard;
window.initOnboardingWizard = initOnboardingWizard;
window.updateUI = updateUI;
window.renderSynergies = renderSynergies;
window.renderRankPerks = renderRankPerks;
window.updateAvatarImage = updateAvatarImage;
window.renderSkills = renderSkills;
window.renderQuests = renderQuests;
window.renderRewards = renderRewards;
window.showSystemToast = showSystemToast;
window.spawnFloatingText = spawnFloatingText;
window.animateGoldGain = animateGoldGain;
window.triggerLevelUpOverlay = triggerLevelUpOverlay;
window.showImpactQuote = showImpactQuote;
window.setupEventListeners = setupEventListeners;
window.handleQuestAction = handleQuestAction;
window.renderGlobalDashboard = renderGlobalDashboard;
window.debouncedDrawRadarChart = debouncedDrawRadarChart;
window.setupRadarToggle = setupRadarToggle;
window.checkFeatureUnlocks = checkFeatureUnlocks;
window.switchTrophiesTab = switchTrophiesTab;

// Bind Game Logic
window.spawnDungeon = spawnDungeon;
window.checkDungeonExpiry = checkDungeonExpiry;
window.completeDungeon = completeDungeon;
window.spawnWeeklyBoss = spawnWeeklyBoss;
window.checkWeeklyBossExpiry = checkWeeklyBossExpiry;
window.hitWeeklyBoss = hitWeeklyBoss;
window.showWeeklyBossModal = showWeeklyBossModal;
window.renderWeeklyBoss = renderWeeklyBoss;
window.BOSS_QUEST_BY_LEVEL = BOSS_QUEST_BY_LEVEL;
window.checkAndActivateBossQuest = checkAndActivateBossQuest;
window.getBossVictoryQuote = getBossVictoryQuote;
window.checkAchievements = checkAchievements;
window.addSkillXP = addSkillXP;
window.deductSkillXP = deductSkillXP;
window.toggleQuest = toggleQuest;
window.adjustWater = adjustWater;
window.addRewards = addRewards;
window.deductRewards = deductRewards;
window.applyDailyPenalty = applyDailyPenalty;
window.checkAllDailies = checkAllDailies;
window.buyStoreItem = buyStoreItem;
window.saveToCloud = saveToCloud;
window.ACHIEVEMENTS_DEFS = ACHIEVEMENTS_DEFS;
window.showQuestCleared = showQuestCleared;
window.syncQuestsByLevel = syncQuestsByLevel;

// Bind Weekly Report
window.getISOWeekString = getISOWeekString;
window.getPreviousWeekDates = getPreviousWeekDates;
window.checkAndShowWeeklyReport = checkAndShowWeeklyReport;
window.claimWeeklyReport = claimWeeklyReport;

// ENG-002: carrega social.js sob demanda (idle) e hidrata os globais usados por
// HTML/onclick e outros módulos. Memoizado — só carrega uma vez.
let _socialModulePromise = null;
function loadSocialModule() {
    if (_socialModulePromise) return _socialModulePromise;
    _socialModulePromise = import('./modules/social.js').then(m => {
        window.setupHabitLibraryAndTabs = m.setupHabitLibraryAndTabs;
        window.addHabitFromLibrary = m.addHabitFromLibrary;
        window.receiveMessage = m.receiveMessage;
        window.showChatBadge = m.showChatBadge;
        window.enterCommunityTab = m.enterCommunityTab;
        window.exitCommunityTab = m.exitCommunityTab;
        window.loadChatMessages = m.loadChatMessages;
        window.initSocialSubTabs = m.initSocialSubTabs;
        window.loadFriendsList = m.loadFriendsList;
        window.loadFriendsRanking = m.loadFriendsRanking;
        window.loadGlobalRanking = m.loadGlobalRanking;
        window.openPlayerProfile = m.openPlayerProfile;
        window.setupSocialModalListeners = m.setupSocialModalListeners;
        window.initFriendsSearchListeners = m.initFriendsSearchListeners;
        window.handleFriendSearch = m.handleFriendSearch;
        window.updateOnlinePlayersUI = m.updateOnlinePlayersUI;
        window.switchRankingMode = m.switchRankingMode;
        window.renderTutorialBanner = m.renderTutorialBanner;
        window.checkAndProgressTutorialStep1 = m.checkAndProgressTutorialStep1;
        window.completeTutorialQuestline = m.completeTutorialQuestline;
        // Wire-up que antes rodava no boot
        if (typeof m.setupSocialModalListeners === 'function') m.setupSocialModalListeners();
        if (typeof m.setupHabitLibraryAndTabs === 'function') m.setupHabitLibraryAndTabs();
        // Re-render para refletir o banner de tutorial agora que o módulo existe
        if (typeof window.updateUI === 'function') window.updateUI();
        return m;
    }).catch(err => {
        console.error('[ENG-002] Falha ao carregar social.js:', err);
        _socialModulePromise = null; // permite nova tentativa
    });
    return _socialModulePromise;
}
window.loadSocialModule = loadSocialModule;

// Bind PWA
window.registerServiceWorker = registerServiceWorker;
window.setupInstallPrompt = setupInstallPrompt;
window.setupSettingsListeners = setupSettingsListeners;
window.loadSettingsToUI = loadSettingsToUI;
window.subscribeUserToPush = subscribeUserToPush;
window.unsubscribeUserFromPush = unsubscribeUserFromPush;

// bootstrapping
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega dados locais do jogo
    loadGameData();

    // 2. Inicialização do Supabase e sincronização da Nuvem ANTES de renderizar a UI ou relatórios
    let isReturningUser = false;
    let tutorialCompleted = false;
    if (typeof window.initSupabase === 'function') {
        window.initSupabase().then((status) => {
            isReturningUser = status?.isReturningUser || false;
            tutorialCompleted = status?.tutorialCompleted || false;

            // Decisão do Onboarding Wizard com base no status do usuário após carregar Supabase
            const wizardModal = document.getElementById('onboarding-wizard');
            if (window._currentUserDbId) {
                // Usuário logado
                if (isReturningUser) {
                    // Se já tiver conta (isReturningUser === true), pule o onboarding
                    gameState.tutorialCompleted = true;
                    gameState.tutorialStep = null;
                    saveGameData();
                    if (wizardModal) wizardModal.style.cssText = 'display: none !important;';
                    checkFeatureUnlocks();
                } else {
                    if (gameState.tutorialCompleted) {
                        if (wizardModal) wizardModal.style.cssText = 'display: none !important;';
                        checkFeatureUnlocks();
                    } else {
                        initOnboardingWizard();
                    }
                }
            }

            const overlay = document.getElementById('app-loading-overlay');
            if (overlay) {
                overlay.style.transition = 'opacity 0.5s ease';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
            }
        }).catch((e) => {
            console.error('[App Bootstrap] Erro ao inicializar Supabase:', e);
            const overlay = document.getElementById('app-loading-overlay');
            if (overlay) overlay.style.display = 'none';
        });
    } else {
        const overlay = document.getElementById('app-loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    // 3. Inicializa abas e renderiza a UI (com dados locais preliminares)
    initTabs();
    renderQuests();
    renderRewards();

    updateUI();
    setupEventListeners();
    
    // Inicializa motor PWA e Configurações
    registerServiceWorker();
    setupSettingsListeners();
    setupInstallPrompt();
    setupPullToRefresh(); // arrastar = sincronizar quando logado

    // ENG-002: carrega social.js (modal + biblioteca + tutorial) em idle, fora do 1º paint.
    // setupSocialModalListeners e setupHabitLibraryAndTabs rodam dentro de loadSocialModule().
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => loadSocialModule(), { timeout: 2000 });
    } else {
        setTimeout(loadSocialModule, 200);
    }

    // Listeners do Ranking (BUG-005) e das sub-abas de Sala de Troféus/Ranking
    const btnRankGlobal = document.getElementById('btn-ranking-global');
    const btnRankFriends = document.getElementById('btn-ranking-friends');
    if (btnRankGlobal) btnRankGlobal.addEventListener('click', () => { if (typeof window.switchRankingMode === 'function') window.switchRankingMode('global'); });
    if (btnRankFriends) btnRankFriends.addEventListener('click', () => { if (typeof window.switchRankingMode === 'function') window.switchRankingMode('friends'); });

    const btnSubtabTrophies = document.getElementById('subtab-btn-trophies');
    const btnSubtabTrophiesRanking = document.getElementById('subtab-btn-trophies-ranking');
    if (btnSubtabTrophies) btnSubtabTrophies.addEventListener('click', () => { if (typeof window.switchTrophiesTab === 'function') window.switchTrophiesTab('trophies'); });
    if (btnSubtabTrophiesRanking) btnSubtabTrophiesRanking.addEventListener('click', () => { if (typeof window.switchTrophiesTab === 'function') window.switchTrophiesTab('ranking'); });

    // Listeners da Taverna (BUG-005)
    const btnTavernaShop = document.getElementById('subtab-btn-shop');
    const btnTavernaInventory = document.getElementById('subtab-btn-inventory');
    if (btnTavernaShop) btnTavernaShop.addEventListener('click', () => { if (typeof window.switchTavernaTab === 'function') window.switchTavernaTab('shop'); });
    if (btnTavernaInventory) btnTavernaInventory.addEventListener('click', () => { if (typeof window.switchTavernaTab === 'function') window.switchTavernaTab('inventory'); });

    // Garante o primeiro draw do radar chart após DOM+fontes carregarem
    setTimeout(() => { drawRadarChart(); }, 150);

    // Verifica e exibe o Relatório Semanal
    setTimeout(() => { checkAndShowWeeklyReport(); }, 800);

    // Mensagem de boas-vindas — apenas no primeiro acesso do dia
    if (gameState.playerName) {
        const todayForWelcome = localDateStr();
        if (gameState.lastWelcomeDateShown !== todayForWelcome) {
            gameState.lastWelcomeDateShown = todayForWelcome;
            saveGameData();
            setTimeout(() => {
                showSystemToast(`Bem-vindo ao LifeRPG, ${gameState.playerName}. O Sistema está ativo. Complete suas missões.`);
            }, 1000);
        }
    }

    // Decisão inicial do Onboarding Wizard (Convidado/Guest)
    const wizardModal = document.getElementById('onboarding-wizard');
    if (!window._currentUserDbId) {
        if (gameState.tutorialCompleted) {
            if (wizardModal) wizardModal.style.cssText = 'display: none !important;';
            checkFeatureUnlocks();
        } else {
            initOnboardingWizard();
        }
    }
});
