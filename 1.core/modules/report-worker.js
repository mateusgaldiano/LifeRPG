// report-worker.js
//
// Worker = APENAS agregador. NÃO decide tier de Sintonia nem recompensa — essa
// fórmula vive num ÚNICO lugar: computeSintoniaTier() em weekly-report.js. O
// worker devolve os agregados brutos + completedTitles; a Main Thread calcula o
// totalMinutes e chama a fórmula unificada.

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

    // Entrada pode ser objeto denormalizado {id,title,skill,duration} (novo) ou
    // string com o título (legado). No legado, cai no cruzamento por título.
    const resolveSkill = (entry) => {
        if (entry && typeof entry === 'object') return entry.skill || 'routine';
        const m = allQuests.find(q => q.title === entry);
        return m ? (m.skill || 'routine') : 'routine';
    };

    completedTitles.forEach(entry => {
        const skill = resolveSkill(entry);
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

    const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const periodText = `PERÍODO DE AVALIAÇÃO: ${formatDate(mondayDate)} a ${formatDate(sundayDate)}`;

    // Devolve só os agregados brutos + completedTitles. A decisão de tier/recompensa
    // acontece na Main Thread (computeSintoniaTier em weekly-report.js).
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
            completedTitles,
            periodText
        }
    });
};
