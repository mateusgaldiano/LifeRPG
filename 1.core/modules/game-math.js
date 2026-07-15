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

// ── CLASSE DO JOGADOR ──────────────────────────────────────────────────────
// Atributos temáticos do radar, na ordem canônica.
const SKILL_KEYS = ['physical', 'routine', 'mental', 'wisdom', 'productivity', 'social'];

// Abaixo deste progresso em TODOS os atributos, o jogador ainda não se definiu.
const CLASS_NOVATO_THRESHOLD = 0.2;
// Margem em que dois atributos contam como empatados na liderança.
const CLASS_TIE_EPSILON = 0.05;

// Progresso contínuo de um atributo: nível inteiro + fração da barra de XP atual.
// A fração é o que desempata dois atributos no mesmo nível.
function skillProgress(skill) {
    if (!skill) return 0;
    return (skill.level - 1) + (skill.xp / (skill.xpToNext || 5));
}

// Classe dominante do jogador, derivada do radar. FONTE ÚNICA: alimenta tanto o
// título exibido (computePlayerTitle) quanto a pasta do avatar (updateAvatarImage).
// Se cada um calculasse por conta, um dia o título diria "Sábio" e o avatar
// mostraria o Monge.
// Retorna: 'novato' (ninguém saiu do lugar), 'desperto' (empate na liderança) ou
// a chave do atributo líder.
function computePlayerClassKey(skills) {
    const s = skills || {};
    const vals = {};
    SKILL_KEYS.forEach(k => { vals[k] = skillProgress(s[k]); });

    const max = Math.max(...SKILL_KEYS.map(k => vals[k]));
    if (max < CLASS_NOVATO_THRESHOLD) return 'novato';

    const leaders = SKILL_KEYS.filter(k => Math.abs(vals[k] - max) < CLASS_TIE_EPSILON);
    return leaders.length === 1 ? leaders[0] : 'desperto';
}

// ── AVATAR ─────────────────────────────────────────────────────────────────
// Arquivo do avatar por rank. Candidato reusa a arte do E; Nacional/Governante/
// Monarca reusam a do S — não têm arte própria.
// FONTE ÚNICA: existiam três cópias divergentes deste mapa (updateAvatarImage e
// openAvatarZoom em ui.js, getPlayerAvatarSrc em social.js), cada uma com um
// buraco diferente — rank A virava E na tela social, Nacional/Monarca viravam E
// no zoom. Manter um mapa só é o que impede o próximo buraco.
const AVATAR_RANK_FILE = {
    candidato:  '1.rank-e',
    e:          '1.rank-e',
    d:          '2.rank-d',
    c:          '3.rank-c',
    b:          '4.rank-b',
    a:          '5.rank-a',
    s:          '6.rank-s',
    nacional:   '6.rank-s',
    governante: '6.rank-s',
    monarca:    '6.rank-s'
};

function getAvatarRankFile(rankKey) {
    return AVATAR_RANK_FILE[String(rankKey || '').toLowerCase()] || AVATAR_RANK_FILE.e;
}

// Nome honorífico exibido para cada rank. FONTE ÚNICA — havia duas cópias
// furadas: o titleMap do openAvatarZoom não tinha os ranks acima de S (um
// Monarca era chamado de "RECRUTA") e o defaultTitles do openPlayerProfile não
// tinha o rank A (virava "Candidato").
const RANK_TITLES = {
    candidato:  { m: 'Candidato',        f: 'Candidata' },
    e:          { m: 'Recruta',          f: 'Recruta' },
    d:          { m: 'Aventureiro',      f: 'Aventureira' },
    c:          { m: 'Caçador',          f: 'Caçadora' },
    b:          { m: 'Elite',            f: 'Elite' },
    a:          { m: 'Herói Lendário',   f: 'Heroína Lendária' },
    s:          { m: 'O Sistema',        f: 'O Sistema' },
    nacional:   { m: 'Caçador Nacional', f: 'Caçadora Nacional' },
    governante: { m: 'Governante',       f: 'Governante' },
    monarca:    { m: 'Monarca',          f: 'Monarca' }
};

function getRankTitle(rankKey, gender = 'male') {
    const t = RANK_TITLES[String(rankKey || '').toLowerCase()] || RANK_TITLES.e;
    return gender === 'female' ? t.f : t.m;
}

// Caminhos candidatos do avatar, do mais específico ao mais genérico:
//   1. pasta da classe dominante  (ex.: 'wisdom-male')
//   2. pasta base do gênero, mesmo rank
//   3. rank E da base — último recurso
// A cadeia existe porque 11 das 16 pastas de classe ainda estão sem arte: sem
// ela o avatar sumiria para quem caísse numa vazia. Cada pasta que receber arte
// passa a valer sozinha, sem tocar no código.
function getAvatarCandidates({ gender = 'male', classKey = 'novato', rankKey = 'e' } = {}) {
    const g = gender === 'female' ? 'female' : 'male';
    const base = g === 'female' ? '0 - female' : '1 - male';
    const file = getAvatarRankFile(rankKey);
    return [
        `2.assets/avatars/${classKey}-${g}/${file}.webp`,
        `2.assets/avatars/${base}/${file}.webp`,
        `2.assets/avatars/${base}/1.rank-e.png`
    ];
}

// Avatar da pasta base do gênero, sem classe. Para os <img> criados soltos (tela
// social), que não têm cadeia de onerror: apontar para uma pasta de classe ali
// arriscaria imagem quebrada, já que 11 das 16 ainda estão vazias.
function getBaseAvatarSrc(gender, rankKey) {
    return getAvatarCandidates({ gender, rankKey })[1];
}

export {
    RANK_THRESHOLDS,
    getRankForLevel,
    getXpToNextForLevel,
    SINTONIA_TIER_MAP,
    computeSintoniaTier,
    SKILL_KEYS,
    computePlayerClassKey,
    AVATAR_RANK_FILE,
    getAvatarRankFile,
    getAvatarCandidates,
    getBaseAvatarSrc,
    RANK_TITLES,
    getRankTitle
};
