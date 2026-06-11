/* ==========================================================================
   LIFERPG - CORE GAME LOGIC & COMPANION SYSTEM (2026)
   ========================================================================== */

// Banco de dados mestre de hábitos por nível do LifeRPG
const ALL_HABITS_DATABASE = [
    // Bracket 1 (Nível 1 ao 4)
    { id: 'q-db-acordar', baseId: 'q-acordar', title: 'Acordar Cedo', type: 'daily', icon: '🌅', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'routine' },
    { id: 'q-db-malhar', baseId: 'q-malhar', title: 'Treinar de Força / Corrida', type: 'daily', icon: '🏋️‍♂️', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'physical' },
    { id: 'q-db-ler', baseId: 'q-ler', title: 'Leitura (Mínimo 15min)', type: 'daily', icon: '📚', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'wisdom' },
    { id: 'q-db-meditar', baseId: 'q-meditar', title: 'Meditar (10 min)', type: 'daily', icon: '🧘', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'mental' },
    { id: 'q-db-agua', baseId: 'q-agua2', title: 'Beber Água (8 copos)', type: 'daily', icon: '💧', completed: false, xp: 20, gold: 10, target: 8, current: 0, minLevel: 1, skill: 'physical' },
    { id: 'q-db-familia', baseId: 'q-familia', title: 'Mandar mensagem/ligar para Família', type: 'daily', icon: '❤️', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'social' },
    
    // Bracket 2 (Nível 5 ao 9)
    { id: 'q-db-deepwork', baseId: 'q-estudo', title: 'Deep Work: 30min no projeto pessoal', type: 'daily', icon: '💻', completed: false, xp: 25, gold: 12, minLevel: 5, skill: 'productivity' },
    { id: 'q-db-estudo', baseId: 'q-estudo', title: 'Estudo: 30min na área profissional', type: 'daily', icon: '🧠', completed: false, xp: 25, gold: 12, minLevel: 5, skill: 'wisdom' },
    { id: 'q-db-checkin', baseId: null, title: 'Check-in Emocional no Diário', type: 'daily', icon: '📝', completed: false, xp: 15, gold: 8, minLevel: 5, skill: 'mental' },
    
    // Bracket 3 (Nível 10+)
    { id: 'q-db-estoico', baseId: null, title: 'Estoicismo: 10min de leitura filosófica', type: 'daily', icon: '🏛️', completed: false, xp: 20, gold: 10, minLevel: 10, skill: 'mental' },
    { id: 'q-db-producao', baseId: null, title: 'Produção: Criar 1 conteúdo autoral', type: 'daily', icon: '✍️', completed: false, xp: 25, gold: 12, minLevel: 10, skill: 'productivity' }
];

// Biblioteca mestre de 30 hábitos curados para a aba Biblioteca do modal
const HABIT_LIBRARY = [
    // Físico (Physical)
    { id: 'lib-corrida', title: 'Treino de Corrida de 20 min', icon: '🏃', difficulty: 'easy', skill: 'physical' },
    { id: 'lib-forca', title: 'Treino de Força (Calistenia/Academia)', icon: '🏋️‍♂️', difficulty: 'medium', skill: 'physical' },
    { id: 'lib-alongamento', title: 'Alongamento / Mobilidade (10 min)', icon: '🧘', difficulty: 'easy', skill: 'physical' },
    { id: 'lib-caminhada', title: 'Caminhada de 5.000 passos', icon: '🚶', difficulty: 'easy', skill: 'physical' },
    { id: 'lib-alimentacao', title: 'Refeição 100% limpa (Sem doces)', icon: '🥦', difficulty: 'medium', skill: 'physical' },

    // Mental (Mental)
    { id: 'lib-meditacao', title: 'Meditação Guiada (10 min)', icon: '🧘', difficulty: 'easy', skill: 'mental' },
    { id: 'lib-gratidao', title: 'Diário de Gratidão (3 coisas)', icon: '📝', difficulty: 'easy', skill: 'mental' },
    { id: 'lib-humor', title: 'Fazer check-in de humor', icon: '💭', difficulty: 'easy', skill: 'mental' },
    { id: 'lib-respiracao', title: 'Respiração controlada (5 min)', icon: '🌬️', difficulty: 'easy', skill: 'mental' },
    { id: 'lib-visualizacao', title: 'Visualização de metas', icon: '🔮', difficulty: 'easy', skill: 'mental' },

    // Foco / Produtividade (Productivity)
    { id: 'lib-deepwork', title: 'Deep Work (Foco total por 45 min)', icon: '💻', difficulty: 'medium', skill: 'productivity' },
    { id: 'lib-organizar', title: 'Organizar mesa de trabalho / Quarto', icon: '🧹', difficulty: 'easy', skill: 'productivity' },
    { id: 'lib-planejar', title: 'Planejar tarefas do dia seguinte', icon: '📅', difficulty: 'easy', skill: 'productivity' },
    { id: 'lib-revisar', title: 'Revisar objetivos semanais', icon: '🎯', difficulty: 'easy', skill: 'productivity' },
    { id: 'lib-estudar-ferramenta', title: 'Estudar nova ferramenta (30 min)', icon: '🌐', difficulty: 'medium', skill: 'productivity' },

    // Saber / Sabedoria (Wisdom)
    { id: 'lib-ler-livro', title: 'Ler 10 páginas de um livro', icon: '📚', difficulty: 'easy', skill: 'wisdom' },
    { id: 'lib-aula-podcast', title: 'Assistir 1 aula/podcast educativo', icon: '🎧', difficulty: 'easy', skill: 'wisdom' },
    { id: 'lib-escrita-criativa', title: 'Praticar escrita criativa (15 min)', icon: '✍️', difficulty: 'easy', skill: 'wisdom' },
    { id: 'lib-curso-online', title: 'Fazer um curso online (30 min)', icon: '🧠', difficulty: 'medium', skill: 'wisdom' },
    { id: 'lib-logica-xadrez', title: 'Resolver 3 problemas de xadrez', icon: '🧩', difficulty: 'easy', skill: 'wisdom' },

    // Rotina (Routine)
    { id: 'lib-sem-celular', title: 'Sem celular ao acordar por 30 min', icon: '🚫', difficulty: 'medium', skill: 'routine' },
    { id: 'lib-cama', title: 'Arrumei a cama ao levantar', icon: '🛏️', difficulty: 'easy', skill: 'routine' },
    { id: 'lib-dormir-cedo', title: 'Dormir antes das 23h', icon: '💤', difficulty: 'medium', skill: 'routine' },
    { id: 'lib-skincare', title: 'Skincare matinal / noturno', icon: '🧴', difficulty: 'easy', skill: 'routine' },
    { id: 'lib-preparar-dia', title: 'Preparar roupas para amanhã', icon: '💼', difficulty: 'easy', skill: 'routine' },

    // Social (Social)
    { id: 'lib-familia-msg', title: 'Mensagem carinhosa para família', icon: '❤️', difficulty: 'easy', skill: 'social' },
    { id: 'lib-amigo-ligar', title: 'Ligar para um amigo antigo', icon: '📞', difficulty: 'medium', skill: 'social' },
    { id: 'lib-escuta-ativa', title: 'Praticar escuta ativa', icon: '👂', difficulty: 'easy', skill: 'social' },
    { id: 'lib-ajudar-alguem', title: 'Ajudar alguém de forma altruísta', icon: '🤝', difficulty: 'medium', skill: 'social' },
    { id: 'lib-evento-grupo', title: 'Participar de grupo comunitário', icon: '👥', difficulty: 'hard', skill: 'social' }
];

