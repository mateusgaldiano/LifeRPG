// caminho.js
// Mapa de progressão "O Caminho" — visualização em trilha por capítulo (Rank),
// derivada 100% do gameState real (history, level, bossQuest). Sem estado
// paralelo: cada render recalcula tudo a partir da fonte única de verdade.
import { gameState, saveGameData, BOSS_QUESTS } from './state.js';
import { localDateStr, getRankForLevel, isQuestActiveOnDay } from './utils.js';
import { RANK_THRESHOLDS } from './game-math.js';
import { toggleQuest, BOSS_QUEST_BY_LEVEL } from './game-logic.js';
import { showSystemToast, updateUI } from './ui.js';

// Guarda o preenchimento anterior da Estrela do Dia p/ animar o INCREMENTO
// (ex.: 80%→100%) em vez de sempre redesenhar do zero. Reseta no reload.
let _lastStarOffset = null;

// ── datas locais (evita os bugs de fuso já documentados no CLAUDE.md: nunca
//    usar toDateString()/Date parsing com string ISO direto) ────────────────
function parseLocalDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function shiftDateStr(str, deltaDays) {
    const dt = parseLocalDate(str);
    dt.setDate(dt.getDate() + deltaDays);
    return localDateStr(dt);
}
function datesBetween(startStr, endStr, maxDays) {
    const out = [];
    let cur = startStr;
    let guard = 0;
    while (cur <= endStr && guard < maxDays) {
        out.push(cur);
        cur = shiftDateStr(cur, 1);
        guard++;
    }
    return out;
}

// ── classificação de um dia PASSADO a partir do histórico real ─────────────
function classifyPastDay(dateStr) {
    const h = gameState.history && gameState.history[dateStr];
    if (!h) return 'missed'; // sem registro nenhum nesse dia = nada foi feito
    if (h.status === 'skipped') return 'done'; // dia de descanso / congelado — perdoado
    const total = h.total || 0;
    if (total === 0) return 'done'; // não havia dailies ativas nesse dia
    const rate = (h.count || 0) / total;
    return rate >= 0.70 ? 'done' : 'missed'; // mesmo corte de 70% da penalidade real
}

// ── informação do capítulo atual (Rank) ─────────────────────────────────────
function getChapterInfo() {
    const level = gameState.level || 1;
    const rankInfo = getRankForLevel(level);
    const ascending = RANK_THRESHOLDS.slice().sort((a, b) => a.min - b.min);
    const next = ascending.find(t => t.min > level);
    const bossThresholdLevel = next ? next.min : null;
    const bossId = bossThresholdLevel ? BOSS_QUEST_BY_LEVEL[bossThresholdLevel] : null;

    const todayStr = localDateStr();
    let chapterStart = gameState.chapterStartDate || gameState.lastCheckedDate || todayStr;
    if (chapterStart > todayStr) chapterStart = todayStr; // sanidade

    return { level, rankInfo, next, bossThresholdLevel, bossId, todayStr, chapterStart };
}

