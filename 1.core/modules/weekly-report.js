// weekly-report.js
import { gameState, saveGameData } from './state.js';
import { getRankForLevel, localDateStr } from './utils.js';
import { showSystemToast, updateUI } from './ui.js';

// ==========================================================================
// SISTEMA DE AVALIAÇÃO SEMANAL (WEEKLY REPORT)
// ==========================================================================
function getISOWeekString(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const padWeek = String(weekNo).padStart(2, '0');
    return `${d.getUTCFullYear()}-W${padWeek}`;
}

function getPreviousWeekDates(todayDate) {
    const dates = [];
    const d = new Date(todayDate);
    const day = d.getDay(); // 0 (domingo) a 6 (sábado)
    const diffToPrevMonday = (day === 0 ? 6 : day - 1) + 7;
    
    const prevMonday = new Date(d);
    prevMonday.setDate(d.getDate() - diffToPrevMonday);
    prevMonday.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(prevMonday);
        dayDate.setDate(prevMonday.getDate() + i);
        dates.push(localDateStr(dayDate));
    }
    
    const mondayDate = new Date(prevMonday);
    const sundayDate = new Date(prevMonday);
    sundayDate.setDate(prevMonday.getDate() + 6);
    
    return { dates, mondayDate, sundayDate };
}

