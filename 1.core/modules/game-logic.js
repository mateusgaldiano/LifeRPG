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

// Poção de Foco (recompensa dos Baús de Foco Diário): +50% XP por 30 minutos.
function isFocusPotionActive() {
    const b = gameState.buffs;
    return !!(b && b.focusPotionExpiresAt && Date.now() < b.focusPotionExpiresAt);
}

// Multiplicador de XP ativo (2/3/5 conforme o tomo); 1 se nenhum ativo.
// A Poção de Foco (+50%) empilha multiplicativamente com o tomo.
function getActiveXpMultiplier() {
    let mult = isDoubleXpActive() ? (gameState.buffs?.xpMult || 2) : 1;
    if (isFocusPotionActive()) mult *= 1.5;
    return mult;
}

// Debuff de recaída de vício: -30% de XP enquanto ativo (24h após uma recaída).
function isAddictionPenaltyActive() {
    const b = gameState.buffs;
    return !!(b && b.addictionPenalty && b.addictionPenaltyExpiresAt && Date.now() < b.addictionPenaltyExpiresAt);
}

// ── REAVALIAÇÃO DE RANK ────────────────────────────────────────────────────
// O rank sobe por nível (mérito). A reavaliação é uma compra OPCIONAL (custo
// escalonado) que entrega o título de prestígio do rank — o ouro vira status.
const RANK_EVALUATIONS = {
    d:        { minLevel: 5,  cost: 250,   titleId: 'rank_d',        titleLabel: 'O Iniciado' },
    c:        { minLevel: 10, cost: 600,   titleId: 'rank_c',        titleLabel: 'O Caçador' },
    b:        { minLevel: 15, cost: 1200,  titleId: 'rank_b',        titleLabel: 'A Elite' },
    a:        { minLevel: 20, cost: 2500,  titleId: 'rank_a',        titleLabel: 'O Herói' },
    s:        { minLevel: 25, cost: 4500,  titleId: 'rank_s',        titleLabel: 'Soberano' },
    nacional: { minLevel: 30, cost: 7000,  titleId: 'rank_nacional', titleLabel: 'Lendário' },
    monarca:  { minLevel: 35, cost: 12000, titleId: 'rank_monarca',  titleLabel: 'O Monarca' },
};
const RANK_EVAL_ORDER = ['d', 'c', 'b', 'a', 's', 'nacional', 'monarca'];

// Retorna a reavaliação de menor rank ainda não reivindicada que o jogador já pode fazer (ou null).
function getPendingRankEvaluation() {
    const claimed = gameState.rankEvaluationsClaimed || [];
    const lvl = gameState.level || 1;
    for (const key of RANK_EVAL_ORDER) {
        const ev = RANK_EVALUATIONS[key];
        if (lvl >= ev.minLevel && !claimed.includes(key)) return { key, ...ev };
    }
    return null;
}