// ── monta a lista de nós com geometria ─────────────────────────────────────
// Trilha combinada (de baixo p/ cima): INÍCIO · dias passados (histórico real) ·
// HOJE · níveis que faltam até o chefe · CHEFE. Assim nunca fica vazia: mesmo
// sem histórico, os níveis futuros já dão caminho rumo ao portão.
function buildNodes(chapterStart, todayStr, containerWidth, info) {
    const SPACING_Y = 92, AMPLITUDE_X = Math.min(62, containerWidth * 0.16);
    const NODE = 50, CUR = 66, SIDE = 32, FUT = 46, NEXT = 54;
    const centerX = containerWidth / 2;
    const PAST_WINDOW = 7; // janela deslizante de dias passados

    // ── dias passados: janela recente, limitada ao 1º dia com histórico real
    //    (não fabrica "perdidos" de antes da pessoa começar a usar o app) ──
    const yesterday = shiftDateStr(todayStr, -1);
    const histKeys = Object.keys(gameState.history || {}).filter(k => k <= yesterday).sort();
    const earliest = histKeys.length ? histKeys[0] : todayStr;
    const windowStart = shiftDateStr(todayStr, -PAST_WINDOW);
    const startStr = windowStart > earliest ? windowStart : earliest;
    const pastDates = (histKeys.length && yesterday >= startStr)
        ? datesBetween(startStr, yesterday, PAST_WINDOW + 2) : [];

    // Reencontro: ontem foi perdido?
    const lostYesterday = pastDates.length > 0
        && pastDates[pastDates.length - 1] === yesterday
        && classifyPastDay(yesterday) === 'missed';
    if (lostYesterday) {
        const activeToday = (gameState.quests || []).some(q => q.type === 'daily' && q.completed);
        if (activeToday && gameState._reencontroResolvedDate !== todayStr) {
            gameState._reencontroResolvedDate = todayStr;
            saveGameData();
        }
    }
    const isBlocked = lostYesterday && gameState._reencontroResolvedDate !== todayStr;

    // ── níveis futuros: do nível atual+1 até (limiar do chefe − 1) ──
    const futureLevels = [];
    if (info.bossThresholdLevel) {
        for (let L = info.level + 1; L < info.bossThresholdLevel; L++) futureLevels.push(L);
    }
    const hasBoss = !!info.bossThresholdLevel;

    // Ordena de baixo (passado) para cima (futuro).
    const raw = [];
    pastDates.forEach(d => raw.push({ kind: 'day', date: d, state: classifyPastDay(d) }));
    raw.push({ kind: 'today', date: todayStr, state: isBlocked ? 'blocked' : 'current' });
    // O 1º nível futuro é o "próximo alvo" (destacado na cor do rank); o resto fica apagado.
    futureLevels.forEach((L, i) => raw.push({ kind: 'future', level: L, state: i === 0 ? 'next' : 'future' }));
    raw.forEach((n, i) => { n.index = i; });

    const FOOTER = 56;
    const totalHeight = 40 + 186 + 88 + (raw.length - 1 + 1.25) * SPACING_Y + FOOTER;

    let targetTop;
    const nodes = raw.map((n) => {
        const yFromBottom = n.index * SPACING_Y;
        const size = n.state === 'current' ? CUR : (n.state === 'next' ? NEXT : (n.kind === 'future' ? FUT : NODE));
        const x = Math.sin((n.index / 2.4) * Math.PI) * AMPLITUDE_X;
        const cy = totalHeight - FOOTER - yFromBottom;
        const cx = centerX + x;
        const top = cy - size / 2;
        const left = cx - size / 2;
        if (n.state === 'current' || n.state === 'blocked') targetTop = top;
        return { ...n, size, cx, cy, top, left };
    });

    const bossCy = totalHeight - FOOTER - (nodes.length - 1 + 1.25) * SPACING_Y;
    const bossSize = 88;
    const boss = { cy: bossCy, cx: centerX, top: bossCy - bossSize / 2, left: centerX - bossSize / 2, size: bossSize };

    let pathD = '';
    nodes.forEach((n, i) => { pathD += (i === 0 ? 'M ' : 'L ') + n.cx.toFixed(1) + ' ' + n.cy.toFixed(1) + ' '; });
    if (hasBoss) pathD += 'L ' + centerX.toFixed(1) + ' ' + boss.cy.toFixed(1);

    let side = null;
    if (isBlocked) {
        const todayNode = nodes.find(n => n.kind === 'today');
        const dx = todayNode.cx >= centerX ? -78 : 78;
        const sideCx = todayNode.cx + dx, sideCy = todayNode.cy - 4;
        side = { cx: sideCx, cy: sideCy, top: sideCy - SIDE / 2, left: sideCx - SIDE / 2, size: SIDE,
                 spurD: 'M ' + todayNode.cx.toFixed(1) + ' ' + todayNode.cy.toFixed(1) + ' L ' + sideCx.toFixed(1) + ' ' + sideCy.toFixed(1) };
    }

    return { nodes, boss, pathD, side, isBlocked, totalHeight, targetTop, hasBoss };
}