// 📆 Utilitário de Data Local (timezone-safe) 📆
// Gera um string de data no formato YYYY-MM-DD baseado no fuso do dispositivo,
// evitando o bug clássico do toDateString() que reseta ao viajar entre fusos.
function localDateStr(d) {
    const dt = d || new Date();
    const y  = dt.getFullYear();
    const m  = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Estado Global do Jogo
let gameState = {
    level: 1,
    xp: 0,
    xpToNext: 100,
    gold: 0,
    streak: 0,
    history: {},
    shields: 0,              // escudos ativos (0-3)
    consecutiveStreak7Days: 0, // dias acumulados rumo ao próximo escudo
    consecutiveMisses: 0,       // contador de dias não concluídos
    bossQuest: null,            // boss quest ativa { id, completed, progress }
    activeDungeon: null,    // dungeon ativa com prazo de 48h
    weeklyBoss: null,       // { spawnedAt, expiresAt, hp, defeated, penaltyApplied }
    lastCheckedDate: null,      // controle diário
    unlockedAchievements: [],   // troféus desbloqueados
    quests: [], // Populado dinamicamente com base no nível
    sideQuests: [],
    rewards: [
        { id: 'r-serie', title: 'Assistir 1 Hora de Série', cost: 35, icon: '📺' },
        { id: 'r-cheat', title: 'Refeição Livre / Doce', cost: 80, icon: '🍔' },
        { id: 'r-game', title: 'Jogar Videogame por 1h', cost: 45, icon: '🎮' }
    ],
    skills: {
        physical: { level: 1, xp: 0, xpToNext: 5 },
        mental: { level: 1, xp: 0, xpToNext: 5 },
        productivity: { level: 1, xp: 0, xpToNext: 5 },
        social: { level: 1, xp: 0, xpToNext: 5 },
        wisdom: { level: 1, xp: 0, xpToNext: 5 },
        routine: { level: 1, xp: 0, xpToNext: 5 }
    },
    messages: [],
    history: {},
    buffs: { autoHeal: false, doubleXp: false, shieldDays: 0 },
    inventory: { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' },
    notificationTimes: { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 },
    lastWeeklyReportYearWeek: ""
};

// Banco de Frases de Impacto
const IMPACT_QUOTES = [
    { author: "David Goggins", text: "They don't know me, son!" },
    { author: "David Goggins", text: "Who's gonna carry the boats and the logs?" },
    { author: "David Goggins", text: "Stay hard!" },
    { author: "Kobe Bryant", text: "I have nothing in common with lazy people who blame others for their lack of success." },
    { author: "Kobe Bryant", text: "Dedication sees dreams come true." },
    { author: "Madara Uchiha", text: "Wake up to reality! Nothing ever goes as planned in this world." },
    { author: "Pain", text: "Those who do not understand true pain can never understand true peace." },
    { author: "Rock Lee", text: "A drop of sweat is a drop of effort! I will not lose!" },
    { author: "Might Guy", text: "It is not always possible to do what we want to do, but it is important to believe in something before you actually do it." },
    { author: "Tyrion Lannister", text: "Never forget what you are, the rest of the world will not. Wear it like armor and it can never be used to hurt you." },
    { author: "Tywin Lannister", text: "A lion doesn't concern himself with the opinions of a sheep." },
    { author: "Eminem", text: "You only get one shot, do not miss your chance to blow." },
    { author: "Cristiano Ronaldo", text: "Talent without working hard is nothing." },
    { author: "Harvey Specter", text: "I don't have dreams, I have goals." },
    { author: "Clóvis de Barros", text: "A vida é uma só, você vai vivê-la como um espectador ou como protagonista?" },
    { author: "Tony Robbins", text: "If you do what you've always done, you'll get what you've always gotten." },
    { author: "Michael Jordan", text: "I can accept failure, everyone fails at something. But I can't accept not trying." },
    { author: "Gandalf", text: "All we have to decide is what to do with the time that is given us." },
    { author: "Julius Caesar", text: "Burn the boats." },
    { author: "Jim Rohn", text: "We must all suffer one of two things: the pain of discipline or the pain of regret." },
    { author: "Seneca", text: "It is not that we have a short time to live, but that we waste a lot of it." },
    { author: "Miyamoto Musashi", text: "There is nothing outside of yourself that can ever enable you to get better, stronger, richer, quicker, or smarter." },
    { author: "Levi Ackerman", text: "The only thing we're allowed to do is believe that we won't regret the choice we made." },
    { author: "Marcus Aurelius", text: "You have power over your mind - not outside events. Realize this, and you will find strength." },
    { author: "Joe Rogan", text: "Be the hero of your own movie." },
    { author: "Yoda", text: "Do or do not. There is no try." }
];

//  Sistema de RANK (Solo Leveling) 
const RANK_THRESHOLDS = [
    { min: 30, rank: 'RANK S', css: 'rank-s' },
    { min: 20, rank: 'RANK A', css: 'rank-a' },
    { min: 15, rank: 'RANK B', css: 'rank-b' },
    { min: 10, rank: 'RANK C', css: 'rank-c' },
    { min: 5,  rank: 'RANK D', css: 'rank-d' },
    { min: 1,  rank: 'RANK E', css: 'rank-e' }
];

//  Boss Quests por Rank Up 
const BOSS_QUESTS = {
    'e-to-d': {
        id: 'e-to-d',
        title: 'Despertar do Guerreiro',
        description: 'Complete todas as suas missões diárias por 3 dias seguidos.',
        rankFrom: 'RANK E', rankTo: 'RANK D',
        xpReward: 150, goldReward: 50,
        check: () => (gameState.streak || 0) >= 3,
        progress: () => `${Math.min(gameState.streak || 0, 3)}/3 dias de streak`
    },
    'd-to-c': {
        id: 'd-to-c',
        title: 'Batismo do Foco',
        description: 'Complete 5 side quests (missões avulsas).',
        rankFrom: 'RANK D', rankTo: 'RANK C',
        xpReward: 250, goldReward: 80,
        check: () => (gameState.bossQuest?.sideQuestsCompleted || 0) >= 5,
        progress: () => `${gameState.bossQuest?.sideQuestsCompleted || 0}/5 side quests`
    },
    'c-to-b': {
        id: 'c-to-b',
        title: 'Ascensão do Atributo',
        description: 'Eleve pelo menos 4 das suas 6 skills para o Nível 3.',
        rankFrom: 'RANK C', rankTo: 'RANK B',
        xpReward: 400, goldReward: 120,
        check: () => {
            const skills = gameState.skills || {};
            const lv3count = Object.values(skills).filter(s => s.level >= 3).length;
            return lv3count >= 4;
        },
        progress: () => {
            const skills = gameState.skills || {};
            const lv3count = Object.values(skills).filter(s => s.level >= 3).length;
            return `${Math.min(lv3count, 4)}/4 skills em LV3+`;
        }
    },
    'b-to-a': {
        id: 'b-to-a',
        title: 'Vigília do Estoico',
        description: 'Mantenha uma sequência de 14 dias consecutivos.',
        rankFrom: 'RANK B', rankTo: 'RANK A',
        xpReward: 600, goldReward: 180,
        check: () => (gameState.streak || 0) >= 14,
        progress: () => `${Math.min(gameState.streak || 0, 14)}/14 dias de streak`
    },
    'a-to-s': {
        id: 'a-to-s',
        title: 'O Sistema Completo',
        description: 'Eleve TODAS as 6 skills para o Nível 5 simultaneamente.',
        rankFrom: 'RANK A', rankTo: 'RANK S',
        xpReward: 1000, goldReward: 300,
        check: () => {
            const skills = gameState.skills || {};
            return Object.values(skills).every(s => s.level >= 5);
        },
        progress: () => {
            const skills = gameState.skills || {};
            const lv5count = Object.values(skills).filter(s => s.level >= 5).length;
            return `${lv5count}/6 skills em LV5+`;
        }
    }
};

// ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ Banco de Dungeons ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬
const DUNGEON_POOL = [
    { title: 'Treino Solitário',   skill: 'physical',     xp: 80,  gold: 40 },
    { title: 'Hora do Silêncio',   skill: 'mental',       xp: 75,  gold: 35 },
    { title: 'Projeto Expresso',   skill: 'productivity', xp: 90,  gold: 45 },
    { title: 'Conexão Rara',       skill: 'social',       xp: 70,  gold: 35 },
    { title: 'Leitura Profunda',   skill: 'wisdom',       xp: 80,  gold: 40 },
    { title: 'Ritual Perfeito',    skill: 'routine',      xp: 75,  gold: 38 },
    { title: 'Corrida do Dragão',  skill: 'physical',     xp: 100, gold: 50 },
    { title: 'Meditação Extrema',  skill: 'mental',       xp: 95,  gold: 48 },
    { title: 'Sprint de Foco',     skill: 'productivity', xp: 110, gold: 55 },
    { title: 'Aliança Inesperada', skill: 'social',       xp: 85,  gold: 42 },
    { title: 'Tomo Proibido',      skill: 'wisdom',       xp: 95,  gold: 48 },
    { title: 'Sequência Sagrada',  skill: 'routine',      xp: 90,  gold: 45 },
];

const DUNGEON_DURATION_MS = 48 * 60 * 60 * 1000; // 48 horas em ms

// Requisito: pelo menos 1 skill em LV3+
function hasSkillLV3() {
    const skills = gameState.skills || {};
    return Object.values(skills).some(s => s.level >= 3);
}

// Gera uma nova dungeon aleatória
function spawnDungeon() {
    if (!hasSkillLV3()) return;
    if (gameState.activeDungeon && !gameState.activeDungeon.completed) return;

    const pick = DUNGEON_POOL[Math.floor(Math.random() * DUNGEON_POOL.length)];
    gameState.activeDungeon = {
        id: 'dungeon-' + Date.now(),
        title: pick.title,
        skill: pick.skill,
        xp: pick.xp,
        gold: pick.gold,
        expiresAt: Date.now() + DUNGEON_DURATION_MS,
        completed: false
    };
    saveGameData();
    setTimeout(() => {
        showSystemToast(`⚔️ *DUNGEON DISPONÍVEL!* Uma missão especial surgiu: *"${pick.title}"*\n\nRecompensa: +${pick.xp} XP · +${pick.gold} 💰\n⏳ Prazo: 48 horas. Conclua antes que expire.`);

    }, 1000);
}

// Verifica e aplica expiração da dungeon ativa
function checkDungeonExpiry() {
    const d = gameState.activeDungeon;
    if (!d || d.completed) return;
    if (Date.now() >= d.expiresAt) {
        const title = d.title;
        gameState.activeDungeon = null;
        gameState.xp = Math.max(0, (gameState.xp || 0) - 5);
        saveGameData();
        setTimeout(() => {
            showSystemToast(`💀 *DUNGEON EXPIRADA.* A missão *"${title}"* foi abandonada. O Sistema cobrou o preço: −5 XP.`);

        }, 500);
    }
}

// Conclui a dungeon ativa
function completeDungeon() {
    const d = gameState.activeDungeon;
    if (!d || d.completed) return;

    d.completed = true;
    let xpGain = d.xp;
    let goldGain = d.gold;

    // Verifica Double XP Buff
    if (gameState.buffs && gameState.buffs.doubleXp) {
        xpGain *= 2;
        gameState.buffs.doubleXp = false;
    }

    gameState.xp   = (gameState.xp   || 0) + xpGain;
    gameState.gold = (gameState.gold || 0) + goldGain;
    gameState._dungeonsCompleted = (gameState._dungeonsCompleted || 0) + 1;

    // Conta para boss quest d-to-c
    if (gameState.bossQuest?.id === 'd-to-c' && !gameState.bossQuest.completed) {
        gameState.bossQuest.sideQuestsCompleted = (gameState.bossQuest.sideQuestsCompleted || 0) + 1;
    }

    addSkillXP(d.skill);
    checkAndActivateBossQuest();
    saveGameData();
    updateUI();

    setTimeout(() => {
        showSystemToast(`🏆 *DUNGEON CONCLUÍDA!* Você completou *"${d.title}"*!\n\n+${xpGain} XP · +${goldGain} 💰 concedidos. Iroh está orgulhoso.`);
    }, 800);

    renderQuests();
}

//  Weekly Boss 
const WEEKLY_BOSS_DURATION_MS = 72 * 60 * 60 * 1000; // 72h

function spawnWeeklyBoss() {
    if (gameState.weeklyBoss && !gameState.weeklyBoss.defeated && Date.now() < gameState.weeklyBoss.expiresAt) return;

    gameState.weeklyBoss = {
        spawnedAt: Date.now(),
        expiresAt: Date.now() + WEEKLY_BOSS_DURATION_MS,
        hp: 3,
        defeated: false,
        penaltyApplied: false
    };
    saveGameData();
    showWeeklyBossModal();
}

function checkWeeklyBossExpiry() {
    const wb = gameState.weeklyBoss;
    if (!wb || wb.defeated || wb.penaltyApplied) return;
    if (Date.now() >= wb.expiresAt) {
        wb.penaltyApplied = true;
        const goldLost = Math.floor((gameState.gold || 0) * 0.20);
        gameState.gold = Math.max(0, (gameState.gold || 0) - goldLost);
        gameState.xp   = Math.max(0, (gameState.xp   || 0) - 30);
        saveGameData();
        updateUI();
        setTimeout(() => {
            receiveMessage(`💀 *O CHEFE DA SEMANA NÃO FOI DERROTADO.*\n\nO Sistema cobrou o preço da sua fraqueza: -${goldLost} Ouro e -30 XP foram consumidos. Que isso sirva de lição.`);
            showChatBadge();
        }, 600);
    }
}

function hitWeeklyBoss() {
    const wb = gameState.weeklyBoss;
    if (!wb || wb.defeated || wb.penaltyApplied || Date.now() >= wb.expiresAt) return;

    wb.hp = Math.max(0, wb.hp - 1);

    if (wb.hp <= 0) {
        wb.defeated = true;
        gameState.xp   = (gameState.xp   || 0) + 150;
        gameState.gold = (gameState.gold || 0) + 80;
        saveGameData();
        updateUI();
        renderWeeklyBoss();
        setTimeout(() => {
            receiveMessage(`🏆 *CHEFE SEMANAL DERROTADO!*\n\nVocê enfrentou o Sistema e venceu. Recompensa: +150 XP e +80 Ouro. O streak continua protegido.`);
            showChatBadge();
        }, 800);
    } else {
        saveGameData();
        renderWeeklyBoss();
    }
}

function showWeeklyBossModal() {
    const modal = document.getElementById('weekly-boss-modal');
    if (modal) modal.style.display = 'flex';
}

function renderWeeklyBoss() {
    const container = document.getElementById('weekly-boss-container');
    if (!container) return;

    const wb = gameState.weeklyBoss;

    if (!wb || wb.defeated || wb.penaltyApplied || Date.now() >= wb.expiresAt) {
        container.style.display = 'none';
        return;
    }

    const remMs  = Math.max(0, wb.expiresAt - Date.now());
    const remH   = Math.floor(remMs / 3600000);
    const remMin = Math.floor((remMs % 3600000) / 60000);
    const hpPct  = (wb.hp / 3) * 100;
    const urgent = remMs < 12 * 3600000;

    container.style.display = 'block';
    container.innerHTML = `
        <div class="weekly-boss-card${urgent ? ' boss-urgent' : ''}">
            <div class="boss-header">
                <span class="boss-icon">💀</span>
                <div class="boss-title-wrap">
                    <span class="boss-title">CHEFE DA SEMANA</span>
                    <span class="boss-timer${urgent ? ' boss-timer-urgent' : ''}">⏳ ${remH}h ${remMin}min restantes</span>
                </div>
                <span class="boss-badge">BOSS</span>
            </div>
            <div class="boss-desc">Derrote completando 3 dias perfeitos (100% das dailies)</div>
            <div class="boss-hp-bar-track">
                <div class="boss-hp-bar-fill" style="width: ${hpPct}%"></div>
            </div>
            <div class="boss-hp-label">${wb.hp}/3 HP restantes</div>
            <div class="boss-rewards-preview">Recompensa: +150 XP · +80 💰 · Streak protegido</div>
        </div>
    `;
}


// Mapeia nível mínimo do rank atual → boss quest a ser ativada
const BOSS_QUEST_BY_LEVEL = {
    5:  'e-to-d',
    10: 'd-to-c',
    15: 'c-to-b',
    20: 'b-to-a',
    30: 'a-to-s'
};

function getRankForLevel(level) {
    for (const r of RANK_THRESHOLDS) {
        if (level >= r.min) return r;
    }
    return RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
}

// Verifica se deve ativar ou concluir uma Boss Quest
function checkAndActivateBossQuest() {
    const level = gameState.level;

    // Verifica se o nível atual tem uma boss quest associada
    const bossId = BOSS_QUEST_BY_LEVEL[level];
    if (bossId && (!gameState.bossQuest || gameState.bossQuest.id !== bossId)) {
        // Ativa a nova Boss Quest
        gameState.bossQuest = {
            id: bossId,
            completed: false,
            sideQuestsCompleted: 0
        };
        const bq = BOSS_QUESTS[bossId];
        setTimeout(() => {
            showSystemToast(`⚔️ *BOSS QUEST DESBLOQUEADA!*\n\n*${bq.title}*\n_${bq.description}_\n\nRecompensa: +${bq.xpReward} XP · +${bq.goldReward} 💰\n\nProgresso atual: ${bq.progress()}`);

        }, 2000);
    }

    // Verifica se a boss quest ativa foi concluída
    if (gameState.bossQuest && !gameState.bossQuest.completed) {
        const bq = BOSS_QUESTS[gameState.bossQuest.id];
        if (bq && bq.check()) {
            gameState.bossQuest.completed = true;
            gameState.xp += bq.xpReward;
            gameState.gold += bq.goldReward;
            setTimeout(() => {
                showSystemToast(`🏆 *BOSS QUEST CONCLUÍDA!*\n\n*${bq.title}* foi completada!\n\n_"${getBossVictoryQuote(bq.id)}"_\n\n+${bq.xpReward} XP · +${bq.goldReward} 💰 concedidos. ${bq.rankFrom} → ${bq.rankTo} desbloqueado por mérito!`);

            }, 1500);
            saveGameData();
            updateUI();
        }
    }
}

// Bordão do Iroh ao concluir cada Boss Quest
function getBossVictoryQuote(bossId) {
    const quotes = {
        'e-to-d': 'Três dias. Simples assim. E você provou que tem o que é preciso para continuar.',
        'd-to-c': 'Missões extras revelam o caráter. Você foi além do mínimo — isso é tudo.',
        'c-to-b': 'Quatro atributos forjados. Não é sorte. É consistência transformada em força.',
        'b-to-a': 'Catorze dias sem parar. Isso não é disciplina — isso é identidade.',
        'a-to-s': 'O Sistema Encarnado. Você não segue mais o método — você virou o método.'
    };
    return quotes[bossId] || 'A vitória pertence a quem persiste.';
}

// ── Mapeamento 6 Skills → 3 Atributos Arise ─────────────────────────────────
function computeAttributes() {
    const s = gameState.skills || {};
    const get = (k) => s[k] ? (s[k].level - 1) + (s[k].xp / (s[k].xpToNext || 5)) : 0;

    const willpower = (get('mental') + get('routine')) / 2;
    const intellect = (get('wisdom') + get('productivity')) / 2;
    const health    = (get('physical') + get('social')) / 2;

    const maxVal = 5;
    return {
        willpower: { val: willpower, level: Math.max(1, Math.round(willpower)), pct: Math.min(willpower / maxVal, 1) },
        intellect: { val: intellect, level: Math.max(1, Math.round(intellect)), pct: Math.min(intellect / maxVal, 1) },
        health:    { val: health,    level: Math.max(1, Math.round(health)),    pct: Math.min(health    / maxVal, 1) }
    };
}

function computePlayerTitle(attrs) {
    const w = attrs.willpower.val;
    const i = attrs.intellect.val;
    const h = attrs.health.val;

    if (w < 0.2 && i < 0.2 && h < 0.2) return "Novato";

    const max = Math.max(w, i, h);
    const epsilon = 0.05;
    const isW = Math.abs(w - max) < epsilon;
    const isI = Math.abs(i - max) < epsilon;
    const isH = Math.abs(h - max) < epsilon;

    if (isW && isI && isH) return "Desperto";
    if (isW && isH) return "Monge-Atleta";
    if (isI && isH) return "Sábio Guerreiro";
    if (isW && isI) return "Mestre da Mente";

    if (isH) return "Guerreiro";
    if (isI) return "Estrategista";
    if (isW) return "Estoico";

    return "Desperto";
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

//  Conquistas (Achievements) 
const ACHIEVEMENTS_DEFS = [
    // CONSISTÊNCIA
    {
        id: 'first_quest', category: 'consistência',
        title: 'O Início da Jornada', desc: 'Conclua sua primeira Missão',
        icon: '⚔️', rewardGold: 10, rarity: 'comum',
        check: (gs) => gs.quests.some(q => q.completed) || (gs.sideQuests && gs.sideQuests.some(q => q.completed)),
        progress: (gs) => ({ cur: Math.min(gs.quests.filter(q => q.completed).length + (gs.sideQuests || []).filter(q => q.completed).length, 1), max: 1 })
    },
    {
        id: 'streak_3', category: 'consistência',
        title: 'Primeiros Passos', desc: 'Atinja um Streak de 3 dias',
        icon: '🔥', rewardGold: 15, rarity: 'comum',
        check: (gs) => gs.streak >= 3,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 3), max: 3 })
    },
    {
        id: 'streak_7', category: 'consistência',
        title: 'Sangue Frio', desc: 'Atinja um Streak de 7 dias',
        icon: '🔥', rewardGold: 25, rarity: 'incomum',
        check: (gs) => gs.streak >= 7,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 7), max: 7 })
    },
    {
        id: 'streak_30', category: 'consistência',
        title: 'Disciplina de Ferro', desc: 'Atinja um Streak de 30 dias',
        icon: '🛡️', rewardGold: 100, rarity: 'raro',
        check: (gs) => gs.streak >= 30,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 30), max: 30 })
    },
    {
        id: 'streak_100', category: 'consistência',
        title: 'A Lenda Não Para', desc: 'Atinja um Streak de 100 dias',
        icon: '👑', rewardGold: 400, rarity: 'lendário',
        check: (gs) => gs.streak >= 100,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 100), max: 100 })
    },
    // RANK
    {
        id: 'rank_d', category: 'rank',
        title: 'O Despertar', desc: 'Chegue ao Rank D (Nível 5)',
        icon: '🌅', rewardGold: 30, rarity: 'incomum',
        check: (gs) => gs.level >= 5,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 5), max: 5 })
    },
    {
        id: 'rank_c', category: 'rank',
        title: 'Ascensão', desc: 'Chegue ao Rank C (Nível 10)',
        icon: '🌟', rewardGold: 80, rarity: 'raro',
        check: (gs) => gs.level >= 10,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 10), max: 10 })
    },
    {
        id: 'rank_s', category: 'rank',
        title: 'Caçador de Rank', desc: 'Chegue ao Rank S (Nível 30)',
        icon: '👑', rewardGold: 500, rarity: 'lendário',
        check: (gs) => gs.level >= 30,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 30), max: 30 })
    },
    // HABILIDADES
    {
        id: 'skill_3', category: 'habilidades',
        title: 'Especialista Iniciante', desc: 'Alcance o Nível 3 em qualquer Skill',
        icon: '✨', rewardGold: 20, rarity: 'comum',
        check: (gs) => Object.values(gs.skills || {}).some(s => s.level >= 3),
        progress: (gs) => ({ cur: Math.min(Math.max(...Object.values(gs.skills || {1:1}).map(s => s.level || 1)), 3), max: 3 })
    },
    {
        id: 'skill_5', category: 'habilidades',
        title: 'Especialista', desc: 'Alcance o Nível 5 em qualquer Skill',
        icon: '⭐', rewardGold: 50, rarity: 'raro',
        check: (gs) => Object.values(gs.skills || {}).some(s => s.level >= 5),
        progress: (gs) => ({ cur: Math.min(Math.max(...Object.values(gs.skills || {1:1}).map(s => s.level || 1)), 5), max: 5 })
    },
    {
        id: 'all_skills_3', category: 'habilidades',
        title: 'Mestre do Sistema', desc: 'Alcance o Nível 3 em TODAS as Skills',
        icon: '💠', rewardGold: 150, rarity: 'lendário',
        check: (gs) => {
            const reqs = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
            return reqs.every(k => gs.skills && gs.skills[k] && gs.skills[k].level >= 3);
        },
        progress: (gs) => {
            const reqs = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
            return { cur: reqs.filter(k => gs.skills && gs.skills[k] && gs.skills[k].level >= 3).length, max: 6 };
        }
    },
    // MASMORRAS
    {
        id: 'dungeon_1', category: 'masmorras',
        title: 'Primeiro Sangue', desc: 'Complete 1 Dungeon',
        icon: '💀', rewardGold: 20, rarity: 'comum',
        check: (gs) => (gs._dungeonsCompleted || 0) >= 1,
        progress: (gs) => ({ cur: Math.min(gs._dungeonsCompleted || 0, 1), max: 1 })
    },
    {
        id: 'dungeon_5', category: 'masmorras',
        title: 'Caçador de Dungeons', desc: 'Complete 5 Dungeons',
        icon: '⚔️', rewardGold: 80, rarity: 'raro',
        check: (gs) => (gs._dungeonsCompleted || 0) >= 5,
        progress: (gs) => ({ cur: Math.min(gs._dungeonsCompleted || 0, 5), max: 5 })
    },
    {
        id: 'boss_defeated', category: 'masmorras',
        title: 'Mata-Boss', desc: 'Derrote 1 Chefe Semanal',
        icon: '🏆', rewardGold: 100, rarity: 'raro',
        check: (gs) => gs.weeklyBoss && gs.weeklyBoss.defeated,
        progress: (gs) => ({ cur: gs.weeklyBoss?.defeated ? 1 : 0, max: 1 })
    },
];

function checkAchievements() {
    if (!gameState.unlockedAchievements) gameState.unlockedAchievements = [];
    let newlyUnlocked = false;

    ACHIEVEMENTS_DEFS.forEach(ach => {
        if (!gameState.unlockedAchievements.includes(ach.id)) {
            if (ach.check(gameState)) {
                gameState.unlockedAchievements.push(ach.id);
                gameState.gold = (gameState.gold || 0) + ach.rewardGold;
                newlyUnlocked = true;
                setTimeout(() => {
                    showSystemToast(`🏆 *CONQUISTA DESBLOQUEADA!* Você obteve o troféu *"${ach.title}"*. Recompensa: +${ach.rewardGold} 💰.`);

                    // Dispara o overlay comemorativo
                    const achOverlay = document.getElementById('achievement-unlocked-overlay');
                    const achTitle = document.getElementById('achievement-unlocked-title');
                    const achRewards = document.getElementById('achievement-unlocked-rewards');
                    if (achOverlay && achTitle && achRewards) {
                        achTitle.innerText = ach.title;
                        achRewards.innerText = `+${ach.rewardGold} OURO`;
                        achOverlay.classList.add('show');
                        setTimeout(() => achOverlay.classList.remove('show'), 2200);
                    }
                }, 1500);
            }
        }
    });

    if (newlyUnlocked) {
        renderAchievements();
        // saveGameData já é chamado em todos os pontos que alteram estado.
    }
}

