// state.js
import { localDateStr, getXpToNextForLevel, hasSkillLV3, initSkillsState, isQuestActiveOnDay } from './utils.js';
import { syncQuestsByLevel, checkDungeonExpiry, checkWeeklyBossExpiry, spawnDungeon, checkAchievements, saveToCloud } from './game-logic.js';

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
    { id: 'lib-revisar', title: 'Revisar objetivos semanais', icon: '🎯', difficulty: 'easy', skill: 'productivity', type: 'weekly', defaultDaysOfWeek: [0] },
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
    { id: 'lib-meal-prep', title: 'Meal Prep Semanal', icon: '🥦', difficulty: 'medium', skill: 'routine', type: 'weekly', defaultDaysOfWeek: [0] },

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

export let gameState = {
    gender: 'male',
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
    buffs: { autoHeal: false, doubleXp: false, legendaryFocus: false, shieldDays: 0 },
    inventory: { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' },
    notificationTimes: { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 },
    lastWeeklyReportYearWeek: "",
    tutorialStep: 1,
    tutorialCompleted: false,
    friendsCount: 0
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
    { min: 20, rank: 'RANK S', css: 'rank-s' },
    { min: 15, rank: 'RANK A', css: 'rank-a' },
    { min: 10, rank: 'RANK B', css: 'rank-b' },
    { min: 5,  rank: 'RANK C', css: 'rank-c' },
    { min: 3,  rank: 'RANK D', css: 'rank-d' },
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
    localStorage.setItem('force_reset_v4', 'true');

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
            parsed.buffs = { autoHeal: false, doubleXp: false, legendaryFocus: false, shieldDays: 0 };
        } else if (parsed.buffs.legendaryFocus === undefined) {
            parsed.buffs.legendaryFocus = false;
        }
        if (!parsed.messages) {
            parsed.messages = [];
        }
        if (parsed.tutorialStep === undefined && parsed.tutorialCompleted === undefined) {
            parsed.tutorialStep = null;
            parsed.tutorialCompleted = true;
        }
        if (parsed.friendsCount === undefined) {
            parsed.friendsCount = 0;
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
            const parts = parsed.lastCheckedDate.split('-').map(Number);
            const oldDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const yesterdayDayOfWeek = oldDateObj.getDay();

            const activeYesterday = (parsed.quests || []).filter(q =>
                isQuestActiveOnDay(q, yesterdayDayOfWeek)
            );

            const completedCount = activeYesterday.filter(q => q.completed).length;
            const totalCount = activeYesterday.length;
            const allWereDone = totalCount > 0 ? (completedCount >= totalCount) : true;
            
            // Grava o Histórico do dia anterior
            let dailyStatus = 'skipped';
            if (totalCount > 0) {
                const pct = completedCount / totalCount;
                if (completedCount === 0) dailyStatus = 'missed';
                else if (pct < 0.5) dailyStatus = 'bad';
                else if (pct < 1.0) dailyStatus = 'good';
                else dailyStatus = 'perfect';
            }

            // Identifica se era um dia ativo (para evitar punir dias de descanso)
            const isRestDay = parsed.activeDays && !parsed.activeDays.includes(yesterdayDayOfWeek);
            if (isRestDay && dailyStatus === 'missed') {
                dailyStatus = 'skipped';
            }

            parsed.history[parsed.lastCheckedDate] = {
                status: dailyStatus,
                count: completedCount,
                total: totalCount,
                completedIds: activeYesterday.filter(q => q.completed).map(q => q.title) // salva nomes
            };

            // Verifica penalidade
            if (totalCount > 0 && !allWereDone && (parsed.streak || 0) > 0 && !isRestDay) {
                // Penalidade adiada para depois do DOM estar pronto
                const yesterdayStr = parsed.lastCheckedDate;
                setTimeout(() => window.applyDailyPenalty(yesterdayStr), 2000);
            }
            // Reseta hábitos diários para um novo dia
            parsed.quests.forEach(q => {
                const type = q.type || 'daily';
                if (type === 'daily') {
                    q.completed = false;
                    if (q.current !== undefined) q.current = 0;
                } else if (type === 'weekly') {
                    if ((q.daysOfWeek || []).includes(yesterdayDayOfWeek)) {
                        q.completed = false;
                        if (q.current !== undefined) q.current = 0;
                    }
                } else if (typeof type === 'string' && type.startsWith('weekly-')) {
                    const days = type.split('-').slice(1).map(Number);
                    if (days.includes(yesterdayDayOfWeek)) {
                        q.completed = false;
                        if (q.current !== undefined) q.current = 0;
                    }
                }
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

        for (const key in gameState) delete gameState[key]; Object.assign(gameState, parsed);
        
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

    // Recalcula e migra o xpToNext com base na curva exponencial
    if (typeof getXpToNextForLevel === 'function') {
        const expectedXpToNext = getXpToNextForLevel(gameState.level);
        if (gameState.xpToNext !== expectedXpToNext) {
            console.log(`[Migration] Atualizando xpToNext do nível ${gameState.level} de ${gameState.xpToNext} para ${expectedXpToNext}`);
            gameState.xpToNext = expectedXpToNext;
            saveGameData();
        }
    }
}


function updateSWQuestStatus() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const todayDayOfWeek = new Date().getDay();
        const activeToday = (gameState.quests || []).filter(q =>
            isQuestActiveOnDay(q, todayDayOfWeek)
        );
        const pendingCount = activeToday.filter(q => !q.completed).length;
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_QUEST_STATUS',
            pendingCount: pendingCount
        });
    }
}

export {
    ALL_HABITS_DATABASE,
    HABIT_LIBRARY,
    IMPACT_QUOTES,
    RANK_THRESHOLDS,
    BOSS_QUESTS,
    DUNGEON_POOL,
    DUNGEON_DURATION_MS,
    saveGameData,
    loadGameData,
    updateSWQuestStatus
};

export function resetGameState(defaultState) {
    for (const key in gameState) {
        delete gameState[key];
    }
    Object.assign(gameState, defaultState);
}
