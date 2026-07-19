// tests/game-math.test.mjs
// Testa o NÚCLEO PURO real do jogo (1.core/modules/game-math.js) — não uma cópia.
// Roda com `node --test`. game-math.js não tem deps de DOM/estado, então importa limpo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    computeSintoniaTier,
    getXpToNextForLevel,
    getRankForLevel,
    RANK_THRESHOLDS,
    computePlayerClassKey,
    SKILL_KEYS,
    getAvatarRankFile,
    getAvatarCandidates,
    getHexTier,
    HEX_TIERS,
} from '../1.core/modules/game-math.js';

// Monta um objeto de skills no formato real do gameState a partir de um mapa
// parcial { chave: progresso }. Progresso 1.0 = 1 nível cheio.
// O xp NÃO é arredondado de propósito: arredondar limitaria a granularidade a
// 1/xpToNext e impediria testar valores logo abaixo do limiar (ex.: 0.19).
function mkSkills(partial) {
    const s = {};
    SKILL_KEYS.forEach(k => {
        const p = partial[k] || 0;
        const level = Math.floor(p) + 1;
        const frac = p - Math.floor(p);
        s[k] = { level, xp: frac * 5, xpToNext: 5 };
    });
    return s;
}

// ── computeSintoniaTier ─────────────────────────────────────────────────────
test('Sintonia: volume alto + tempo suficiente => S', () => {
    const r = computeSintoniaTier({ completedQuests: 60, totalMinutes: 120 });
    assert.equal(r.tier, 'S');
    assert.equal(r.score, 100);
    assert.equal(r.gold, 160);
    assert.equal(r.xp, 300);
    assert.equal(r.label, 'SINTONIA S');
});

test('Sintonia: gate de tempo rebaixa S->A quando < 120min', () => {
    const r = computeSintoniaTier({ completedQuests: 60, totalMinutes: 119 });
    assert.equal(r.tier, 'A');
    assert.equal(r.score, 100); // score é volume; só o tier é rebaixado
});

test('Sintonia: gate de tempo rebaixa A->B quando < 60min', () => {
    const r = computeSintoniaTier({ completedQuests: 45, totalMinutes: 59 }); // score 90 => A
    assert.equal(r.tier, 'B');
});

test('Sintonia: fronteiras de score (>95=S, 85=A, 70=B, 50=C, 30=D, <30=E)', () => {
    // totalMinutes alto p/ isolar a fronteira de score dos gates de tempo
    const tierOf = (q) => computeSintoniaTier({ completedQuests: q, totalMinutes: 1000 }).tier;
    assert.equal(tierOf(48), 'S'); // score 96 (>95)
    assert.equal(tierOf(48 - 1), 'A'); // 47 => 94 (>=85)
    assert.equal(tierOf(43), 'A'); // 86 (>=85)
    assert.equal(tierOf(42), 'B'); // 84 (>=70)
    assert.equal(tierOf(35), 'B'); // 70
    assert.equal(tierOf(34), 'C'); // 68 (>=50)
    assert.equal(tierOf(25), 'C'); // 50
    assert.equal(tierOf(24), 'D'); // 48 (>=30)
    assert.equal(tierOf(15), 'D'); // 30
    assert.equal(tierOf(14), 'E'); // 28 (<30)
    assert.equal(tierOf(0), 'E');
});

test('Sintonia: entrada vazia não quebra (defaults => E)', () => {
    const r = computeSintoniaTier();
    assert.equal(r.tier, 'E');
    assert.equal(r.gold, 0);
    assert.equal(r.xp, 0);
});

test('Sintonia: survivalRate não altera o tier (formula é volume puro)', () => {
    const a = computeSintoniaTier({ completedQuests: 40, survivalRate: 0, totalMinutes: 1000 });
    const b = computeSintoniaTier({ completedQuests: 40, survivalRate: 100, totalMinutes: 1000 });
    assert.equal(a.tier, b.tier);
});