function calculateWeeklyReportSync(history, quests, sideQuests, dates, prevWeekStr, mondayDate, sundayDate) {
    let completedQuests = 0;
    let totalQuests = 0;
    let perfectDays = 0;
    let goodDays = 0;
    let missedDays = 0;
    let activeDaysCount = 0;
    const completedTitles = [];
    
    dates.forEach(dStr => {
        const log = history[dStr];
        if (log) {
            activeDaysCount++;
            completedQuests += (log.count || 0);
            totalQuests += (log.total || 0);
            
            if (log.status === 'perfect') perfectDays++;
            else if (log.status === 'good') goodDays++;
            else if (log.status === 'missed' || log.status === 'bad') missedDays++;
            
            if (log.completedIds && Array.isArray(log.completedIds)) {
                completedTitles.push(...log.completedIds);
            }
        }
    });
    
    if (activeDaysCount === 0) {
        return { status: 'no_active_days' };
    }
    
    const survivalRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;
    
    const skillCounts = {};
    const allQuests = [...(quests || []), ...(sideQuests || [])];
    
    completedTitles.forEach(title => {
        const match = allQuests.find(q => q.title === title);
        const skill = match ? (match.skill || 'routine') : 'routine';
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    
    let topSkill = 'routine';
    let maxCount = 0;
    Object.entries(skillCounts).forEach(([skill, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topSkill = skill;
        }
    });
    
    const skillNames = {
        routine: 'Rotina',
        physical: 'Força Física',
        wisdom: 'Sabedoria/Estudos',
        mental: 'Saúde Mental',
        productivity: 'Produtividade',
        social: 'Social/Conexões'
    };
    const topSkillName = skillNames[topSkill] || 'Rotina';
    
    // ── SINTONIA: 100% baseada no Volume (Quantidade de Quests Concluídas) ──
    // Satura em 100 com 50 ou mais conclusões na semana.
    const score = Math.min(100, completedQuests * 2);

    // Tempo total de atividade concluída na semana (minutos), pela duração de cada conclusão.
    const totalMinutes = completedTitles.reduce((sum, title) => {
        const q = allQuests.find(x => x.title === title);
        return sum + (q && q.duration ? q.duration : 5);
    }, 0);

    // Faixas estilo Solo Leveling — S é raríssimo.
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

    const TIER_MAP = {
        S: { label: 'SINTONIA S', cls: 'rank-glow-s', gold: 160, xp: 300, desc: '"Desempenho lendário. Pouquíssimos alcançam este nível. Suas habilidades crescem em ritmo avassalador — o topo do mundo está ao seu alcance."' },
        A: { label: 'SINTONIA A', cls: 'rank-glow-a', gold: 100, xp: 200, desc: '"Desempenho formidável. O Sistema reconhece seu vigor e determinação. Continue assim e o rank S deixará de ser um sonho."' },
        B: { label: 'SINTONIA B', cls: 'rank-glow-b', gold: 60,  xp: 120, desc: '"Progresso sólido. Suas conquistas são constantes, mas a complacência é sua maior inimiga."' },
        C: { label: 'SINTONIA C', cls: 'rank-glow-c', gold: 30,  xp: 60,  desc: '"Na média. Você está sobrevivendo, mas o Sistema exige mais empenho e volume."' },
        D: { label: 'SINTONIA D', cls: 'rank-glow-d', gold: 10,  xp: 30,  desc: '"Desempenho fraco. Você está estagnando. O Sistema observa — e não tem paciência com a inércia."' },
        E: { label: 'SINTONIA E', cls: 'rank-glow-e', gold: 0,   xp: 0,   desc: '"Praticamente inerte. O Sistema mal registrou sua presença esta semana. Desperte, ou seja esquecido."' },
    };
    const tierData = TIER_MAP[tier];
    const rankLabel = tierData.label;
    const rankClass = tierData.cls;
    const goldReward = tierData.gold;
    const xpReward = tierData.xp;
    const verdictDesc = tierData.desc;
    
    const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const periodText = `PERÍODO DE AVALIAÇÃO: ${formatDate(mondayDate)} a ${formatDate(sundayDate)}`;
    
    return {
        status: 'success',
        survivalRate,
        score,
        totalMinutes,
        completedQuests,
        totalQuests,
        perfectDays,
        goodDays,
        missedDays,
        topSkillName,
        maxCount,
        rankLabel,
        rankClass,
        goldReward,
        xpReward,
        verdictDesc,
        periodText
    };
}

function renderWeeklyReportUI(data, prevWeekStr) {
    const periodEl = document.getElementById('report-period-text');
    const rateValEl = document.getElementById('report-rate-val');
    const rateBarEl = document.getElementById('report-rate-bar');
    const countEl = document.getElementById('report-quests-count');
    const perfEl = document.getElementById('report-days-perfect');
    const goodEl = document.getElementById('report-days-good');
    const missEl = document.getElementById('report-days-missed');
    const focusEl = document.getElementById('report-skill-focus');
    const rankEl = document.getElementById('report-verdict-rank');
    const descEl = document.getElementById('report-verdict-desc');
    const btn = document.getElementById('btn-claim-weekly-report');
    
    if (periodEl) periodEl.innerText = data.periodText;
    if (rateValEl) rateValEl.innerText = `${data.survivalRate}%`;
    if (rateBarEl) rateBarEl.style.width = `${data.survivalRate}%`;
    if (countEl) {
        const tm = data.totalMinutes || 0;
        const h = Math.floor(tm / 60), m = tm % 60;
        const timeStr = h > 0 ? `${h}h${m > 0 ? ' ' + m + 'min' : ''}` : `${m}min`;
        countEl.innerText = `Concluiu ${data.completedQuests} de ${data.totalQuests} missões · ${timeStr} de atividade`;
    }
    
    if (perfEl) perfEl.innerText = data.perfectDays;
    if (goodEl) goodEl.innerText = data.goodDays;
    if (missEl) missEl.innerText = data.missedDays;
    
    if (focusEl) {
        if (data.maxCount > 0) {
            focusEl.innerHTML = `Você focou majoritariamente na habilidade: <strong style="color: var(--neon-purple);">${data.topSkillName}</strong> (${data.maxCount} quests feitas).`;
        } else {
            focusEl.innerHTML = `Nenhuma missão realizada no período.`;
        }
    }
    
    if (rankEl) {
        rankEl.innerText = data.rankLabel;
        rankEl.className = `font-hud ${data.rankClass}`;
    }
    if (descEl) descEl.innerText = data.verdictDesc;
    
    if (btn) {
        btn.dataset.rewards = JSON.stringify({ gold: data.goldReward, xp: data.xpReward, rank: data.rankLabel });
        btn.dataset.week = prevWeekStr;
    }
    
    const modal = document.getElementById('modal-weekly-report');
    if (modal) modal.style.display = 'flex';
}

function checkAndShowWeeklyReport() {
    const today = new Date();

    // Avaliação semanal só na segunda-feira
    if (today.getDay() !== 1) return;

    const currentWeekStr = getISOWeekString(today);
    
    const prevWeekDate = new Date(today);
    prevWeekDate.setDate(today.getDate() - 7);
    const prevWeekStr = getISOWeekString(prevWeekDate);
    
    if (!gameState.history || Object.keys(gameState.history).length === 0) return;
    if (gameState.lastWeeklyReportYearWeek === prevWeekStr) return;
    
    const { dates, mondayDate, sundayDate } = getPreviousWeekDates(today);
    
    const useWorker = typeof(Worker) !== 'undefined' && window.location.protocol !== 'file:';
    
    if (useWorker) {
        let workerTerminated = false;
        const worker = new Worker('1.core/modules/report-worker.js');
        
        const timeout = setTimeout(() => {
            if (!workerTerminated) {
                console.warn('[Report Worker] Timeout atingido. Executando fallback na Main Thread.');
                worker.terminate();
                workerTerminated = true;
                runFallback();
            }
        }, 4000);
        
        worker.postMessage({
            history: gameState.history,
            quests: gameState.quests,
            sideQuests: gameState.sideQuests,
            dates: dates,
            prevWeekStr: prevWeekStr,
            mondayDateStr: mondayDate.toISOString(),
            sundayDateStr: sundayDate.toISOString()
        });
        
        worker.onmessage = function(e) {
            if (workerTerminated) return;
            clearTimeout(timeout);
            workerTerminated = true;
            worker.terminate();
            
            const msg = e.data;
            if (msg.status === 'no_active_days') {
                gameState.lastWeeklyReportYearWeek = msg.prevWeekStr;
                saveGameData();
                return;
            }
            if (msg.type === 'done') {
                renderWeeklyReportUI(msg.data, prevWeekStr);
            }
        };
        
        worker.onerror = function(err) {
            if (workerTerminated) return;
            clearTimeout(timeout);
            console.error('[Report Worker Error]', err);
            workerTerminated = true;
            worker.terminate();
            runFallback();
        };
    } else {
        runFallback();
    }
    
    function runFallback() {
        const result = calculateWeeklyReportSync(
            gameState.history,
            gameState.quests,
            gameState.sideQuests,
            dates,
            prevWeekStr,
            mondayDate,
            sundayDate
        );
        
        if (result.status === 'no_active_days') {
            gameState.lastWeeklyReportYearWeek = prevWeekStr;
            saveGameData();
            return;
        }
        
        if (result.status === 'success') {
            renderWeeklyReportUI(result, prevWeekStr);
        }
    }
}


function claimWeeklyReport(rewards, weekStr) {
    const gold = rewards.gold || 0;
    const xp = rewards.xp || 0;
    const rank = rewards.rank || 'SINTONIA D';
    
    if (xp > 0) {
        gameState.xp += xp;
        if (gameState.xp >= gameState.xpToNext) {
            gameState.level++;
            gameState.xp = gameState.xp - gameState.xpToNext;
            gameState.xpToNext = getXpToNextForLevel(gameState.level);
            syncQuestsByLevel();
            triggerLevelUpOverlay();
            checkAndActivateBossQuest();
        }
    }
    if (gold > 0) {
        gameState.gold = (gameState.gold || 0) + gold;
    }
    
    let systemMessage = `🔔 *NOTIFICAÇÃO DE AVALIAÇÃO DO SISTEMA*\n\nSemana avaliada: *${weekStr}*\nResultado obtido: *${rank}*\n\n`;
    if (gold > 0 || xp > 0) {
        systemMessage += `Recompensa resgatada:\n+${xp} XP · +${gold} Ouro 🪙`;
    } else {
        systemMessage += `Nenhuma recompensa concedida devido ao baixo desempenho.`;
    }
    
    if (typeof receiveMessage === 'function') {
        setTimeout(() => {
            receiveMessage(systemMessage);
            if (typeof showChatBadge === 'function') showChatBadge();
        }, 500);
    }
    
    gameState.lastWeeklyReportYearWeek = weekStr;
    saveGameData();
    updateUI();
    
    const modal = document.getElementById('modal-weekly-report');
    if (modal) modal.style.display = 'none';
    showSystemToast(`🏆 Avaliação finalizada. Recompensas recebidas.`);
}



export {
    getISOWeekString,
    getPreviousWeekDates,
    checkAndShowWeeklyReport,
    claimWeeklyReport
};