function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const unlockedIds = gameState.unlockedAchievements || [];
    const totalUnlocked = unlockedIds.length;
    const totalAchs = ACHIEVEMENTS_DEFS.length;

    // Agrupa por categoria
    const categories = {
        'consistência': { label: 'CONSISTÊNCIA', icon: '🔥' },
        'rank':         { label: 'RANK & NÍVEL', icon: '🌟' },
        'habilidades':  { label: 'HABILIDADES', icon: '✨' },
        'masmorras':    { label: 'MASMORRAS & BOSS', icon: '⚔️' }
    };

    const rarityColors = {
        'comum':     { bg: 'rgba(120,120,140,0.1)', border: 'rgba(120,120,140,0.3)', label: 'rgba(170,170,190,0.7)' },
        'incomum':   { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.35)',  label: 'rgba(34,197,94,0.8)' },
        'raro':      { bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.4)',  label: 'rgba(129,140,248,0.9)' },
        'lendário':  { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.5)',  label: 'rgba(251,191,36,1)' }
    };

    let html = `
        <div class="ach-summary-bar">
            <span class="ach-summary-count">${totalUnlocked}<span class="ach-summary-total">/${totalAchs}</span></span>
            <span class="ach-summary-label">CONQUISTAS DESBLOQUEADAS</span>
            <div class="ach-summary-track"><div class="ach-summary-fill" style="width:${(totalUnlocked/totalAchs*100).toFixed(0)}%"></div></div>
        </div>
    `;

    Object.entries(categories).forEach(([catKey, catInfo]) => {
        const catAchs = ACHIEVEMENTS_DEFS.filter(a => a.category === catKey);
        const catUnlocked = catAchs.filter(a => unlockedIds.includes(a.id)).length;

        html += `<div class="ach-category">
            <div class="ach-category-header">
                <span class="ach-category-icon">${catInfo.icon}</span>
                <span class="ach-category-label">${catInfo.label}</span>
                <span class="ach-category-count">${catUnlocked}/${catAchs.length}</span>
            </div>
            <div class="ach-cards-row">`;

        catAchs.forEach(ach => {
            const isUnlocked = unlockedIds.includes(ach.id);
            const prog = ach.progress ? ach.progress(gameState) : null;
            const progPct = prog ? Math.min(100, Math.round((prog.cur / prog.max) * 100)) : 0;
            const rc = rarityColors[ach.rarity] || rarityColors['comum'];

            html += `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}" style="
                ${isUnlocked ? `background:${rc.bg}; border-color:${rc.border};` : ''}
            ">
                <div class="ach-icon">${isUnlocked ? ach.icon : '🔒'}</div>
                <div class="ach-title">${ach.title}</div>
                <div class="ach-desc">${ach.desc}</div>
                ${isUnlocked
                    ? `<div class="ach-rarity-badge" style="color:${rc.label}; border-color:${rc.border}">${ach.rarity.toUpperCase()}</div>
                       <div class="ach-reward">+${ach.rewardGold} 💰</div>`
                    : prog ? `<div class="ach-prog-track"><div class="ach-prog-fill" style="width:${progPct}%"></div></div>
                              <div class="ach-prog-label">${prog.cur}/${prog.max}</div>` : ''
                }
            </div>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}

//  Rank Perks 
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

// ==========================================================================
// RADAR CHART — declarada no topo para garantir escopo global total
// ==========================================================================
function drawRadarChart() {
    try {
        const canvas = document.getElementById('skills-radar-chart');
        if (!canvas) { console.error('[Radar] canvas não encontrado!'); return; }

        // Força display:block via JS (algo sobrescrevia para 'inline')
        canvas.width  = 260;
        canvas.height = 260;
        canvas.style.display = 'block';
        canvas.style.margin  = '0 auto';

        const ctx = canvas.getContext('2d');
        if (!ctx) { console.error('[Radar] contexto 2d nulo!'); return; }

        const W = 260, H = 260;
        const cx = W / 2, cy = H / 2;
        const maxR = 72;

        ctx.clearRect(0, 0, W, H);

        const skillTypes  = ['physical','mental','productivity','social','wisdom','routine'];
        const skillLabels = {
            physical:'FÍSICO', mental:'MENTAL', productivity:'FOCO',
            social:'CONEXÃO', wisdom:'SABEDORIA', routine:'ROTINA'
        };
        const N = skillTypes.length;

        // Helper: raio e skill
        const getR = (type) => {
            const skill = (gameState.skills && gameState.skills[type])
                || { level: 1, xp: 0, xpToNext: 5 };
            const val  = (skill.level - 1) + (skill.xp / (skill.xpToNext || 5));
            const frac = Math.min(val / 5, 1.0);
            // Raio mínimo de 4px apenas para manter o marcador visível no vértice
            // Escala real começa do zero
            const minR = 4;
            return { r: minR + (frac * (maxR - minR)), skill };
        };

        // 1. Grades concêntricas
        for (let g = 1; g <= 5; g++) {
            const r = (g / 5) * maxR;
            ctx.beginPath();
            for (let i = 0; i < N; i++) {
                const a = (i * 2 * Math.PI / N) - Math.PI / 2;
                i === 0
                    ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                    : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
            }
            ctx.closePath();
            ctx.strokeStyle = g === 5 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 2. Eixos
        for (let i = 0; i < N; i++) {
            const a = (i * 2 * Math.PI / N) - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 3. Polígono preenchido com gradiente
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
            const { r } = getR(skillTypes[i]);
            const a = (i * 2 * Math.PI / N) - Math.PI / 2;
            i === 0
                ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        grad.addColorStop(0, 'rgba(0,240,255,0.40)');
        grad.addColorStop(1, 'rgba(0,240,255,0.06)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Contorno usa a cor da skill de maior nível
        const maxSkillLevel = Math.max(...skillTypes.map(t =>
            (gameState.skills && gameState.skills[t]) ? gameState.skills[t].level : 1
        ));
        ctx.strokeStyle = getSkillColor(maxSkillLevel);
        ctx.lineWidth   = 2;
        ctx.stroke();

        // 4. Marcadores nos vértices (polígono evolutivo)
        for (let i = 0; i < N; i++) {
            const { r, skill } = getR(skillTypes[i]);
            const a = (i * 2 * Math.PI / N) - Math.PI / 2;
            const vx = cx + r * Math.cos(a);
            const vy = cy + r * Math.sin(a);
            const color = getSkillColor(skill.level);
            drawVertexMarker(ctx, vx, vy, skill.level, color);
        }

        // 5. Rótulos (nome + nível)
        for (let i = 0; i < N; i++) {
            const { skill } = getR(skillTypes[i]);
            const a    = (i * 2 * Math.PI / N) - Math.PI / 2;
            const dist = maxR + 10;
            const lx   = cx + dist * Math.cos(a);
            const ly   = cy + dist * Math.sin(a);
            const cosA = Math.cos(a);
            const color = getSkillColor(skill.level);

            ctx.textBaseline = 'middle';
            ctx.textAlign    = Math.abs(cosA) < 0.15 ? 'center' : cosA > 0 ? 'left' : 'right';

            ctx.font      = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.fillText(skillLabels[skillTypes[i]], lx, ly - 6);

            ctx.font      = 'bold 11px "JetBrains Mono", monospace';
            ctx.fillStyle = color;
            ctx.fillText('LV' + skill.level, lx, ly + 6);
        }

    } catch (err) {
        console.error('[Radar] Erro ao desenhar:', err);
    }
}
// Expõe no window para garantir acesso global em qualquer contexto
window.drawRadarChart = drawRadarChart;

// Retorna a cor da ponta do hexágono baseada no nível da skill
function getSkillColor(level) {
    if (level >= 5) return '#fbbf24'; // Dourado
    if (level >= 3) return '#C0C0C0'; // Prata
    return '#00f0ff';                 // Ciano (padrão)
}

// Desenha o marcador no vértice do hexágono — polígono com N lados = nível da skill
function drawVertexMarker(ctx, x, y, level, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    if (level <= 1) {
        // LV1: círculo vazio (apenas contorno)
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.stroke();
        return;
    }

    if (level === 2) {
        // LV2: círculo preenchido
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        return;
    }

    // LV3+: polígono com N = level lados
    const sides = level; // LV3 = triângulo, LV4 = quadrado, LV5 = pentágono...
    const radius = 5;
    const startAngle = -Math.PI / 2; // Começa do topo

    ctx.beginPath();
    for (let s = 0; s < sides; s++) {
        const angle = startAngle + (s * 2 * Math.PI / sides);
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

// ==========================================================================
// TUTORIAIS E ONBOARDING DE NOVAS FEATURES
// ==========================================================================
function showFeatureUnlockModal(title, text) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 420px; padding: 28px; text-align: center; border: 1px solid var(--neon-cyan); box-shadow: 0 0 30px rgba(0, 242, 254, 0.25);">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">🔓</div>
            <h3 style="color: var(--neon-cyan); font-size: 1.2rem; font-family: var(--font-hud); letter-spacing: 1px; margin-bottom: 15px;">${title}</h3>
            <p style="color: #cbd5e1; font-size: 0.85rem; line-height: 1.6; text-align: left; white-space: pre-line; margin-bottom: 25px;">${text}</p>
            <button class="btn-submit" style="width: 100%;" onclick="this.closest('.modal').remove()">ENTENDIDO</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function checkFeatureUnlocks() {
    const level = gameState.level;
    
    if (level >= 5 && localStorage.getItem('tutorial_taverna_seen') !== 'true') {
        localStorage.setItem('tutorial_taverna_seen', 'true');
        showFeatureUnlockModal(
            '⚔️ TAVERNA & BOSS QUESTS LIBERADAS!',
            'Você atingiu o Nível 5 e destravou novas mecânicas do Sistema:\n\n' +
            '• 🍻 **A Taverna**: Use seu Ouro acumulado para comprar Perks (como escudos e pergaminhos de dobro XP) e Skins premium para o seu avatar!\n\n' +
            '• 💀 **Boss Quests**: Sempre que você sobe de Rank, um Chefe de Rank surge. Complete uma série de missões diárias seguidas para derrotá-lo e ganhar bônus gigantes de XP e Ouro!'
        );
        return;
    }
    
    if (level >= 10 && localStorage.getItem('tutorial_dungeons_seen') !== 'true') {
        localStorage.setItem('tutorial_dungeons_seen', 'true');
        showFeatureUnlockModal(
            '🔮 MASMORRAS DE ELITE ATIVADAS!',
            'Você atingiu o Nível 10! Masmorras temporárias agora aparecerão periodicamente sob a sua lista de missões secundárias:\n\n' +
            '• ⏳ **Tempo Limitado**: As Dungeons têm prazos rígidos de 48 horas para serem concluídas.\n\n' +
            '• 🛡️ **Combate de Skill**: Elas estão associadas a um atributo específico e dão recompensas massivas ao serem concluídas, ajudando a especializar seu personagem!'
        );
    }
}

// ==========================================================================
// INICIALIZAÇÃO DO APLICATIVO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    if (typeof initFirebase === 'function') initFirebase();
    initTabs();
    renderQuests();
    renderRewards();

    updateUI();
    setupEventListeners();
    
    // Inicializa motor PWA e Configurações
    registerServiceWorker();
    setupSettingsListeners();
    setupInstallPrompt();
    setupHabitLibraryAndTabs();
    // initChatListeners();

    // Garante o primeiro draw do radar chart após DOM+fontes carregarem
    setTimeout(() => { drawRadarChart(); }, 150);

    // Verifica e exibe o Relatório Semanal
    setTimeout(() => { checkAndShowWeeklyReport(); }, 800);

    // Mensagem de boas-vindas na primeira vez
    if ((!gameState.messages || gameState.messages.length === 0) && gameState.playerName) {
        if (!gameState.messages) gameState.messages = [];
        setTimeout(() => {
            showSystemToast(`Bem-vindo ao LifeRPG, ${gameState.playerName}. O Sistema está ativo. Complete suas missões.`);
        }, 1000);
    }

    // Loop de Retenção D1 -> D2
    const welcomeD2Shown = localStorage.getItem('lifeRPG_d2_welcome_shown') === 'true';
    if (!welcomeD2Shown && gameState.playerName && gameState.history) {
        const yesterdayStr = localDateStr(new Date(Date.now() - 86400000));
        const yesterdayStats = gameState.history[yesterdayStr];
        
        if (yesterdayStats && (yesterdayStats.status === 'perfect' || yesterdayStats.status === 'good')) {
            localStorage.setItem('lifeRPG_d2_welcome_shown', 'true');
            setTimeout(() => {
                showSystemToast(`🌅 *BOM RETORNO, ${gameState.playerName.toUpperCase()}!*\n\nO Sistema identificou sua consistência ontem (${yesterdayStats.count}/${yesterdayStats.total} tarefas). Continue focado hoje!`);
            }, 3000);
        }
    }
    
    // Inicia o Wizard se o usuário não tem nome definido
    if (!gameState.playerName) {
        initOnboardingWizard();
    } else {
        checkFeatureUnlocks();
    }
});

// ==========================================================================
// SELEÇÃO E GERENCIAMENTO DE ABAS
// ==========================================================================
function initTabs() {
    const navButtons = document.querySelectorAll('.tab-link[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            const targetTab = document.getElementById(`tab-${tabName}`);
            
            if (!targetTab) return;

            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            btn.classList.add('active');
            targetTab.classList.add('active');

            // Se for a aba Global, renderiza os gráficos e o heatmap
            if (tabName === 'global') {
                renderGlobalDashboard();
            }
            /*
            if (tabName === 'chat') {
                renderChat();
            }
            */

            // No Mobile, rola a tela até o conteúdo da aba, respeitando o header fixo
            if (window.innerWidth <= 1023) {
                const offset = targetTab.getBoundingClientRect().top + window.scrollY - 130;
                window.scrollTo({ top: offset, behavior: 'smooth' });
            }
        });
    });
}


// ==========================================================================
// SUB-ABAS DA TAVERNA E INVENTÁRIO
// ==========================================================================
window.switchTavernaTab = function(mode) {
    const btnShop      = document.getElementById('subtab-btn-shop');
    const btnInventory = document.getElementById('subtab-btn-inventory');
    const panelShop      = document.getElementById('taverna-shop');
    const panelInventory = document.getElementById('taverna-inventory');

    if (!btnShop || !btnInventory || !panelShop || !panelInventory) return;

    if (mode === 'shop') {
        btnShop.classList.add('active');
        btnInventory.classList.remove('active');
        panelShop.style.display = 'block';
        panelInventory.style.display = 'none';
    } else {
        btnShop.classList.remove('active');
        btnInventory.classList.add('active');
        panelShop.style.display = 'none';
        panelInventory.style.display = 'block';
        renderInventory();
    }
};

window.confirmRemoveQuest = function(id, title) {
    // Pop-up nativo do browser — simples e funcional
    const confirmed = confirm(`Remover "${title}" das suas missões?\n\nEssa ação não pode ser desfeita.`);
    if (!confirmed) return;

    // Remove de quests diárias
    const qIdx = gameState.quests.findIndex(q => q.id === id);
    if (qIdx !== -1) {
        gameState.quests.splice(qIdx, 1);
        saveGameData();
        renderQuests();
        showSystemToast(`✕ Missão removida.`);
        return;
    }

    // Remove de side quests
    const sqIdx = gameState.sideQuests.findIndex(q => q.id === id);
    if (sqIdx !== -1) {
        gameState.sideQuests.splice(sqIdx, 1);
        saveGameData();
        renderQuests();
        showSystemToast(`✕ Side Quest removida.`);
    }
};

window.equipItem = function(type, itemId) {
    if (type === 'title') {
        gameState.inventory.activeTitle = itemId;
    } else if (type === 'border') {
        gameState.inventory.activeBorder = itemId;
    } else if (type === 'skin') {
        gameState.inventory.activeSkin = itemId;
    }
    
    saveGameData();
    renderInventory();
    updateUI();
};

window.renderInventory = function() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const inv = gameState.inventory || { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' };
    if (!inv.unlockedSkins) inv.unlockedSkins = ['default'];
    if (!inv.activeSkin) inv.activeSkin = 'default';
    
    const catalog = {
        'title_implacavel': { name: 'O Implacável', type: 'title', icon: '🏷️', color: 'var(--neon-purple)' },
        'title_mestre': { name: 'Mestre do Tempo', type: 'title', icon: '⏳', color: 'var(--neon-gold)' },
        'border_neonred': { name: 'Demônio Carmesim', type: 'border', icon: '🖼️', color: 'var(--neon-red)' },
        'default': { name: 'Avatar Padrão do Rank', type: 'skin', icon: '🛡️', color: 'var(--neon-cyan)' },
        'skin_shadow_master': { name: 'Mestre das Sombras', type: 'skin', icon: '👤', color: 'var(--neon-purple)' },
        'skin_mist_monarch': { name: 'Monarca da Névoa', type: 'skin', icon: '👥', color: 'var(--neon-cyan)' },
        'skin_arise_emperor': { name: 'Imperador Arise', type: 'skin', icon: '👑', color: 'var(--neon-gold)' }
    };

    const allUnlocked = [
        'default',
        ...inv.unlockedTitles,
        ...inv.unlockedBorders,
        ...inv.unlockedSkins.filter(s => s !== 'default')
    ];
    
    allUnlocked.forEach(itemId => {
        const item = catalog[itemId];
        if (!item) return;

        const isEquipped = (item.type === 'title' && inv.activeTitle === itemId) || 
                           (item.type === 'border' && inv.activeBorder === itemId) ||
                           (item.type === 'skin' && inv.activeSkin === itemId);

        const card = document.createElement('div');
        card.className = 'reward-card';
        card.style.border = isEquipped ? `1px solid ${item.color}` : '1px solid var(--border-glass)';
        if (isEquipped) {
            card.style.boxShadow = `0 0 10px ${item.color}`;
        }

        const btnLabel = isEquipped ? 'EQUIPADO' : 'EQUIPAR';
        const btnStyle = isEquipped ? `background: ${item.color}; color: #fff;` : '';

        let displayType = 'Título';
        if (item.type === 'border') displayType = 'Borda';
        else if (item.type === 'skin') displayType = 'Avatar';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="color: ${item.color};">${displayType}: ${item.name}</h3>
                </div>
                <span style="font-size: 1.5rem;">${item.icon}</span>
            </div>
            <div class="reward-bottom" style="margin-top: 15px; justify-content: flex-end;">
                <button class="btn-buy" style="${btnStyle}" onclick="equipItem('${item.type}', '${itemId}')">${btnLabel}</button>
            </div>
        `;
        grid.appendChild(card);
    });
};

// ==========================================================================
// ONBOARDING WIZARD
// ==========================================================================
function initOnboardingWizard() {
    const wizardModal = document.getElementById('onboarding-wizard');
    if (!wizardModal) return;
    
    wizardModal.style.cssText = 'display: flex !important; position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.95); backdrop-filter: blur(8px); justify-content: center; align-items: center; padding: 24px;';
    
    // Passo 1: Nome
    const btnNext1 = document.getElementById('btn-wizard-next-1');
    const inputName = document.getElementById('wizard-name-input');
    
    btnNext1.addEventListener('click', () => {
        const name = inputName.value.trim();
        if (name) {
            gameState.playerName = name;
            document.getElementById('lbl-player-name').innerText = name.toUpperCase();
            document.getElementById('wizard-step-1').style.display = 'none';
            document.getElementById('wizard-step-2').style.display = 'block';
        } else {
            inputName.style.borderColor = 'red';
        }
    });

    // Passo 2: Arquétipo
    const btnNext2 = document.getElementById('btn-wizard-next-2');
    const archCards = document.querySelectorAll('.archetype-card');
    const otherInputContainer = document.getElementById('wizard-other-container');
    const otherInput = document.getElementById('wizard-other-input');
    let selectedArch = null;

    archCards.forEach(card => {
        card.addEventListener('click', () => {
            archCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedArch = card.getAttribute('data-arch');
            
            if (selectedArch === 'outros') {
                otherInputContainer.style.display = 'block';
                btnNext2.disabled = otherInput.value.trim() === '';
            } else {
                otherInputContainer.style.display = 'none';
                btnNext2.disabled = false;
            }
        });
    });

    otherInput.addEventListener('input', () => {
        if (selectedArch === 'outros') {
            btnNext2.disabled = otherInput.value.trim() === '';
        }
    });

    btnNext2.addEventListener('click', () => {
        if (selectedArch) {
            if (selectedArch === 'outros') {
                gameState.archetype = otherInput.value.trim() || 'Desconhecido';
                // Pula direto pro juramento se for 'outros'
                document.getElementById('wizard-step-2').style.display = 'none';
                document.getElementById('wizard-step-3').style.display = 'block';
            } else {
                gameState.archetype = selectedArch;
                // Configura a tela de Hook
                setupHookStep(selectedArch);
                document.getElementById('wizard-step-2').style.display = 'none';
                document.getElementById('wizard-step-hook').style.display = 'block';
            }
        }
    });

    // Passo Hook
    const btnNextHook = document.getElementById('btn-wizard-next-hook');
    btnNextHook.addEventListener('click', () => {
        document.getElementById('wizard-step-hook').style.display = 'none';
        document.getElementById('wizard-step-3').style.display = 'block';
    });

    // Passo 3: Comprometimento e Finalização
    const btnFinish = document.getElementById('btn-wizard-finish');
    const hourCards = document.querySelectorAll('.hour-card');
    let selectedHours = null;

    hourCards.forEach(card => {
        card.addEventListener('click', () => {
            hourCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedHours = card.getAttribute('data-hours');
            btnFinish.disabled = false;
        });
    });

    btnFinish.addEventListener('click', () => {
        if (selectedHours) {
            gameState.dailyCommitmentMins = parseInt(selectedHours);
            
            // Coletar dias selecionados
            const dayCheckboxes = document.querySelectorAll('.day-checkbox input:checked');
            const selectedDays = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
            gameState.activeDays = selectedDays.length > 0 ? selectedDays : [0,1,2,3,4,5,6]; // Fallback
            
            // Adapta o deck de missões com base no arquétipo e no tempo
            applyArchetypeDeck(selectedArch, gameState.dailyCommitmentMins);
            
            wizardModal.style.cssText = 'display: none !important;';
            saveGameData();
            updateUI();
            
            setTimeout(() => {
                showSystemToast(`Despertar concluído, ${gameState.playerName}. O Sistema iniciou sua jornada.`);
            }, 1000);
        }
    });
}

function setupHookStep(archetype) {
    const lblArch = document.getElementById('hook-arch-name');
    const lblHabit = document.getElementById('hook-habit-title');
    const icon = document.getElementById('hook-icon');

    if (archetype === 'corpo') {
        lblArch.innerText = 'Alta Performance & Corpo';
        lblHabit.innerText = 'Beber 1 copo de água ao acordar';
        icon.innerText = '💧';
    } else if (archetype === 'foco') {
        lblArch.innerText = 'Foco & Produtividade';
        lblHabit.innerText = '15 minutos de leitura (sem celular)';
        icon.innerText = '📚';
    } else if (archetype === 'zen') {
        lblArch.innerText = 'Zen & Saúde Mental';
        lblHabit.innerText = 'Meditar por 3 minutos';
        icon.innerText = '🧘';
    } else if (archetype === 'rotina') {
        lblArch.innerText = 'Estilo de Vida & Rotina';
        lblHabit.innerText = 'Arrumar a cama ao levantar';
        icon.innerText = '🛏️';
    }
}

function applyArchetypeDeck(archetype, minutes) {
    let deck = [];
    
    // 1. O Micro-hábito base (sempre garantido pelo Hook)
    if (archetype === 'corpo') {
        deck.push({ id: 'q-agua', title: 'Beber 1 copo de água ao acordar', type: 'daily', icon: '💧', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'physical' });
    } else if (archetype === 'foco') {
        deck.push({ id: 'q-ler', title: '15 minutos de leitura (sem celular)', type: 'daily', icon: '📚', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'wisdom' });
    } else if (archetype === 'zen') {
        deck.push({ id: 'q-meditar', title: 'Meditar por 3 minutos', type: 'daily', icon: '🧘', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'mental' });
    } else if (archetype === 'rotina') {
        deck.push({ id: 'q-cama', title: 'Arrumar a cama ao levantar', type: 'daily', icon: '🛏️', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'routine' });
    } else {
        deck.push({ id: 'q-foco', title: 'Dar o primeiro passo no meu objetivo', type: 'daily', icon: '🎯', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'productivity' });
    }

    // 2. Escalonando a quantidade de hábitos pelo Tempo (minutos)
    if (minutes >= 30) {
        // Adiciona mais um hábito rápido
        deck.push({ id: 'q-acordar', title: 'Acordar Cedo (Horário Fixo)', type: 'daily', icon: '🌅', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'routine' });
        if (archetype !== 'corpo') deck.push({ id: 'q-agua2', title: 'Beber Água (8 copos)', type: 'daily', icon: '💧', completed: false, xp: 15, gold: 8, target: 8, current: 0, minLevel: 1, skill: 'physical' });
    }

    if (minutes >= 60) {
        // Adiciona hábitos de esforço médio/alto (1 hora permite treino ou estudos intensos)
        if (archetype === 'corpo' || archetype === 'zen') {
            deck.push({ id: 'q-malhar', title: 'Treinar de Força / Corrida (45min)', type: 'daily', icon: '🏋️‍♂️', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'physical' });
        } else {
            deck.push({ id: 'q-estudo', title: 'Deep Work / Foco ininterrupto (1h)', type: 'daily', icon: '💻', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'productivity' });
        }
    }

    if (minutes >= 120) {
        // Hardcore: Um mix completo (Físico + Mental + Sabedoria + Social)
        deck.push({ id: 'q-detox', title: '1h sem celular antes de dormir', type: 'daily', icon: '📵', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'mental' });
        
        // Se já não tiver Treino, adiciona Treino. Se já não tiver Deep Work, adiciona Deep Work.
        const hasTreino = deck.some(q => q.id === 'q-malhar');
        const hasEstudo = deck.some(q => q.id === 'q-estudo');
        
        if (!hasTreino) deck.push({ id: 'q-malhar', title: 'Treinar de Força / Corrida', type: 'daily', icon: '🏋️‍♂️', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'physical' });
        if (!hasEstudo) deck.push({ id: 'q-estudo', title: 'Deep Work / Estudos', type: 'daily', icon: '💻', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'productivity' });
        
        deck.push({ id: 'q-social', title: 'Conectar com Família/Amigo (Sem tela)', type: 'daily', icon: '❤️', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'social' });
    }
    
    // Substitui o banco ativo e re-renderiza
    gameState.quests = deck;
    renderQuests();
}


// ==========================================================================
// RENDERIZADORES DE INTERFACE (UI)
// ==========================================================================

// Atualiza informações gerais do Personagem
function updateUI() {
    const lvlEl = document.getElementById('lbl-level');
    if (lvlEl) lvlEl.innerText = gameState.level;
    const goldEl = document.getElementById('lbl-gold');
    if (goldEl) goldEl.innerText = gameState.gold;
    if (gameState.playerName) {
        const playerNameEl = document.getElementById('lbl-player-name');
        if (playerNameEl) playerNameEl.innerText = gameState.playerName.toUpperCase();
    }
    
    // Update Atributos Secundários (Barras)
    if (gameState.skills) {
        const setBar = (idSuffix, skillType) => {
            const lvlEl = document.getElementById(`attr-lvl-${idSuffix}`);
            const fillEl = document.getElementById(`attr-fill-${idSuffix}`);
            if (lvlEl && fillEl && gameState.skills[skillType]) {
                const s = gameState.skills[skillType];
                lvlEl.innerText = s.level;
                const pct = Math.min((s.xp / (s.xpToNext || 5)) * 100, 100);
                fillEl.style.width = `${pct}%`;
            }
        };
        setBar('willpower', 'routine');
        setBar('intellect', 'wisdom');
        setBar('vitality', 'physical');
    }
    // RANK badge
    const rankInfo = getRankForLevel(gameState.level);
    const rankBadge = document.getElementById('lbl-rank');
    if (rankBadge) {
        rankBadge.innerText = rankInfo.rank;
        rankBadge.className = 'rank-badge ' + rankInfo.css;
    }

    // COSMÉTICOS (Títulos e Bordas)
    const titleLabels = {
        'title_implacavel': 'O Implacável',
        'title_mestre': 'Mestre do Tempo'
    };
    const playerTitle = document.getElementById('lbl-player-title');
    if (playerTitle) {
        if (gameState.inventory && gameState.inventory.activeTitle) {
            playerTitle.innerText = titleLabels[gameState.inventory.activeTitle] || 'Desperto';
            if (gameState.inventory.activeTitle === 'title_implacavel') playerTitle.style.color = 'var(--neon-purple)';
            if (gameState.inventory.activeTitle === 'title_mestre') playerTitle.style.color = 'var(--neon-gold)';
        } else {
            playerTitle.innerText = 'Desperto';
            playerTitle.style.color = 'var(--text-muted)';
        }
    }

    const avatarBorder = document.querySelector('.avatar-hex-border');
    const avatarWrapper = document.querySelector('.avatar-hex-wrapper');
    if (avatarBorder && avatarWrapper) {
        if (gameState.inventory && gameState.inventory.activeBorder === 'border_neonred') {
            avatarBorder.classList.add('border-neonred');
            avatarWrapper.classList.add('glow-neonred');
        } else {
            avatarBorder.classList.remove('border-neonred');
            avatarWrapper.classList.remove('glow-neonred');
        }
    }

    // Display estendido do streak: dias + multiplicador + escudos
    const streakEl = document.getElementById('lbl-streak');
    if (streakEl) {
        if (typeof gameState.streak !== 'number') {
            gameState.streak = parseInt(gameState.streak) || 0;
        }
        const mult = calcStreakMultiplier();
        const multStr = mult > 1 ? ` · x${mult.toFixed(2)}` : '';
        const shields = gameState.shields || 0;
        const shieldStr = shields > 0
            ? '  ' + '🛡️'.repeat(shields) + '░'.repeat(3 - shields)
            : '';
        streakEl.innerText = `${gameState.streak}${multStr}${shieldStr}`;

        // Animação/badges com base no tier do streak
        const streakChip = streakEl.closest('.streak-chip');
        if (streakChip) {
            streakChip.classList.remove('streak-tier-3', 'streak-tier-7', 'streak-tier-14', 'streak-tier-30');
            const streak = gameState.streak || 0;
            if (streak >= 30) streakChip.classList.add('streak-tier-30');
            else if (streak >= 14) streakChip.classList.add('streak-tier-14');
            else if (streak >= 7) streakChip.classList.add('streak-tier-7');
            else if (streak >= 3) streakChip.classList.add('streak-tier-3');
        }
    }

    // Barra de XP
    const xpCurEl = document.getElementById('lbl-xp-current');
    if (xpCurEl) xpCurEl.innerText = gameState.xp;
    const xpNextEl = document.getElementById('lbl-xp-next');
    if (xpNextEl) xpNextEl.innerText = gameState.xpToNext;
    const xpBarInnerEl = document.getElementById('xp-bar-inner');
    if (xpBarInnerEl) {
        const xpPercent = Math.min((gameState.xp / gameState.xpToNext) * 100, 100);
        xpBarInnerEl.style.width = `${xpPercent}%`;
    }

    // Progresso diário
    const totalDailies = gameState.quests.length;
    const completedDailies = gameState.quests.filter(q => q.completed).length;
    const lblDailyProg = document.getElementById('lbl-daily-progress');
    if (lblDailyProg) lblDailyProg.innerText = `${completedDailies}/${totalDailies}`;

    // RANK badge

    // 3 Barras de atributos (Willpower / Intellect / Health)
    const attrs = computeAttributes();
    const minPct = 0; // Preenchimento diretamente proporcional ao nível/progresso
    ['willpower', 'intellect', 'health'].forEach(key => {
        const lvlEl  = document.getElementById(`attr-lvl-${key}`);
        const fillEl = document.getElementById(`attr-fill-${key}`);
        if (lvlEl)  lvlEl.innerText  = attrs[key].level;
        if (fillEl) fillEl.style.width = `${minPct + (attrs[key].pct * (100 - minPct))}%`;
    });

    // Player Title Dinâmico
    const titleLabel = document.getElementById('lbl-player-title');
    if (titleLabel) {
        titleLabel.innerText = computePlayerTitle(attrs);
    }

    // Avatar e radar chart
    updateAvatarImage();
    renderSkills();

    //  Sinergias ativas 
    renderSynergies();
    renderRankPerks();
    renderWeeklyBoss();
    renderAchievements();
}

// Renderiza badges de sinergias ativas abaixo das barras de atributo
function renderSynergies() {
    const container = document.getElementById('synergies-container');
    if (!container) return; // Elemento ainda não existe no HTML — seguro ignorar

    const active = computeSynergies();
    if (active.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '<div style="width:100%; font-size:10px; color:#fbbf24; font-family:var(--font-hud); letter-spacing:2px; margin-bottom:4px; border-bottom: 1px solid rgba(251,191,36,0.3); padding-bottom: 2px;">⚡ SINERGIAS ATIVAS</div>' + active.map(s => `
        <div class="synergy-badge" title="${s.description}">
            <span class="synergy-icon">${s.icon}</span>
            <span class="synergy-name">${s.name}</span>
        </div>
    `).join('');
}

// Renderiza badges de rank perks ativos abaixo das sinergias
function renderRankPerks() {
    const container = document.getElementById('rank-perks-container');
    if (!container) return;

    const active = getActivePerks();
    if (active.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '<div style="width:100%; font-size:10px; color:#00f0ff; font-family:var(--font-hud); letter-spacing:2px; margin-bottom:4px; margin-top:8px; border-bottom: 1px solid rgba(0,240,255,0.3); padding-bottom: 2px;">P RANK PERKS</div>' + active.map(p => `
        <div class="perk-badge" title="${p.description}">
            <span class="perk-icon">${p.icon}</span>
            <span class="perk-name">${p.name}</span>
        </div>
    `).join('');
}

function updateAvatarImage() {
    const avatarEl = document.getElementById('char-avatar-img');
    if (!avatarEl) return;
    
    const activeSkin = gameState.inventory?.activeSkin || 'default';
    if (activeSkin !== 'default') {
        avatarEl.src = `avatars/${activeSkin}.png`;
        avatarEl.onerror = () => { avatarEl.src = 'avatars/1.rank-e.png'; };
    } else {
        const rank = getRankForLevel(gameState.level);
        const rankKey = rank.css.replace('rank-', '');
        const prefixMap = { e: '1', d: '2', c: '3', b: '4', a: '5', s: '6' };
        const num = prefixMap[rankKey] || '1';
        avatarEl.src = `avatars/${num}.rank-${rankKey}.png`;
        avatarEl.onerror = () => { avatarEl.src = 'avatars/1.rank-e.png'; };
    }
}

// Renderiza a árvore de atributos (Hexagonal Radar Chart) dinamicamente
function renderSkills() {
    // Inicializa se não existir no save
    initSkillsState();
    
    // Desenha o gráfico Radar Hexagonal no Canvas
    drawRadarChart();
}

// Inicializa a árvore de skills caso não esteja presente no estado (retrocompatibilidade robusta)
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

// Multiplicador de Ouro baseado no streak atual
function calcStreakGoldMultiplier() {
    const streak = gameState.streak || 0;
    if (streak >= 30) return 0.30; // +30%
    if (streak >= 14) return 0.20; // +20%
    if (streak >= 7)  return 0.10; // +10%
    return 0.0;
}

// Incrementa o progresso de uma skill e verifica level up do atributo
function addSkillXP(skillType) {
    initSkillsState();
    
    const skillObj = gameState.skills[skillType];
    if (!skillObj) return;

    // XP ganho escala com o level geral
    skillObj.xp += calcSkillXpGain() + getSynergySkillXpBonus(); // +bonus de sinergias
    
    if (skillObj.xp >= skillObj.xpToNext) {
        skillObj.level++;
        skillObj.xp = 0;
        skillObj.xpToNext = calcSkillXpToNext(skillObj.level);
        
        const skillNamesPT = {
            physical: 'Físico 🏋️‍♂️',
            mental: 'Mental 🧘',
            productivity: 'Foco 💻',
            social: 'Conexão ❤️',
            wisdom: 'Sabedoria 📚',
            routine: 'Rotina 🛏️'
        };
        
        setTimeout(() => {
            showSystemToast(`⭐ *ATRIBUTO UP!* ${gameState.playerName || 'Guerreiro'}, seu treino diário elevou o seu nível de *${skillNamesPT[skillType]}* para o *Nível ${skillObj.level}*! A consistência lapida a mente e o corpo. Muito bem!`);

        }, 1200);
    }
    
    checkAndActivateBossQuest(); // ← NOVO: verifica conclusão de boss quest ao evoluir skill
    saveGameData();
}

// Decrementa o progresso de uma skill caso desmarque a quest
function deductSkillXP(skillType) {
    initSkillsState();
    
    const skillObj = gameState.skills[skillType];
    if (!skillObj) return;

    if (skillObj.xp > 0) {
        skillObj.xp -= calcSkillXpGain();
        if (skillObj.xp < 0) skillObj.xp = 0;
    } else if (skillObj.level > 1) {
        skillObj.level--;
        skillObj.xpToNext = calcSkillXpToNext(skillObj.level);
        skillObj.xp = skillObj.xpToNext - 1;
    }
    
    saveGameData();
}

function renderQuests() {
    const dailyContainer = document.getElementById('daily-quests-list');
    const sideContainer  = document.getElementById('side-quests-list');
    dailyContainer.innerHTML = '';
    sideContainer.innerHTML  = '';

    // Renderiza Masmorras (se houver ativa)
    const dungeonBanner = document.getElementById('dungeon-active-banner');
    if (gameState.activeDungeon && dungeonBanner) {
        dungeonBanner.style.display = 'block';
        dungeonBanner.innerHTML = `
            <div class="dungeon-card" style="background: linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(147,51,234,0.3) 100%); border: 1px solid var(--neon-purple); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 10px; color: var(--neon-purple); font-family: var(--font-hud); letter-spacing: 1px;">MASMORRA ATIVA</div>
                        <div style="font-size: 16px; font-weight: bold; margin-top: 5px; color: white;">${gameState.activeDungeon.title}</div>
                    </div>
                    <button class="dungeon-banner-btn" style="background: rgba(147,51,234,0.2); border: 1px solid var(--neon-purple); color: var(--neon-purple); padding: 8px 15px; border-radius: 4px; cursor: pointer; font-family: var(--font-hud); letter-spacing: 1px;" data-dungeon="true">ATACAR BOSS</button>
                </div>
            </div>
        `;
    } else if (dungeonBanner) {
        dungeonBanner.style.display = 'none';
    }

    //    Dungeon ativa                                                     
    checkDungeonExpiry();
    const _d = gameState.activeDungeon;
    if (_d && !_d.completed) {
        const _now = Date.now();
        const _remMs  = Math.max(0, _d.expiresAt - _now);
        const _remH   = Math.floor(_remMs / 3600000);
        const _remMin = Math.floor((_remMs % 3600000) / 60000);
        const _timeLabel = _remMs <= 0 ? 'EXPIRADA' : `${_remH}h ${_remMin}min restantes`;
        const _urgent    = _remMs > 0 && _remMs < 6 * 3600000;

        const _dc = document.createElement('div');
        _dc.className = `quest-card dungeon-card${_urgent ? ' dungeon-urgent' : ''}`;
        _dc.setAttribute('data-skill', _d.skill);
        _dc.innerHTML = `
            <div class="quest-details">
                <div class="quest-icon">⚔️</div>
                <div class="quest-title-wrap">
                    <span class="quest-title">${_d.title}</span>
                    <div class="quest-payouts">
                        <span class="diff-badge dungeon-badge">DUNGEON</span>
                        <span class="payout-xp">+${_d.xp} XP</span>
                        <span class="payout-gold">+${_d.gold} 💰</span>
                    </div>
                    <div class="dungeon-timer${_urgent ? ' dungeon-timer-urgent' : ''}">⏳ ${_timeLabel}</div>
                </div>
            </div>
            <button class="quest-complete-btn dungeon-btn" data-dungeon="true">✓</button>
        `;
        sideContainer.appendChild(_dc);
    }
    //  fim dungeon 

    //  Daily Quests 
    gameState.quests.forEach(quest => {
        const card = document.createElement('div');
        card.className = `quest-card ${quest.completed ? 'completed' : ''}`;
        card.setAttribute('data-skill', quest.skill || 'routine');

        const diffMap = { routine: 'RANK E', physical: 'RANK E', wisdom: 'RANK D', mental: 'RANK D', productivity: 'RANK C', social: 'RANK D' };
        const diffLabel = diffMap[quest.skill] || 'RANK E';

        let extraHTML = '';
        if (quest.current !== undefined && quest.target !== undefined) {
            extraHTML = `<div class="water-adjust-row">
                <button class="water-btn btn-minus" data-id="${quest.id}">−</button>
                <span class="water-val">${quest.current || 0}/${quest.target} copos</span>
                <button class="water-btn btn-plus" data-id="${quest.id}">+</button>
            </div>`;
        }

        card.innerHTML = `
            <button class="quest-remove-btn"
                    data-id="${quest.id}"
                    onclick="confirmRemoveQuest('${quest.id}', '${quest.title.replace(/'/g, "\\'")}')">
                ✕
            </button>
            <div class="quest-details">
                <div class="quest-icon">${quest.icon}</div>
                <div class="quest-title-wrap">
                    <span class="quest-title">${quest.title}</span>
                    <div class="quest-payouts">
                        <span class="diff-badge">${diffLabel}</span>
                        <span class="payout-xp">+${quest.xp} XP</span>
                        <span class="payout-gold">+${quest.gold} 🪙</span>
                    </div>
                    ${extraHTML}
                </div>
            </div>
            <button class="quest-complete-btn" data-id="${quest.id}">✓</button>
        `;
        dailyContainer.appendChild(card);
    });

    //  Side Quests 
    const activeDungeon = gameState.activeDungeon;
    if (gameState.sideQuests.length === 0 && !(activeDungeon && !activeDungeon.completed)) {
        sideContainer.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;padding:24px;font-family:var(--font-hud);letter-spacing:1px">NENHUMA MISSÃO ATIVA</div>`;
    } else {
        gameState.sideQuests.forEach(quest => {
            const card = document.createElement('div');
            card.className = `quest-card ${quest.completed ? 'completed' : ''}`;
            card.setAttribute('data-skill', 'productivity');
            const diffLabel = quest.difficulty === 'hard' ? 'RANK C' : quest.difficulty === 'medium' ? 'RANK D' : 'RANK E';
            card.innerHTML = `
                <button class="quest-remove-btn"
                        data-id="${quest.id}"
                        onclick="confirmRemoveQuest('${quest.id}', '${quest.title.replace(/'/g, "\\'")}')">
                    ✕
                </button>
                <div class="quest-details">
                    <div class="quest-icon">${quest.icon || '⚔️'}</div>
                    <div class="quest-title-wrap">
                        <span class="quest-title">${quest.title}</span>
                        <div class="quest-payouts">
                            <span class="diff-badge">${diffLabel}</span>
                            <span class="payout-xp">+${quest.xp} XP</span>
                            <span class="payout-gold">+${quest.gold} 🪙</span>
                        </div>
                    </div>
                </div>
                <button class="quest-complete-btn" data-id="${quest.id}">✓</button>
            `;
            sideContainer.appendChild(card);
        });
    }
}

// Renderiza a Taverna (Recompensas)
function renderRewards() {
    const rewardsContainer = document.getElementById('rewards-list');
    if (!rewardsContainer) return;
    rewardsContainer.innerHTML = `
        <div class="store-item" onclick="buyStoreItem('buff_autoHeal')">
            <div class="store-info"><span>🧪 Poção de Cura</span><small>Protege o streak por 1 erro</small></div>
            <button>100 🪙</button>
        </div>
        <div class="store-item" onclick="buyStoreItem('buff_doubleXp')">
            <div class="store-info"><span>📜 Pergaminho de Dobro XP</span><small>XP x2 por um dia</small></div>
            <button>50 🪙</button>
        </div>
        <div class="store-item" onclick="buyStoreItem('buff_shield')">
            <div class="store-info"><span>🛡️ Carga de Escudo</span><small>Reforce sua defesa</small></div>
            <button>150 🪙</button>
        </div>
    `;
}

// ==========================================================================
// SISTEMA DE REGRAS DO JOGO E GAMIFICAÇÃO
// ==========================================================================

// Finaliza ou altera status de uma Quest (Suporta desmarcar / cancelar)
function toggleQuest(id) {
    // Se for dungeon, roteia para completeDungeon
    if (id === 'dungeon-true') {
        completeDungeon();
        return;
    }

    // Procura nas Quests Diárias
    let quest = gameState.quests.find(q => q.id === id);
    let isDaily = true;

    // Se não achar, procura nas Side Quests
    if (!quest) {
        quest = gameState.sideQuests.find(q => q.id === id);
        isDaily = false;
    }

    if (!quest) return;

    const skillType = quest.skill || 'productivity';

    if (quest.completed) {
        // CANCELAR / DESMARCAR QUEST
        quest.completed = false;
        if (quest.current !== undefined) {
            quest.current = 0; // Reseta contador de água
        }
        deductRewards(quest.xp, quest.gold);
        
        // Deduz pontos no atributo
        deductSkillXP(skillType);
    } else {
        // CONCLUIR QUEST
        if (quest.current !== undefined) {
            quest.current = quest.target || 8;
        }
        
        // Aplica Double XP Buff se ativo
        let xpGained = quest.xp;
        if (gameState.buffs && gameState.buffs.doubleXp) {
            xpGained *= 2;
            gameState.buffs.doubleXp = false;
        }

        quest.completed = true;
        addRewards(xpGained, quest.gold);
        addSkillXP(skillType);

        // Impact Quote - Primeira do Dia
        const todayStr = new Date().toDateString();
        const completedDailies = gameState.quests.filter(q => q.completed).length;
        if (completedDailies === 1 && gameState.lastQuoteDate !== todayStr + '_first') {
            setTimeout(showImpactQuote, 1500);
            gameState.lastQuoteDate = todayStr + '_first';
        }

        // Perk: Foco Matinal — +5 XP na primeira quest concluída do dia
        if (hasPerk('foco_matinal') && !gameState._firstQuestBonusGiven) {
            gameState.xp = (gameState.xp || 0) + 5;
            gameState._firstQuestBonusGiven = true;
        }

        // Perk: Momentum — +1 XP por quest consecutiva (acumula até 5)
        if (hasPerk('momentum')) {
            gameState._momentumStack = Math.min((gameState._momentumStack || 0) + 1, 5);
            const momentumBonus = gameState._momentumStack;
            gameState.xp = (gameState.xp || 0) + momentumBonus;
        }

        // Após addSkillXP(skillType), antes de showQuestCleared(quest):
        if (!isDaily && gameState.bossQuest?.id === 'd-to-c' && !gameState.bossQuest.completed) {
            gameState.bossQuest.sideQuestsCompleted = (gameState.bossQuest.sideQuestsCompleted || 0) + 1;
        }

        // Quest Cleared animation (Arise-style)
        showQuestCleared(quest);

        
        if (isDaily) {
            checkAllDailies();
        }
    }

    saveGameData();
    renderQuests();
    updateUI();
}

// Gerencia copos de água individualmente
function adjustWater(id, operation) {
    const quest = gameState.quests.find(q => q.id === id);
    if (!quest) return;

    const skillType = quest.skill || 'physical';
    const targetVal = quest.target || 8;

    if (quest.completed && operation === 'minus') {
        // Se já estava concluída e diminuiu a água, desmarca
        quest.completed = false;
        quest.current = targetVal - 1;
        deductRewards(quest.xp, quest.gold);
        deductSkillXP(skillType);
    } else if (!quest.completed) {
        if (operation === 'plus' && quest.current < targetVal) {
            quest.current++;
            if (quest.current === targetVal) {
                quest.completed = true;
                addRewards(quest.xp, quest.gold);
                addSkillXP(skillType);
                
                checkAllDailies();
            }
        } else if (operation === 'minus' && quest.current > 0) {
            quest.current--;
        }
    }

    saveGameData();
    renderQuests();
    updateUI();
}

// Sincroniza a lista de hábitos ativos de acordo com o nível do jogador (Skill Tree)
function syncQuestsByLevel() {
    let level = gameState.level;
    
    // Filtra todos os hábitos desbloqueados até o nível atual
    let unlockedHabits = ALL_HABITS_DATABASE.filter(h => h.minLevel <= level);
    
    let updatedQuests = [];
    
    // 1. Preserva as quests que já estão na lista ativa (incluindo as customizadas do Onboarding)
    if (gameState.quests) {
        gameState.quests.forEach(activeQuest => {
            updatedQuests.push(activeQuest);
        });
    }
    
    // 2. Adiciona as novas do banco de dados que foram desbloqueadas e ainda não constam
    unlockedHabits.forEach(dbHabit => {
        let exists = updatedQuests.some(q =>
            q.id === dbHabit.id ||
            (dbHabit.baseId && q.id === dbHabit.baseId)
        );
        if (!exists) {
            const fresh = { ...dbHabit };
            // Preserva progresso de água se já existia quest similar
            const similarWater = gameState.quests.find(q =>
                (q.id === dbHabit.id || (dbHabit.baseId && q.id === dbHabit.baseId)) && q.current !== undefined
            );
            if (similarWater) fresh.current = similarWater.current;
            updatedQuests.push(fresh);
            
            // Notifica o usuário no chat via Iroh caso não seja a primeira carga do app
            if (gameState.messages.length > 0) {
                setTimeout(() => {
                    showSystemToast(`🔥 *SISTEMA:* Incrível, ${gameState.playerName || 'Guerreiro'}! Ao alcançar o nível *${level}*, você desbloqueou uma nova quest diária: *"${dbHabit.title}"*! Que ela fortaleça a sua rotina!`);
                }, 1500);
            }
        }
    });
    
    gameState.quests = updatedQuests;
}

// Soma XP e Gold, gerencia Level Up
function addRewards(xpGained, goldGained) {
    // Aplica multiplicador de streak e bônus de sinergias
    const multiplier = calcStreakMultiplier();
    const synergyXp   = getSynergyXpBonus();
    const synergyGold = getSynergyGoldBonus();
    const streakGold  = calcStreakGoldMultiplier();
    
    const perkXp = getPerkXpBonus(); // +25% se Lenda Imortal ativo
    const bonusXp = Math.round(xpGained * (multiplier + synergyXp + perkXp));
    const bonusGold = Math.round(goldGained * (1 + synergyGold + streakGold));
    
    gameState.xp += bonusXp;
    gameState.gold += bonusGold;

    // Lógica de Level Up
    if (gameState.xp >= gameState.xpToNext) {
        gameState.level++;
        gameState.xp = gameState.xp - gameState.xpToNext;
        gameState.xpToNext = Math.round(gameState.xpToNext * 1.3); // Escalabilidade de XP
        
        // Sincroniza hábitos do novo nível desbloqueado
        syncQuestsByLevel();
        
        triggerLevelUpOverlay();
        checkAndActivateBossQuest(); // verifica boss quest ao subir de nível
    }

    // Verifica conclusão de boss quest mesmo sem level up
    checkAndActivateBossQuest();
}



// Subtrai XP e Gold ao desmarcar (impede negativar XP/Ouro)
function deductRewards(xpLost, goldLost) {
    gameState.xp -= xpLost;
    gameState.gold -= goldLost;

    if (gameState.xp < 0) {
        gameState.xp = 0;
    }
    if (gameState.gold < 0) {
        gameState.gold = 0;
    }
}

// Dispara Overlay de evolução (estilo Arise)
function triggerLevelUpOverlay() {
    const oldRank = getRankForLevel(gameState.level - 1);
    const newRank = getRankForLevel(gameState.level);
    const rankChanged = oldRank.rank !== newRank.rank;

    document.getElementById('overlay-lvl').innerText = gameState.level;

    const rankUpEl = document.getElementById('overlay-rank-up');
    if (rankChanged) {
        document.getElementById('overlay-old-rank').innerText = oldRank.rank;
        document.getElementById('overlay-new-rank').innerText = newRank.rank;
        rankUpEl.style.display = 'block';
    } else {
        rankUpEl.style.display = 'none';
    }

    document.getElementById('level-up-overlay').style.display = 'flex';

    setTimeout(() => {
        const msg = rankChanged
            ? `⚡ LEVEL UP! Nível ${gameState.level} atingido! E mais: ${oldRank.rank} → ${newRank.rank}! O Sistema reconhece sua evolução!`
            : `⚡ LEVEL UP! Nível ${gameState.level}! O Sistema reconhece sua evolução!`;
        showSystemToast(msg);

    }, 1200);
}

function checkAllDailies() {
    const allDone = gameState.quests.every(q => q.completed);
    if (allDone) {
        gameState.streak++;

        // Desbloqueia título especial com 30 dias de streak
        if (gameState.streak === 30) {
            if (!gameState.inventory.unlockedTitles.includes('Inabalável')) {
                gameState.inventory.unlockedTitles.push('Inabalável');
                setTimeout(() => {
                    showSystemToast(`🏆 *NOVO TÍTULO DESBLOQUEADO!*\n\nVocê atingiu um Streak de 30 dias e conquistou o título: *Inabalável*! Equipe-o na Taverna.`);
                }, 3000);
            }
        }

        gameState.consecutiveMisses = 0; // zera contador de falhas ao completar o dia

        // Perk: Mente de Diamante — +10 XP ao completar todas as dailies
        if (hasPerk('mente_diamante')) {
            gameState.xp = (gameState.xp || 0) + 10;
        }

        // Perk: O Sistema — +1 Skill XP em uma skill aleatória ao completar todas as dailies
        if (hasPerk('o_sistema')) {
            const skillTypes = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
            const randomSkill = skillTypes[Math.floor(Math.random() * skillTypes.length)];
            if (gameState.skills && gameState.skills[randomSkill]) {
                gameState.skills[randomSkill].xp = (gameState.skills[randomSkill].xp || 0) + 1;
            }
        }

        // Reseta flags de perks diários
        gameState._firstQuestBonusGiven = false;
        gameState._momentumStack = 0;

        // Incrementa contador para escudo (a cada 7 dias = +1 escudo, máx 3)
        gameState.consecutiveStreak7Days = (gameState.consecutiveStreak7Days || 0) + 1;
        if (gameState.consecutiveStreak7Days >= 7) {
            gameState.consecutiveStreak7Days = 0;
            const maxShields = hasSynergyShieldBonus() ? 4 : 3;
            if ((gameState.shields || 0) < maxShields) {
                gameState.shields = (gameState.shields || 0) + 1;
                setTimeout(() => {
                    showSystemToast(`🛡️ *ESCUDO GERADO!* Você manteve a consistência por 7 dias seguidos. Um escudo foi adicionado ao seu arsenal — ele protege sua sequência em um dia difícil. Escudos ativos: ${gameState.shields}/${maxShields}`, 'toast-alert');
                }, 2000);
            }
        }

        saveGameData();
        updateUI();

        // Tenta gerar dungeon ao completar todas as dailies
        if (!gameState.activeDungeon) spawnDungeon();

        setTimeout(() => {
            const todayStr = new Date().toDateString();
            if (gameState.lastQuoteDate !== todayStr + '_all') {
                showImpactQuote();
                gameState.lastQuoteDate = todayStr + '_all';
            }
        }, 1500);
    }
}

//  QUEST CLEARED Animation 
function showQuestCleared(quest) {
    const skillToAttr = {
        mental: 'FORÇA DE VONTADE ↑', routine: 'FORÇA DE VONTADE ↑',
        wisdom: 'INTELECTO ↑', productivity: 'INTELECTO ↑',
        physical: 'SAÚDE ↑', social: 'SAÚDE ↑'
    };
    const overlay = document.getElementById('quest-cleared-overlay');
    document.getElementById('quest-cleared-rewards').innerText = `+${quest.xp} XP · +${quest.gold} OURO`;
    document.getElementById('quest-cleared-attr').innerText = skillToAttr[quest.skill] || 'ATRIBUTO ↑';
    overlay.classList.add('show');
    setTimeout(() => overlay.classList.remove('show'), 1800);
}

function applyDailyPenalty() {
    // Incrementa contador de dias faltosos consecutivos
    gameState.consecutiveMisses = (gameState.consecutiveMisses || 0) + 1;
    const misses = gameState.consecutiveMisses;

    // ── Verifica escudo (só absorve no 1º dia faltoso) ──────────────────────
    if (misses === 1 && (gameState.shields || 0) > 0) {
        gameState.shields--;
        gameState.consecutiveStreak7Days = 0;

        setTimeout(() => {
            showSystemToast(`🛡️ *ESCUDO ATIVADO!* Você falhou hoje, mas seu escudo absorveu a penalidade. Streak preservada em ${gameState.streak} dias. Escudos restantes: ${gameState.shields}/3. Não abuse dessa proteção.`);

        }, 500);

        saveGameData();
        updateUI();
        return;
    }

    // ── Determina nível da penalidade ────────────────────────────────────────
    let xpPenaltyPct, streakReset, skillPenalty, debuffDurationMs, irohTone;

    if (misses >= 5) {
        xpPenaltyPct    = 0.40;
        streakReset     = true;
        skillPenalty    = true;
        debuffDurationMs = 48 * 3600000; // 48h
        irohTone        = 'severe';
    } else if (misses >= 3) {
        xpPenaltyPct    = 0.25;
        streakReset     = true;
        skillPenalty    = true;
        debuffDurationMs = 24 * 3600000; // 24h
        irohTone        = 'angry';
    } else if (misses >= 2) {
        xpPenaltyPct    = 0.15;
        streakReset     = true;
        skillPenalty    = false;
        debuffDurationMs = 8 * 3600000; // 8h
        irohTone        = 'firm';
    } else {
        // misses === 1, sem escudo
        xpPenaltyPct    = 0.05;
        streakReset     = false;
        skillPenalty    = false;
        debuffDurationMs = 1 * 3600000; // 1h
        irohTone        = 'motivational';
    }

    //  Aplica penalidade de XP 
    const penalty = Math.max(5, Math.round(gameState.xp * xpPenaltyPct));
    gameState.xp  = Math.max(0, gameState.xp - penalty);

    // ── Reseta streak se necessário ─────────────────────────────────────────
    if (streakReset) {
        gameState.streak = 0;
        gameState.consecutiveStreak7Days = 0;
    }

    //  Aplica penalidade nas skills (-1 XP nas skills com falhas comuns) 
    if (skillPenalty && gameState.skills) {
        // Penaliza skills ligadas a quests não concluídas
        const failedSkills = new Set();
        (gameState.quests || []).forEach(q => {
            if (!q.completed && q.skill) failedSkills.add(q.skill);
        });
        const skillToMainAttr = {
            mental: 'willpower', routine: 'willpower',
            wisdom: 'intellect', productivity: 'intellect',
            physical: 'health', social: 'health'
        };

        failedSkills.forEach(skillType => {
            const sk = gameState.skills[skillType];
            if (sk && sk.xp > 0) {
                sk.xp = Math.max(0, sk.xp - 1);

                // Animação de piscada na barra principal correspondente
                const mainAttr = skillToMainAttr[skillType];
                if (mainAttr) {
                    const el = document.querySelector(`.attr-bar-item.${mainAttr}`);
                    if (el) {
                        el.classList.add('flash-red-penalty');
                        setTimeout(() => {
                            if (el) el.classList.remove('flash-red-penalty');
                        }, 1500);
                    }
                }
            }
        });
    }

    //  Debuff visual no player card 
    const card = document.getElementById('player-card');
    if (card) {
        card.classList.add('debuffed');
        setTimeout(() => card.classList.remove('debuffed'), debuffDurationMs);
    }

    //  Overlay de penalidade 
    document.getElementById('penalty-loss-text').innerText = `−${penalty} XP`;
    document.getElementById('penalty-overlay').style.display = 'flex';

    //  Mensagem do Iroh por tom 
    setTimeout(() => {
        const irohMessages = {
            motivational: `☀️ *SISTEMA:* Você falhou hoje, ${gameState.playerName || 'Guerreiro'}. Mas um tropeço não define sua jornada. _"A jornada mais longa começa com um único passo — e você ainda pode dar o de amanhã."_ Penalidade leve aplicada: −${penalty} XP. Levante-se.`,
            firm: `⚠️ *SISTEMA:* Dois dias, ${gameState.playerName || 'Guerreiro'}. O Sistema registrou. Sua sequência foi zerada. _"O rio que para de correr logo apodrece."_ −${penalty} XP deduzidos. Não deixe virar hábito.`,
            angry: `☠️ *SISTEMA:* Três dias consecutivos de falha. Penalidade severa aplicada. −${penalty} XP. Suas habilidades sofreram regressão. _"Você conhece seu potencial e ainda assim escolheu a fraqueza."_ Corrija isso agora.`,
            severe: `💀 *SISTEMA — ALERTA CRÍTICO:* Cinco dias ou mais sem cumprir suas missões. Penalidade máxima: −${penalty} XP. Debuff de 48h ativo. Regressão de habilidades aplicada. _"Um guerreiro que abandona sua disciplina por dias não é mais um guerreiro — é apenas alguém com o uniforme."_ Retorne. Agora.`
        };
        showSystemToast(irohMessages[irohTone]);

    }, 600);

    saveGameData();
    updateUI();
}

// ==========================================================================
// LOJA E TAVERNA (COMPRA DE BUFFS E COSMÉTICOS)
// ==========================================================================
function buyStoreItem(itemId) {
    const prices = {
        'buff_autoHeal': 100,
        'buff_doubleXp': 50,
        'buff_shield': 150,
        'title_implacavel': 300,
        'title_mestre': 300,
        'border_neonred': 500,
        'skin_shadow_master': 250,
        'skin_mist_monarch': 400,
        'skin_arise_emperor': 600
    };

    const cost = prices[itemId];
    if (!cost) return;

    if ((gameState.gold || 0) < cost) {
        showSystemToast(`⚠️ *OURO INSUFICIENTE.* O Sistema não faz caridade. Você precisa de ${cost} 💰.`);
        return;
    }

    // Processamento do Item
    if (itemId.startsWith('buff_')) {
        if (!gameState.buffs) gameState.buffs = { autoHeal: false, doubleXp: false, shieldDays: 0 };
        
        if (itemId === 'buff_autoHeal') {
            if (gameState.buffs.autoHeal) {
                showSystemToast("⚠️ Você já possui uma Poção de Cura ativa no inventário.");
                return;
            }
            gameState.buffs.autoHeal = true;
            showSystemToast("🧪 *POÇÃO COMPRADA!* Seu próximo erro será perdoado. O Sistema protege os preparados.");
        } 
        else if (itemId === 'buff_doubleXp') {
            if (gameState.buffs.doubleXp) {
                showSystemToast("⚠️ Seu Pergaminho já está ativo até meia-noite!");
                return;
            }
            gameState.buffs.doubleXp = true;
            showSystemToast("📜 *CONHECIMENTO ADQUIRIDO!* Todo XP ganho hoje será DOBRADO. Vá trabalhar.");
        }
        else if (itemId === 'buff_shield') {
            gameState.shields = (gameState.shields || 0) + 1;
            showSystemToast(`🛡️ *ESCUDO COMPRADO!* Você adicionou 1 carga ao seu escudo principal. Total: ${gameState.shields}`);
        }
    } 
    else if (itemId.startsWith('title_') || itemId.startsWith('border_')) {
        if (!gameState.inventory) gameState.inventory = { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' };
        if (!gameState.inventory.unlockedSkins) gameState.inventory.unlockedSkins = ['default'];
        
        const isTitle = itemId.startsWith('title_');
        const inventoryList = isTitle ? gameState.inventory.unlockedTitles : gameState.inventory.unlockedBorders;
        const activeKey = isTitle ? 'activeTitle' : 'activeBorder';
        const displayType = isTitle ? 'Título' : 'Borda';

        if (inventoryList.includes(itemId)) {
            // Se já tem, apenas equipa
            gameState.inventory[activeKey] = itemId;
            showSystemToast(`( *${displayType} Equipado(a)!* Atualizado no seu perfil.`);
            saveGameData();
            updateUI(); // Vai atualizar a UI do header
            return; // Retorna para não cobrar ouro de novo
        } else {
            // Compra e equipa
            inventoryList.push(itemId);
            gameState.inventory[activeKey] = itemId;
            showSystemToast(`💎 *${displayType} Desbloqueado(a) e Equipado(a)!*`);
        }
    }
    else if (itemId.startsWith('skin_')) {
        if (!gameState.inventory) gameState.inventory = { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' };
        if (!gameState.inventory.unlockedSkins) gameState.inventory.unlockedSkins = ['default'];

        // Requisitos de Rank (Nível)
        if (itemId === 'skin_shadow_master' && gameState.level < 10) {
            showSystemToast("⚠️ *BLOQUEADO.* Esta skin exige Rank C (Nível 10+) para ser adquirida.");
            return;
        }
        if (itemId === 'skin_mist_monarch' && gameState.level < 15) {
            showSystemToast("⚠️ *BLOQUEADO.* Esta skin exige Rank B (Nível 15+) para ser adquirida.");
            return;
        }
        if (itemId === 'skin_arise_emperor' && gameState.level < 20) {
            showSystemToast("⚠️ *BLOQUEADO.* Esta skin exige Rank A (Nível 20+) para ser adquirida.");
            return;
        }

        const unlockedSkins = gameState.inventory.unlockedSkins;
        if (unlockedSkins.includes(itemId)) {
            gameState.inventory.activeSkin = itemId;
            showSystemToast(`🎭 *Skin Equipada!* Seu avatar foi alterado.`);
            saveGameData();
            updateUI();
            return;
        } else {
            unlockedSkins.push(itemId);
            gameState.inventory.activeSkin = itemId;
            showSystemToast(`🎭 *Skin Desbloqueada e Equipada!*`);
        }
    }

    // Cobra o ouro
    gameState.gold -= cost;
    saveGameData();
    updateUI();
}

// ==========================================================================
// SISTEMA DE NOTIFICAÇÕES (TOASTS) E IMPACT QUOTES
// ==========================================================================

function showSystemToast(text, type = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let formattedText = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                            .replace(/_(.*?)_/g, '<em>$1</em>')
                            .replace(/\n/g, '<br>');
    
    toast.innerHTML = formattedText;
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

function showImpactQuote() {
    const modal = document.getElementById('modal-impact-quote');
    if (!modal) return;
    const textEl = document.getElementById('impact-quote-text');
    const authorEl = document.getElementById('impact-quote-author');
    
    const randomQuote = IMPACT_QUOTES[Math.floor(Math.random() * IMPACT_QUOTES.length)];
    textEl.innerText = `"${randomQuote.text}"`;
    authorEl.innerText = `— ${randomQuote.author}`;
    
    modal.style.display = 'flex';
}

document.getElementById('btn-quote-acknowledge')?.addEventListener('click', () => {
    document.getElementById('modal-impact-quote').style.display = 'none';
});
document.getElementById('close-quote-modal')?.addEventListener('click', () => {
    document.getElementById('modal-impact-quote').style.display = 'none';
});



// ==========================================================================
// PROCESSAMENTO DE EVENTOS E MODAIS
// ==========================================================================
function setupEventListeners() {
    // Quests
    document.getElementById('daily-quests-list')?.addEventListener('click', handleQuestAction);
    document.getElementById('side-quests-list')?.addEventListener('click', handleQuestAction);

    // Taverna
    // Modais
    const modalSq  = document.getElementById('modal-sidequest');
    const modalAv  = document.getElementById('modal-avatar-zoom');

    document.getElementById('btn-add-sidequest')?.addEventListener('click', () => { if (modalSq) modalSq.style.display = 'flex'; });
    document.getElementById('close-sq-modal')?.addEventListener('click', () => { if (modalSq) modalSq.style.display = 'none'; });

    const modalRw = document.getElementById('modal-reward');
    if (modalRw) {
        document.getElementById('close-rw-modal')?.addEventListener('click', () => modalRw.style.display = 'none');
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalSq) modalSq.style.display = 'none';
        if (e.target === modalAv) modalAv.style.display = 'none';
        if (modalRw && e.target === modalRw) modalRw.style.display = 'none';
        const modalWr = document.getElementById('modal-weekly-report');
        if (modalWr && e.target === modalWr) modalWr.style.display = 'none';
    });

    // Form: Side Quest
    document.getElementById('form-sidequest')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('sq-title').value;
        const icon = document.getElementById('sq-icon').value || '⚔️';
        const difficulty = document.getElementById('sq-difficulty').value;
        let xp = 25, gold = 15;
        if (difficulty === 'easy') { xp = 10; gold = 5; }
        else if (difficulty === 'hard') { xp = 50; gold = 30; }
        gameState.sideQuests.push({ id: 'sq-' + Date.now(), title, type: 'side', icon, difficulty, completed: false, xp, gold });
        saveGameData(); renderQuests();
        modalSq.style.display = 'none';
        document.getElementById('form-sidequest').reset();
    });

    // Form: Recompensa


    // Level Up Overlay
    document.getElementById('btn-close-levelup')?.addEventListener('click', () => {
        document.getElementById('level-up-overlay').style.display = 'none';
        saveGameData(); updateUI();
    });

    // Penalty Overlay
    document.getElementById('btn-close-penalty')?.addEventListener('click', () => {
        document.getElementById('penalty-overlay').style.display = 'none';
    });

    // Avatar Zoom
    document.getElementById('char-avatar-img')?.addEventListener('click', openAvatarZoom);
    document.getElementById('close-avatar-zoom')?.addEventListener('click', () => { if (modalAv) modalAv.style.display = 'none'; });

    // Relatório Semanal (Weekly Report)
    document.getElementById('btn-close-weekly-report')?.addEventListener('click', () => {
        document.getElementById('modal-weekly-report').style.display = 'none';
    });

    document.getElementById('btn-claim-weekly-report')?.addEventListener('click', () => {
        const btn = document.getElementById('btn-claim-weekly-report');
        if (btn) {
            const rewards = JSON.parse(btn.dataset.rewards || '{}');
            const weekStr = btn.dataset.week || '';
            claimWeeklyReport(rewards, weekStr);
        }
    });
}

