// game-logic.js
import { gameState, saveGameData, BOSS_QUESTS, DUNGEON_POOL, DUNGEON_DURATION_MS, ALL_HABITS_DATABASE } from './state.js';
import {
    trackEvent, localDateStr, getRankForLevel, getXpToNextForLevel, hasPerk,
    calcStreakMultiplier, calcStreakGoldMultiplier, calcGroupMultiplier,
    getSynergySkillXpBonus, getSynergyXpBonus, getSynergyGoldBonus, getPerkXpBonus, initSkillsState,
    getPlayerTerm, isQuestActiveOnDay
} from './utils.js';
import {
    showSystemToast, spawnFloatingText, animateGoldGain, triggerLevelUpOverlay,
    showImpactQuote, renderQuests, updateUI, renderAchievements, checkFeatureUnlocks
} from './ui.js';

// Verifica se o Pergaminho de Double XP está ativo (dura até meia-noite, não consome na 1ª quest)
function isDoubleXpActive() {
    const b = gameState.buffs;
    if (!b) return false;
    if (b.doubleXpExpiresAt && Date.now() < b.doubleXpExpiresAt) return true;
    if (b.doubleXp === true) return true; // compatibilidade com saves antigos (boolean)
    return false;
}

// Gera uma nova dungeon aleatória
function spawnDungeon() {
    if (!hasSkillLV3()) return;
    if (gameState.activeDungeon && !gameState.activeDungeon.completed) return;

    const pick = DUNGEON_POOL[Math.floor(Math.random() * DUNGEON_POOL.length)];
    gameState.activeDungeon = {
        id: 'dungeon-' + Date.now(),
        title: pick.title,
        skill: pick.skill,
        xp: pick.xp,
        gold: pick.gold,
        expiresAt: Date.now() + DUNGEON_DURATION_MS,
        completed: false
    };
    saveGameData();
    setTimeout(() => {
        showSystemToast(`⚔️ *DUNGEON DISPONÍVEL!* Uma missão especial surgiu: *"${pick.title}"*\n\nRecompensa: +${pick.xp} XP · +${pick.gold} 💰\n⏳ Prazo: 48 horas. Conclua antes que expire.`);

    }, 1000);
}


// Verifica e aplica expiração da dungeon ativa
function checkDungeonExpiry() {
    const d = gameState.activeDungeon;
    if (!d || d.completed) return;
    if (Date.now() >= d.expiresAt) {
        const title = d.title;
        gameState.activeDungeon = null;
        gameState.xp = Math.max(0, (gameState.xp || 0) - 5);
        saveGameData();
        setTimeout(() => {
            showSystemToast(`💀 *DUNGEON EXPIRADA.* A missão *"${title}"* foi abandonada. O Sistema cobrou o preço: −5 XP.`);

        }, 500);
    }
}


// Conclui a dungeon ativa
function completeDungeon() {
    const d = gameState.activeDungeon;
    if (!d || d.completed) return;

    d.completed = true;
    let xpGain = d.xp;
    let goldGain = d.gold;

    // Verifica Double XP Buff (dura até meia-noite — não desativa na 1ª quest)
    if (isDoubleXpActive()) {
        xpGain *= 2;
    }

    gameState.xp   = (gameState.xp   || 0) + xpGain;
    gameState.gold = (gameState.gold || 0) + goldGain;
    gameState._dungeonsCompleted = (gameState._dungeonsCompleted || 0) + 1;

    // Conta para boss quest d-to-c
    if (gameState.bossQuest?.id === 'd-to-c' && !gameState.bossQuest.completed) {
        gameState.bossQuest.sideQuestsCompleted = (gameState.bossQuest.sideQuestsCompleted || 0) + 1;
    }

    addSkillXP(d.skill);
    checkAndActivateBossQuest();
    saveGameData();
    updateUI();

    setTimeout(() => {
        showSystemToast(`🏆 *DUNGEON CONCLUÍDA!* Você completou *"${d.title}"*!\n\n+${xpGain} XP · +${goldGain} 💰 concedidos. Iroh está orgulhoso.`);
    }, 800);

    renderQuests();
}


//  Weekly Boss 
const WEEKLY_BOSS_DURATION_MS = 72 * 60 * 60 * 1000; // 72h

function spawnWeeklyBoss() {
    if (gameState.weeklyBoss && !gameState.weeklyBoss.defeated && Date.now() < gameState.weeklyBoss.expiresAt) return;

    gameState.weeklyBoss = {
        spawnedAt: Date.now(),
        expiresAt: Date.now() + WEEKLY_BOSS_DURATION_MS,
        hp: 3,
        defeated: false,
        penaltyApplied: false
    };
    saveGameData();
    showWeeklyBossModal();
}

function checkWeeklyBossExpiry() {
    const wb = gameState.weeklyBoss;
    if (!wb || wb.defeated || wb.penaltyApplied) return;
    if (Date.now() >= wb.expiresAt) {
        wb.penaltyApplied = true;
        const goldLost = Math.floor((gameState.gold || 0) * 0.20);
        gameState.gold = Math.max(0, (gameState.gold || 0) - goldLost);
        gameState.xp   = Math.max(0, (gameState.xp   || 0) - 30);
        saveGameData();
        updateUI();
        setTimeout(() => {
            receiveMessage(`💀 *O CHEFE DA SEMANA NÃO FOI DERROTADO.*\n\nO Sistema cobrou o preço da sua fraqueza: -${goldLost} Ouro e -30 XP foram consumidos. Que isso sirva de lição.`);
            showChatBadge();
        }, 600);
    }
}

function hitWeeklyBoss() {
    const wb = gameState.weeklyBoss;
    if (!wb || wb.defeated || wb.penaltyApplied || Date.now() >= wb.expiresAt) return;

    wb.hp = Math.max(0, wb.hp - 1);

    if (wb.hp <= 0) {
        wb.defeated = true;
        gameState.xp   = (gameState.xp   || 0) + 150;
        gameState.gold = (gameState.gold || 0) + 80;
        saveGameData();
        updateUI();
        renderWeeklyBoss();
        setTimeout(() => {
            receiveMessage(`🏆 *CHEFE SEMANAL DERROTADO!*\n\nVocê enfrentou o Sistema e venceu. Recompensa: +150 XP e +80 Ouro. O streak continua protegido.`);
            showChatBadge();
        }, 800);
    } else {
        saveGameData();
        renderWeeklyBoss();
    }
}

