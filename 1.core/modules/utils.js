// utils.js
import { gameState, RANK_THRESHOLDS } from './state.js';
import { drawRadarChart } from './ui.js';

function localDateStr(d) {
    const dt = d || new Date();
    const y  = dt.getFullYear();
    const m  = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Requisito: pelo menos 1 skill em LV3+
function hasSkillLV3() {
    const skills = gameState.skills || {};
    return Object.values(skills).some(s => s.level >= 3);
}


function getRankForLevel(level) {
    for (const r of RANK_THRESHOLDS) {
        if (level >= r.min) return r;
    }
    return RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
}


function computeAttributes() {
    const s = gameState.skills || {};
    const get = (k) => s[k] ? (s[k].level - 1) + (s[k].xp / (s[k].xpToNext || 5)) : 0;

    const willpower = (get('physical') + get('routine')) / 2;
    const intellect = (get('mental') + get('wisdom')) / 2;
    const health    = (get('focus') + get('social')) / 2;

    const maxVal = 5;
    return {
        willpower: { val: willpower, level: Math.max(1, Math.round(willpower)), pct: Math.min(willpower / maxVal, 1) },
        intellect: { val: intellect, level: Math.max(1, Math.round(intellect)), pct: Math.min(intellect / maxVal, 1) },
        health:    { val: health,    level: Math.max(1, Math.round(health)),    pct: Math.min(health    / maxVal, 1) }
    };
}


function computePlayerTitle(attrs, gender = 'male') {
    const w = attrs.willpower.val;
    const i = attrs.intellect.val;
    const h = attrs.health.val;

    const isFemale = gender === 'female';

    if (w < 0.2 && i < 0.2 && h < 0.2) return isFemale ? "Novata" : "Novato";

    const max = Math.max(w, i, h);
    const epsilon = 0.05;
    const isW = Math.abs(w - max) < epsilon;
    const isI = Math.abs(i - max) < epsilon;
    const isH = Math.abs(h - max) < epsilon;

    if (isW && isI && isH) return isFemale ? "Desperta" : "Desperto";
    if (isW && isH) return isFemale ? "Guerreira-Atleta" : "Monge-Atleta";
    if (isI && isH) return isFemale ? "Sábia Guerreira" : "Sábio Guerreiro";
    if (isW && isI) return isFemale ? "Mestra da Mente" : "Mestre da Mente";

    if (isH) return isFemale ? "Guerreira" : "Guerreiro";
    if (isI) return "Estrategista";
    if (isW) return isFemale ? "Estoica" : "Estoico";

    return isFemale ? "Desperta" : "Desperto";
}

// ── Definições de Sinergias de Atributos ──────────────────────────────────

const SYNERGY_DEFS = [
    {
        id: 'willpower_iron',
        name: 'Vontade de Ferro',
        icon: '⚡',
        description: '+10% XP em todas as quests',
        check: (attrs) => attrs.willpower.level >= 3,
        bonusXpPct: 0.10,
        bonusSkillXp: 0,
        bonusGoldPct: 0
    },
    {
        id: 'sharp_mind',
        name: 'Mente Afiada',
        icon: '🧠',
        description: '+1 Skill XP em cada quest',
        check: (attrs) => attrs.intellect.level >= 3,
        bonusXpPct: 0,
        bonusSkillXp: 1,
        bonusGoldPct: 0
    },
    {
        id: 'body_mind',
        name: 'Corpo e Mente',
        icon: '⚖️',
        description: '+5% Ouro em todas as quests',
        check: (attrs) => attrs.willpower.level >= 3 && attrs.health.level >= 3,
        bonusXpPct: 0,
        bonusSkillXp: 0,
        bonusGoldPct: 0.05
    },
    {
        id: 'the_system',
        name: 'O Sistema',
        icon: '⚡',
        description: '+15% XP, +1 Skill XP, +5% Ouro',
        check: (attrs) => attrs.willpower.level >= 3 && attrs.intellect.level >= 3 && attrs.health.level >= 3,
        bonusXpPct: 0.15,
        bonusSkillXp: 1,
        bonusGoldPct: 0.05
    },
    {
        id: 'immortal_legend',
        name: 'Lenda Imortal',
        icon: '👑',
        description: '+25% XP + Escudo bônus a cada 7-streak',
        check: (attrs) => attrs.willpower.level >= 5 && attrs.intellect.level >= 5 && attrs.health.level >= 5,
        bonusXpPct: 0.25,
        bonusSkillXp: 0,
        bonusGoldPct: 0,
        shieldBonus: true
    }
];


// Retorna array de sinergias ativas com base nos atributos atuais
function computeSynergies() {
    const attrs = computeAttributes();
    return SYNERGY_DEFS.filter(s => s.check(attrs));
}

// Calcula o bônus total de XP de sinergias (somativo, ex: 0.10 + 0.15 = 0.25)
function getSynergyXpBonus() {
    return computeSynergies().reduce((sum, s) => sum + (s.bonusXpPct || 0), 0);
}

// Calcula o bônus total de Skill XP de sinergias
function getSynergySkillXpBonus() {
    return computeSynergies().reduce((sum, s) => sum + (s.bonusSkillXp || 0), 0);
}

// Calcula o bônus total de Ouro de sinergias
function getSynergyGoldBonus() {
    return computeSynergies().reduce((sum, s) => sum + (s.bonusGoldPct || 0), 0);
}

// Verifica se a sinergia "Lenda Imortal" está ativa (escudo bônus no 7-streak)
function hasSynergyShieldBonus() {
    return computeSynergies().some(s => s.shieldBonus);
}


function initSkillsState() {
    if (!gameState.skills) {
        gameState.skills = {};
    }
    const skillTypes = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
    skillTypes.forEach(type => {
        if (!gameState.skills[type]) {
            gameState.skills[type] = { level: 1, xp: 0, xpToNext: 5 };
        } else {
            // Recalcula xpToNext com a nova fórmula (migra saves antigos automaticamente)
            gameState.skills[type].xpToNext = calcSkillXpToNext(gameState.skills[type].level);
        }
    });
}


// Fórmula de XP necessário para subir de nível de skill (curva x1.4)
function calcSkillXpToNext(level) {
    return Math.max(5, Math.round(5 * Math.pow(1.4, level - 1)));
}

// XP ganho por conclusão de quest escala com o level geral do personagem
function calcSkillXpGain() {
    const lvl = gameState.level;
    if (lvl >= 30) return 4;
    if (lvl >= 20) return 3;
    if (lvl >= 10) return 2;
    return 1;
}

// Multiplicador de XP baseado no streak atual (escada progressiva)
function calcStreakMultiplier() {
    const streak = gameState.streak || 0;
    if (streak >= 30) return 1.50; // +50%
    if (streak >= 14) return 1.35; // +35%
    if (streak >= 7)  return 1.20; // +20%
    if (streak >= 3)  return 1.10; // +10%
    return 1.0;
}

function getXpToNextForLevel(level) {
    return Math.round(100 * Math.pow(level, 1.5));
}

function calcGroupMultiplier() {
    const count = gameState.friendsCount || 0;
    return 1 + (Math.min(count, 5) * 0.02);
}

// Multiplicador de Ouro baseado no streak atual
function calcStreakGoldMultiplier() {
    const streak = gameState.streak || 0;
    if (streak >= 30) return 0.30; // +30%
    if (streak >= 14) return 0.20; // +20%
    if (streak >= 7)  return 0.10; // +10%
    return 0.0;
}

const RANK_PERKS = {
    'd': {
        id: 'foco_matinal',
        name: 'Foco Matinal',
        icon: '🌅',
        description: '+5 XP bônus na primeira quest do dia',
        rank: 'RANK D'
    },
    'c': {
        id: 'mente_diamante',
        name: 'Mente de Diamante',
        icon: '💎',
        description: '+10 XP bônus ao completar todas as dailies',
        rank: 'RANK C'
    },
    'b': {
        id: 'momentum',
        name: 'Momentum',
        icon: '⚡',
        description: '+1 XP por quest consecutiva (acumula até 5)',
        rank: 'RANK B'
    },
    'a': {
        id: 'o_sistema',
        name: 'O Sistema',
        icon: '🔄',
        description: '1 skill XP de bônus ao completar todas as dailies',
        rank: 'RANK A'
    },
    's': {
        id: 'lenda_imortal',
        name: 'Lenda Imortal',
        icon: '👑',
        description: '+25% XP em todas as recompensas',
        rank: 'RANK S'
    }
};

// Retorna os perks ativos com base no rank atual (todos os ranks atingidos até o atual)
function getActivePerks() {
    const rankKey = getRankForLevel(gameState.level).css.replace('rank-', ''); // 'e','d','c','b','a','s'
    const rankOrder = ['e', 'd', 'c', 'b', 'a', 's'];
    const currentIndex = rankOrder.indexOf(rankKey);
    // Inclui todos os perks dos ranks atingidos (exceto 'e' que não tem perk)
    return rankOrder
        .slice(0, currentIndex + 1)
        .filter(r => RANK_PERKS[r])
        .map(r => RANK_PERKS[r]);
}

// Verifica se um perk específico está ativo
function hasPerk(perkId) {
    return getActivePerks().some(p => p.id === perkId);
}

// Bônus de XP do perk Lenda Imortal
function getPerkXpBonus() {
    return hasPerk('lenda_imortal') ? 0.25 : 0;
}


function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function getPlayerTerm(gender = 'male') {
    return gender === 'female' ? 'Guerreira' : 'Guerreiro';
}

async function trackEvent(eventName, properties = {}) {
    console.log(`[Analytics] Track Event: ${eventName}`, properties);
    if (typeof supabaseClient === 'undefined') {
        console.warn('[Analytics] Supabase client não encontrado. Evento não enviado para nuvem.');
        return;
    }
    const userId = window._currentUserDbId || null;
    try {
        const { error } = await supabaseClient
            .from('analytics_events')
            .insert({
                user_id: userId,
                event_name: eventName,
                properties: properties,
                created_at: new Date().toISOString()
            });
        if (error) {
            console.error('[Analytics] Erro ao salvar evento no Supabase:', error.message);
        }
    } catch (err) {
        console.error('[Analytics] Erro inesperado ao salvar evento:', err);
    }
}

export {
    trackEvent,
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
    getPlayerTerm
};
