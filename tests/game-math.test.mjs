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
} from '../1.core/modules/game-math.js';

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