function showWeeklyBossModal() {
    const modal = document.getElementById('weekly-boss-modal');
    if (modal) modal.style.display = 'flex';
}

function renderWeeklyBoss() {
    const container = document.getElementById('weekly-boss-container');
    if (!container) return;

    const wb = gameState.weeklyBoss;

    if (!wb || wb.defeated || wb.penaltyApplied || Date.now() >= wb.expiresAt) {
        container.style.display = 'none';
        return;
    }

    const remMs  = Math.max(0, wb.expiresAt - Date.now());
    const remH   = Math.floor(remMs / 3600000);
    const remMin = Math.floor((remMs % 3600000) / 60000);
    const hpPct  = (wb.hp / 3) * 100;
    const urgent = remMs < 12 * 3600000;

    container.style.display = 'block';
    container.innerHTML = `
        <div class="weekly-boss-card${urgent ? ' boss-urgent' : ''}">
            <div class="boss-header">
                <span class="boss-icon">💀</span>
                <div class="boss-title-wrap">
                    <span class="boss-title">CHEFE DA SEMANA</span>
                    <span class="boss-timer${urgent ? ' boss-timer-urgent' : ''}">⏳ ${remH}h ${remMin}min restantes</span>
                </div>
                <span class="boss-badge">BOSS</span>
            </div>
            <div class="boss-desc">Derrote completando 3 dias perfeitos (100% das dailies)</div>
            <div class="boss-hp-bar-track">
                <div class="boss-hp-bar-fill" style="width: ${hpPct}%"></div>
            </div>
            <div class="boss-hp-label">${wb.hp}/3 HP restantes</div>
            <div class="boss-rewards-preview">Recompensa: +150 XP · +80 💰 · Streak protegido</div>
        </div>
    `;
}



// Mapeia nível mínimo do rank atual → boss quest a ser ativada
const BOSS_QUEST_BY_LEVEL = {
    5:  'e-to-d',
    10: 'd-to-c',
    15: 'c-to-b',
    20: 'b-to-s',
    25: 's-to-nacional',
    30: 'nacional-to-governante',
    35: 'governante-to-monarca'
};


function checkAndActivateBossQuest() {
    const level = gameState.level;

    // Verifica se o nível atual tem uma boss quest associada
    const bossId = BOSS_QUEST_BY_LEVEL[level];
    if (bossId && (!gameState.bossQuest || gameState.bossQuest.id !== bossId)) {
        // Ativa a nova Boss Quest
        gameState.bossQuest = {
            id: bossId,
            completed: false,
            sideQuestsCompleted: 0
        };
        const bq = BOSS_QUESTS[bossId];
        setTimeout(() => {
            showSystemToast(`⚔️ *BOSS QUEST DESBLOQUEADA!*\n\n*${bq.title}*\n_${bq.description}_\n\nRecompensa: +${bq.xpReward} XP · +${bq.goldReward} 💰\n\nProgresso atual: ${bq.progress()}`);

        }, 2000);
    }

    // Verifica se a boss quest ativa foi concluída
    if (gameState.bossQuest && !gameState.bossQuest.completed) {
        const bq = BOSS_QUESTS[gameState.bossQuest.id];
        if (bq && bq.check()) {
            gameState.bossQuest.completed = true;
            gameState.xp += bq.xpReward;
            gameState.gold += bq.goldReward;
            setTimeout(() => {
                showSystemToast(`🏆 *BOSS QUEST CONCLUÍDA!*\n\n*${bq.title}* foi completada!\n\n_"${getBossVictoryQuote(bq.id)}"_\n\n+${bq.xpReward} XP · +${bq.goldReward} 💰 concedidos. ${bq.rankFrom} → ${bq.rankTo} desbloqueado por mérito!`);

            }, 1500);
            saveGameData();
            updateUI();
        }
    }
}

// Bordão do Iroh ao concluir cada Boss Quest
function getBossVictoryQuote(bossId) {
    const quotes = {
        'e-to-d': 'Três dias. Simples assim. E você provou que tem o que é preciso para continuar.',
        'd-to-c': 'Missões extras revelam o caráter. Você foi além do mínimo — isso é tudo.',
        'c-to-b': 'Quatro atributos forjados. Não é sorte. É consistência transformada em força.',
        'b-to-a': 'Catorze dias sem parar. Isso não é disciplina — isso é identidade.',
        'a-to-s': 'O Sistema Encarnado. Você não segue mais o método — você virou o método.'
    };
    return quotes[bossId] || 'A vitória pertence a quem persiste.';
}


