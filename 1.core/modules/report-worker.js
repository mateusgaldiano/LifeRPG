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
    
    let rankLabel = 'SINTONIA D';
    let rankClass = 'rank-glow-d';
    let goldReward = 0;
    let xpReward = 0;
    let verdictDesc = '';
    
    if (survivalRate >= 90) {
        rankLabel = 'SINTONIA S';
        rankClass = 'rank-glow-s';
        goldReward = 80;
        xpReward = 150;
        verdictDesc = '"Desempenho lendário. Suas habilidades crescem em ritmo avassalador. O topo do mundo está ao seu alcance."';
    } else if (survivalRate >= 75) {
        rankLabel = 'SINTONIA A';
        rankClass = 'rank-glow-a';
        goldReward = 50;
        xpReward = 100;
        verdictDesc = '"Desempenho formidável. O Sistema reconhece seu vigor e determinação. Continue subindo de nível."';
    } else if (survivalRate >= 50) {
        rankLabel = 'SINTONIA B';
        rankClass = 'rank-glow-b';
        goldReward = 30;
        xpReward = 60;
        verdictDesc = '"Progresso aceitável. Suas conquistas são constantes, mas a complacência é sua maior inimiga."';
    } else if (survivalRate >= 30) {
        rankLabel = 'SINTONIA C';
        rankClass = 'rank-glow-c';
        goldReward = 15;
        xpReward = 30;
        verdictDesc = '"Abaixo das expectativas. Você está apenas sobrevivendo. O Sistema exige mais empenho e atitude."';
    } else {
        rankLabel = 'SINTONIA D';
        rankClass = 'rank-glow-d';
        goldReward = 0;
        xpReward = 0;
        verdictDesc = '"Desempenho patético. Você corre risco de estagnação. Desperte antes que seja tarde demais."';
    }
    
    const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const periodText = `PERÍODO DE AVALIAÇÃO: ${formatDate(mondayDate)} a ${formatDate(sundayDate)}`;
    
    self.postMessage({
        type: 'done',
        data: {
            survivalRate,
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