function buyRankEvaluation(rankKey) {
    const ev = RANK_EVALUATIONS[rankKey];
    if (!ev) return;
    if ((gameState.level || 1) < ev.minLevel) {
        showSystemToast('⚠️ Você ainda não atingiu o nível para esta reavaliação.');
        return;
    }
    if (!gameState.rankEvaluationsClaimed) gameState.rankEvaluationsClaimed = [];
    if (gameState.rankEvaluationsClaimed.includes(rankKey)) return;
    if ((gameState.gold || 0) < ev.cost) {
        showSystemToast(`⚠️ Ouro insuficiente. A Reavaliação custa ${ev.cost} 🪙.`);
        return;
    }

    gameState.gold -= ev.cost;
    gameState.rankEvaluationsClaimed.push(rankKey);

    if (!gameState.inventory) gameState.inventory = { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' };
    if (!gameState.inventory.unlockedTitles) gameState.inventory.unlockedTitles = [];
    if (!gameState.inventory.unlockedTitles.includes(ev.titleId)) gameState.inventory.unlockedTitles.push(ev.titleId);
    gameState.inventory.activeTitle = ev.titleId;

    trackEvent('rank_evaluation_claimed', { rank: rankKey, cost: ev.cost });
    showSystemToast(`⚜️ *REAVALIAÇÃO CONCLUÍDA!* O Sistema te promove a Rank ${rankKey.toUpperCase()}. Novo título: _"${ev.titleLabel}"_.`);
    saveGameData();
    updateUI();
    if (window.saveBuffsToSupabase) window.saveToCloud && window.saveToCloud();
}

// Multiplicador de renda (XP + ouro) por rank do avatar — alimenta o loop rank→renda→tomos.
function getRankIncomeMultiplier() {
    const lvl = gameState.level || 1;
    if (lvl >= 35) return 2.5;  // Monarca
    if (lvl >= 30) return 2.0;  // Nacional
    if (lvl >= 25) return 1.75; // S
    if (lvl >= 20) return 1.5;  // A
    if (lvl >= 15) return 1.35; // B
    if (lvl >= 10) return 1.2;  // C
    if (lvl >= 5)  return 1.1;  // D
    return 1.0;                  // E / Candidato
}

// Gera uma nova dungeon aleatória
const SKILL_LABELS = { physical: 'Físico', mental: 'Mental', productivity: 'Foco', wisdom: 'Sabedoria', social: 'Conexão', routine: 'Rotina' };

function spawnDungeon(forcedSkill = null) {
    // Chaves de Portal abrem masmorras sob demanda (forcedSkill) — bypassa o gate de
    // agendamento, mas a regra de "uma masmorra por vez" continua valendo.
    if (!forcedSkill && !hasSkillLV3()) return;
    if (gameState.activeDungeon && !gameState.activeDungeon.completed) return;

    let pool = DUNGEON_POOL;
    if (forcedSkill) {
        const filtered = DUNGEON_POOL.filter(d => d.skill === forcedSkill);
        if (filtered.length > 0) pool = filtered;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];

    // Roleta de Raridade (Épico: 10%, Raro: 25%, Comum: 65%)
    const roll = Math.random();
    let rarity = 'comum';
    let rarityLabel = '⚔️ COMUM';
    let mult = 1.0, targetAdd = 0;

    if (roll < 0.10) {
        rarity = 'epico';
        rarityLabel = '✨ ÉPICA';
        mult = 2.5;
        targetAdd = 2;
    } else if (roll < 0.35) {
        rarity = 'raro';
        rarityLabel = '🔵 RARA';
        mult = 1.5;
        targetAdd = 1;
    }

    const lvl = gameState.level || 1;
    const base = lvl >= 30 ? 5 : lvl >= 20 ? 4 : lvl >= 10 ? 3 : 2; // escala por nível (E/D..Monarca)
    const target = base + targetAdd;

    const xpVal = Math.round(pick.xp * mult);
    const goldVal = Math.round(pick.gold * mult);
    const skillName = SKILL_LABELS[pick.skill] || pick.skill;

    gameState.activeDungeon = {
        id: 'dungeon-' + Date.now(),
        title: pick.title,
        skill: pick.skill,
        xp: xpVal,
        gold: goldVal,
        rarity: rarity,
        target: target,
        progress: 0,
        expiresAt: Date.now() + DUNGEON_DURATION_MS,
        completed: false,
        fromKey: !!forcedSkill   // aberta por Chave de Portal (paga) → sem penalidade de expiração
    };
    saveGameData();
    const openingLabel = forcedSkill ? '🗝️ *PORTAL ABERTO!*' : `${rarityLabel} *MASMORRA ABERTA!*`;
    setTimeout(() => {
        showSystemToast(`${openingLabel} *"${pick.title}"* — objetivo: conclua *${target} hábitos de ${skillName}*\n\nRecompensa: +${xpVal} XP · +${goldVal} 💰\n⏳ Prazo: 48 horas. Conclua antes que expire.`);

    }, 1000);
}


// Verifica e aplica expiração da dungeon ativa
function checkDungeonExpiry() {
    const d = gameState.activeDungeon;
    if (!d || d.completed) return;
    if (Date.now() >= d.expiresAt) {
        const title = d.title;
        const fromKey = !!d.fromKey;
        gameState.activeDungeon = null;
        // Masmorra aberta por Chave já foi paga com ouro — expirar não aplica a
        // penalidade de −100 XP (evita punição dupla). As aleatórias mantêm o preço.
        if (!fromKey) gameState.xp = Math.max(0, (gameState.xp || 0) - 100);
        saveGameData();
        setTimeout(() => {
            showSystemToast(fromKey
                ? `⌛ *PORTAL FECHADO.* A masmorra *"${title}"* expirou sem ser concluída. Sem penalidade de XP — a chave já foi seu custo.`
                : `💀 *DUNGEON EXPIRADA.* A missão *"${title}"* foi abandonada. O Sistema cobrou o preço: −100 XP.`);

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
    gameState.activeDungeon = null;
    saveGameData();
    updateUI();

    setTimeout(() => {
        showSystemToast(`🏆 *DUNGEON CONCLUÍDA!* Você completou *"${d.title}"*!\n\n+${xpGain} XP · +${goldGain} 💰 concedidos. Iroh está orgulhoso.`);
    }, 800);

    renderQuests();
}


// -- MASMORRAS: progresso por skill + agendamento (sabado + 30% no meio da semana) --
// Incrementa/decrementa o progresso da masmorra ativa quando um habito da MESMA skill
// e concluido/desmarcado. Ao atingir o alvo, a masmorra e concluida automaticamente.
function bumpDungeonProgress(skill, delta) {
    const d = gameState.activeDungeon;
    if (!d || d.completed || d.skill !== skill) return;
    d.progress = Math.max(0, (d.progress || 0) + delta);
    if (delta > 0 && d.progress >= (d.target || 1)) {
        completeDungeon();
    }
}

// Agenda o spawn das masmorras: 1 garantida no sabado + 30%/semana de uma extra num
// dia entre segunda e quinta (com perdao: se voce nao abrir no dia, nasce no proximo
// acesso da semana). Chamada no boot e na virada de dia.
function checkDungeonSchedule() {
    if (!hasSkillLV3()) return;

    const now = new Date();
    const dow = now.getDay(); // 0=Dom, 1=Seg ... 6=Sab
    const monday = new Date(now);
    monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow)); // segunda desta semana ISO
    const weekKey = localDateStr(monday);

    // Nova semana: reseta marcadores e rola a chance (30%) da masmorra do meio de semana.
    if (gameState._dungeonWeek !== weekKey) {
        gameState._dungeonWeek = weekKey;
        gameState._dungeonSatDone = false;
        gameState._dungeonMidDone = false;
        gameState._dungeonMidDay = (Math.random() < 0.30) ? (1 + Math.floor(Math.random() * 4)) : 0; // Seg(1)-Qui(4)
        saveGameData();
    }

    if (gameState.activeDungeon && !gameState.activeDungeon.completed) return; // uma por vez

    // Masmorra do meio de semana (janela seg-sex, a partir do dia agendado).
    if (gameState._dungeonMidDay && !gameState._dungeonMidDone && dow >= gameState._dungeonMidDay && dow <= 5) {
        gameState._dungeonMidDone = true;
        spawnDungeon();
        return;
    }

    // Masmorra de sabado garantida (janela sab-dom).
    if (!gameState._dungeonSatDone && (dow === 6 || dow === 0)) {
        gameState._dungeonSatDone = true;
        spawnDungeon();
    }
}


// ==========================================================================
// SISTEMA DE DESAFIOS SEMANAIS (WEEKLY CHALLENGES)
// ==========================================================================
const WEEKLY_CHALLENGES_POOL = [
    { title: 'Maratona Física', description: 'Conclua 4 missões de Força 💪 nesta semana', skill: 'physical', target: 4, xpReward: 150, goldReward: 75 },
    { title: 'Templo Mental', description: 'Conclua 5 missões de Mente 🧠 nesta semana', skill: 'mental', target: 5, xpReward: 150, goldReward: 75 },
    { title: 'Erudito do Sistema', description: 'Conclua 4 missões de Sabedoria 📚 nesta semana', skill: 'wisdom', target: 4, xpReward: 150, goldReward: 75 },
    { title: 'Produtividade Extrema', description: 'Conclua 5 missões de Foco 🎯 nesta semana', skill: 'productivity', target: 5, xpReward: 150, goldReward: 75 },
    { title: 'Mestre da Rotina', description: 'Conclua 6 missões de Rotina 🛏️ nesta semana', skill: 'routine', target: 6, xpReward: 180, goldReward: 90 },
    { title: 'Carisma do Caçador', description: 'Conclua 3 missões de Social 🤝 nesta semana', skill: 'social', target: 3, xpReward: 120, goldReward: 60 }
];

function getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (date - yearStart) / 86400000) + 1)/7);
    return { week: weekNo, year: date.getUTCFullYear() };
}