//  Conquistas (Achievements) 
const ACHIEVEMENTS_DEFS = [
    // CONSISTÊNCIA
    {
        id: 'first_quest', category: 'consistência',
        title: 'O Início da Jornada', desc: 'Conclua sua primeira Missão',
        icon: '⚔️', rewardGold: 10, rarity: 'comum',
        check: (gs) => gs.quests.some(q => q.completed) || (gs.sideQuests && gs.sideQuests.some(q => q.completed)),
        progress: (gs) => ({ cur: Math.min(gs.quests.filter(q => q.completed).length + (gs.sideQuests || []).filter(q => q.completed).length, 1), max: 1 })
    },
    {
        id: 'streak_3', category: 'consistência',
        title: 'Primeiros Passos', desc: 'Atinja um Streak de 3 dias',
        icon: '🔥', rewardGold: 15, rarity: 'comum',
        check: (gs) => gs.streak >= 3,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 3), max: 3 })
    },
    {
        id: 'streak_7', category: 'consistência',
        title: 'Sangue Frio', desc: 'Atinja um Streak de 7 dias',
        icon: '🔥', rewardGold: 25, rarity: 'incomum',
        check: (gs) => gs.streak >= 7,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 7), max: 7 })
    },
    {
        id: 'streak_30', category: 'consistência',
        title: 'Disciplina de Ferro', desc: 'Atinja um Streak de 30 dias',
        icon: '🛡️', rewardGold: 100, rarity: 'raro',
        check: (gs) => gs.streak >= 30,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 30), max: 30 })
    },
    {
        id: 'streak_100', category: 'consistência',
        title: 'A Lenda Não Para', desc: 'Atinja um Streak de 100 dias',
        icon: '👑', rewardGold: 400, rarity: 'lendário',
        check: (gs) => gs.streak >= 100,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 100), max: 100 })
    },
    // RANK
    {
        id: 'rank_d', category: 'rank',
        title: 'O Despertar', desc: 'Chegue ao Rank D (Nível 5)',
        icon: '🌅', rewardGold: 30, rarity: 'incomum',
        check: (gs) => gs.level >= 5,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 5), max: 5 })
    },
    {
        id: 'rank_c', category: 'rank',
        title: 'Ascensão', desc: 'Chegue ao Rank C (Nível 10)',
        icon: '🌟', rewardGold: 80, rarity: 'raro',
        check: (gs) => gs.level >= 10,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 10), max: 10 })
    },
    {
        id: 'rank_s', category: 'rank',
        title: 'Caçador de Rank', desc: 'Chegue ao Rank S (Nível 30)',
        icon: '👑', rewardGold: 500, rarity: 'lendário',
        check: (gs) => gs.level >= 30,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 30), max: 30 })
    },
    // HABILIDADES
    {
        id: 'skill_3', category: 'habilidades',
        title: 'Especialista Iniciante', desc: 'Alcance o Nível 3 em qualquer Skill',
        icon: '✨', rewardGold: 20, rarity: 'comum',
        check: (gs) => Object.values(gs.skills || {}).some(s => s.level >= 3),
        progress: (gs) => ({ cur: Math.min(Math.max(...Object.values(gs.skills || {1:1}).map(s => s.level || 1)), 3), max: 3 })
    },
    {
        id: 'skill_5', category: 'habilidades',
        title: 'Especialista', desc: 'Alcance o Nível 5 em qualquer Skill',
        icon: '⭐', rewardGold: 50, rarity: 'raro',
        check: (gs) => Object.values(gs.skills || {}).some(s => s.level >= 5),
        progress: (gs) => ({ cur: Math.min(Math.max(...Object.values(gs.skills || {1:1}).map(s => s.level || 1)), 5), max: 5 })
    },
    {
        id: 'all_skills_3', category: 'habilidades',
        title: 'Mestre do Sistema', desc: 'Alcance o Nível 3 em TODAS as Skills',
        icon: '💠', rewardGold: 150, rarity: 'lendário',
        check: (gs) => {
            const reqs = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
            return reqs.every(k => gs.skills && gs.skills[k] && gs.skills[k].level >= 3);
        },
        progress: (gs) => {
            const reqs = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
            return { cur: reqs.filter(k => gs.skills && gs.skills[k] && gs.skills[k].level >= 3).length, max: 6 };
        }
    },
    // MASMORRAS
    {
        id: 'dungeon_1', category: 'masmorras',
        title: 'Primeiro Sangue', desc: 'Complete 1 Dungeon',
        icon: '💀', rewardGold: 20, rarity: 'comum',
        check: (gs) => (gs._dungeonsCompleted || 0) >= 1,
        progress: (gs) => ({ cur: Math.min(gs._dungeonsCompleted || 0, 1), max: 1 })
    },
    {
        id: 'dungeon_5', category: 'masmorras',
        title: 'Caçador de Dungeons', desc: 'Complete 5 Dungeons',
        icon: '⚔️', rewardGold: 80, rarity: 'raro',
        check: (gs) => (gs._dungeonsCompleted || 0) >= 5,
        progress: (gs) => ({ cur: Math.min(gs._dungeonsCompleted || 0, 5), max: 5 })
    },
    {
        id: 'boss_defeated', category: 'masmorras',
        title: 'Mata-Boss', desc: 'Derrote 1 Chefe Semanal',
        icon: '🏆', rewardGold: 100, rarity: 'raro',
        check: (gs) => gs.weeklyBoss && gs.weeklyBoss.defeated,
        progress: (gs) => ({ cur: gs.weeklyBoss?.defeated ? 1 : 0, max: 1 })
    },
];

function checkAchievements() {
    if (!gameState.unlockedAchievements) gameState.unlockedAchievements = [];
    let newlyUnlocked = false;

    ACHIEVEMENTS_DEFS.forEach(ach => {
        if (!gameState.unlockedAchievements.includes(ach.id)) {
            if (ach.check(gameState)) {
                gameState.unlockedAchievements.push(ach.id);
                gameState.gold = (gameState.gold || 0) + ach.rewardGold;
                newlyUnlocked = true;
                setTimeout(() => {
                    showSystemToast(`🏆 *CONQUISTA DESBLOQUEADA!* Você obteve o troféu *"${ach.title}"*. Recompensa: +${ach.rewardGold} 💰.`);

                    // Dispara o overlay comemorativo
                    const achOverlay = document.getElementById('achievement-unlocked-overlay');
                    const achTitle = document.getElementById('achievement-unlocked-title');
                    const achRewards = document.getElementById('achievement-unlocked-rewards');
                    if (achOverlay && achTitle && achRewards) {
                        achTitle.innerText = ach.title;
                        achRewards.innerText = `+${ach.rewardGold} OURO`;
                        achOverlay.classList.add('show');
                        setTimeout(() => achOverlay.classList.remove('show'), 2200);
                    }
                }, 1500);
            }
        }
    });

    if (newlyUnlocked) {
        renderAchievements();
        // saveGameData já é chamado em todos os pontos que alteram estado.
    }
}



