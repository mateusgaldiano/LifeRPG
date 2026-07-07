// game-math.js
// NÚCLEO PURO de regras numéricas do jogo — SEM dependência de DOM, gameState,
// localStorage ou qualquer efeito colateral. É o único módulo do app importável
// diretamente por `node --test`. Os módulos de UI/estado re-exportam daqui, então
// não há duplicação: existe UMA fonte para cada fórmula.

// ── RANK (Solo Leveling) ───────────────────────────────────────────────────
const RANK_THRESHOLDS = [
    { min: 35, rank: 'Monarca', css: 'rank-monarca' },
    { min: 30, rank: 'Nacional', css: 'rank-nacional' },
    { min: 25, rank: 'RANK S', css: 'rank-s' },
    { min: 20, rank: 'RANK A', css: 'rank-a' },
    { min: 15, rank: 'RANK B', css: 'rank-b' },
    { min: 10, rank: 'RANK C', css: 'rank-c' },
    { min: 5,  rank: 'RANK D', css: 'rank-d' },
    { min: 3,  rank: 'RANK E', css: 'rank-e' },
    { min: 1,  rank: 'Candidato', css: 'rank-candidato' }
];

// Rank do avatar para um dado nível (maior faixa cujo min <= level).
function getRankForLevel(level) {
    for (const r of RANK_THRESHOLDS) {
        if (level >= r.min) return r;
    }
    return RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
}

// ── CURVA DE XP ────────────────────────────────────────────────────────────
// XP necessário para subir do nível `level` — curva exponencial (expoente 1.5).
function getXpToNextForLevel(level) {
    return Math.round(100 * Math.pow(level, 1.5));
}

// ── SINTONIA SEMANAL ───────────────────────────────────────────────────────
// Fonte ÚNICA da fórmula de tier/recompensa do relatório semanal.
const SINTONIA_TIER_MAP = {
    S: { label: 'SINTONIA S', cls: 'rank-glow-s', gold: 160, xp: 300, desc: '"Desempenho lendário. Pouquíssimos alcançam este nível. Suas habilidades crescem em ritmo avassalador — o topo do mundo está ao seu alcance."' },
    A: { label: 'SINTONIA A', cls: 'rank-glow-a', gold: 100, xp: 200, desc: '"Desempenho formidável. O Sistema reconhece seu vigor e determinação. Continue assim e o rank S deixará de ser um sonho."' },
    B: { label: 'SINTONIA B', cls: 'rank-glow-b', gold: 60,  xp: 120, desc: '"Progresso sólido. Suas conquistas são constantes, mas a complacência é sua maior inimiga."' },
    C: { label: 'SINTONIA C', cls: 'rank-glow-c', gold: 30,  xp: 60,  desc: '"Na média. Você está sobrevivendo, mas o Sistema exige mais empenho e volume."' },
    D: { label: 'SINTONIA D', cls: 'rank-glow-d', gold: 10,  xp: 30,  desc: '"Desempenho fraco. Você está estagnando. O Sistema observa — e não tem paciência com a inércia."' },
    E: { label: 'SINTONIA E', cls: 'rank-glow-e', gold: 0,   xp: 0,   desc: '"Praticamente inerte. O Sistema mal registrou sua presença esta semana. Desperte, ou seja esquecido."' },
};

function computeSintoniaTier({ completedQuests = 0, survivalRate = 0, totalMinutes = 0 } = {}) {
    // Score 100% baseado no VOLUME: satura em 100 com 50+ conclusões na semana.
    const score = Math.min(100, completedQuests * 2);

    let tier;
    if (score > 95) tier = 'S';
    else if (score >= 85) tier = 'A';
    else if (score >= 70) tier = 'B';
    else if (score >= 50) tier = 'C';
    else if (score >= 30) tier = 'D';
    else tier = 'E';

    // Gates de tempo: S exige >= 2h de atividade; A exige >= 1h.
    if (tier === 'S' && totalMinutes < 120) tier = 'A';
    if (tier === 'A' && totalMinutes < 60) tier = 'B';

    const t = SINTONIA_TIER_MAP[tier];
    return { tier, score, label: t.label, cls: t.cls, gold: t.gold, xp: t.xp, desc: t.desc };
}

export {
    RANK_THRESHOLDS,
    getRankForLevel,
    getXpToNextForLevel,
    SINTONIA_TIER_MAP,
    computeSintoniaTier
};