function svgIcon(name) {
    const icons = {
        check: '<path d="M20 6L9 17l-5-5"/>',
        flag: '<path d="M5 3v18"/><path d="M5 4h11l-2 4 2 4H5"/>',
        compass: '<circle cx="12" cy="12" r="9"/><polygon points="14.5 9.5 12 14.5 9.5 12 12 9.5" fill="currentColor" stroke="none"/>',
        swords: '<line x1="5" y1="19" x2="19" y2="5"/><path d="M15 5h4v4"/><line x1="19" y1="19" x2="5" y2="5"/><path d="M9 5H5v4"/>'
    };
    return icons[name] || '';
}

function nodeHtml(n) {
    if (n.state === 'done') {
        return `<div class="cv-node cv-node-done" style="top:${n.top.toFixed(1)}px;left:${n.left.toFixed(1)}px;width:${n.size}px;height:${n.size}px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${svgIcon('check')}</svg>
        </div>`;
    }
    if (n.state === 'missed') {
        return `<div class="cv-node cv-node-missed" style="top:${n.top.toFixed(1)}px;left:${n.left.toFixed(1)}px;width:${n.size}px;height:${n.size}px;">
            <div class="cv-node-badge"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${svgIcon('flag')}</svg></div>
        </div>`;
    }
    if (n.state === 'blocked') {
        return `<div class="cv-node cv-node-blocked" style="top:${n.top.toFixed(1)}px;left:${n.left.toFixed(1)}px;width:${n.size}px;height:${n.size}px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgIcon('compass')}</svg>
        </div>`;
    }
    if (n.state === 'next') {
        // Próximo nível a alcançar — destacado na cor do rank ("próximo alvo").
        return `<div class="cv-node cv-node-next" style="top:${n.top.toFixed(1)}px;left:${n.left.toFixed(1)}px;width:${n.size}px;height:${n.size}px;">
            <span class="cv-node-lvl">${n.level}</span>
        </div>
        <div class="cv-node-label" style="top:${(n.top + n.size + 4).toFixed(1)}px;left:${(n.left - 18).toFixed(1)}px;width:${n.size + 36}px;">PRÓXIMO</div>`;
    }
    if (n.state === 'future') {
        // Nível ainda por alcançar rumo ao chefe — mostra o número do nível.
        return `<div class="cv-node cv-node-future" style="top:${n.top.toFixed(1)}px;left:${n.left.toFixed(1)}px;width:${n.size}px;height:${n.size}px;">
            <span class="cv-node-lvl">${n.level}</span>
        </div>
        <div class="cv-node-label cv-node-label-future" style="top:${(n.top + n.size + 4).toFixed(1)}px;left:${(n.left - 18).toFixed(1)}px;width:${n.size + 36}px;">NÍVEL ${n.level}</div>`;
    }
    // current
    return `<div class="cv-node cv-node-current" id="cv-today-node" style="top:${n.top.toFixed(1)}px;left:${n.left.toFixed(1)}px;width:${n.size}px;height:${n.size}px;">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><path d="M12 2c1 3-2 4-2 7a4 4 0 1 0 8 0c0-1-.5-2-1-2 .5 2-1 3-2 3-1.5 0-2-1.5-1-3-2 .5-3 2.5-2 5a6 6 0 1 1-9-5c0-3 3-4 4-6 1 1 2 1 3 0z"/></svg>
    </div>
    <div class="cv-node-label" style="top:${(n.top + n.size + 5).toFixed(1)}px;left:${n.left.toFixed(1)}px;width:${n.size}px;">HOJE</div>`;
}