// Incrementa o progresso de uma skill e verifica level up do atributo
function addSkillXP(skillType) {
    initSkillsState();
    
    const skillObj = gameState.skills[skillType];
    if (!skillObj) return;

    // XP ganho escala com o level geral
    skillObj.xp += calcSkillXpGain() + getSynergySkillXpBonus(); // +bonus de sinergias
    
    if (skillObj.xp >= skillObj.xpToNext) {
        skillObj.level++;
        skillObj.xp = 0;
        skillObj.xpToNext = calcSkillXpToNext(skillObj.level);
        
        const skillNamesPT = {
            physical: 'Físico 🏋️‍♂️',
            mental: 'Mental 🧘',
            productivity: 'Foco 💻',
            social: 'Conexão ❤️',
            wisdom: 'Sabedoria 📚',
            routine: 'Rotina 🛏️'
        };
        
        setTimeout(() => {
            showSystemToast(`⭐ *ATRIBUTO UP!* ${gameState.playerName || getPlayerTerm(gameState.gender)}, seu treino diário elevou o seu nível de *${skillNamesPT[skillType]}* para o *Nível ${skillObj.level}*! A consistência lapida a mente e o corpo. Muito bem!`);

        }, 1200);
    }
    
    checkAndActivateBossQuest(); // ← NOVO: verifica conclusão de boss quest ao evoluir skill
    saveGameData();
}

// Decrementa o progresso de uma skill caso desmarque a quest
function deductSkillXP(skillType) {
    initSkillsState();
    
    const skillObj = gameState.skills[skillType];
    if (!skillObj) return;

    if (skillObj.xp > 0) {
        skillObj.xp -= calcSkillXpGain();
        if (skillObj.xp < 0) skillObj.xp = 0;
    } else if (skillObj.level > 1) {
        skillObj.level--;
        skillObj.xpToNext = calcSkillXpToNext(skillObj.level);
        skillObj.xp = skillObj.xpToNext - 1;
    }
    
    saveGameData();
}


// ==========================================================================
// SISTEMA DE REGRAS DO JOGO E GAMIFICAÇÃO
// ==========================================================================

// Finaliza ou altera status de uma Quest (Suporta desmarcar / cancelar)
function toggleQuest(id) {
    // Se for dungeon, roteia para completeDungeon
    if (id === 'dungeon-true') {
        completeDungeon();
        return;
    }

    // Procura nas Quests Diárias
    let quest = gameState.quests.find(q => q.id === id);
    let isDaily = true;

    // Se não achar, procura nas Side Quests
    if (!quest) {
        quest = gameState.sideQuests.find(q => q.id === id);
        isDaily = false;
    }

    if (!quest) return;

    const skillType = quest.skill || 'productivity';

    if (quest.completed) {
        // CANCELAR / DESMARCAR QUEST
        quest.completed = false;
        if (quest.current !== undefined) {
            quest.current = 0; // Reseta contador de água
        }
        
        let goldLost = quest.gold;
        if (quest._legendaryFocusConsumed) {
            goldLost *= 3;
            delete quest._legendaryFocusConsumed;
        }
        deductRewards(quest.xp, goldLost);
        
        // Deduz pontos no atributo
        deductSkillXP(skillType);
    } else {
        // CONCLUIR QUEST
        if (quest.current !== undefined) {
            quest.current = quest.target || 8;
        }
        
        // Aplica Double XP Buff se ativo (dura até meia-noite — não consome na 1ª quest)
        let xpGained = quest.xp;
        if (isDoubleXpActive()) {
            xpGained *= 2;
        }

        // Aplica Pergaminho do Foco Lendário se ativo (multiplica o ouro ganho por 3)
        let goldGained = quest.gold;
        if (gameState.buffs && gameState.buffs.legendaryFocus) {
            // Nota explicativa de game design: o multiplicador de Foco Lendário (x3) e o multiplicador de grupo (+2% a +10%)
            // se empilham de forma multiplicativa (em conjunto), pois multiplicamos o ouro base da quest aqui antes
            // de repassar à função addRewards(), que posteriormente aplicará o multiplicador de grupo e outras sinergias.
            goldGained *= 3;
            gameState.buffs.legendaryFocus = false;
            if (window.deleteBuffFromSupabase) window.deleteBuffFromSupabase('legendaryFocus');
            quest._legendaryFocusConsumed = true;
        }

        quest.completed = true;
        addRewards(xpGained, goldGained);
        addSkillXP(skillType);

        // Impact Quote - Primeira do Dia
        const todayStr = new Date().toDateString();
        const completedDailies = gameState.quests.filter(q => q.completed).length;
        if (completedDailies === 1 && gameState.lastQuoteDate !== todayStr + '_first') {
            setTimeout(showImpactQuote, 1500);
            gameState.lastQuoteDate = todayStr + '_first';
        }

        // Perk: Foco Matinal — +5 XP na primeira quest concluída do dia
        if (hasPerk('foco_matinal') && !gameState._firstQuestBonusGiven) {
            gameState.xp = (gameState.xp || 0) + 5;
            gameState._firstQuestBonusGiven = true;
        }

        // Perk: Momentum — +1 XP por quest consecutiva (acumula até 5)
        if (hasPerk('momentum')) {
            gameState._momentumStack = Math.min((gameState._momentumStack || 0) + 1, 5);
            const momentumBonus = gameState._momentumStack;
            gameState.xp = (gameState.xp || 0) + momentumBonus;
        }

        // Após addSkillXP(skillType), antes de showQuestCleared(quest):
        if (!isDaily && gameState.bossQuest?.id === 'd-to-c' && !gameState.bossQuest.completed) {
            gameState.bossQuest.sideQuestsCompleted = (gameState.bossQuest.sideQuestsCompleted || 0) + 1;
        }

        // Quest Cleared animation (Arise-style)
        showQuestCleared(quest);

        
        if (isDaily) {
            checkAllDailies();
        }
    }

    saveGameData();
    renderQuests();
    updateUI();
}