// ── getXpToNextForLevel ─────────────────────────────────────────────────────
test('curva de XP: 100 * level^1.5 arredondado', () => {
    assert.equal(getXpToNextForLevel(1), 100);
    assert.equal(getXpToNextForLevel(4), 800);   // 100 * 8
    assert.equal(getXpToNextForLevel(9), 2700);  // 100 * 27
    assert.equal(getXpToNextForLevel(2), Math.round(100 * Math.pow(2, 1.5))); // 283
});

test('curva de XP: monotônica crescente', () => {
    for (let l = 1; l < 50; l++) {
        assert.ok(getXpToNextForLevel(l + 1) > getXpToNextForLevel(l), `nível ${l}`);
    }
});

// ── getRankForLevel ─────────────────────────────────────────────────────────
test('rank: fronteiras principais', () => {
    assert.equal(getRankForLevel(1).rank, 'Candidato');
    assert.equal(getRankForLevel(2).rank, 'Candidato'); // < 3
    assert.equal(getRankForLevel(3).rank, 'RANK E');
    assert.equal(getRankForLevel(5).rank, 'RANK D');
    assert.equal(getRankForLevel(10).rank, 'RANK C');
    assert.equal(getRankForLevel(15).rank, 'RANK B');
    assert.equal(getRankForLevel(20).rank, 'RANK A');
    assert.equal(getRankForLevel(25).rank, 'RANK S');
    assert.equal(getRankForLevel(30).rank, 'Nacional');
    assert.equal(getRankForLevel(35).rank, 'Monarca');
    assert.equal(getRankForLevel(999).rank, 'Monarca');
});

test('rank: nível 0/negativo cai no menor rank (Candidato)', () => {
    assert.equal(getRankForLevel(0).rank, 'Candidato');
    assert.equal(getRankForLevel(-5).rank, 'Candidato');
});

test('rank: thresholds ordenados do maior p/ o menor (invariante da busca)', () => {
    for (let i = 1; i < RANK_THRESHOLDS.length; i++) {
        assert.ok(RANK_THRESHOLDS[i - 1].min > RANK_THRESHOLDS[i].min, `índice ${i}`);
    }
});

// ── computePlayerClassKey ───────────────────────────────────────────────────
test('classe: atributo líder isolado define a classe', () => {
    assert.equal(computePlayerClassKey(mkSkills({ wisdom: 3, physical: 1 })), 'wisdom');
    assert.equal(computePlayerClassKey(mkSkills({ physical: 2 })), 'physical');
    assert.equal(computePlayerClassKey(mkSkills({ social: 1.4, mental: 1 })), 'social');
});

test('classe: skills vazias/ausentes => novato', () => {
    assert.equal(computePlayerClassKey(mkSkills({})), 'novato');
    assert.equal(computePlayerClassKey({}), 'novato');
    assert.equal(computePlayerClassKey(null), 'novato');
    assert.equal(computePlayerClassKey(undefined), 'novato');
});

test('classe: abaixo do limiar de 0.2 ainda é novato; a partir dele, define', () => {
    assert.equal(computePlayerClassKey(mkSkills({ mental: 0.19 })), 'novato');
    assert.equal(computePlayerClassKey(mkSkills({ mental: 0.4 })), 'mental');
});

test('classe: empate na liderança => desperto', () => {
    assert.equal(computePlayerClassKey(mkSkills({ physical: 2, wisdom: 2 })), 'desperto');
    // Três empatados também é empate.
    assert.equal(computePlayerClassKey(mkSkills({ physical: 1, wisdom: 1, social: 1 })), 'desperto');
    // Todos iguais e acima do limiar: ninguém lidera.
    const todos = {};
    SKILL_KEYS.forEach(k => { todos[k] = 1; });
    assert.equal(computePlayerClassKey(mkSkills(todos)), 'desperto');
});

test('classe: diferença menor que o epsilon conta como empate', () => {
    // 0.04 de diferença (< 0.05) => empate técnico.
    const quaseIgual = { level: 3, xp: 5, xpToNext: 5 };      // progresso 3.0
    const lider      = { level: 3, xp: 5.2, xpToNext: 5 };    // progresso 3.04
    assert.equal(computePlayerClassKey({ physical: lider, wisdom: quaseIgual }), 'desperto');
});

