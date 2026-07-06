// report-worker.js

self.onmessage = function(e) {
    const { history, quests, sideQuests, dates, prevWeekStr, mondayDateStr, sundayDateStr } = e.data;
    
    const mondayDate = new Date(mondayDateStr);
    const sundayDate = new Date(sundayDateStr);
    
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
        self.postMessage({ status: 'no_active_days', prevWeekStr });
        return;
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

    // Faixas estilo Solo Leveling — baseadas no volume absoluto concluído.
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
    
    self.postMessage({
        type: 'done',
        data: {
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
        }
    });
};