function checkWeeklyChallengeReset() {
    const current = getWeekNumber(new Date());
    const wc = gameState.weeklyChallenge;

    if (!wc || wc.week !== current.week || wc.year !== current.year) {
        if (wc && !wc.completed) {
            setTimeout(() => {
                showSystemToast(`📅 *SEMANA RESETADA.* O desafio semanal anterior *"${wc.title}"* expirou.`);
            }, 1000);
        }

        const pick = WEEKLY_CHALLENGES_POOL[Math.floor(Math.random() * WEEKLY_CHALLENGES_POOL.length)];
        gameState.weeklyChallenge = {
            title: pick.title,
            description: pick.description,
            skill: pick.skill,
            target: pick.target,
            current: 0,
            xpReward: pick.xpReward,
            goldReward: pick.goldReward,
            completed: false,
            week: current.week,
            year: current.year
        };
        saveGameData();
    }
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
        check: (gs) => gs.quests.some(q => q.completed && q.type !== 'addiction') || (gs.sideQuests && gs.sideQuests.some(q => q.completed)),
        progress: (gs) => ({ cur: Math.min(gs.quests.filter(q => q.completed && q.type !== 'addiction').length + (gs.sideQuests || []).filter(q => q.completed).length, 1), max: 1 })
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
    // MISSÕES (META-001)
    {
        id: 'quests_5_day', category: 'missões',
        title: 'Dia Lendário', desc: 'Conclua 5 Missões em um único dia',
        icon: '🔥', rewardGold: 30, rarity: 'raro',
        check: (gs) => (gs._maxDailyCompleted || 0) >= 5,
        progress: (gs) => ({ cur: Math.min(gs._maxDailyCompleted || 0, 5), max: 5 })
    },
    {
        id: 'quests_50_total', category: 'missões',
        title: 'Veterano', desc: 'Conclua 50 Missões no total',
        icon: '⚔️', rewardGold: 80, rarity: 'raro',
        check: (gs) => (gs._totalQuestsCompleted || 0) >= 50,
        progress: (gs) => ({ cur: Math.min(gs._totalQuestsCompleted || 0, 50), max: 50 })
    },
    {
        id: 'quests_100_total', category: 'missões',
        title: 'Lenda', desc: 'Conclua 100 Missões no total',
        icon: '👑', rewardGold: 200, rarity: 'lendário',
        check: (gs) => (gs._totalQuestsCompleted || 0) >= 100,
        progress: (gs) => ({ cur: Math.min(gs._totalQuestsCompleted || 0, 100), max: 100 })
    },
    // SOCIAL & PVP (META-001)
    {
        id: 'pvp_first_win', category: 'social',
        title: 'Gladiador', desc: 'Vença seu primeiro Duelo PvP',
        icon: '🏆', rewardGold: 100, rarity: 'raro',
        check: (gs) => (gs._pvpWins || 0) >= 1,
        progress: (gs) => ({ cur: Math.min(gs._pvpWins || 0, 1), max: 1 })
    },
    {
        id: 'friends_3', category: 'social',
        title: 'Aliança', desc: 'Tenha 3 amigos no Sistema',
        icon: '🤝', rewardGold: 50, rarity: 'incomum',
        check: (gs) => (gs.friendsCount || 0) >= 3,
        progress: (gs) => ({ cur: Math.min(gs.friendsCount || 0, 3), max: 3 })
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
    let skillGain = calcSkillXpGain() + getSynergySkillXpBonus(); // +bonus de sinergias
    if (isAddictionPenaltyActive()) skillGain = Math.floor(skillGain * 0.7); // debuff de recaída
    skillObj.xp += skillGain;

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

// Alterna um vício (quest type: 'addiction'). Lógica invertida:
//   completed:true  = abstinência (padrão do dia)
//   completed:false = recaída → aplica debuff de -30% XP por 24h + zera a streak
// Remarcar no mesmo dia = arrependimento → remove o debuff (se nenhum outro vício
// estiver desmarcado). A streak permanece zerada — a recaída já aconteceu.
function handleAddictionToggle(quest) {
    if (!gameState.buffs) gameState.buffs = {};

    if (quest.completed) {
        // RECAÍDA
        quest.completed = false;
        gameState.addictionStreak = 0;
        // Marca a recaída pela DATA (auto-expirável). Ver a nota no rollover em
        // state.js: o booleano antigo voltava da nuvem e zerava a streak sem motivo.
        gameState._addictionRelapseDate = localDateStr();
        gameState.buffs.addictionPenalty = true;
        gameState.buffs.addictionPenaltyExpiresAt = Date.now() + 86400000; // 24h
        if (window.saveBuffsToSupabase) window.saveBuffsToSupabase();
        setTimeout(() => {
            showSystemToast(`🔥 *RECAÍDA.* Você cedeu ao vício "${quest.title}". Um debuff de *-30% de XP por 24h* foi aplicado e sua sequência de abstinência voltou a zero. Remarque hoje se conseguir se recuperar.`, 'toast-alert');
        }, 300);
    } else {
        // ARREPENDIMENTO
        quest.completed = true;
        const anyStillRelapsed = gameState.quests.some(q => q.type === 'addiction' && !q.completed);
        if (!anyStillRelapsed) {
            gameState.buffs.addictionPenalty = false;
            gameState.buffs.addictionPenaltyExpiresAt = null;
            if (window.deleteBuffFromSupabase) window.deleteBuffFromSupabase('addictionPenalty');
            if (window.saveBuffsToSupabase) window.saveBuffsToSupabase();
            setTimeout(() => {
                showSystemToast(`💪 *ARREPENDIMENTO.* Você resistiu de novo a "${quest.title}" e removeu o debuff de recaída. A disciplina vence. Mantenha o foco.`);
            }, 300);
        }
    }
}

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

    // Vícios têm lógica invertida (nascem completos = abstinência). Desmarcar = recaída.
    if (quest.type === 'addiction') {
        handleAddictionToggle(quest);
        if (typeof window.queueQuestOp === 'function') window.queueQuestOp(quest.id, 'upsert');
        saveGameData();
        renderQuests();
        updateUI();
        return;
    }

    const skillType = quest.skill || 'productivity';

    if (quest.completed) {
        // CANCELAR / DESMARCAR QUEST
        quest.completed = false;

        // Remove EXATAMENTE o que a conclusão concedeu (com todos os multiplicadores),
        // não o valor base — senão cada ciclo marcar/desmarcar dá lucro líquido.
        const xpToRemove = (quest._xpAwarded != null) ? quest._xpAwarded : quest.xp;
        let goldToRemove;
        if (quest._goldAwarded != null) {
            goldToRemove = quest._goldAwarded;
        } else {
            // Fallback p/ quests concluídas ANTES desta correção (sem _goldAwarded).
            goldToRemove = quest.gold;
            if (quest._legendaryFocusConsumed) goldToRemove *= 5;
        }
        delete quest._xpAwarded;
        delete quest._goldAwarded;
        delete quest._legendaryFocusConsumed;
        deductRewards(xpToRemove, goldToRemove);

        // Deduz pontos no atributo
        deductSkillXP(skillType);
        bumpDungeonProgress(skillType, -1);

        // Atualiza progresso do Desafio Semanal (decrementa se compatível)
        if (gameState.weeklyChallenge && skillType === gameState.weeklyChallenge.skill) {
            if (gameState.weeklyChallenge.completed) {
                gameState.weeklyChallenge.completed = false;
                deductRewards(gameState.weeklyChallenge.xpReward, gameState.weeklyChallenge.goldReward);
            }
            gameState.weeklyChallenge.current = Math.max(0, (gameState.weeklyChallenge.current || 0) - 1);
        }

        // META-001: desfaz a contagem total ao desmarcar (nunca abaixo de 0).
        gameState._totalQuestsCompleted = Math.max(0, (gameState._totalQuestsCompleted || 0) - 1);
    } else {
        // CONCLUIR QUEST
        // Aplica Double XP Buff se ativo (dura até meia-noite — não consome na 1ª quest)
        let xpGained = quest.xp * getActiveXpMultiplier();

        // Aplica Pergaminho do Foco Lendário se ativo (multiplica o ouro ganho por 5)
        let goldGained = quest.gold;
        if (gameState.buffs && gameState.buffs.legendaryFocus) {
            // Nota explicativa de game design: o multiplicador de Foco Lendário (x5) e o multiplicador de grupo (+2% a +10%)
            // se empilham de forma multiplicativa (em conjunto), pois multiplicamos o ouro base da quest aqui antes
            // de repassar à função addRewards(), que posteriormente aplicará o multiplicador de grupo e outras sinergias.
            goldGained *= 5;
            gameState.buffs.legendaryFocus = false;
            if (window.deleteBuffFromSupabase) window.deleteBuffFromSupabase('legendaryFocus');
            quest._legendaryFocusConsumed = true;
        }

        quest.completed = true;
        // Guarda os valores REAIS concedidos (com multiplicadores) p/ desmarcar remover
        // exatamente isto — senão marcar/desmarcar dá lucro (bug de farm de XP/ouro).
        const awarded = addRewards(xpGained, goldGained);
        quest._xpAwarded = awarded.xp;
        quest._goldAwarded = awarded.gold;
        addSkillXP(skillType);
        bumpDungeonProgress(skillType, 1);

        // Atualiza progresso do Desafio Semanal
        if (gameState.weeklyChallenge && !gameState.weeklyChallenge.completed && skillType === gameState.weeklyChallenge.skill) {
            gameState.weeklyChallenge.current = Math.min(gameState.weeklyChallenge.target, (gameState.weeklyChallenge.current || 0) + 1);
            if (gameState.weeklyChallenge.current >= gameState.weeklyChallenge.target) {
                gameState.weeklyChallenge.completed = true;
                gameState.xp += gameState.weeklyChallenge.xpReward;
                gameState.gold += gameState.weeklyChallenge.goldReward;
                setTimeout(() => {
                    showSystemToast(`🏆 *DESAFIO SEMANAL CONCLUÍDO!*\n\n*${gameState.weeklyChallenge.title}* foi completado!\n\n+${gameState.weeklyChallenge.xpReward} XP · +${gameState.weeklyChallenge.goldReward} 💰 concedidos.`);
                }, 1500);
            }
        }

        // META-001: contadores p/ achievements de volume (total acumulado + pico diário).
        // Vícios nascem completos (abstinência) — não contam como "quest concluída".
        gameState._totalQuestsCompleted = (gameState._totalQuestsCompleted || 0) + 1;
        const _completedTodayCount = gameState.quests.filter(q => q.completed && q.type !== 'addiction').length
            + (gameState.sideQuests || []).filter(q => q.completed).length;
        gameState._maxDailyCompleted = Math.max(gameState._maxDailyCompleted || 0, _completedTodayCount);

        // Impact Quote - Primeira do Dia
        const todayStr = new Date().toDateString();
        const completedDailies = gameState.quests.filter(q => q.completed && q.type !== 'addiction').length;
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

        // Baús de Foco Diário: verifica se o horário desta conclusão concede um baú.
        checkDailyChestEarn();
    }

    // Sincroniza o estado desta quest (completed/contador) para a nuvem via outbox,
    // p/ os checks do dia refletirem em outros dispositivos. Antes só XP/Ouro subiam.
    if (typeof window.queueQuestOp === 'function') window.queueQuestOp(quest.id, 'upsert');

    saveGameData();
    renderQuests();
    updateUI();
}

// (Removido) adjustWater / contador de copos — toda atividade virou check simples.

// Sincroniza a lista de hábitos ativos de acordo com o nível do jogador (Skill Tree)
function syncQuestsByLevel() {
    return; // Auto-unlock por nível removido (v2.1.43) — a biblioteca é o catálogo único.
    // eslint-disable-next-line no-unreachable
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
    // Debuff de recaída de vício: -30% de XP enquanto ativo.
    if (isAddictionPenaltyActive()) {
        xpGained = Math.floor(xpGained * 0.7);
    }

    // Aplica multiplicador de streak e bônus de sinergias
    const multiplier = calcStreakMultiplier();
    const synergyXp   = getSynergyXpBonus();
    const synergyGold = getSynergyGoldBonus();
    const streakGold  = calcStreakGoldMultiplier();
    const groupMult   = calcGroupMultiplier(); // Multiplicador de grupo
    
    const perkXp = getPerkXpBonus(); // +25% se Lenda Imortal ativo
    const rankMult = getRankIncomeMultiplier(); // renda escala com o rank do avatar
    const bonusXp = Math.round(xpGained * (multiplier + synergyXp + perkXp) * groupMult * rankMult);
    const bonusGold = Math.round(goldGained * (1 + synergyGold + streakGold) * groupMult * rankMult);
    
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

    // Retorna os valores REAIS concedidos (já com todos os multiplicadores) para que
    // o desmarcar remova exatamente isto — evita o exploit de marcar/desmarcar.
    return { xp: bonusXp, gold: bonusGold };
}



// Subtrai XP e Gold ao desmarcar (impede negativar XP/Ouro).
// Reverte também eventuais level-ups causados pela conclusão ("empresta" do nível
// anterior), pra que desmarcar devolva ao estado exato de antes — sem farmar nível.
function deductRewards(xpLost, goldLost) {
    gameState.gold = Math.max(0, (gameState.gold || 0) - goldLost);

    let xp = (gameState.xp || 0) - xpLost;
    while (xp < 0 && (gameState.level || 1) > 1) {
        gameState.level--;
        gameState.xpToNext = getXpToNextForLevel(gameState.level);
        xp += gameState.xpToNext;
    }
    gameState.xp = xp < 0 ? 0 : xp;
}

// Dispara Overlay de evolução (estilo Arise)


function checkAllDailies() {
    const todayDayOfWeek = new Date().getDay();
    const activeToday = (gameState.quests || []).filter(q =>
        isQuestActiveOnDay(q, todayDayOfWeek)
    );
    const allDone = activeToday.length > 0 && activeToday.every(q => q.completed);
    // As recompensas de "dia completo" (streak, escudo, perks mente_diamante/o_sistema)
    // só valem UMA vez por dia. Sem esta trava, marcar/desmarcar a última daily inflava
    // streak e escudos indefinidamente — e o streak alimenta o multiplicador de XP.
    if (allDone && gameState._dailiesRewardedDate !== localDateStr()) {
        gameState._dailiesRewardedDate = localDateStr();
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

        // (Masmorras agora nascem por agendamento - ver checkDungeonSchedule.)

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
    const skillLabel = (SKILL_LABELS[quest.skill] || quest.skill || 'ATRIBUTO').toUpperCase();
    const overlay = document.getElementById('quest-cleared-overlay');
    document.getElementById('quest-cleared-rewards').innerText = `+${quest.xp} XP · +${quest.gold} OURO`;
    document.getElementById('quest-cleared-attr').innerText = `${skillLabel} ↑`;
    overlay.classList.add('show');
    setTimeout(() => overlay.classList.remove('show'), 1800);
}

// done/total: quantas missões você concluiu de quantas ativas no dia penalizado.
// Servem só para a mensagem ficar auto-explicativa ("Dia 16/07: 3 de 12 · 25%").
function applyDailyPenalty(yesterdayStr, done, total) {
    // ── 1. Verifica Poção de Cura (Prioridade Máxima) ────────────────────────
    if (gameState.buffs && gameState.buffs.autoHeal) {
        gameState.buffs.autoHeal = false;
        if (window.deleteBuffFromSupabase) window.deleteBuffFromSupabase('autoHeal');
        gameState.consecutiveMisses = 0; // Reseta o contador para evitar penalidades severas nos dias seguintes

        // delay de 500ms para não competir visualmente com outros toasts/eventos de reset diário
        setTimeout(() => {
            showSystemToast(`🧪 *POÇÃO DE CURA CONSUMIDA!* Sua poção protegeu seu streak e evitou qualquer penalidade hoje! _"A alquimia salvou o dia."_`, 'toast-alert');
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
            showSystemToast(`🛡️ *ESCUDO ATIVADO!* Você falhou hoje, mas seu escudo absorveu a penalidade. Streak preservada em ${gameState.streak} dias. Escudos restantes: ${gameState.shields}/3. Não abuse dessa proteção.`, 'toast-alert');

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

    // GAME-001: suaviza penalidades para iniciantes (< nível 10) — reduz churn de novatos
    if (gameState.level < 10) {
        xpPenaltyPct = Math.min(xpPenaltyPct, 0.10); // teto de 10% de XP
        skillPenalty = false;                        // sem perda de atributos
        if (misses < 3) streakReset = false;         // streak só reseta com 3+ falhas
    }

    //  Aplica penalidade de XP
    const penalty = Math.max(5, Math.round(gameState.xp * xpPenaltyPct));
    gameState.xp  = Math.max(0, gameState.xp - penalty);

    // ── Reseta streak se necessário ─────────────────────────────────────────
    if (streakReset) {
        // Snapshot da sequência perdida ANTES de zerar — a Ampulheta do Tempo pode
        // revertê-la. Só grava se havia sequência real (>0) para não sobrescrever um
        // registro bom com 0 em falhas consecutivas subsequentes.
        const prevStreak = gameState.streak || 0;
        if (prevStreak > 0) {
            gameState.lostStreak = {
                value: prevStreak,
                lostOn: yesterdayStr || localDateStr(new Date(Date.now() - 86400000))
            };
        }
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
        failedSkills.forEach(skillType => {
            const sk = gameState.skills[skillType];
            if (sk && sk.xp > 0) {
                sk.xp = Math.max(0, sk.xp - 1);

                // Animação de piscada no cabeçalho da coluna de quest correspondente
                const colEl = document.querySelector(`.quest-attr-column.${skillType}-col`);
                if (colEl) {
                    colEl.classList.add('flash-red-penalty');
                    setTimeout(() => {
                        if (colEl) colEl.classList.remove('flash-red-penalty');
                    }, 1500);
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
        // Linha factual: QUAL dia e QUANTO você fez — para a penalidade deixar de
        // ser opaca ("por que fui punido?") e virar auto-explicativa.
        let motivo = '';
        if (typeof total === 'number' && total > 0) {
            const pct = Math.round((done / total) * 100);
            let dataFmt = yesterdayStr;
            if (yesterdayStr && yesterdayStr.includes('-')) {
                const [, mm, dd] = yesterdayStr.split('-');
                dataFmt = `${dd}/${mm}`;
            }
            motivo = `📊 *Dia ${dataFmt}:* você concluiu ${done} de ${total} missões (${pct}%) — abaixo dos 70% exigidos.\n\n`;
        }
        const irohMessages = {
            motivational: `☀️ *SISTEMA:* Você falhou hoje, ${gameState.playerName || getPlayerTerm(gameState.gender)}. Mas um tropeço não define sua jornada. _"A jornada mais longa começa com um único passo — e você ainda pode dar o de amanhã."_ Penalidade leve aplicada: −${penalty} XP. Levante-se.`,
            firm: `⚠️ *SISTEMA:* Dois dias, ${gameState.playerName || getPlayerTerm(gameState.gender)}. O Sistema registrou. Sua sequência foi zerada. _"O rio que para de correr logo apodrece."_ −${penalty} XP deduzidos. Não deixe virar hábito.`,
            angry: `☠️ *SISTEMA:* Três dias consecutivos de falha. Penalidade severa aplicada. −${penalty} XP. Suas habilidades sofreram regressão. _"Você conhece seu potencial e ainda assim escolheu a fraqueza."_ Corrija isso agora.`,
            severe: `💀 *SISTEMA — ALERTA CRÍTICO:* Cinco dias ou mais sem cumprir suas missões. Penalidade máxima: −${penalty} XP. Debuff de 48h ativo. Regressão de habilidades aplicada. _"${getPlayerTerm(gameState.gender) === 'Guerreira' ? 'Uma guerreira que abandona sua disciplina por dias não é mais uma guerreira' : 'Um guerreiro que abandona sua disciplina por dias não é mais um guerreiro'} — é apenas alguém com o uniforme."_ Retorne. Agora.`
        };
        showSystemToast(motivo + irohMessages[irohTone], 'toast-alert');

    }, 600);

    saveGameData();
    updateUI();
}


// ==========================================================================
// AMPULHETA DO TEMPO · CHAVES DE PORTAL · TRIBUTO AO SISTEMA (helpers)
// ==========================================================================

// ── Ampulheta do Tempo (restauração retroativa de streak) ──────────────────
const HOURGLASS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 1 uso a cada 30 dias
const HOURGLASS_RESTORE_WINDOW_DAYS = 3;                 // só reverte perda recente (≤3 dias)

function isHourglassOnCooldown() {
    const last = gameState.lastHourglassAt || 0;
    return last > 0 && (Date.now() - last) < HOURGLASS_COOLDOWN_MS;
}

function hourglassDaysLeft() {
    const last = gameState.lastHourglassAt || 0;
    const remaining = HOURGLASS_COOLDOWN_MS - (Date.now() - last);
    return Math.max(1, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

// Há uma sequência perdida recentemente que valha a pena restaurar?
function hasRestorableStreak() {
    const ls = gameState.lostStreak;
    if (!ls || !ls.value || ls.value <= (gameState.streak || 0)) return false;
    if (!ls.lostOn) return true; // sem data → assume elegível (compat)
    const lost = new Date(ls.lostOn + 'T00:00:00');
    const today = new Date(localDateStr() + 'T00:00:00');
    const diffDays = Math.round((today - lost) / (24 * 60 * 60 * 1000));
    return diffDays >= 0 && diffDays <= HOURGLASS_RESTORE_WINDOW_DAYS;
}

// ── Chaves de Portal (masmorras sob demanda por skill) ─────────────────────
const KEY_SKILL_MAP = {
    key_physical:     'physical',
    key_wisdom:       'wisdom',
    key_mental:       'mental',
    key_productivity: 'productivity',
    key_social:       'social',
    key_routine:      'routine',
};

// ── Tributo Semanal ao Sistema (converte ouro em skill XP — taxa ruim) ──────
const TRIBUTE_SKILL_MAP = {
    tribute_physical:     'physical',
    tribute_mental:       'mental',
    tribute_productivity: 'productivity',
    tribute_social:       'social',
    tribute_wisdom:       'wisdom',
    tribute_routine:      'routine',
};
const TRIBUTE_COST = 1000;  // ouro drenado por tributo

// Skill XP concedido pelo tributo. ESCALA com o nível da skill-alvo (a curva de XP
// é exponencial — um valor fixo vira pó no fim de jogo, justo onde o tributo deveria
// ser um dreno relevante). Piso 5, teto 30: continua um péssimo negócio vs. hábitos
// grátis, mas empurra skills atrasadas de verdade sem virar exploit.
function tributeXpFor(skillType) {
    initSkillsState();
    const lvl = (gameState.skills[skillType] && gameState.skills[skillType].level) || 1;
    return Math.min(30, Math.max(5, Math.round(0.15 * calcSkillXpToNext(lvl))));
}

// Chave de semana ISO (segunda-feira desta semana) — usada no cooldown do tributo.
function currentWeekKey() {
    const now = new Date();
    const dow = now.getDay(); // 0=Dom .. 6=Sab
    const monday = new Date(now);
    monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
    return localDateStr(monday);
}

// Concede uma quantidade EXATA de skill XP (com carry-over de nível). Diferente de
// addSkillXP (que soma o ganho-padrão de quest e zera o excedente ao subir).
function grantRawSkillXP(skillType, amount) {
    initSkillsState();
    const s = gameState.skills[skillType];
    if (!s) return false;
    s.xp = (s.xp || 0) + amount;
    let leveled = false;
    let guard = 0;
    while (s.xp >= s.xpToNext && guard < 100) {
        s.xp -= s.xpToNext;
        s.level++;
        s.xpToNext = calcSkillXpToNext(s.level);
        leveled = true;
        guard++;
    }
    checkAndActivateBossQuest();
    saveGameData();
    return leveled;
}


// ==========================================================================
// BAÚS DE FOCO DIÁRIO (EARLY BIRD / NIGHT OWL)
// Recompensam a consistência de horário e induzem o hábito de abrir o app 2×/dia:
//   • Caçador Matutino: complete 1 hábito antes das 09h → baú abre após as 18h.
//   • Patrulha Noturna: complete 1 hábito após as 20h → baú resgatável na manhã seguinte.
// Estado derivado de datas (dailyChest); status calculado, não armazenado.
// ==========================================================================

// Chamada em toggleQuest ao CONCLUIR um hábito: concede o baú se o horário se encaixa.
function checkDailyChestEarn() {
    if (!gameState.dailyChest) gameState.dailyChest = {};
    const c = gameState.dailyChest;
    const today = localDateStr();
    const hour = new Date().getHours();

    if (hour < 9 && c.earlyBirdEarnedDate !== today) {
        c.earlyBirdEarnedDate = today;
        c.earlyBirdOpenedDate = null;
        trackEvent('daily_chest_earned', { chest: 'early_bird' });
        setTimeout(() => showSystemToast('🌅 *BAÚ DO CAÇADOR MATUTINO CONQUISTADO!* Você começou o dia cedo. O baú aparece nas Missões e abre após as *18h* — uma recompensa para fechar a noite.'), 1400);
    }
    if (hour >= 20 && c.nightOwlEarnedDate !== today) {
        c.nightOwlEarnedDate = today;
        c.nightOwlOpenedDate = null;
        trackEvent('daily_chest_earned', { chest: 'night_owl' });
        setTimeout(() => showSystemToast('🌙 *BAÚ DA PATRULHA NOTURNA CONQUISTADO!* Disciplina até tarde. Resgate a recompensa *amanhã de manhã* nas Missões.'), 1400);
    }
}

// Status derivado: 'none' | 'locked' (ganho, aguardando janela) | 'ready' | 'opened'.
function getEarlyBirdChestStatus() {
    const c = gameState.dailyChest; if (!c) return 'none';
    const today = localDateStr();
    if (c.earlyBirdEarnedDate !== today) return 'none';
    if (c.earlyBirdOpenedDate === today) return 'opened';
    return new Date().getHours() >= 18 ? 'ready' : 'locked';
}

function getNightOwlChestStatus() {
    const c = gameState.dailyChest; if (!c) return 'none';
    const today = localDateStr();
    const yesterday = localDateStr(new Date(Date.now() - 86400000));
    if (!c.nightOwlEarnedDate) return 'none';
    if (c.nightOwlEarnedDate === today) {
        // Ganho hoje à noite → travado até a manhã seguinte.
        return c.nightOwlOpenedDate === today ? 'opened' : 'locked';
    }
    if (c.nightOwlEarnedDate === yesterday) {
        return c.nightOwlOpenedDate ? 'opened' : 'ready';
    }
    return 'none'; // ganho há 2+ dias sem resgate → expirou
}

// Rola a recompensa do baú: 50% Poção de Foco (30 min, +50% XP), 50% Ouro.
// Ouro é um bônus de engajamento FIXO e modesto (40–80) — de propósito NÃO escala
// com o rank, pra não virar uma torneira que anula os ralos (Tributo/Amuletos) no fim de jogo.
function grantChestReward(source) {
    if (!gameState.buffs) gameState.buffs = {};
    if (Math.random() < 0.5) {
        gameState.buffs.focusPotionExpiresAt = Date.now() + 30 * 60 * 1000;
        trackEvent('daily_chest_reward', { source, reward: 'focus_potion' });
        return '🧪 *Poção de Foco* ativada — +50% de XP nas missões pelos próximos 30 minutos. Aproveite o embalo.';
    }
    const gold = 40 + Math.floor(Math.random() * 41); // 40–80, plano
    gameState.gold = (gameState.gold || 0) + gold;
    trackEvent('daily_chest_reward', { source, reward: 'gold', amount: gold });
    return `+${gold} 💰 de Ouro caíram no seu bolso.`;
}

// Abre um baú pronto ('ready'); ignora com aviso se ainda travado.
function openDailyChest(which) {
    const status = which === 'earlyBird' ? getEarlyBirdChestStatus() : getNightOwlChestStatus();
    if (status !== 'ready') {
        if (status === 'locked') {
            showSystemToast(which === 'earlyBird'
                ? '🔒 *BAÚ TRANCADO.* O Baú do Caçador Matutino só abre após as 18h. Volte à noite.'
                : '🔒 *BAÚ TRANCADO.* O Baú da Patrulha Noturna só é resgatável amanhã de manhã.');
        }
        return;
    }
    const today = localDateStr();
    gameState.dailyChest[which + 'OpenedDate'] = today;
    const rewardMsg = grantChestReward(which === 'earlyBird' ? 'early_bird' : 'night_owl');
    const chestName = which === 'earlyBird' ? 'CAÇADOR MATUTINO' : 'PATRULHA NOTURNA';
    showSystemToast(`🎁 *BAÚ DO ${chestName} ABERTO!* ${rewardMsg}`);
    saveGameData();
    renderQuests();
    updateUI();
}


// ==========================================================================
// AMULETOS DE FIM DE SEMANA (WEEKEND FREEZE)
// ==========================================================================
// Data (YYYY-MM-DD) da PRÓXIMA ocorrência FUTURA de um dia da semana — nunca hoje.
// Amuleto é ferramenta de planejamento (congelar um descanso à frente), não um botão
// de pânico retroativo: se hoje já é o dia-alvo, pula para a semana seguinte. Assim o
// perdão "no mesmo dia depois de falhar" fica reservado à Ampulheta (cara, cooldown).
function nextWeekendDateStr(targetDow) {
    const now = new Date();
    const diff = ((targetDow - now.getDay() + 7) % 7) || 7; // hoje = alvo → +7 (semana que vem)
    const d = new Date(now);
    d.setDate(now.getDate() + diff);
    return localDateStr(d);
}


// ==========================================================================
// LOJA E TAVERNA (COMPRA DE BUFFS E COSMÉTICOS)
// ==========================================================================
async function buyStoreItem(itemId) {
    // Economia dura: benefícios são escassos e caros. Preços rebalanceados p/ cima
    // (~3-6×), com cosméticos de prestígio sofrendo mais. Promo de tutorial intacta.
    const prices = {
        'buff_autoHeal': 800,
        'buff_doubleXp': 500,
        'buff_tripleXp': 1800,
        'buff_megaXp': 5000,
        'buff_shield': 1000,
        'buff_immortality': 2500,
        'buff_legendary_focus': 400,
        'buff_hourglass': 2500,
        'title_implacavel': 1500,
        'title_mestre': 1500,
        'border_neonred': 2500,
        'skin_shadow_master': 2000,
        'skin_mist_monarch': 3500,
        'skin_arise_emperor': 6000,
        'amulet_saturday': 600,
        'amulet_sunday': 600
    };
    // Chaves de Portal (masmorra sob demanda por skill) — todas 300 de ouro.
    Object.keys(KEY_SKILL_MAP).forEach(k => { prices[k] = 300; });
    // Tributo Semanal ao Sistema (converte ouro em skill XP).
    Object.keys(TRIBUTE_SKILL_MAP).forEach(k => { prices[k] = TRIBUTE_COST; });

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

    // Validar restrição de nível do Grimório Lendário (poder máximo de XP — só elite)
    if (itemId === 'buff_megaXp' && gameState.level < 20) {
        trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'level_restriction' });
        showSystemToast("⚠️ *BLOQUEADO.* O Grimório Lendário exige nível 20+ para ser adquirido.");
        return;
    }

    // ── Ampulheta do Tempo: valida cooldown e disponibilidade ANTES de cobrar ──
    if (itemId === 'buff_hourglass') {
        if (isHourglassOnCooldown()) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'cooldown' });
            showSystemToast(`⏳ *AMPULHETA EM RECARGA.* O tempo se dobra devagar. Aguarde ${hourglassDaysLeft()} dia(s) para poder usá-la de novo.`, 'toast-alert');
            return;
        }
        if (!hasRestorableStreak()) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'no_streak' });
            showSystemToast(`⌛ *NADA A RESTAURAR.* A Ampulheta só reverte uma sequência perdida nos últimos ${HOURGLASS_RESTORE_WINDOW_DAYS} dias. Sua ofensiva atual está intacta.`, 'toast-alert');
            return;
        }
    }

    // ── Chaves de Portal: exige masmorras desbloqueadas e nenhuma masmorra ativa ──
    if (itemId.startsWith('key_')) {
        if (!hasSkillLV3()) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'feature_locked' });
            showSystemToast("⚠️ *PORTAIS ADORMECIDOS.* Eleve ao menos uma habilidade ao Nível 3 para abrir masmorras.");
            return;
        }
        if (gameState.activeDungeon && !gameState.activeDungeon.completed) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'dungeon_active' });
            showSystemToast("⚠️ *MASMORRA EM ANDAMENTO.* Conclua a masmorra ativa antes de abrir um novo portal.");
            return;
        }
    }

    // ── Tributo ao Sistema: end-game (nível 10+) e 1× por semana ────────────────
    if (itemId.startsWith('tribute_')) {
        if ((gameState.level || 1) < 10) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'level_restriction' });
            showSystemToast("⚠️ *BLOQUEADO.* O Tributo ao Sistema exige nível 10+ para ser ofertado.");
            return;
        }
        if (gameState.lastTributeWeek && gameState.lastTributeWeek === currentWeekKey()) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'weekly_cooldown' });
            showSystemToast("🏛️ *TRIBUTO JÁ OFERTADO.* O Sistema aceita apenas um tributo por semana. Retorne na próxima.");
            return;
        }
    }

    // ── Amuleto de Fim de Semana: não pode congelar o mesmo dia duas vezes ──────
    if (itemId.startsWith('amulet_')) {
        const targetDate = nextWeekendDateStr(itemId === 'amulet_saturday' ? 6 : 0);
        if ((gameState.frozenDates || []).includes(targetDate)) {
            trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'already_frozen' });
            showSystemToast(`❄️ *JÁ CONGELADO.* O próximo ${itemId === 'amulet_saturday' ? 'sábado' : 'domingo'} (${targetDate}) já está protegido por um amuleto.`);
            return;
        }
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
        else if (itemId === 'buff_doubleXp' || itemId === 'buff_tripleXp' || itemId === 'buff_megaXp') {
            if (isDoubleXpActive()) {
                trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'already_active' });
                showSystemToast("⚠️ Você já tem um Pergaminho de XP ativo. Espere ele acabar.");
                return;
            }
            const TOMES = {
                buff_doubleXp: { mult: 2, days: 1, nome: 'Pergaminho de Sabedoria' },
                buff_tripleXp: { mult: 3, days: 3, nome: 'Tomo do Conhecimento' },
                buff_megaXp:   { mult: 5, days: 5, nome: 'Grimório Lendário' },
            };
            const t = TOMES[itemId];
            const exp = new Date(); exp.setHours(0, 0, 0, 0); exp.setDate(exp.getDate() + t.days);
            gameState.buffs.doubleXp = false;          // limpa boolean legado
            gameState.buffs.doubleXpExpiresAt = exp.getTime();
            gameState.buffs.xpMult = t.mult;
            showSystemToast(`📜 *${t.nome.toUpperCase()}!* Todo XP será multiplicado por ${t.mult}× pelos próximos ${t.days} dia(s). Vá trabalhar.`);
            if (window.saveBuffsToSupabase) await window.saveBuffsToSupabase();
        }
        else if (itemId === 'buff_legendary_focus') {
            if (gameState.buffs.legendaryFocus) {
                trackEvent('item_purchase_blocked', { item_id: itemId, reason: 'already_active' });
                showSystemToast("⚠️ Você já possui o Pergaminho do Foco Lendário ativo no inventário.");
                return;
            }
            gameState.buffs.legendaryFocus = true;
            showSystemToast("📜 *FOCO LENDÁRIO ATIVADO!* Sua próxima missão concluída dará o QUÍNTUPLO (x5) de Ouro.");
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
        else if (itemId === 'buff_hourglass') {
            // Disponibilidade já validada acima (cooldown + hasRestorableStreak).
            const restored = gameState.lostStreak.value;
            gameState.streak = restored;
            gameState.consecutiveMisses = 0;   // apaga a falha por completo
            gameState.lostStreak = null;       // consome o snapshot
            gameState.lastHourglassAt = Date.now(); // arma o cooldown de 30 dias
            showSystemToast(`⏳ *AMPULHETA DE CHRONOS CONSUMIDA!* O tempo recuou — sua sequência de *${restored} dias* foi restaurada e a falha, apagada. Não desperdice esta segunda chance.`, 'toast-alert');
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
    else if (itemId.startsWith('key_')) {
        // Chave de Portal: abre uma masmorra sob demanda focada na skill escolhida.
        // (Gate e "sem masmorra ativa" já validados acima.) spawnDungeon exibe o toast.
        const skill = KEY_SKILL_MAP[itemId];
        spawnDungeon(skill);
        trackEvent('portal_key_used', { item_id: itemId, skill });
    }
    else if (itemId.startsWith('tribute_')) {
        // Tributo ao Sistema: converte ouro em skill XP a uma taxa dura (dreno de fim de jogo).
        const skill = TRIBUTE_SKILL_MAP[itemId];
        const tributeXp = tributeXpFor(skill); // escala com o nível da skill-alvo
        gameState.lastTributeWeek = currentWeekKey(); // arma o cooldown semanal
        grantRawSkillXP(skill, tributeXp);
        const label = SKILL_LABELS[skill] || skill;
        showSystemToast(`🏛️ *TRIBUTO ACEITO.* O Sistema converteu ${TRIBUTE_COST} de Ouro em *+${tributeXp} XP de ${label}*. Uma troca cara — mas o poder tem seu preço.`);
        trackEvent('tribute_offered', { item_id: itemId, skill, xp: tributeXp, cost: TRIBUTE_COST });
    }
    else if (itemId.startsWith('amulet_')) {
        // Amuleto de Fim de Semana: congela o próximo sábado/domingo (perdão automático).
        const dow = itemId === 'amulet_saturday' ? 6 : 0;
        const targetDate = nextWeekendDateStr(dow);
        if (!Array.isArray(gameState.frozenDates)) gameState.frozenDates = [];
        gameState.frozenDates.push(targetDate);
        const dayName = dow === 6 ? 'sábado' : 'domingo';
        showSystemToast(`❄️ *AMULETO DE ${dayName.toUpperCase()} ATIVADO!* O ${dayName} (${targetDate}) está congelado: faltas nesse dia serão perdoadas e seu streak preservado. Descanse com tranquilidade.`);
        trackEvent('weekend_freeze_bought', { item_id: itemId, date: targetDate });
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
    checkDungeonSchedule,
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
    addRewards,
    deductRewards,
    applyDailyPenalty,
    checkAllDailies,
    buyStoreItem,
    saveToCloud,
    ACHIEVEMENTS_DEFS,
    showQuestCleared,
    syncQuestsByLevel,
    getPendingRankEvaluation,
    buyRankEvaluation,
    checkWeeklyChallengeReset,
    checkDailyChestEarn,
    getEarlyBirdChestStatus,
    getNightOwlChestStatus,
    openDailyChest
};