// Gerencia copos de água individualmente
function adjustWater(id, operation) {
    const quest = gameState.quests.find(q => q.id === id);
    if (!quest) return;

    const skillType = quest.skill || 'physical';
    const targetVal = quest.target || 8;

    if (quest.completed && operation === 'minus') {
        // Se já estava concluída e diminuiu a água, desmarca
        quest.completed = false;
        quest.current = targetVal - 1;
        let goldLost = quest.gold;
        if (quest._legendaryFocusConsumed) {
            goldLost *= 3;
            delete quest._legendaryFocusConsumed;
        }
        deductRewards(quest.xp, goldLost);
        deductSkillXP(skillType);
    } else if (!quest.completed) {
        if (operation === 'plus' && quest.current < targetVal) {
            quest.current++;
            if (quest.current === targetVal) {
                let goldGained = quest.gold;
                if (gameState.buffs && gameState.buffs.legendaryFocus) {
                    // Nota explicativa de game design: o multiplicador de Foco Lendário (x3) e o multiplicador de grupo (+2% a +10%)
                    // se empilham de forma multiplicativa (em conjunto).
                    goldGained *= 3;
                    gameState.buffs.legendaryFocus = false;
                    if (window.deleteBuffFromSupabase) window.deleteBuffFromSupabase('legendaryFocus');
                    quest._legendaryFocusConsumed = true;
                }
                quest.completed = true;
                let xpGained = quest.xp;
                if (isDoubleXpActive()) { xpGained *= 2; }
                addRewards(xpGained, goldGained);
                addSkillXP(skillType);
                
                checkAllDailies();
            }
        } else if (operation === 'minus' && quest.current > 0) {
            quest.current--;
        }
    }

    saveGameData();
    renderQuests();
    updateUI();
}

// Sincroniza a lista de hábitos ativos de acordo com o nível do jogador (Skill Tree)
function syncQuestsByLevel() {
    let level = gameState.level;
    
    // Filtra todos os hábitos desbloqueados até o nível atual
    let unlockedHabits = ALL_HABITS_DATABASE.filter(h => h.minLevel <= level);
    
    let updatedQuests = [];
    
    // 1. Preserva as quests que já estão na lista ativa (incluindo as customizadas do Onboarding)
    if (gameState.quests) {
        gameState.quests.forEach(activeQuest => {
            updatedQuests.push(activeQuest);
        });
    }
    
    // 2. Adiciona as novas do banco de dados que foram desbloqueadas e ainda não constam
    unlockedHabits.forEach(dbHabit => {
        let exists = updatedQuests.some(q => {
            if (q.id === dbHabit.id || (dbHabit.baseId && q.id === dbHabit.baseId)) return true;
            
            // Previne colisões de hábitos com o mesmo propósito (água, treino, meditação, leitura, acordar, família)
            const t1 = q.title.toLowerCase();
            const t2 = dbHabit.title.toLowerCase();
            const keywords = [
                ['água', 'agua', 'copo', 'copos', '💧'],
                ['treinar', 'malhar', 'corrida', 'força', 'força / corrida', 'forca', 'exercício', 'academia', 'calistenia', '🏋️'],
                ['meditar', 'meditação', 'meditacao', '🧘'],
                ['leitura', 'ler', 'livro', '📚'],
                ['acordar', '🌅'],
                ['cama', '🛏️'],
                ['família', 'familia', 'amigo', 'social', 'conectar', '❤️', '📞'],
                ['higienização', 'higienizacao', 'bucal', 'dente', 'dental', 'fio dental', '🪥']
            ];
            for (const group of keywords) {
                const q1Matches = group.some(kw => t1.includes(kw) || q.icon === kw || q.emoji === kw || q.id?.includes(kw));
                const q2Matches = group.some(kw => t2.includes(kw) || dbHabit.icon === kw || dbHabit.emoji === kw || dbHabit.id?.includes(kw));
                if (q1Matches && q2Matches) return true;
            }
            return false;
        });
        if (!exists) {
            const limit = gameState.dailyCommitmentMins || 60;
            const habitDur = dbHabit.duration || 5;
            let currentTotalDuration = updatedQuests.reduce((sum, q) => sum + (q.duration || 5), 0);
            
            if (currentTotalDuration + habitDur <= limit) {
                const fresh = { ...dbHabit };
                // Preserva progresso de água se já existia quest similar
                const similarWater = gameState.quests.find(q =>
                    (q.id === dbHabit.id || (dbHabit.baseId && q.id === dbHabit.baseId)) && q.current !== undefined
                );
                if (similarWater) fresh.current = similarWater.current;
                updatedQuests.push(fresh);
                
                // Notifica o usuário no chat via Iroh caso não seja a primeira carga do app
                if (gameState.messages && gameState.messages.length > 0) {
                    setTimeout(() => {
                        showSystemToast(`🔥 *SISTEMA:* Incrível, ${gameState.playerName || getPlayerTerm(gameState.gender)}! Ao alcançar o nível *${level}*, você desbloqueou uma nova quest diária: *"${dbHabit.title}"*! Que ela fortaleça a sua rotina!`);
                    }, 1500);
                }
            }
        }
    });
    
    gameState.quests = updatedQuests;
}

// Soma XP e Gold, gerencia Level Up
function addRewards(xpGained, goldGained) {
    // Aplica multiplicador de streak e bônus de sinergias
    const multiplier = calcStreakMultiplier();
    const synergyXp   = getSynergyXpBonus();
    const synergyGold = getSynergyGoldBonus();
    const streakGold  = calcStreakGoldMultiplier();
    const groupMult   = calcGroupMultiplier(); // Multiplicador de grupo
    
    const perkXp = getPerkXpBonus(); // +25% se Lenda Imortal ativo
    const bonusXp = Math.round(xpGained * (multiplier + synergyXp + perkXp) * groupMult);
    const bonusGold = Math.round(goldGained * (1 + synergyGold + streakGold) * groupMult);
    
    gameState.xp += bonusXp;
    gameState.gold += bonusGold;

    // Trigger animations and floating texts
    if (bonusGold > 0) {
        animateGoldGain();
        spawnFloatingText(bonusGold, 'gold');
    }
    if (bonusXp > 0) {
        spawnFloatingText(bonusXp, 'xp');
    }

    // Lógica de Level Up
    if (gameState.xp >= gameState.xpToNext) {
        gameState.level++;
        gameState.xp = gameState.xp - gameState.xpToNext;
        gameState.xpToNext = getXpToNextForLevel(gameState.level); // Escalabilidade de XP
        
        // Sincroniza hábitos do novo nível desbloqueado
        syncQuestsByLevel();
        
        triggerLevelUpOverlay();
        checkAndActivateBossQuest(); // verifica boss quest ao subir de nível
    }

    // Verifica conclusão de boss quest mesmo sem level up
    checkAndActivateBossQuest();
}



// Subtrai XP e Gold ao desmarcar (impede negativar XP/Ouro)
function deductRewards(xpLost, goldLost) {
    gameState.xp -= xpLost;
    gameState.gold -= goldLost;

    if (gameState.xp < 0) {
        gameState.xp = 0;
    }
    if (gameState.gold < 0) {
        gameState.gold = 0;
    }
}