// Abre o modal de zoom do avatar com o título correto e imagem ampliada
function openAvatarZoom() {
    const modal = document.getElementById('modal-avatar-zoom');
    const imgLarge = document.getElementById('img-avatar-large');
    const titleEl = document.getElementById('avatar-zoom-title');
    
    if (!modal || !imgLarge || !titleEl) return;
    
    let level = gameState.level;
    const rank = getRankForLevel(level);
    const rankKey = rank.css.replace('rank-', '');
    
    const activeSkin = gameState.inventory?.activeSkin || 'default';
    let src = '';
    let titleName = '';
    
    if (activeSkin !== 'default') {
        src = `avatars/${activeSkin}.png`;
        const skinNames = {
            'skin_shadow_master': 'Mestre das Sombras',
            'skin_mist_monarch': 'Monarca da Névoa',
            'skin_arise_emperor': 'Imperador Arise'
        };
        titleName = skinNames[activeSkin] || 'Skin Especial';
    } else {
        const prefixMap = { e: '1', d: '2', c: '3', b: '4', a: '5', s: '6' };
        const num = prefixMap[rankKey] || '1';
        src = `avatars/${num}.rank-${rankKey}.png`;
        const titleMap = { e: 'Recruta', d: 'Aventureiro', c: 'Caçador', b: 'Elite', a: 'Herói Lendário', s: 'O Sistema' };
        titleName = titleMap[rankKey] || 'Recruta';
    }
    
    imgLarge.src = src;
    imgLarge.onerror = () => { imgLarge.src = 'avatars/1.rank-e.png'; };
    titleEl.innerText = `${titleName} - Nível ${level}`;
    modal.style.display = 'flex';
}
function handleQuestAction(e) {
    const target = e.target;
    
    // Dungeon: clique no botão ou no card
    if (target.classList.contains('dungeon-btn') || target.closest('.dungeon-card')) {
        const btn = target.classList.contains('dungeon-btn')
            ? target
            : target.closest('.dungeon-card')?.querySelector('.dungeon-btn');
        if (btn?.dataset.dungeon) {
            completeDungeon();
            return;
        }
    }

    // Se for clique nos botões de ajustar água
    if (target.classList.contains('water-btn')) {
        const id = target.getAttribute('data-id');
        const operation = target.classList.contains('btn-plus') ? 'plus' : 'minus';
        adjustWater(id, operation);
        return;
    }
    
    // Caso contrário, se clicou em qualquer lugar no card, completa a quest
    const card = target.closest('.quest-card');
    if (card) {
        const btn = card.querySelector('.quest-complete-btn');
        if (btn) {
            const id = btn.getAttribute('data-id');
            toggleQuest(id);
        }
    }
}