test('classe: sempre retorna uma chave com pasta de avatar correspondente', () => {
    const validas = new Set([...SKILL_KEYS, 'novato', 'desperto']);
    const casos = [
        mkSkills({}), mkSkills({ physical: 5 }), mkSkills({ physical: 2, social: 2 }),
        {}, null, mkSkills({ routine: 0.2 }),
    ];
    for (const c of casos) {
        assert.ok(validas.has(computePlayerClassKey(c)), `retornou chave fora do conjunto`);
    }
});

// ── getAvatarRankFile ───────────────────────────────────────────────────────
test('avatar: cada rank aponta para o arquivo certo', () => {
    assert.equal(getAvatarRankFile('e'), '1.rank-e');
    assert.equal(getAvatarRankFile('d'), '2.rank-d');
    assert.equal(getAvatarRankFile('c'), '3.rank-c');
    assert.equal(getAvatarRankFile('b'), '4.rank-b');
    assert.equal(getAvatarRankFile('a'), '5.rank-a');
    assert.equal(getAvatarRankFile('s'), '6.rank-s');
});

test('avatar: rank A não cai no E (bug antigo do social.js)', () => {
    assert.equal(getAvatarRankFile('a'), '5.rank-a');
    assert.notEqual(getAvatarRankFile('a'), '1.rank-e');
});

test('avatar: ranks acima de S reusam a arte do S (bug antigo do zoom)', () => {
    assert.equal(getAvatarRankFile('nacional'), '6.rank-s');
    assert.equal(getAvatarRankFile('governante'), '6.rank-s');
    assert.equal(getAvatarRankFile('monarca'), '6.rank-s');
});

test('avatar: candidato reusa a arte do E; rank desconhecido/vazio idem', () => {
    assert.equal(getAvatarRankFile('candidato'), '1.rank-e');
    assert.equal(getAvatarRankFile('inexistente'), '1.rank-e');
    assert.equal(getAvatarRankFile(''), '1.rank-e');
    assert.equal(getAvatarRankFile(null), '1.rank-e');
    assert.equal(getAvatarRankFile(undefined), '1.rank-e');
});

test('avatar: rank é case-insensitive (o banco guarda MAIUSCULO)', () => {
    assert.equal(getAvatarRankFile('MONARCA'), '6.rank-s');
    assert.equal(getAvatarRankFile('A'), '5.rank-a');
});

// ── getAvatarCandidates ─────────────────────────────────────────────────────
test('avatar: cadeia vai da pasta da classe para a base do gênero', () => {
    const c = getAvatarCandidates({ gender: 'male', classKey: 'wisdom', rankKey: 'c' });
    assert.deepEqual(c, [
        '2.assets/avatars/wisdom-male/3.rank-c.webp',
        '2.assets/avatars/1 - male/3.rank-c.webp',
        '2.assets/avatars/1 - male/1.rank-e.png',
    ]);
});

test('avatar: feminino usa a pasta base 0 - female', () => {
    const c = getAvatarCandidates({ gender: 'female', classKey: 'mental', rankKey: 'a' });
    assert.equal(c[0], '2.assets/avatars/mental-female/5.rank-a.webp');
    assert.equal(c[1], '2.assets/avatars/0 - female/5.rank-a.webp');
});

test('avatar: o fallback preserva o rank (não rebaixa para E no 2º candidato)', () => {
    const c = getAvatarCandidates({ gender: 'male', classKey: 'social', rankKey: 'monarca' });
    assert.ok(c[1].includes('6.rank-s'), 'o 2º candidato deve manter o rank S');
});

test('avatar: gênero ausente/inválido cai no masculino', () => {
    assert.equal(getAvatarCandidates({ classKey: 'novato', rankKey: 'e' })[1],
        '2.assets/avatars/1 - male/1.rank-e.webp');
    assert.equal(getAvatarCandidates({ gender: 'outro', classKey: 'novato', rankKey: 'e' })[0],
        '2.assets/avatars/novato-male/1.rank-e.webp');
});