// Dispara Overlay de evolução (estilo Arise)


function checkAllDailies() {
    const todayDayOfWeek = new Date().getDay();
    const activeToday = (gameState.quests || []).filter(q =>
        isQuestActiveOnDay(q, todayDayOfWeek)
    );
    const allDone = activeToday.length > 0 && activeToday.every(q => q.completed);
    if (allDone) {
        gameState.streak++;

        // Desbloqueia título especial com 30 dias de streak
        if (gameState.streak === 30) {
            if (!gameState.inventory.unlockedTitles.includes('Inabalável')) {
                gameState.inventory.unlockedTitles.push('Inabalável');
                setTimeout(() => {
                    showSystemToast(`🏆 *NOVO TÍTULO DESBLOQUEADO!*\n\nVocê atingiu um Streak de 30 dias e conquistou o título: *Inabalável*! Equipe-o na Taverna.`);
                }, 3000);
            }
        }

        gameState.consecutiveMisses = 0; // zera contador de falhas ao completar o dia

        // Perk: Mente de Diamante — +10 XP ao completar todas as dailies
        if (hasPerk('mente_diamante')) {
            gameState.xp = (gameState.xp || 0) + 10;
        }

        // Perk: O Sistema — +1 Skill XP em uma skill aleatória ao completar todas as dailies
        if (hasPerk('o_sistema')) {
            const skillTypes = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
            const randomSkill = skillTypes[Math.floor(Math.random() * skillTypes.length)];
            if (gameState.skills && gameState.skills[randomSkill]) {
                gameState.skills[randomSkill].xp = (gameState.skills[randomSkill].xp || 0) + 1;
            }
        }

        // Reseta flags de perks diários
        gameState._firstQuestBonusGiven = false;
        gameState._momentumStack = 0;

        // Incrementa contador para escudo (a cada 7 dias = +1 escudo, máx 3)
        gameState.consecutiveStreak7Days = (gameState.consecutiveStreak7Days || 0) + 1;
        if (gameState.consecutiveStreak7Days >= 7) {
            gameState.consecutiveStreak7Days = 0;
            const maxShields = hasSynergyShieldBonus() ? 4 : 3;
            if ((gameState.shields || 0) < maxShields) {
                gameState.shields = (gameState.shields || 0) + 1;
                setTimeout(() => {
                    showSystemToast(`🛡️ *ESCUDO GERADO!* Você manteve a consistência por 7 dias seguidos. Um escudo foi adicionado ao seu arsenal — ele protege sua sequência em um dia difícil. Escudos ativos: ${gameState.shields}/${maxShields}`, 'toast-alert');
                }, 2000);
            }
        }

        saveGameData();
        updateUI();

        // Tenta gerar dungeon ao completar todas as dailies
        if (!gameState.activeDungeon) spawnDungeon();

        setTimeout(() => {
            const todayStr = new Date().toDateString();
            if (gameState.lastQuoteDate !== todayStr + '_all') {
                showImpactQuote();
                gameState.lastQuoteDate = todayStr + '_all';
            }
        }, 1500);
    }
}

//  QUEST CLEARED Animation 
function showQuestCleared(quest) {
    const skillToAttr = {
        mental: 'FORÇA DE VONTADE ↑', routine: 'FORÇA DE VONTADE ↑',
        wisdom: 'INTELECTO ↑', productivity: 'INTELECTO ↑',
        physical: 'SAÚDE ↑', social: 'SAÚDE ↑'
    };
    const overlay = document.getElementById('quest-cleared-overlay');
    document.getElementById('quest-cleared-rewards').innerText = `+${quest.xp} XP · +${quest.gold} OURO`;
    document.getElementById('quest-cleared-attr').innerText = skillToAttr[quest.skill] || 'ATRIBUTO ↑';
    overlay.classList.add('show');
    setTimeout(() => overlay.classList.remove('show'), 1800);
}