// ==========================================================================
// PERSISTÊNCIA DE DADOS (LOCALSTORAGE)
// ==========================================================================
function saveGameData() {
    checkAchievements();
    localStorage.setItem('lifeRPG_gameState', JSON.stringify(gameState));
    if (typeof saveToCloud === 'function') saveToCloud();
    updateSWQuestStatus();
}

function fixEncoding(str) {
    if (typeof str !== 'string') return str;
    let current = str;
    for (let i = 0; i < 4; i++) {
        try {
            if (current.includes('Ã') || current.includes('â') || current.includes('Â')) {
                let decoded = decodeURIComponent(escape(current));
                if (decoded === current) break;
                current = decoded;
            } else {
                break;
            }
        } catch (e) {
            break;
        }
    }
    return current;
}

function cleanObjectEncoding(obj) {
    if (!obj) return obj;
    if (typeof obj === 'string') {
        return fixEncoding(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => cleanObjectEncoding(item));
    }
    if (typeof obj === 'object') {
        const newObj = {};
        for (const [key, val] of Object.entries(obj)) {
            newObj[key] = cleanObjectEncoding(val);
        }
        return newObj;
    }
    return obj;
}

function loadGameData() {
    // FORÇAR RESET ÚNICO PEDIDO PELO USUÁRIO (Nível 1, 0 Gold, 0 Streak)
    if (localStorage.getItem('force_reset_v3') !== 'true') {
        localStorage.removeItem('lifeRPG_gameState');
        localStorage.setItem('force_reset_v3', 'true');
        gameState = {
            level: 1,
            xp: 0,
            xpToNext: 100,
            gold: 0,
            streak: 0,
            history: {},
            shields: 0,
            consecutiveStreak7Days: 0,
            consecutiveMisses: 0,
            bossQuest: null,
            activeDungeon: null,
            weeklyBoss: null,
            lastCheckedDate: localDateStr(),
            unlockedAchievements: [],
            quests: [],
            sideQuests: [],
            rewards: [
                { id: 'r-serie', title: 'Assistir 1 Hora de Série', cost: 35, icon: '📺' },
                { id: 'r-cheat', title: 'Refeição Livre / Doce', cost: 80, icon: '🍔' },
                { id: 'r-game',  title: 'Jogar Videogame por 1h',  cost: 45, icon: '🎮' }
            ],
            skills: {
                physical:     { level: 1, xp: 0, xpToNext: 5 },
                mental:       { level: 1, xp: 0, xpToNext: 5 },
                productivity: { level: 1, xp: 0, xpToNext: 5 },
                social:       { level: 1, xp: 0, xpToNext: 5 },
                wisdom:       { level: 1, xp: 0, xpToNext: 5 },
                routine:      { level: 1, xp: 0, xpToNext: 5 }
            },
            messages: [],
            notificationTimes: {
                morningHour: 7, morningMin: 0,
                eveningHour: 19, eveningMin: 0
            },
            history: {}, // Store daily logs { "2026-06-08": { status: "perfect", count: 3, total: 3, completedIds: [] } }
            buffs: { autoHeal: false, doubleXp: false, shieldDays: 0 },
            inventory: { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' },
            lastWeeklyReportYearWeek: ""
        };
        saveGameData();
        window.location.reload();
        return;
    }

    // Migration from old key to new key
    let data = localStorage.getItem('lifeRPG_gameState');
    if (!data) {
        const oldData = localStorage.getItem('lifeRPG_gameState_Mateus');
        if (oldData) {
            data = oldData;
            localStorage.setItem('lifeRPG_gameState', data);
            localStorage.removeItem('lifeRPG_gameState_Mateus');
        }
    }

    if (data) {
        const parsed = cleanObjectEncoding(JSON.parse(data));
        
        // Sanitização de ícones corrompidos no LocalStorage
        const CLEAN_ICONS = {
            'q-cama': '🛏️',
            'q-db-acordar': '🌅',
            'q-db-malhar': '🏋️‍♂️',
            'q-db-ler': '📚',
            'q-db-meditar': '🧘',
            'q-db-agua': '💧',
            'q-db-familia': '❤️',
            'q-db-deepwork': '💻',
            'q-db-estudo': '🧠',
            'q-db-checkin': '📝',
            'q-db-estoico': '🏛️',
            'q-db-producao': '✍️',
            'q-agua': '💧',
            'q-ler': '📚',
            'q-meditar': '🧘',
            'q-foco': '🎯',
            'q-acordar': '🌅',
            'q-agua2': '💧',
            'q-malhar': '🏋️‍♂️',
            'q-estudo': '💻',
            'q-detox': '📵',
            'q-social': '❤️',
            'r-serie': '📺',
            'r-cheat': '🍔',
            'r-game': '🎮'
        };
        const isCorrupted = (icon) => {
            if (!icon || typeof icon !== 'string') return true;
            for (let charIdx = 0; charIdx < icon.length; charIdx++) {
                const code = icon.charCodeAt(charIdx);
                if (code < 32 && code !== 9 && code !== 10 && code !== 13) return true;
            }
            if (icon.includes('Ã') || icon.includes('â') || icon.includes('Â')) return true;
            return false;
        };

        if (parsed.quests && Array.isArray(parsed.quests)) {
            parsed.quests.forEach(q => {
                if (CLEAN_ICONS[q.id]) q.icon = CLEAN_ICONS[q.id];
                else if (q.baseId && CLEAN_ICONS[q.baseId]) q.icon = CLEAN_ICONS[q.baseId];
                else if (isCorrupted(q.icon)) q.icon = '❓';
            });
        }
        if (parsed.sideQuests && Array.isArray(parsed.sideQuests)) {
            parsed.sideQuests.forEach(q => {
                if (CLEAN_ICONS[q.id]) q.icon = CLEAN_ICONS[q.id];
                else if (q.baseId && CLEAN_ICONS[q.baseId]) q.icon = CLEAN_ICONS[q.baseId];
                else if (isCorrupted(q.icon)) q.icon = '❓';
            });
        }
        if (parsed.rewards && Array.isArray(parsed.rewards)) {
            parsed.rewards.forEach(r => {
                if (CLEAN_ICONS[r.id]) r.icon = CLEAN_ICONS[r.id];
                else if (isCorrupted(r.icon)) r.icon = '🎁';
            });
        }
        
        // Migration: Ensure history exists
        if (!parsed.history) {
            parsed.history = {};
        }

        // MOCK DATA (Gera 90 dias caso não exista histórico e o level for > 1)
        if (Object.keys(parsed.history).length === 0 && parsed.level > 1) {
            const now = new Date();
            const statuses = ['missed', 'bad', 'good', 'perfect', 'perfect', 'good'];
            for (let i = 1; i <= 90; i++) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                let count = 0, total = 8;
                if (randomStatus === 'perfect') count = 8;
                else if (randomStatus === 'good') count = 5;
                else if (randomStatus === 'bad') count = 2;
                
                parsed.history[localDateStr(d)] = { status: randomStatus, count: count, total: total };
            }
        }

        if (!parsed.lastWeeklyReportYearWeek) {
            parsed.lastWeeklyReportYearWeek = "";
        }

        // Migration: Ensure buffs and inventory exist
        if (!parsed.buffs) {
            parsed.buffs = { autoHeal: false, doubleXp: false, shieldDays: 0 };
        }
        if (!parsed.inventory) {
            parsed.inventory = { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' };
        } else {
            if (!parsed.inventory.unlockedTitles) parsed.inventory.unlockedTitles = [];
            if (!parsed.inventory.unlockedBorders) parsed.inventory.unlockedBorders = [];
            if (!parsed.inventory.unlockedSkins) parsed.inventory.unlockedSkins = ['default'];
            if (!parsed.inventory.activeSkin) parsed.inventory.activeSkin = 'default';
            
            // Garantir que nulos sejam usados em vez de string vazia ou "default"
            if (parsed.inventory.activeTitle === "" || parsed.inventory.activeTitle === "default") parsed.inventory.activeTitle = null;
            if (parsed.inventory.activeBorder === "" || parsed.inventory.activeBorder === "default") parsed.inventory.activeBorder = null;

            if (parsed.inventory.activeTitle && !parsed.inventory.unlockedTitles.includes(parsed.inventory.activeTitle)) {
                parsed.inventory.unlockedTitles.push(parsed.inventory.activeTitle);
            }
            if (parsed.inventory.activeBorder && !parsed.inventory.unlockedBorders.includes(parsed.inventory.activeBorder)) {
                parsed.inventory.unlockedBorders.push(parsed.inventory.activeBorder);
            }
        }

        // Verifica reset diário
        const todayStr = localDateStr();
        if (parsed.lastCheckedDate && parsed.lastCheckedDate !== todayStr) {
            const completedCount = (parsed.quests || []).filter(q => q.completed).length;
            const totalCount = (parsed.quests || []).length;
            const allWereDone = completedCount >= totalCount && totalCount > 0;
            
            // Grava o Histórico do dia anterior
            let dailyStatus = 'missed';
            if (totalCount > 0) {
                const pct = completedCount / totalCount;
                if (completedCount === 0) dailyStatus = 'missed';
                else if (pct < 0.5) dailyStatus = 'bad';
                else if (pct < 1.0) dailyStatus = 'good';
                else dailyStatus = 'perfect';
            }

            // Identifica se era um dia ativo (para evitar punir dias de descanso)
            const oldDateObj = new Date(parsed.lastCheckedDate);
            const isRestDay = parsed.activeDays && !parsed.activeDays.includes(oldDateObj.getDay());
            if (isRestDay && dailyStatus === 'missed') {
                dailyStatus = 'skipped';
            }

            parsed.history[parsed.lastCheckedDate] = {
                status: dailyStatus,
                count: completedCount,
                total: totalCount,
                completedIds: (parsed.quests || []).filter(q => q.completed).map(q => q.title) // salva nomes
            };

            // Verifica penalidade
            if (!allWereDone && (parsed.streak || 0) > 0 && !isRestDay) {
                // Penalidade adiada para depois do DOM estar pronto
                setTimeout(() => applyDailyPenalty(), 2000);
            }
            // Reseta hábitos diários para um novo dia
            parsed.quests.forEach(q => {
                q.completed = false;
                if (q.current !== undefined) q.current = 0;
            });
            // Limpa as side quests concluídas
            if (parsed.sideQuests) {
                parsed.sideQuests = parsed.sideQuests.filter(sq => !sq.completed);
            }
            // Reseta flags de perks diários
            parsed._firstQuestBonusGiven = false;
            parsed._momentumStack = 0;
            
            parsed.lastCheckedDate = todayStr;
        } else if (!parsed.lastCheckedDate) {
            parsed.lastCheckedDate = todayStr;
        }

        gameState = parsed;
        
        // Sanitize legacy corrupted icons in saved quests
        if (gameState.quests) {
            gameState.quests.forEach(q => {
                if (q.id === 'q-cama' && (!q.icon || q.icon.includes('<') || q.icon.includes('\u0005'))) {
                    q.icon = '🛏️';
                }
            });
        }

        if (typeof gameState.streak !== 'number') {
            gameState.streak = parseInt(gameState.streak) || 0;
        }
        initSkillsState(); // Garante inicialização das skills caso seja um save antigo
        
        // Inicializa campos novos caso seja um save antigo
        if (gameState.shields === undefined) gameState.shields = 0;
        if (gameState.consecutiveStreak7Days === undefined) gameState.consecutiveStreak7Days = 0;
        if (gameState.consecutiveMisses === undefined) gameState.consecutiveMisses = 0;
        if (gameState.bossQuest === undefined) gameState.bossQuest = null;
        if (gameState.activeDungeon === undefined) gameState.activeDungeon = null;
        if (gameState.weeklyBoss === undefined) gameState.weeklyBoss = null;
        if (gameState.unlockedAchievements === undefined) gameState.unlockedAchievements = [];
        if (gameState._dungeonsCompleted === undefined) gameState._dungeonsCompleted = 0;

        if (!gameState.notificationTimes) {
            gameState.notificationTimes = { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 };
        }
    } else {
        gameState.lastCheckedDate = localDateStr();
        gameState.notificationTimes = { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 };
        initSkillsState();
    }
    
    // Garante que a lista de hábitos esteja sincronizada com o nível atual na carga do app
    syncQuestsByLevel();

    // Dungeons e Boss: verifica expiração e gera se não houver ativa
    checkDungeonExpiry();
    checkWeeklyBossExpiry();
    if (!gameState.activeDungeon && hasSkillLV3()) {
        setTimeout(() => spawnDungeon(), 3000);
    }
}

// ==========================================================================
// CONFIGURAÇÕES & PWA MOBILE ENGINE
// ==========================================================================
let serviceWorkerRegistration = null;
let deferredPrompt = null;

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                serviceWorkerRegistration = reg;
                console.log('[App] SW Registrado:', reg.scope);
                
                // Configura notificações iniciais assim que o SW estiver pronto
                navigator.serviceWorker.ready.then(() => {
                    updateSWNotifications();
                });
            })
            .catch(err => {
                console.error('[App] Erro SW:', err);
            });
    }
}