test('avatar: sem argumentos ainda devolve uma cadeia utilizável', () => {
    const c = getAvatarCandidates();
    assert.equal(c.length, 3);
    assert.ok(c.every(p => p.startsWith('2.assets/avatars/')));
});

// ── getHexTier (faixas do radar) ────────────────────────────────────────────
test('hexágono: novato (tudo LV1) fica na faixa 1 com o teto de hoje', () => {
    const t = getHexTier(mkSkills({}));
    assert.equal(t.nivel, 1);
    assert.equal(t.nome, 'Iniciante');
    assert.equal(t.teto, 5); // idêntico ao teto fixo antigo: nada muda p/ iniciante
});

test('hexágono: a faixa vem do atributo MAIS ALTO, não da média', () => {
    // um único atributo alto (LV9 => val 8) puxa a faixa sozinho
    const t = getHexTier(mkSkills({ routine: 8, mental: 0.5 }));
    assert.equal(t.nivel, 2);
    assert.equal(t.teto, 10);
});

test('hexágono: fronteira — val 5 (nível 6) JÁ sobe para a faixa 2', () => {
    assert.equal(getHexTier(mkSkills({ physical: 4.9 })).nivel, 1);
    assert.equal(getHexTier(mkSkills({ physical: 5 })).nivel, 2);
});

test('hexágono: todas as fronteiras das 5 faixas', () => {
    const casos = [
        [0, 1, 5], [4.99, 1, 5],
        [5, 2, 10], [9.99, 2, 10],
        [10, 3, 15], [14.99, 3, 15],
        [15, 4, 20], [19.99, 4, 20],
        [20, 5, 25], [24.99, 5, 25],
    ];
    for (const [val, nivel, teto] of casos) {
        const t = getHexTier(mkSkills({ wisdom: val }));
        assert.equal(t.nivel, nivel, `val ${val} deveria estar na faixa ${nivel}`);
        assert.equal(t.teto, teto, `val ${val} deveria ter teto ${teto}`);
    }
});

test('hexágono: acima da última faixa o teto continua subindo (nunca satura)', () => {
    const t = getHexTier(mkSkills({ routine: 27 })); // além de Lendário
    assert.equal(t.nome, 'Lendário');
    assert.ok(t.teto >= 30, 'o teto deve crescer além de 25');
    // e o atributo nunca deve estourar o próprio teto
    assert.ok(27 <= t.teto);
});

test('hexágono: entrada vazia/nula não quebra', () => {
    for (const entrada of [undefined, null, {}]) {
        const t = getHexTier(entrada);
        assert.equal(t.nivel, 1);
        assert.equal(t.teto, 5);
    }
});

test('hexágono: o caso real do Mateus (maior = LV9) cai em Intermediário', () => {
    // valores reais: rotina 8.70, sabedoria 7.75, foco 7.23, físico 6.21, social 6.0, mental 5.30
    const t = getHexTier(mkSkills({
        routine: 8.70, wisdom: 7.75, productivity: 7.23,
        physical: 6.21, social: 6.00, mental: 5.30,
    }));
    assert.equal(t.nome, 'Intermediário');
    assert.equal(t.teto, 10);
    // com teto 10 os atributos voltam a se ESPALHAR (antes: todos em 1.00)
    assert.ok(8.70 / t.teto < 1, 'o maior não pode mais estourar o teto');
    assert.ok((8.70 / t.teto) - (5.30 / t.teto) > 0.3, 'deve haver diferença visível');
});

test('hexágono: as faixas são contíguas e crescentes (sem buraco nem sobreposição)', () => {
    for (let i = 1; i < HEX_TIERS.length; i++) {
        assert.ok(HEX_TIERS[i].maxVal > HEX_TIERS[i - 1].maxVal, `faixa ${i} deve subir`);
        assert.equal(HEX_TIERS[i].nivel, HEX_TIERS[i - 1].nivel + 1, 'níveis sequenciais');
    }
});