function applyDailyPenalty(yesterdayStr) {
    // ── 1. Verifica Poção de Cura (Prioridade Máxima) ────────────────────────
    if (gameState.buffs && gameState.buffs.autoHeal) {
        gameState.buffs.autoHeal = false;
        if (window.deleteBuffFromSupabase) window.deleteBuffFromSupabase('autoHeal');
        gameState.consecutiveMisses = 0; // Reseta o contador para evitar penalidades severas nos dias seguintes

        // delay de 500ms para não competir visualmente com outros toasts/eventos de reset diário
        setTimeout(() => {
            showSystemToast(`🧪 *POÇÃO DE CURA CONSUMIDA!* Sua poção protegeu seu streak e evitou qualquer penalidade hoje! _"A alquimia salvou o dia."_`);
        }, 500);

        saveGameData();
        updateUI();
        return;
    }

    // Incrementa contador de dias faltosos consecutivos
    gameState.consecutiveMisses = (gameState.consecutiveMisses || 0) + 1;
    const misses = gameState.consecutiveMisses;

    // ── 2. Verifica escudo (Prioridade Secundária — só absorve no 1º dia faltoso) ──────────────────────
    if (misses === 1 && (gameState.shields || 0) > 0) {
        gameState.shields--;
        gameState.consecutiveStreak7Days = 0;

        setTimeout(() => {
            showSystemToast(`🛡️ *ESCUDO ATIVADO!* Você falhou hoje, mas seu escudo absorveu a penalidade. Streak preservada em ${gameState.streak} dias. Escudos restantes: ${gameState.shields}/3. Não abuse dessa proteção.`);

        }, 500);

        saveGameData();
        updateUI();
        return;
    }

    // ── Determina nível da penalidade ────────────────────────────────────────
    let xpPenaltyPct, streakReset, skillPenalty, debuffDurationMs, irohTone;

    if (misses >= 5) {
        xpPenaltyPct    = 0.40;
        streakReset     = true;
        skillPenalty    = true;
        debuffDurationMs = 48 * 3600000; // 48h
        irohTone        = 'severe';
    } else if (misses >= 3) {
        xpPenaltyPct    = 0.25;
        streakReset     = true;
        skillPenalty    = true;
        debuffDurationMs = 24 * 3600000; // 24h
        irohTone        = 'angry';
    } else if (misses >= 2) {
        xpPenaltyPct    = 0.15;
        streakReset     = true;
        skillPenalty    = false;
        debuffDurationMs = 8 * 3600000; // 8h
        irohTone        = 'firm';
    } else {
        // misses === 1, sem escudo
        xpPenaltyPct    = 0.05;
        streakReset     = false;
        skillPenalty    = false;
        debuffDurationMs = 1 * 3600000; // 1h
        irohTone        = 'motivational';
    }

    //  Aplica penalidade de XP 
    const penalty = Math.max(5, Math.round(gameState.xp * xpPenaltyPct));
    gameState.xp  = Math.max(0, gameState.xp - penalty);

    // ── Reseta streak se necessário ─────────────────────────────────────────
    if (streakReset) {
        gameState.streak = 0;
        gameState.consecutiveStreak7Days = 0;
    }

    //  Aplica penalidade nas skills (-1 XP nas skills com falhas comuns) 
    if (skillPenalty && gameState.skills) {
        // Penaliza skills ligadas a quests não concluídas
        let yesterdayDay;
        if (yesterdayStr) {
            const parts = yesterdayStr.split('-').map(Number);
            yesterdayDay = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
        } else {
            yesterdayDay = new Date(Date.now() - 86400000).getDay();
        }
        const failedSkills = new Set();
        (gameState.quests || []).forEach(q => {
            if (isQuestActiveOnDay(q, yesterdayDay) && !q.completed && q.skill) failedSkills.add(q.skill);
        });
        const skillToMainAttr = {
            mental: 'willpower', routine: 'willpower',
            wisdom: 'intellect', productivity: 'intellect',
            physical: 'health', social: 'health'
        };

        failedSkills.forEach(skillType => {
            const sk = gameState.skills[skillType];
            if (sk && sk.xp > 0) {
                sk.xp = Math.max(0, sk.xp - 1);

                // Animação de piscada na barra principal correspondente
                const mainAttr = skillToMainAttr[skillType];
                if (mainAttr) {
                    const el = document.querySelector(`.attr-bar-item.${mainAttr}`);
                    if (el) {
                        el.classList.add('flash-red-penalty');
                        setTimeout(() => {
                            if (el) el.classList.remove('flash-red-penalty');
                        }, 1500);
                    }
                }
            }
        });
    }

    //  Debuff visual no player card 
    const card = document.getElementById('player-card');
    if (card) {
        card.classList.add('debuffed');
        setTimeout(() => card.classList.remove('debuffed'), debuffDurationMs);
    }

    //  Overlay de penalidade 
    document.getElementById('penalty-loss-text').innerText = `−${penalty} XP`;
    document.getElementById('penalty-overlay').style.display = 'flex';

    //  Mensagem do Iroh por tom 
    setTimeout(() => {
        const irohMessages = {
            motivational: `☀️ *SISTEMA:* Você falhou hoje, ${gameState.playerName || getPlayerTerm(gameState.gender)}. Mas um tropeço não define sua jornada. _"A jornada mais longa começa com um único passo — e você ainda pode dar o de amanhã."_ Penalidade leve aplicada: −${penalty} XP. Levante-se.`,
            firm: `⚠️ *SISTEMA:* Dois dias, ${gameState.playerName || getPlayerTerm(gameState.gender)}. O Sistema registrou. Sua sequência foi zerada. _"O rio que para de correr logo apodrece."_ −${penalty} XP deduzidos. Não deixe virar hábito.`,
            angry: `☠️ *SISTEMA:* Três dias consecutivos de falha. Penalidade severa aplicada. −${penalty} XP. Suas habilidades sofreram regressão. _"Você conhece seu potencial e ainda assim escolheu a fraqueza."_ Corrija isso agora.`,
            severe: `💀 *SISTEMA — ALERTA CRÍTICO:* Cinco dias ou mais sem cumprir suas missões. Penalidade máxima: −${penalty} XP. Debuff de 48h ativo. Regressão de habilidades aplicada. _"${getPlayerTerm(gameState.gender) === 'Guerreira' ? 'Uma guerreira que abandona sua disciplina por dias não é mais uma guerreira' : 'Um guerreiro que abandona sua disciplina por dias não é mais um guerreiro'} — é apenas alguém com o uniforme."_ Retorne. Agora.`
        };
        showSystemToast(irohMessages[irohTone]);

    }, 600);

    saveGameData();
    updateUI();
}