// ── render principal ─────────────────────────────────────────────────────
function renderCaminho() {
    const root = document.getElementById('caminho-view');
    const scrollEl = document.getElementById('caminho-path-scroll');
    const innerEl = document.getElementById('caminho-path-inner');
    const bannerEl = document.getElementById('caminho-banner');
    if (!root || !scrollEl || !innerEl || !bannerEl) return;

    const info = getChapterInfo();
    root.className = 'caminho-view ' + info.rankInfo.css;

    // Mede o chrome fixo (header de ícones + nav inferior) para o mapa preencher
    // exatamente o espaço livre no layout imersivo do mobile. Ver body.caminho-active.
    const topH = document.querySelector('.brand-header')?.offsetHeight || 52;
    const navH = document.querySelector('.dashboard-tabs')?.offsetHeight || 76;
    document.documentElement.style.setProperty('--cv-topbar', topH + 'px');
    document.documentElement.style.setProperty('--cv-bottomnav', navH + 'px');
    // Promove o accent do rank pro :root, pra o header e a nav (fora do
    // .caminho-view) poderem tingir junto no layout imersivo escuro.
    const cvCS = getComputedStyle(root);
    document.documentElement.style.setProperty('--cv-accent-live', (cvCS.getPropertyValue('--cv-accent') || '').trim());
    document.documentElement.style.setProperty('--cv-accent-ink-live', (cvCS.getPropertyValue('--cv-accent-ink') || '').trim());

    const width = Math.max(280, Math.min(scrollEl.clientWidth || 390, 480));
    const built = buildNodes(info.chapterStart, info.todayStr, width, info);
    const { nodes, boss, pathD, side, isBlocked, totalHeight, targetTop } = built;

    // banner — stats essenciais + ESTRELA DO DIA (progresso das dailies de hoje).
    // É o loop de curto prazo: cada daily concluída enche a estrela; fechar
    // todas = Dia Perfeito.
    const chapterLabel = info.rankInfo.rank;
    const gold = gameState.gold || 0;
    const streak = gameState.streak || 0;

    // Progresso do dia por HÁBITOS (não por XP): dailies ativas hoje × concluídas.
    const dow = new Date().getDay();
    const dailiesToday = (gameState.quests || []).filter(q => q.type === 'daily' && isQuestActiveOnDay(q, dow));
    const doneToday = dailiesToday.filter(q => q.completed).length;
    const totalToday = dailiesToday.length;
    const ratio = totalToday > 0 ? doneToday / totalToday : 0;
    const isFull = totalToday > 0 && doneToday === totalToday;

    const STAR_R = 25, STAR_C = 2 * Math.PI * STAR_R;
    const offsetTarget = STAR_C * (1 - ratio);
    const startOffset = _lastStarOffset !== null ? _lastStarOffset : STAR_C; // 1ª vez enche do zero

    const starHtml = totalToday > 0 ? `
        <div class="cv-star ${isFull ? 'cv-star-full' : ''}">
            <div class="cv-star-ring">
                <svg viewBox="0 0 60 60" class="cv-star-svg" aria-hidden="true">
                    <circle class="cv-star-track" cx="30" cy="30" r="${STAR_R}"></circle>
                    <circle class="cv-star-fill" cx="30" cy="30" r="${STAR_R}" stroke-dasharray="${STAR_C.toFixed(1)}" stroke-dashoffset="${startOffset.toFixed(1)}"></circle>
                </svg>
                <div class="cv-star-center">${isFull ? '★' : `<b>${doneToday}</b><span>/${totalToday}</span>`}</div>
            </div>
            <div class="cv-star-label">${isFull ? 'DIA PERFEITO' : 'HOJE'}</div>
        </div>` : '';

    bannerEl.innerHTML = `
        <div class="cv-banner-main">
            <div class="cv-banner-eyebrow">${chapterLabel}</div>
            <div class="cv-banner-title">${isBlocked ? 'Você se afastou da trilha' : 'A Trilha'}</div>
            <div class="cv-banner-stats">
                <span class="cv-stat"><span class="cv-stat-k">NÍVEL</span><b>${info.level}</b></span>
                <span class="cv-stat"><span class="cv-stat-i">🪙</span><b>${gold}</b></span>
                <span class="cv-stat"><span class="cv-stat-i">🔥</span><b>${streak}</b></span>
            </div>
        </div>
        ${starHtml}
    `;

    // Anima a estrela do valor anterior até o atual (o "estalo" de encher).
    requestAnimationFrame(() => {
        const fill = bannerEl.querySelector('.cv-star-fill');
        if (fill) fill.style.strokeDashoffset = offsetTarget.toFixed(1);
    });
    _lastStarOffset = offsetTarget;

    // Dia Perfeito: 1ª vez que todas as dailies de hoje ficam prontas.
    if (isFull && gameState._perfectDayDate !== info.todayStr) {
        gameState._perfectDayDate = info.todayStr;
        saveGameData();
        requestAnimationFrame(() => {
            const star = bannerEl.querySelector('.cv-star');
            if (star) star.classList.add('cv-star-celebrate');
        });
        setTimeout(() => {
            showSystemToast('🌟 *DIA PERFEITO!* Você fechou todas as missões de hoje. O Sistema registrou sua consistência — a chama continua.');
        }, 450);
    }

    // boss node
    const bossReady = info.bossId && gameState.bossQuest && gameState.bossQuest.id === info.bossId && !gameState.bossQuest.completed;
    const bossHtml = info.bossId ? `
        <div class="cv-boss ${bossReady ? 'cv-boss-ready' : 'cv-boss-dormant'}" id="cv-boss-node"
             style="top:${boss.top.toFixed(1)}px;left:${boss.left.toFixed(1)}px;width:${boss.size}px;height:${boss.size}px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgIcon('swords')}</svg>
        </div>
        <div class="cv-boss-label" style="top:${(boss.top + boss.size + 5).toFixed(1)}px;left:${(boss.left - 20).toFixed(1)}px;width:${(boss.size + 40)}px;">CHEFE · Nv ${info.bossThresholdLevel}</div>
    ` : '';

    const sideHtml = side ? `
        <div class="cv-side" id="cv-side-node" style="top:${side.top.toFixed(1)}px;left:${side.left.toFixed(1)}px;width:${side.size}px;height:${side.size}px;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${svgIcon('compass')}</svg>
        </div>
        <div class="cv-side-label" style="top:${(side.top + side.size + 4).toFixed(1)}px;left:${(side.left - 40).toFixed(1)}px;width:${side.size + 80}px;">REENCONTRO</div>
    ` : '';

    innerEl.style.height = totalHeight.toFixed(0) + 'px';
    innerEl.innerHTML = `
        <div class="cv-fog"></div>
        <div class="cv-fog-label">Adiante · desconhecido</div>
        <svg class="cv-path-svg" width="${width}" height="${totalHeight.toFixed(0)}">
            <path d="${pathD}" fill="none" stroke="var(--cv-border)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 16"/>
            ${side ? `<path d="${side.spurD}" fill="none" stroke="var(--cv-lost)" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7" opacity="0.75"/>` : ''}
        </svg>
        ${bossHtml}
        ${nodes.map(nodeHtml).join('')}
        ${sideHtml}
        <div class="cv-start-marker" style="bottom:18px;">INÍCIO</div>
    `;

    // clique no nó de hoje (ou no nó de reencontro, se bloqueado)
    const openHandler = () => openTodaySheet(isBlocked);
    const todayNode = document.getElementById('cv-today-node');
    if (todayNode) todayNode.addEventListener('click', openHandler);
    const blockedNode = innerEl.querySelector('.cv-node-blocked');
    if (blockedNode) blockedNode.addEventListener('click', openHandler);
    const sideNode = document.getElementById('cv-side-node');
    if (sideNode) sideNode.addEventListener('click', () => openTodaySheet(true));

    const bossNode = document.getElementById('cv-boss-node');
    if (bossNode) {
        bossNode.addEventListener('click', () => {
            if (!info.bossId) return;
            const bq = BOSS_QUESTS[info.bossId];
            if (!bq) return;
            if (bossReady) {
                showSystemToast(`⚔️ *${bq.title}*\n_${bq.description}_\n\nProgresso: ${bq.progress()}\nRecompensa: +${bq.xpReward} XP · +${bq.goldReward} 🪙`);
            } else {
                showSystemToast(`🔒 O portão ainda está fechado. Alcance o nível ${info.bossThresholdLevel} para abri-lo.`);
            }
        });
    }

    // scroll até o nó relevante (hoje / bloqueado)
    if (targetTop !== undefined) {
        requestAnimationFrame(() => {
            scrollEl.scrollTop = Math.max(0, targetTop - scrollEl.clientHeight / 2 + 30);
        });
    }

    setupDragScroll(scrollEl);
}

// ── bottom sheet de hoje (reaproveita toggleQuest existente) ───────────────
function openTodaySheet(blocked) {
    const sheet = document.getElementById('caminho-today-sheet');
    const overlay = document.getElementById('caminho-today-overlay');
    if (!sheet || !overlay) return;
    renderTodaySheetList(blocked);
    overlay.classList.add('cv-open');
    sheet.classList.add('cv-open');
}
function closeTodaySheet() {
    const sheet = document.getElementById('caminho-today-sheet');
    const overlay = document.getElementById('caminho-today-overlay');
    if (sheet) sheet.classList.remove('cv-open');
    if (overlay) overlay.classList.remove('cv-open');
}
function renderTodaySheetList(blocked) {
    const list = document.getElementById('caminho-today-list');
    const hint = document.getElementById('caminho-today-hint');
    if (!list) return;
    if (hint) hint.style.display = blocked ? 'flex' : 'none';

    const dow = new Date().getDay();
    const dailies = (gameState.quests || []).filter(q => q.type === 'daily' && isQuestActiveOnDay(q, dow));
    if (dailies.length === 0) {
        list.innerHTML = '<div class="cv-empty">Nenhuma missão diária configurada.</div>';
        return;
    }
    list.innerHTML = dailies.map(q => `
        <div class="cv-quest-row ${q.completed ? 'cv-quest-done' : ''}" data-quest-id="${q.id}">
            <div class="cv-quest-check">${q.completed ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' : ''}</div>
            <div class="cv-quest-title">${q.title}</div>
            <div class="cv-quest-xp">+${q.xp} XP</div>
        </div>
    `).join('');

    list.querySelectorAll('.cv-quest-row').forEach(row => {
        row.addEventListener('click', () => {
            const id = row.getAttribute('data-quest-id');
            toggleQuest(id);
            updateUI();
            renderTodaySheetList(blocked);
            renderCaminho();
        });
    });
}

function setupDragScroll(el) {
    if (!el || el._cvDragBound) return;
    el._cvDragBound = true;
    let dragging = false, startY = 0, startScroll = 0;
    el.style.cursor = 'grab';
    el.addEventListener('mousedown', (e) => {
        dragging = true;
        startY = e.pageY;
        startScroll = el.scrollTop;
        el.style.cursor = 'grabbing';
        e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        el.scrollTop = startScroll - (e.pageY - startY);
    });
    window.addEventListener('mouseup', () => {
        dragging = false;
        el.style.cursor = 'grab';
    });
}

function initCaminho() {
    const closeBtn = document.getElementById('caminho-today-close');
    const overlay = document.getElementById('caminho-today-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeTodaySheet);
    if (overlay) overlay.addEventListener('click', closeTodaySheet);
}

export { renderCaminho, initCaminho, openTodaySheet };