function setupSettingsListeners() {
    const modalSettings = document.getElementById('modal-settings');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('close-settings-modal');

    if (btnOpenSettings && modalSettings && btnCloseSettings) {
        btnOpenSettings.addEventListener('click', () => {
            loadSettingsToUI();
            updateNotificationPermissionUI();
            modalSettings.style.display = 'flex';
        });
        
        btnCloseSettings.addEventListener('click', () => {
            modalSettings.style.display = 'none';
        });

        // Salvar configurações do Claude IA
        const btnSaveClaude = document.getElementById('btn-save-claude');
        if (btnSaveClaude) {
            btnSaveClaude.addEventListener('click', () => {
                const keyInput = document.getElementById('settings-claude-key');
                const urlInput = document.getElementById('settings-claude-url');
                if (keyInput && urlInput) {
                    localStorage.setItem('lifeRPG_claude_key', keyInput.value.trim());
                    localStorage.setItem('lifeRPG_claude_url', urlInput.value.trim());
                    showSystemToast('🍵 Configurações do Mentor salvas com sucesso!');
                    
                    // UI feedback
                    const originalText = btnSaveClaude.innerText;
                    btnSaveClaude.innerText = '✓ SALVO';
                    btnSaveClaude.style.background = 'linear-gradient(90deg, var(--neon-green), #34d399)';
                    setTimeout(() => {
                        btnSaveClaude.innerText = originalText;
                        btnSaveClaude.style.background = '';
                    }, 1500);
                }
            });
        }

        // Clique fora para fechar
        window.addEventListener('click', (e) => {
            if (e.target === modalSettings) {
                modalSettings.style.display = 'none';
            }
        });
    }

    // Solicitar permissão de notificação
    const btnRequestNotif = document.getElementById('btn-request-notif');
    if (btnRequestNotif) {
        btnRequestNotif.addEventListener('click', () => {
            if ('Notification' in window) {
                Notification.requestPermission().then(() => {
                    updateNotificationPermissionUI();
                    updateSWNotifications();
                });
            }
        });
    }

    // Salvar horários
    const btnSaveNotif = document.getElementById('btn-save-notif');
    if (btnSaveNotif) {
        btnSaveNotif.addEventListener('click', () => {
            const morningHour = Math.min(23, Math.max(0, parseInt(document.getElementById('notif-morning-hour').value) || 0));
            const morningMin = Math.min(59, Math.max(0, parseInt(document.getElementById('notif-morning-min').value) || 0));
            const eveningHour = Math.min(23, Math.max(0, parseInt(document.getElementById('notif-evening-hour').value) || 0));
            const eveningMin = Math.min(59, Math.max(0, parseInt(document.getElementById('notif-evening-min').value) || 0));

            gameState.notificationTimes = { morningHour, morningMin, eveningHour, eveningMin };
            saveGameData();
            updateSWNotifications();
            
            // UI feedback
            const originalText = btnSaveNotif.innerText;
            btnSaveNotif.innerText = '✓ SALVO';
            btnSaveNotif.style.background = 'linear-gradient(90deg, var(--neon-green), #34d399)';
            setTimeout(() => {
                btnSaveNotif.innerText = originalText;
                btnSaveNotif.style.background = '';
            }, 1500);
        });
    }

    // Testar notificação
    const btnTestNotif = document.getElementById('btn-test-notif');
    if (btnTestNotif) {
        btnTestNotif.addEventListener('click', () => {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'TEST_NOTIFICATION'
                });
            } else {
                alert('Service Worker não está ativo ou não foi registrado. Aguarde e tente novamente.');
            }
        });
    }

    // Exportar Save
    const btnExportSave = document.getElementById('btn-export-save');
    if (btnExportSave) {
        btnExportSave.addEventListener('click', () => {
            try {
                const payload = JSON.stringify(gameState, null, 2);
                const blob = new Blob([payload], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const ts = new Date().toISOString().slice(0,10);
                a.href = url;
                a.download = `thesystem-backup-${ts}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                setTimeout(() => showSystemToast('💾 *BACKUP EXPORTADO!* Seu arquivo de save foi baixado com sucesso. Guarde-o em local seguro — ele é sua memória.'), 300);
            } catch(err) {
                showSystemToast('⚠️ Erro ao exportar o save. Tente novamente.');
            }
        });
    }

    // Importar Save
    const fileInputImport = document.getElementById('import-save-file');
    if (fileInputImport) {
        fileInputImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (parsed.hasOwnProperty('level') && parsed.hasOwnProperty('xp') && parsed.hasOwnProperty('gold')) {
                        localStorage.setItem('lifeRPG_gameState', JSON.stringify(parsed));
                        // Toast antes do reload
                        showSystemToast('📥 *SAVE IMPORTADO!* Memória restaurada com sucesso. O Sistema está reiniciando...');
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        showSystemToast('⚠️ *ARQUIVO INVÁLIDO.* O arquivo não parece ser um backup válido do The System.');
                    }
                } catch (err) {
                    showSystemToast('L *ERRO AO IMPORTAR.* Arquivo corrompido ou formato desconhecido.');
                }
            };
            reader.readAsText(file);
        });
    }

    // Hard Reset (Destruição do Sistema)
    const btnHardReset = document.getElementById('btn-hard-reset');
    if (btnHardReset) {
        btnHardReset.addEventListener('click', () => {
            const confirmed = confirm("🔥 TEM CERTEZA QUE DESEJA APAGAR TODO O SEU PROGRESSO?\n\nEsta ação destruirá seu histórico, atributos, missões e inventário. Você voltará ao nível 1 e o Onboarding será reiniciado.\n\nESTA AÇÃO NÃO PODE SER DESFEITA.");
            if (confirmed) {
                localStorage.removeItem('lifeRPG_gameState');
                localStorage.removeItem('force_reset_v3');
                alert("O Sistema foi resetado. Reiniciando simulação...");
                window.location.reload();
            }
        });
    }
}

// Carrega as configurações guardadas para a UI dos inputs
function loadSettingsToUI() {
    const times = gameState.notificationTimes || { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 };
    
    const pad = (n) => String(n).padStart(2, '0');
    
    document.getElementById('notif-morning-hour').value = times.morningHour;
    document.getElementById('notif-morning-min').value = pad(times.morningMin);
    document.getElementById('notif-evening-hour').value = times.eveningHour;
    document.getElementById('notif-evening-min').value = pad(times.eveningMin);

    // Claude IA credentials loading
    const key = localStorage.getItem('lifeRPG_claude_key') || '';
    const url = localStorage.getItem('lifeRPG_claude_url') || 'https://api.anthropic.com/v1/messages';
    const keyInput = document.getElementById('settings-claude-key');
    const urlInput = document.getElementById('settings-claude-url');
    if (keyInput) keyInput.value = key;
    if (urlInput) urlInput.value = url;
}

// Atualiza a badge visual de permissão
function updateNotificationPermissionUI() {
    const badge = document.getElementById('notif-permission-badge');
    const btnRequest = document.getElementById('btn-request-notif');
    
    if (!badge) return;
    
    if (!('Notification' in window)) {
        badge.innerText = 'NÃO SUPORTADO';
        badge.className = 'badge-status-denied';
        if (btnRequest) btnRequest.style.display = 'none';
        return;
    }
    
    const perm = Notification.permission;
    if (perm === 'granted') {
        badge.innerText = 'CONCEDIDO';
        badge.className = 'badge-status-granted';
        if (btnRequest) btnRequest.style.display = 'none';
    } else if (perm === 'denied') {
        badge.innerText = 'BLOQUEADO';
        badge.className = 'badge-status-denied';
        if (btnRequest) btnRequest.style.display = 'inline-block';
    } else {
        badge.innerText = 'NÃO CONFIGURADO';
        badge.className = 'badge-status-neutral';
        if (btnRequest) btnRequest.style.display = 'inline-block';
    }
}

// Reschedule notifications in SW
function updateSWNotifications() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const times = gameState.notificationTimes || { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 };
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATIONS',
            ...times
        });
    }
}

// Envia status de missões pendentes para o Service Worker
function updateSWQuestStatus() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const pendingCount = (gameState.quests || []).filter(q => !q.completed).length;
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_QUEST_STATUS',
            pendingCount: pendingCount
        });
    }
}

// PWA Install promotion banner
function setupInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    const btnInstall = document.getElementById('btn-pwa-install');
    const btnDismiss = document.getElementById('btn-pwa-dismiss');
    const instructionsText = document.getElementById('install-banner-instructions');
    const btnFooterInstall = document.getElementById('btn-pwa-install-footer');

    // Detecta se é iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone) {
        console.log('[PWA] Rodando em standalone mode.');
        // Esconde o botão de rodapé e banner quando já instalado
        if (btnFooterInstall) btnFooterInstall.style.display = 'none';
        const footerWrapper = document.querySelector('.pwa-install-mobile-footer');
        if (footerWrapper) footerWrapper.style.display = 'none';
        return; // PWA já instalado e ativo
    }

    // === Botão de rodapé — SEMPRE visível (CSS já faz display:block) ===
    if (btnFooterInstall) {
        btnFooterInstall.addEventListener('click', () => {
            if (isIOS) {
                // iOS não suporta prompt nativo — mostra instruções manuais
                alert('Para instalar no iPhone/iPad:\n\n1. Toque no ícone de "Compartilhar" (quadrado com seta ↑ no Safari)\n2. Role a lista e toque em "Adicionar à Tela de Início"');
            } else if (deferredPrompt) {
                // Android/Desktop com prompt nativo disponível
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        btnFooterInstall.style.display = 'none';
                        const footerWrapper = document.querySelector('.pwa-install-mobile-footer');
                        if (footerWrapper) footerWrapper.style.display = 'none';
                    }
                    deferredPrompt = null;
                });
            } else {
                // Fallback: prompt nativo não disponível
                alert('Para instalar o LifeRPG:\n\n• No Chrome: Toque no menu (⋮) → "Instalar app" ou "Adicionar à tela de início"\n• No Safari: Toque em Compartilhar → "Adicionar à Tela de Início"\n• No Firefox: Toque no menu → "Instalar"');
            }
        });
    }

    // === Banner flutuante — lógica original ===
    if (isIOS) {
        if (instructionsText && btnInstall) {
            instructionsText.innerText = 'Para instalar no iOS: Toque em Compartilhar e depois "Adicionar à Tela de Início".';
            btnInstall.style.display = 'none';
        }
        setTimeout(() => {
            if (banner && localStorage.getItem('pwa_install_dismissed') !== 'true') {
                banner.classList.add('show');
            }
        }, 3000);
    } else {
        // Android/Desktop — captura o prompt nativo
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            if (banner && localStorage.getItem('pwa_install_dismissed') !== 'true') {
                banner.classList.add('show');
            }
        });
    }

    // Banner install button click (do banner flutuante)
    if (btnInstall) {
        btnInstall.addEventListener('click', () => {
            if (!deferredPrompt) return;
            if (banner) banner.classList.remove('show');
            
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('[PWA] Usuário aceitou a instalação.');
                    if (btnFooterInstall) btnFooterInstall.style.display = 'none';
                    const footerWrapper = document.querySelector('.pwa-install-mobile-footer');
                    if (footerWrapper) footerWrapper.style.display = 'none';
                }
                deferredPrompt = null;
            });
        });
    }

    // Banner dismiss button
    if (btnDismiss) {
        btnDismiss.addEventListener('click', () => {
            if (banner) banner.classList.remove('show');
            localStorage.setItem('pwa_install_dismissed', 'true');
        });
    }
}

// ==========================================================================
// ABA VISÃO GLOBAL E HEATMAP
// ==========================================================================
function renderGlobalDashboard() {
    const tabGlobal = document.getElementById('tab-global');
    if (!tabGlobal || !tabGlobal.classList.contains('active')) return;

    const history = gameState.history || {};
    const dates = Object.keys(history).sort((a,b) => new Date(a) - new Date(b));
    
    const emptyStateEl = document.getElementById('global-empty-state');
    if (dates.length === 0) {
        if (emptyStateEl) emptyStateEl.style.display = 'block';
        Array.from(tabGlobal.children).forEach(child => {
            if (child.id !== 'global-empty-state' && !child.classList.contains('section-title')) {
                child.style.display = 'none';
            }
        });
        return;
    } else {
        if (emptyStateEl) emptyStateEl.style.display = 'none';
        Array.from(tabGlobal.children).forEach(child => {
            if (child.id !== 'global-empty-state' && !child.classList.contains('section-title')) {
                if (child.classList.contains('dashboard-metrics-grid')) {
                    child.style.display = 'grid';
                } else if (child.classList.contains('pwa-install-mobile-footer')) {
                    child.style.display = '';
                } else {
                    child.style.display = 'block';
                }
            }
        });
    }
    
    // 1. Preencher Heatmap Anual (365 dias)
    const heatmapGrid = document.getElementById('heatmap-grid');
    if(heatmapGrid) heatmapGrid.innerHTML = '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Dia inicial (364 dias atrás + hoje = 365)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    // Padding para alinhar verticalmente (Semana começa domingo = 0)
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyBlock = document.createElement('div');
        emptyBlock.className = 'hm-block hm-empty';
        if(heatmapGrid) heatmapGrid.appendChild(emptyBlock);
    }

    for (let i = 0; i < 365; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        
        const dateStr = d.toDateString();
        const log = history[dateStr];
        
        const block = document.createElement('div');
        block.className = 'hm-block';
        
        if (log) {
            block.classList.add(`hm-${log.status}`);
            block.title = `${dateStr}: ${log.count}/${log.total} completos`;
        } else {
            block.title = `${dateStr}: Sem dados`;
        }
        if(heatmapGrid) heatmapGrid.appendChild(block);
    }

    // Rola para o final para mostrar "hoje"
    if (heatmapGrid && heatmapGrid.parentElement) {
        // setTimeout para garantir que a renderização no DOM rolou antes do scroll
        setTimeout(() => {
            heatmapGrid.parentElement.scrollLeft = heatmapGrid.parentElement.scrollWidth;
        }, 10);
    }

    // 2. Preencher Métricas de Topo
    let totalHabitsDone = 0;
    let totalMissed = 0;
    let perfectDays = 0;
    let totalDaysLogged = dates.length;

    let monthlyData = new Array(12).fill(0); // [Jan, Fev, ... Dez]
    let habitCounts = {};

    dates.forEach(d => {
        const log = history[d];
        totalHabitsDone += log.count;
        totalMissed += (log.total - log.count);
        if (log.status === 'perfect') perfectDays++;
        
        const month = new Date(d).getMonth();
        monthlyData[month] += log.count;

        (log.completedIds || []).forEach(habitTitle => {
            habitCounts[habitTitle] = (habitCounts[habitTitle] || 0) + 1;
        });
    });

    const elHabits = document.getElementById('dash-total-habits');
    const elPerfect = document.getElementById('dash-perfect-days');
    const elMissed = document.getElementById('dash-total-missed');
    const elRhythm = document.getElementById('dash-rhythm');
    
    if(elHabits) elHabits.innerText = totalHabitsDone;
    if(elPerfect) elPerfect.innerText = perfectDays;
    if(elMissed) elMissed.innerText = totalMissed;
    
    const rhythm = totalDaysLogged > 0 ? Math.round((perfectDays / totalDaysLogged) * 100) : 0;
    if(elRhythm) elRhythm.innerText = rhythm + '%';

    // 3. Gráfico de Barras Mensais
    const barChart = document.getElementById('dash-bar-chart');
    if(barChart) {
        barChart.innerHTML = '';
        const monthsNames = ['J','F','M','A','M','J','J','A','S','O','N','D'];
        const maxMonthly = Math.max(...monthlyData, 1); // Evita divisão por zero

        for (let i = 0; i < 12; i++) {
            const hPercent = (monthlyData[i] / maxMonthly) * 100;
            
            const col = document.createElement('div');
            col.className = 'dash-bar-col';
            col.innerHTML = `
                <div class="dash-bar-fill" style="height: ${hPercent}%" title="${monthlyData[i]} hábitos em ${monthsNames[i]}"></div>
                <div class="dash-bar-lbl">${monthsNames[i]}</div>
            `;
            barChart.appendChild(col);
        }
    }

    // 4. Top Hábitos
    const topHabitsContainer = document.getElementById('dash-top-habits');
    if(topHabitsContainer) {
        topHabitsContainer.innerHTML = '';
        
        const sortedHabits = Object.entries(habitCounts).sort((a,b) => b[1] - a[1]);
        const top5 = sortedHabits.slice(0, 5);
        const maxHabitCount = top5.length > 0 ? top5[0][1] : 1;

        if (top5.length === 0) {
            topHabitsContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; text-align:center;">Nenhum dado registrado ainda.</p>';
        } else {
            top5.forEach(([name, count]) => {
                const wPercent = (count / maxHabitCount) * 100;
                const row = document.createElement('div');
                row.className = 'dash-habit-row';
                row.innerHTML = `
                    <div class="dash-habit-name" title="${name}">${name}</div>
                    <div class="dash-habit-bar-bg">
                        <div class="dash-habit-bar-fill" style="width: ${wPercent}%"></div>
                    </div>
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-left:8px; width:20px; text-align:right;">${count}</div>
                `;
                topHabitsContainer.appendChild(row);
            });
        }
    }
}

// ==========================================================================
// CLOUD SAVE (FIREBASE)
// ==========================================================================
let db = null;
let currentUser = null;

function initFirebase() {
    try {
        if (typeof firebase === 'undefined') return;
        db = firebase.firestore();
        firebase.auth().onAuthStateChanged(async (user) => {
            currentUser = user;
            updateCloudUI(user);
            if (user) {
                await syncFromCloud();
            }
        });

        // Listeners UI
        const btnLogin = document.getElementById('btn-cloud-login');
        const btnLogout = document.getElementById('btn-cloud-logout');
        
        if (btnLogin) {
            btnLogin.addEventListener('click', async () => {
                const provider = new firebase.auth.GoogleAuthProvider();
                try {
                    await firebase.auth().signInWithPopup(provider);
                } catch(e) {
                    console.warn('[Cloud] Erro no login:', e);
                    showSystemToast('⚠️ Erro ao conectar com Google.');
                }
            });
        }
        
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                await firebase.auth().signOut();
                currentUser = null;
                showSystemToast('Sessão encerrada.');
            });
        }
    } catch(e) {
        console.warn('[Cloud] Firebase não disponível:', e);
    }
}

async function saveToCloud() {
    if (!db || !currentUser) return;
    try {
        const payload = { ...gameState, _savedAt: Date.now(), _version: 3 };
        await db.collection('saves').doc(currentUser.uid).set(payload);
    } catch(e) {
        console.warn('[Cloud] Erro ao salvar:', e);
    }
}

async function syncFromCloud() {
    if (!db || !currentUser) return;
    try {
        const doc = await db.collection('saves').doc(currentUser.uid).get();
        if (!doc.exists) {
            // Primeiro login: sobe o save local
            await saveToCloud();
            showSystemToast('☁️ *SAVE ENVIADO PARA A NUVEM!* Sua conta foi criada.');
            return;
        }
        const cloudState = doc.data();
        const localLevel = gameState.level || 1;
        const cloudLevel = cloudState.level || 1;
        const localStreak = gameState.streak || 0;
        const cloudStreak = cloudState.streak || 0;

        const cloudWins = cloudLevel > localLevel || (cloudLevel === localLevel && cloudStreak > localStreak);

        if (cloudWins) {
            Object.assign(gameState, cloudState);
            saveGameData(); 
            updateUI();
            showSystemToast('🔄 *SAVE SINCRONIZADO!* Progresso atualizado da nuvem.');
        } else {
            await saveToCloud();
        }
    } catch(e) {
        console.warn('[Cloud] Erro ao sincronizar:', e);
    }
}

function updateCloudUI(user) {
    const el = document.getElementById('cloud-sync-status');
    const btnLogin = document.getElementById('btn-cloud-login');
    const btnLogout = document.getElementById('btn-cloud-logout');
    if (!el) return;
    
    if (user) {
        const name = user.displayName || (user.isAnonymous ? 'Anônimo' : user.email);
        el.innerHTML = `<span class="cloud-dot online"></span> Online`;
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'inline-flex';
    } else {
        el.innerHTML = `<span class="cloud-dot offline"></span> Não sincronizado`;
        if (btnLogin) btnLogin.style.display = 'inline-flex';
        if (btnLogout) btnLogout.style.display = 'none';
    }
}

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

function checkAndShowWeeklyReport() {
    const today = new Date();
    const currentWeekStr = getISOWeekString(today);
    
    const prevWeekDate = new Date(today);
    prevWeekDate.setDate(today.getDate() - 7);
    const prevWeekStr = getISOWeekString(prevWeekDate);
    
    if (!gameState.history || Object.keys(gameState.history).length === 0) return;
    if (gameState.lastWeeklyReportYearWeek === prevWeekStr) return;
    
    const { dates, mondayDate, sundayDate } = getPreviousWeekDates(today);
    
    let completedQuests = 0;
    let totalQuests = 0;
    let perfectDays = 0;
    let goodDays = 0;
    let missedDays = 0;
    let activeDaysCount = 0;
    const completedTitles = [];
    
    dates.forEach(dStr => {
        const log = gameState.history[dStr];
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
        gameState.lastWeeklyReportYearWeek = prevWeekStr;
        saveGameData();
        return;
    }
    
    const survivalRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;
    
    const skillCounts = {};
    const allQuests = [...(gameState.quests || []), ...(gameState.sideQuests || [])];
    
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
    
    let rankLabel = 'RANK D';
    let rankClass = 'rank-glow-d';
    let goldReward = 0;
    let xpReward = 0;
    let verdictDesc = '';
    
    if (survivalRate >= 90) {
        rankLabel = 'RANK S';
        rankClass = 'rank-glow-s';
        goldReward = 80;
        xpReward = 150;
        verdictDesc = '"Desempenho lendário. Suas habilidades crescem em ritmo avassalador. O topo do mundo está ao seu alcance."';
    } else if (survivalRate >= 75) {
        rankLabel = 'RANK A';
        rankClass = 'rank-glow-a';
        goldReward = 50;
        xpReward = 100;
        verdictDesc = '"Desempenho formidável. O Sistema reconhece seu vigor e determinação. Continue subindo de nível."';
    } else if (survivalRate >= 50) {
        rankLabel = 'RANK B';
        rankClass = 'rank-glow-b';
        goldReward = 30;
        xpReward = 60;
        verdictDesc = '"Progresso aceitável. Suas conquistas são constantes, mas a complacência é sua maior inimiga."';
    } else if (survivalRate >= 30) {
        rankLabel = 'RANK C';
        rankClass = 'rank-glow-c';
        goldReward = 15;
        xpReward = 30;
        verdictDesc = '"Abaixo das expectativas. Você está apenas sobrevivendo. O Sistema exige mais empenho e atitude."';
    } else {
        rankLabel = 'RANK D';
        rankClass = 'rank-glow-d';
        goldReward = 0;
        xpReward = 0;
        verdictDesc = '"Desempenho patético. Você corre risco de estagnação. Desperte antes que seja tarde demais."';
    }
    
    const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const periodText = `PERÍODO DE AVALIAÇÃO: ${formatDate(mondayDate)} a ${formatDate(sundayDate)}`;
    
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
    
    if (periodEl) periodEl.innerText = periodText;
    if (rateValEl) rateValEl.innerText = `${survivalRate}%`;
    if (rateBarEl) rateBarEl.style.width = `${survivalRate}%`;
    if (countEl) countEl.innerText = `Concluiu ${completedQuests} de ${totalQuests} missões programadas`;
    
    if (perfEl) perfEl.innerText = perfectDays;
    if (goodEl) goodEl.innerText = goodDays;
    if (missEl) missEl.innerText = missedDays;
    
    if (focusEl) {
        if (maxCount > 0) {
            focusEl.innerHTML = `Você focou majoritariamente na habilidade: <strong style="color: var(--neon-cyan);">${topSkillName}</strong> (${maxCount} quests feitas).`;
        } else {
            focusEl.innerHTML = `Nenhuma missão realizada no período.`;
        }
    }
    
    if (rankEl) {
        rankEl.innerText = rankLabel;
        rankEl.className = `font-hud ${rankClass}`;
    }
    if (descEl) descEl.innerText = verdictDesc;
    
    if (btn) {
        btn.dataset.rewards = JSON.stringify({ gold: goldReward, xp: xpReward, rank: rankLabel });
        btn.dataset.week = prevWeekStr;
    }
    
    const modal = document.getElementById('modal-weekly-report');
    if (modal) modal.style.display = 'flex';
}

function claimWeeklyReport(rewards, weekStr) {
    const gold = rewards.gold || 0;
    const xp = rewards.xp || 0;
    const rank = rewards.rank || 'RANK D';
    
    if (xp > 0) {
        gameState.xp += xp;
        if (gameState.xp >= gameState.xpToNext) {
            gameState.level++;
            gameState.xp = gameState.xp - gameState.xpToNext;
            gameState.xpToNext = Math.round(gameState.xpToNext * 1.3);
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


// ==========================================================================
// BIBLIOTECA DE HÁBITOS & CONVERSA COM MENTOR IA (CLAUDE)
// ==========================================================================

let selectedLibraryHabit = null;
let activeLibraryFilter = 'all';

function setupHabitLibraryAndTabs() {
    const modalSq = document.getElementById('modal-sidequest');
    const tabCreateBtn = document.getElementById('modal-tab-create');
    const tabLibraryBtn = document.getElementById('modal-tab-library');
    const panelCreate = document.getElementById('modal-panel-create');
    const panelLibrary = document.getElementById('modal-panel-library');
    const searchInput = document.getElementById('library-search');

    if (!modalSq || !tabCreateBtn || !tabLibraryBtn || !panelCreate || !panelLibrary) return;

    // Reset when modal opens (Habit Library active by default)
    document.getElementById('btn-add-sidequest')?.addEventListener('click', () => {
        tabLibraryBtn.classList.add('active');
        tabCreateBtn.classList.remove('active');
        panelLibrary.classList.add('active');
        panelLibrary.style.display = 'flex';
        panelCreate.classList.remove('active');
        panelCreate.style.display = 'none';
        activeLibraryFilter = 'all';
        if (searchInput) searchInput.value = '';
        renderHabitLibrary('all', '');
    });

    tabCreateBtn.addEventListener('click', () => {
        tabCreateBtn.classList.add('active');
        tabLibraryBtn.classList.remove('active');
        panelCreate.classList.add('active');
        panelCreate.style.display = 'flex';
        panelLibrary.classList.remove('active');
        panelLibrary.style.display = 'none';
    });

    tabLibraryBtn.addEventListener('click', () => {
        tabLibraryBtn.classList.add('active');
        tabCreateBtn.classList.remove('active');
        panelLibrary.classList.add('active');
        panelLibrary.style.display = 'flex';
        panelCreate.classList.remove('active');
        panelCreate.style.display = 'none';
        renderHabitLibrary('all', '');
    });

    // Filtros de Categoria
    const filterBtns = document.querySelectorAll('.library-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeLibraryFilter = btn.getAttribute('data-filter');
            renderHabitLibrary(activeLibraryFilter, searchInput?.value || '');
        });
    });

    // Busca ao vivo
    searchInput?.addEventListener('input', (e) => {
        renderHabitLibrary(activeLibraryFilter, e.target.value);
    });

    // Confirmation Modal setup
    const modalConfirm = document.getElementById('modal-confirm-habit');
    const closeConfirm = document.getElementById('close-confirm-modal');
    const cancelConfirm = document.getElementById('btn-cancel-add-habit');
    const confirmDailyBtn = document.getElementById('btn-habit-confirm-daily');
    const confirmSideBtn = document.getElementById('btn-habit-confirm-side');

    const hideConfirm = () => {
        if (modalConfirm) modalConfirm.style.display = 'none';
    };

    closeConfirm?.addEventListener('click', hideConfirm);
    cancelConfirm?.addEventListener('click', hideConfirm);
    window.addEventListener('click', (e) => {
        if (e.target === modalConfirm) hideConfirm();
    });

    confirmDailyBtn?.addEventListener('click', () => {
        if (!selectedLibraryHabit) return;
        addHabitFromLibrary(selectedLibraryHabit, 'daily');
    });

    confirmSideBtn?.addEventListener('click', () => {
        if (!selectedLibraryHabit) return;
        addHabitFromLibrary(selectedLibraryHabit, 'side');
    });
}

function addHabitFromLibrary(h, type = 'daily') {
    let xp = 25, gold = 15;
    if (h.difficulty === 'easy') { xp = 10; gold = 5; }
    else if (h.difficulty === 'hard') { xp = 50; gold = 30; }

    const isSq = (type === 'side');
    const prefix = isSq ? 'sq-lib-' : 'q-lib-';

    const newQuest = {
        id:        prefix + Date.now(),
        title:     h.title,
        type:      type,           // 'daily' ou 'side'
        skill:     h.skill,
        difficulty: h.difficulty,
        xp:        xp,
        gold:      gold,
        emoji:     h.icon || '⚔️',
        icon:      h.icon || '⚔️',
        completed: false,
        fromLibrary: true
    };

    if (type === 'daily') {
        gameState.quests.push(newQuest);
        showSystemToast(`📅 "${h.title}" adicionada às Missões Diárias!`);
    } else {
        gameState.sideQuests.push(newQuest);
        showSystemToast(`⚡ "${h.title}" adicionada às Side Quests!`);
    }

    saveGameData();
    renderQuests();

    const modalConfirm = document.getElementById('modal-confirm-habit');
    if (modalConfirm) modalConfirm.style.display = 'none';

    const modalSq = document.getElementById('modal-sidequest');
    if (modalSq) modalSq.style.display = 'none';

    selectedLibraryHabit = null;
}

function renderHabitLibrary(filter = 'all', search = '') {
    const listContainer = document.getElementById('library-habits-list');
    if (!listContainer) return;

    const query = search.toLowerCase().trim();
    
    // Filter habits
    const filtered = HABIT_LIBRARY.filter(habit => {
        const matchesFilter = filter === 'all' || habit.skill === filter;
        const matchesSearch = habit.title.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:20px; font-size:11px; color:var(--text-muted);">Nenhum hábito encontrado.</div>';
        return;
    }

    const skillNames = {
        physical: 'Físico',
        mental: 'Mental',
        productivity: 'Foco',
        wisdom: 'Saber',
        routine: 'Rotina',
        social: 'Social'
    };

    let html = '';
    filtered.forEach(habit => {
        let diffLabel = 'MÉDIO', diffClass = 'diff-medium', xp = 25, gold = 15;
        if (habit.difficulty === 'easy') {
            diffLabel = 'FÁCIL'; diffClass = 'diff-easy'; xp = 10; gold = 5;
        } else if (habit.difficulty === 'hard') {
            diffLabel = 'DIFÍCIL'; diffClass = 'diff-hard'; xp = 50; gold = 30;
        }

        html += '<div class="library-item">' +
            '<div class="library-item-main">' +
                '<div class="library-item-icon">' + habit.icon + '</div>' +
                '<div class="library-item-info">' +
                    '<span class="library-item-title">' + habit.title + '</span>' +
                    '<div class="library-item-meta">' +
                        '<span class="library-badge category">' + (skillNames[habit.skill] || habit.skill) + '</span>' +
                        '<span class="library-badge ' + diffClass + '">' + diffLabel + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="btn-library-add" data-id="' + habit.id + '">ADICIONAR</button>' +
        '</div>';
    });

    listContainer.innerHTML = html;

    // Attach click listeners to Add buttons
    listContainer.querySelectorAll('.btn-library-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const habitId = btn.getAttribute('data-id');
            const habit = HABIT_LIBRARY.find(h => h.id === habitId);
            if (habit) {
                selectedLibraryHabit = habit;
                
                const modalConfirm = document.getElementById('modal-confirm-habit');
                const confirmDesc = document.getElementById('confirm-habit-desc');
                if (modalConfirm && confirmDesc) {
                    let diffLabel = 'Médio', xp = 25, gold = 15;
                    if (habit.difficulty === 'easy') { diffLabel = 'Fácil'; xp = 10; gold = 5; }
                    else if (habit.difficulty === 'hard') { diffLabel = 'Difícil'; xp = 50; gold = 30; }

                    confirmDesc.innerHTML = 'Deseja adicionar o hábito <b>"' + habit.title + '"</b>?<br><br>Recompensas ao concluir: <b>+' + xp + ' XP</b> · <b>+' + gold + ' Ouro</b> · <b>+' + xp + ' Skill XP</b>';
                    modalConfirm.style.display = 'flex';
                }
            }
        });
    });
}

/* Lógica de Chat com IA Real (Claude) desabilitada temporariamente
function initChatListeners() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    if (!chatInput || !sendBtn) return;

    sendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

function renderChat() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    if (!gameState.messages) gameState.messages = [];

    // Se estiver vazio, adiciona a mensagem padrão acolhedora do Tio Iroh
    if (gameState.messages.length === 0) {
        gameState.messages.push({
            role: 'assistant',
            content: 'Olá, meu jovem. Sente-se, tome uma xícara de chá de jasmim 🍵. Como está sendo sua jornada hoje? Lembre-se, às vezes o melhor caminho é aquele que construímos um dia de cada vez, com paciência e clareza.'
        });
        saveGameData();
    }

    let html = '';
    gameState.messages.forEach(msg => {
        const isUser = msg.role === 'user';
        const wrapperClass = isUser ? 'sent' : 'received';
        
        // Substitui quebras de linha por tag <br> para formatação correta
        const formattedContent = msg.content.replace(/\n/g, '<br>');

        html += '<div class="msg-wrapper ' + wrapperClass + '">' +
            '<div class="msg-bubble">' +
                formattedContent +
            '</div>' +
        '</div>';
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const container = document.getElementById('chat-messages-container');
    if (!chatInput || !container) return;

    const text = chatInput.value.trim();
    if (!text) return;

    // Adiciona a mensagem do usuário
    gameState.messages.push({ role: 'user', content: text });
    chatInput.value = '';
    renderChat();
    saveGameData();

    // Insere o indicador de "digitando" temporário do Iroh
    const typingHtml = '<div class="msg-wrapper received" id="chat-typing-indicator">' +
        '<div class="msg-bubble" style="font-style: italic; color: var(--text-muted); opacity: 0.8; display: flex; align-items: center; gap: 8px;">' +
            '<span>Tio Iroh está servindo o chá...</span>' +
            '<span class="cloud-dot online" style="animation: pulse 1s infinite alternate;"></span>' +
        '</div>' +
    '</div>';
    container.innerHTML += typingHtml;
    container.scrollTop = container.scrollHeight;

    const apiKey = localStorage.getItem('lifeRPG_claude_key');
    const apiUrl = localStorage.getItem('lifeRPG_claude_url') || 'https://api.anthropic.com/v1/messages';

    // Se não há chave de API cadastrada, Iroh responde localmente de forma educativa
    if (!apiKey) {
        setTimeout(() => {
            const indicator = document.getElementById('chat-typing-indicator');
            if (indicator) indicator.remove();

            const promptConfigMsg = 'Olá, meu jovem! Fico muito contente em ver o seu empenho. No entanto, para que possamos ter conversas dinâmicas e inteligentes em tempo real sobre seu progresso, por favor insira sua <b>Chave de API do Claude</b> nas Configurações ⚙️ (localizadas no topo lateral direito). Enquanto isso, continue firme nas suas missões e tome um pouco mais de chá! 🍵';
            
            gameState.messages.push({ role: 'assistant', content: promptConfigMsg });
            renderChat();
            saveGameData();
        }, 1500);
        return;
    }

    // Monta o prompt de sistema personalizado com o estado do jogador
    const activeDailies = gameState.quests.map(q => `- ${q.title} (${q.completed ? 'Concluída' : 'Pendente'})`).join('\n');
    const activeSides = gameState.sideQuests.map(q => `- ${q.title} (${q.completed ? 'Concluída' : 'Pendente'})`).join('\n');
    const skillsList = Object.entries(gameState.skills).map(([k, v]) => `- ${k.toUpperCase()}: Nível ${v.level} (XP: ${v.xp}/${v.xpToNext})`).join('\n');
    const rankName = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
    
    const systemPrompt = `Você é o Tio Iroh, o sábio mentor do desenho Avatar: A Lenda de Aang.
Você está conversando com o jogador no aplicativo de produtividade gamificada LifeRPG OS.
O jogador se chama ${gameState.playerName || 'Guerreiro'}.
Seu objetivo é dar conselhos sábios, confortantes e motivadores de forma calma, usando metáforas sobre chá, caminhos, natureza e paciência. Fale sempre em português (PT-BR). Seja encorajador, sábio e paciente. Use citações de sabedoria.

ESTADO ATUAL DO JOGADOR NO RPG:
- Nível Geral: ${gameState.level} (Rank: ${rankName})
- Streak de Dailies: ${gameState.streak} dias consecutivos
- Gold acumulado: ${gameState.gold} moedas de ouro
- Dailies do Dia:
${activeDailies || 'Nenhuma daily hoje.'}
- Side Quests:
${activeSides || 'Nenhuma missão paralela.'}
- Níveis de Atributos (Skills):
${skillsList}

Lembre-se de comentar sobre o progresso real do jogador se for relevante (ex: se ele tem um alto streak, elogie; se ele está com quests pendentes, encoraje de forma gentil). Responda sempre como o Tio Iroh de forma imersiva e natural. Não quebre o personagem. Mantenha as respostas curtas e acolhedoras, tipicamente 2 a 4 parágrafos.`;

    // Filtra as últimas 10 mensagens para manter o histórico otimizado
    const chatHistory = gameState.messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: systemPrompt,
            messages: chatHistory
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('API Error: Status ' + res.status);
        return res.json();
    })
    .then(data => {
        const indicator = document.getElementById('chat-typing-indicator');
        if (indicator) indicator.remove();

        const responseText = data.content[0].text;
        gameState.messages.push({ role: 'assistant', content: responseText });
        renderChat();
        saveGameData();
    })
    .catch(err => {
        console.error('Claude API Error:', err);
        const indicator = document.getElementById('chat-typing-indicator');
        if (indicator) indicator.remove();

        gameState.messages.push({
            role: 'assistant',
            content: `Hum... parece que nossas xícaras de chá se desentenderam, meu jovem. O vento soprou forte e a conexão com o servidor falhou. Certifique-se de que sua Chave de API está correta e que você configurou um Proxy CORS ou Gateway adequado nas configurações para que possamos nos comunicar sem impedimentos no navegador.\n\n*(Erro técnico: ${err.message})*`
        });
        renderChat();
        saveGameData();
    });
}
*/