// ==========================================================================
// LOJA E TAVERNA (COMPRA DE BUFFS E COSMÉTICOS)
// ==========================================================================
async function buyStoreItem(itemId) {
    const prices = {
        'buff_autoHeal': 100,
        'buff_doubleXp': 50,
        'buff_shield': 150,
        'buff_immortality': 800,
        'buff_legendary_focus': 400,
        'title_implacavel': 300,
        'title_mestre': 300,
        'border_neonred': 500,
        'skin_shadow_master': 250,
        'skin_mist_monarch': 400,
        'skin_arise_emperor': 600
    };

    let cost = prices[itemId];
    if (!cost) return;

    const isTutorialPromo = (gameState.tutorialStep === 2 && itemId === 'skin_shadow_master');
    if (isTutorialPromo) {
        cost = 50; // Preço promocional de tutorial
    }

    // Validar restrição de nível do Pergaminho do Foco Lendário (Requer Nível 10)
    if (itemId === 'buff_legendary_focus' && gameState.level < 10) {
        trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'level_restriction' });
        showSystemToast("⚠️ *BLOQUEADO.* O Pergaminho do Foco Lendário exige nível 10+ para ser adquirido.");
        return;
    }

    // Validar restrição de nível do Cálice da Imortalidade (Late-Game)
    if (itemId === 'buff_immortality' && gameState.level < 15) {
        trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'level_restriction' });
        showSystemToast("⚠️ *BLOQUEADO.* O Cálice da Imortalidade exige nível 15+ para ser adquirido.");
        return;
    }

    if ((gameState.gold || 0) < cost) {
        trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'insufficient_gold' });
        showSystemToast(`⚠️ *OURO INSUFICIENTE.* O Sistema não faz caridade. Você precisa de ${cost} 💰.`);
        return;
    }

    // Processamento do Item
    if (itemId.startsWith('buff_')) {
        if (!gameState.buffs) gameState.buffs = { autoHeal: false, doubleXp: false, legendaryFocus: false, shieldDays: 0 };
        
        if (itemId === 'buff_autoHeal') {
            if (gameState.buffs.autoHeal) {
                trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'already_active' });
                showSystemToast("⚠️ Você já possui uma Poção de Cura ativa no inventário.");
                return;
            }
            gameState.buffs.autoHeal = true;
            showSystemToast("🧪 *POÇÃO COMPRADA!* Seu próximo erro será perdoado. O Sistema protege os preparados.");
            if (window.saveBuffsToSupabase) await window.saveBuffsToSupabase();
        } 
        else if (itemId === 'buff_doubleXp') {
            if (isDoubleXpActive()) {
                trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'already_active' });
                showSystemToast("⚠️ Seu Pergaminho já está ativo até meia-noite!");
                return;
            }
            // Define expiração na próxima meia-noite local
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            gameState.buffs.doubleXp = false;          // limpa boolean legado
            gameState.buffs.doubleXpExpiresAt = midnight.getTime();
            showSystemToast("📜 *CONHECIMENTO ADQUIRIDO!* Todo XP ganho até meia-noite será DOBRADO. Vá trabalhar.");
            if (window.saveBuffsToSupabase) await window.saveBuffsToSupabase();
        }
        else if (itemId === 'buff_legendary_focus') {
            if (gameState.buffs.legendaryFocus) {
                trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'already_active' });
                showSystemToast("⚠️ Você já possui o Pergaminho do Foco Lendário ativo no inventário.");
                return;
            }
            gameState.buffs.legendaryFocus = true;
            showSystemToast("📜 *FOCO LENDÁRIO ATIVADO!* Sua próxima missão concluída dará o TRIPLO (x3) de Ouro.");
            if (window.saveBuffsToSupabase) await window.saveBuffsToSupabase();
        }
        else if (itemId === 'buff_shield') {
            gameState.shields = (gameState.shields || 0) + 1;
            showSystemToast(`🛡️ *ESCUDO COMPRADO!* Você adicionou 1 carga ao seu escudo principal. Total: ${gameState.shields}`);
        }
        else if (itemId === 'buff_immortality') {
            gameState.shields = 3; // restaura escudos ao máximo (3/3)
            showSystemToast(`👑 *CÁLICE DA IMORTALIDADE CONSUMIDO!* Seus escudos foram restaurados ao máximo (3/3).`);
        }
    } 
    else if (itemId.startsWith('title_') || itemId.startsWith('border_')) {
        if (!gameState.inventory) gameState.inventory = { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' };
        if (!gameState.inventory.unlockedSkins) gameState.inventory.unlockedSkins = ['default'];
        
        const isTitle = itemId.startsWith('title_');
        const inventoryList = isTitle ? gameState.inventory.unlockedTitles : gameState.inventory.unlockedBorders;
        const activeKey = isTitle ? 'activeTitle' : 'activeBorder';
        const displayType = isTitle ? 'Título' : 'Borda';

        if (inventoryList.includes(itemId)) {
            // Se já tem, apenas equipa
            gameState.inventory[activeKey] = itemId;
            showSystemToast(`( *${displayType} Equipado(a)!* Atualizado no seu perfil.`);
            saveGameData();
            updateUI(); // Vai atualizar a UI do header
            return; // Retorna para não cobrar ouro de novo
        } else {
            // Compra e equipa
            inventoryList.push(itemId);
            gameState.inventory[activeKey] = itemId;
            showSystemToast(`💎 *${displayType} Desbloqueado(a) e Equipado(a)!*`);
        }
    }
    else if (itemId.startsWith('skin_')) {
        if (!gameState.inventory) gameState.inventory = { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' };
        if (!gameState.inventory.unlockedSkins) gameState.inventory.unlockedSkins = ['default'];

        // Requisitos de Rank (Nível) - ignorados se for a promo do tutorial
        if (itemId === 'skin_shadow_master' && gameState.level < 10 && !isTutorialPromo) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'level_restriction' });
            showSystemToast("⚠️ *BLOQUEADO.* Esta borda exige Rank C (Nível 10+) para ser adquirida.");
            return;
        }
        if (itemId === 'skin_mist_monarch' && gameState.level < 15) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'level_restriction' });
            showSystemToast("⚠️ *BLOQUEADO.* Esta borda exige Rank B (Nível 15+) para ser adquirida.");
            return;
        }
        if (itemId === 'skin_arise_emperor' && gameState.level < 20) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'level_restriction' });
            showSystemToast("⚠️ *BLOQUEADO.* Esta borda exige Rank A (Nível 20+) para ser adquirida.");
            return;
        }

        const unlockedSkins = gameState.inventory.unlockedSkins;
        if (unlockedSkins.includes(itemId)) {
            if (gameState.inventory.activeBorder === itemId) {
                gameState.inventory.activeBorder = null;
                showSystemToast(`🎭 *Borda Desequipada!*`);
            } else {
                gameState.inventory.activeBorder = itemId;
                showSystemToast(`🎭 *Borda Equipada!* Seu perfil foi atualizado.`);
            }
            saveGameData();
            updateUI();
            
            if (isTutorialPromo) {
                completeTutorialQuestline();
            }
            return;
        } else {
            unlockedSkins.push(itemId);
            gameState.inventory.activeBorder = itemId;
            showSystemToast(`🎭 *Borda Desbloqueada e Equipada!*`);
            
            if (isTutorialPromo) {
                completeTutorialQuestline();
            }
        }
    }

    // Cobra o ouro
    trackEvent('item_purchased', { item_id: itemId, cost: cost, level: gameState.level });
    gameState.gold -= cost;
    saveGameData();
    updateUI();
}


// ==========================================================================
// CLOUD SAVE (SUPABASE)
// ==========================================================================
async function saveToCloud() {
    if (typeof window.saveToSupabase === 'function' && window._currentUserDbId) {
        await window.saveToSupabase();
    }
}


export {
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
};
