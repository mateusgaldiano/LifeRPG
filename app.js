/* ==========================================================================
   LIFERPG - CORE GAME LOGIC & COMPANION SYSTEM (2026)
   ========================================================================== */

// Banco de dados mestre de hÃƒÆ’Ã‚Â¡bitos por nÃƒÆ’Ã‚Â­vel do LifeRPG
const ALL_HABITS_DATABASE = [
    // Bracket 1 (NÃƒÆ’Ã‚Â­vel 1 ao 4)
    { id: 'q-acordar', title: 'Acordar Cedo', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã¢â‚¬Â¦', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'routine' },
    { id: 'q-malhar', title: 'Treinar de ForÃƒÆ’Ã‚Â§a / Corrida', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â¹ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€žÂ¢Ã¢â‚¬Å¡ÃƒÂ¯Ã‚Â¸Ã‚Â', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'physical' },
    { id: 'q-ler', title: 'Leitura (MÃƒÆ’Ã‚Â­nimo 15min)', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â¡', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'wisdom' },
    { id: 'q-meditar', title: 'Meditar (10 min)', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã‚Â§Ã‹Å“', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'mental' },
    { id: 'q-agua', title: 'Beber ÃƒÆ’Ã‚Âgua (8 copos)', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â§', completed: false, xp: 20, gold: 10, target: 8, current: 0, minLevel: 1, skill: 'physical' },
    { id: 'q-familia', title: 'Mandar mensagem/ligar para FamÃƒÆ’Ã‚Â­lia', type: 'daily', icon: 'ÃƒÂ¢Ã‚ÂÃ‚Â¤ÃƒÂ¯Ã‚Â¸Ã‚Â', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'social' },
    
    // Bracket 2 (NÃƒÆ’Ã‚Â­vel 5 ao 9)
    { id: 'q-deepwork', title: 'Deep Work: 30min no projeto pessoal', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â»', completed: false, xp: 25, gold: 12, minLevel: 5, skill: 'productivity' },
    { id: 'q-estudo', title: 'Estudo: 30min na ÃƒÆ’Ã‚Â¡rea profissional', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Â ', completed: false, xp: 25, gold: 12, minLevel: 5, skill: 'wisdom' },
    { id: 'q-checkin', title: 'Check-in Emocional no DiÃƒÆ’Ã‚Â¡rio', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â', completed: false, xp: 15, gold: 8, minLevel: 5, skill: 'mental' },
    
    // Bracket 3 (NÃƒÆ’Ã‚Â­vel 10+)
    { id: 'q-estoico', title: 'Estoicismo: 10min de leitura filosÃƒÆ’Ã‚Â³fica', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬ÂºÃƒÂ¯Ã‚Â¸Ã‚Â', completed: false, xp: 20, gold: 10, minLevel: 10, skill: 'mental' },
    { id: 'q-producao', title: 'ProduÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o: Criar 1 conteÃƒÆ’Ã‚Âºdo autoral', type: 'daily', icon: 'ÃƒÂ¢Ã…â€œÃ‚ÂÃƒÂ¯Ã‚Â¸Ã‚Â', completed: false, xp: 25, gold: 12, minLevel: 10, skill: 'productivity' }
];

// Estado Global do Jogo
let gameState = {
    level: 1,
    xp: 0,
    xpToNext: 100,
    gold: 0,
    streak: 0,
    history: {},
    shields: 0,              // escudos ativos (0-3)
    consecutiveStreak7Days: 0, // dias acumulados rumo ao prÃƒÆ’Ã‚Â³ximo escudo
    consecutiveMisses: 0,       // contador de dias nÃƒÆ’Ã‚Â£o concluÃƒÆ’Ã‚Â­dos
    bossQuest: null,            // boss quest ativa { id, completed, progress }
    activeDungeon: null,    // dungeon ativa com prazo de 48h
    weeklyBoss: null,       // { spawnedAt, expiresAt, hp, defeated, penaltyApplied }
    lastCheckedDate: null,      // controle diÃƒÆ’Ã‚Â¡rio
    unlockedAchievements: [],   // trofÃƒÆ’Ã‚Â©us desbloqueados
    quests: [], // Populado dinamicamente com base no nÃƒÆ’Ã‚Â­vel
    sideQuests: [],
    rewards: [
        { id: 'r-serie', title: 'Assistir 1 Hora de SÃƒÆ’Ã‚Â©rie', cost: 35, icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Âº' },
        { id: 'r-cheat', title: 'RefeiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o Livre / Doce', cost: 80, icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â' },
        { id: 'r-game', title: 'Jogar Videogame por 1h', cost: 45, icon: 'ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â®' }
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
    inventory: { unlockedTitles: [], unlockedBorders: [], activeTitle: null, activeBorder: null },
    notificationTimes: { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 }
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
    { author: "ClÃƒÆ’Ã‚Â³vis de Barros", text: "A vida ÃƒÆ’Ã‚Â© uma sÃƒÆ’Ã‚Â³, vocÃƒÆ’Ã‚Âª vai vivÃƒÆ’Ã‚Âª-la como um espectador ou como protagonista?" },
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

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Sistema de RANK (Solo Leveling) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const RANK_THRESHOLDS = [
    { min: 30, rank: 'RANK S', css: 'rank-s' },
    { min: 20, rank: 'RANK A', css: 'rank-a' },
    { min: 15, rank: 'RANK B', css: 'rank-b' },
    { min: 10, rank: 'RANK C', css: 'rank-c' },
    { min: 5,  rank: 'RANK D', css: 'rank-d' },
    { min: 1,  rank: 'RANK E', css: 'rank-e' }
];

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Boss Quests por Rank Up ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const BOSS_QUESTS = {
    'e-to-d': {
        id: 'e-to-d',
        title: 'Despertar do Guerreiro',
        description: 'Complete todas as suas missÃƒÆ’Ã‚Âµes diÃƒÆ’Ã‚Â¡rias por 3 dias seguidos.',
        rankFrom: 'RANK E', rankTo: 'RANK D',
        xpReward: 150, goldReward: 50,
        check: () => (gameState.streak || 0) >= 3,
        progress: () => `${Math.min(gameState.streak || 0, 3)}/3 dias de streak`
    },
    'd-to-c': {
        id: 'd-to-c',
        title: 'Batismo do Foco',
        description: 'Complete 5 side quests (missÃƒÆ’Ã‚Âµes avulsas).',
        rankFrom: 'RANK D', rankTo: 'RANK C',
        xpReward: 250, goldReward: 80,
        check: () => (gameState.bossQuest?.sideQuestsCompleted || 0) >= 5,
        progress: () => `${gameState.bossQuest?.sideQuestsCompleted || 0}/5 side quests`
    },
    'c-to-b': {
        id: 'c-to-b',
        title: 'AscensÃƒÆ’Ã‚Â£o do Atributo',
        description: 'Eleve pelo menos 4 das suas 6 skills para o NÃƒÆ’Ã‚Â­vel 3.',
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
        title: 'VigÃƒÆ’Ã‚Â­lia do Estoico',
        description: 'Mantenha uma sequÃƒÆ’Ã‚Âªncia de 14 dias consecutivos.',
        rankFrom: 'RANK B', rankTo: 'RANK A',
        xpReward: 600, goldReward: 180,
        check: () => (gameState.streak || 0) >= 14,
        progress: () => `${Math.min(gameState.streak || 0, 14)}/14 dias de streak`
    },
    'a-to-s': {
        id: 'a-to-s',
        title: 'O Sistema Completo',
        description: 'Eleve TODAS as 6 skills para o NÃƒÆ’Ã‚Â­vel 5 simultaneamente.',
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

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Banco de Dungeons ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const DUNGEON_POOL = [
    { title: 'Treino SolitÃƒÆ’Ã‚Â¡rio',   skill: 'physical',     xp: 80,  gold: 40 },
    { title: 'Hora do SilÃƒÆ’Ã‚Âªncio',   skill: 'mental',       xp: 75,  gold: 35 },
    { title: 'Projeto Expresso',   skill: 'productivity', xp: 90,  gold: 45 },
    { title: 'ConexÃƒÆ’Ã‚Â£o Rara',       skill: 'social',       xp: 70,  gold: 35 },
    { title: 'Leitura Profunda',   skill: 'wisdom',       xp: 80,  gold: 40 },
    { title: 'Ritual Perfeito',    skill: 'routine',      xp: 75,  gold: 38 },
    { title: 'Corrida do DragÃƒÆ’Ã‚Â£o',  skill: 'physical',     xp: 100, gold: 50 },
    { title: 'MeditaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o Extrema',  skill: 'mental',       xp: 95,  gold: 48 },
    { title: 'Sprint de Foco',     skill: 'productivity', xp: 110, gold: 55 },
    { title: 'AlianÃƒÆ’Ã‚Â§a Inesperada', skill: 'social',       xp: 85,  gold: 42 },
    { title: 'Tomo Proibido',      skill: 'wisdom',       xp: 95,  gold: 48 },
    { title: 'SequÃƒÆ’Ã‚Âªncia Sagrada',  skill: 'routine',      xp: 90,  gold: 45 },
];

const DUNGEON_DURATION_MS = 48 * 60 * 60 * 1000; // 48 horas em ms

// Requisito: pelo menos 1 skill em LV3+
function hasSkillLV3() {
    const skills = gameState.skills || {};
    return Object.values(skills).some(s => s.level >= 3);
}

// Gera uma nova dungeon aleatÃƒÆ’Ã‚Â³ria
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
        showSystemToast(`ÃƒÂ¢Ã…Â¡Ã¢â‚¬ÂÃƒÂ¯Ã‚Â¸Ã‚Â *DUNGEON DISPONÃƒÆ’Ã‚ÂVEL!* Uma missÃƒÆ’Ã‚Â£o especial surgiu: *"${pick.title}"*\n\nRecompensa: +${pick.xp} XP Ãƒâ€šÃ‚Â· +${pick.gold} ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â°\nÃƒÂ¢Ã‚ÂÃ‚Â³ Prazo: 48 horas. Conclua antes que expire.`);

    }, 1000);
}

// Verifica e aplica expiraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o da dungeon ativa
function checkDungeonExpiry() {
    const d = gameState.activeDungeon;
    if (!d || d.completed) return;
    if (Date.now() >= d.expiresAt) {
        const title = d.title;
        gameState.activeDungeon = null;
        gameState.xp = Math.max(0, (gameState.xp || 0) - 5);
        saveGameData();
        setTimeout(() => {
            showSystemToast(`ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã¢â€šÂ¬ *DUNGEON EXPIRADA.* A missÃƒÆ’Ã‚Â£o *"${title}"* foi abandonada. O Sistema cobrou o preÃƒÆ’Ã‚Â§o: ÃƒÂ¢Ã‹â€ Ã¢â‚¬â„¢5 XP.`);

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
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Weekly Boss ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
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
            receiveMessage(`ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã¢â€šÂ¬ *O CHEFE DA SEMANA NÃƒÆ’Ã†â€™O FOI DERROTADO.*\n\nO Sistema cobrou o preÃƒÆ’Ã‚Â§o da sua fraqueza: -${goldLost} Ouro e -30 XP foram consumidos. Que isso sirva de liÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.`);
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
            receiveMessage(`ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â  *CHEFE SEMANAL DERROTADO!*\n\nVocÃƒÆ’Ã‚Âª enfrentou o Sistema e venceu. Recompensa: +150 XP e +80 Ouro. O streak continua protegido.`);
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
                <span class="boss-icon">ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã¢â€šÂ¬</span>
                <div class="boss-title-wrap">
                    <span class="boss-title">CHEFE DA SEMANA</span>
                    <span class="boss-timer${urgent ? ' boss-timer-urgent' : ''}">ÃƒÂ¢Ã‚ÂÃ‚Â³ ${remH}h ${remMin}min restantes</span>
                </div>
                <span class="boss-badge">BOSS</span>
            </div>
            <div class="boss-desc">Derrote completando 3 dias perfeitos (100% das dailies)</div>
            <div class="boss-hp-bar-track">
                <div class="boss-hp-bar-fill" style="width: ${hpPct}%"></div>
            </div>
            <div class="boss-hp-label">${wb.hp}/3 HP restantes</div>
            <div class="boss-rewards-preview">Recompensa: +150 XP Ãƒâ€šÃ‚Â· +80 ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â° Ãƒâ€šÃ‚Â· Streak protegido</div>
        </div>
    `;
}

    setTimeout(() => {
        showSystemToast(`ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â  *DUNGEON CONCLUÃƒÆ’Ã‚ÂDA!* VocÃƒÆ’Ã‚Âª completou *"${d.title}"*!\n\n+${xpGain} XP Ãƒâ€šÃ‚Â· +${goldGain} ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â° concedidos. Iroh estÃƒÆ’Ã‚Â¡ orgulhoso.`);

    }, 800);

    renderQuests();
}

// Mapeia nÃƒÆ’Ã‚Â­vel mÃƒÆ’Ã‚Â­nimo do rank atual ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ boss quest a ser ativada
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

    // Verifica se o nÃƒÆ’Ã‚Â­vel atual tem uma boss quest associada
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
            showSystemToast(`ÃƒÂ¢Ã…Â¡Ã¢â‚¬ÂÃƒÂ¯Ã‚Â¸Ã‚Â *BOSS QUEST DESBLOQUEADA!*\n\n*${bq.title}*\n_${bq.description}_\n\nRecompensa: +${bq.xpReward} XP Ãƒâ€šÃ‚Â· +${bq.goldReward} ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â°\n\nProgresso atual: ${bq.progress()}`);

        }, 2000);
    }

    // Verifica se a boss quest ativa foi concluÃƒÆ’Ã‚Â­da
    if (gameState.bossQuest && !gameState.bossQuest.completed) {
        const bq = BOSS_QUESTS[gameState.bossQuest.id];
        if (bq && bq.check()) {
            gameState.bossQuest.completed = true;
            gameState.xp += bq.xpReward;
            gameState.gold += bq.goldReward;
            setTimeout(() => {
                showSystemToast(`ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â  *BOSS QUEST CONCLUÃƒÆ’Ã‚ÂDA!*\n\n*${bq.title}* foi completada!\n\n_"${getBossVictoryQuote(bq.id)}"_\n\n+${bq.xpReward} XP Ãƒâ€šÃ‚Â· +${bq.goldReward} ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â° concedidos. ${bq.rankFrom} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ${bq.rankTo} desbloqueado por mÃƒÆ’Ã‚Â©rito!`);

            }, 1500);
            saveGameData();
            updateUI();
        }
    }
}

// BordÃƒÆ’Ã‚Â£o do Iroh ao concluir cada Boss Quest
function getBossVictoryQuote(bossId) {
    const quotes = {
        'e-to-d': 'TrÃƒÆ’Ã‚Âªs dias. Simples assim. E vocÃƒÆ’Ã‚Âª provou que tem o que ÃƒÆ’Ã‚Â© preciso para continuar.',
        'd-to-c': 'MissÃƒÆ’Ã‚Âµes extras revelam o carÃƒÆ’Ã‚Â¡ter. VocÃƒÆ’Ã‚Âª foi alÃƒÆ’Ã‚Â©m do mÃƒÆ’Ã‚Â­nimo ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â isso ÃƒÆ’Ã‚Â© tudo.',
        'c-to-b': 'Quatro atributos forjados. NÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© sorte. ÃƒÆ’Ã¢â‚¬Â° consistÃƒÆ’Ã‚Âªncia transformada em forÃƒÆ’Ã‚Â§a.',
        'b-to-a': 'Catorze dias sem parar. Isso nÃƒÆ’Ã‚Â£o ÃƒÆ’Ã‚Â© disciplina ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â isso ÃƒÆ’Ã‚Â© identidade.',
        'a-to-s': 'O Sistema Encarnado. VocÃƒÆ’Ã‚Âª nÃƒÆ’Ã‚Â£o segue mais o mÃƒÆ’Ã‚Â©todo ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â vocÃƒÆ’Ã‚Âª virou o mÃƒÆ’Ã‚Â©todo.'
    };
    return quotes[bossId] || 'A vitÃƒÆ’Ã‚Â³ria pertence a quem persiste.';
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Mapeamento 6 Skills ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 3 Atributos Arise ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
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
    if (isI && isH) return "SÃƒÆ’Ã‚Â¡bio Guerreiro";
    if (isW && isI) return "Mestre da Mente";

    if (isH) return "Guerreiro";
    if (isI) return "Estrategista";
    if (isW) return "Estoico";

    return "Desperto";
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ DefiniÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes de Sinergias de Atributos ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const SYNERGY_DEFS = [
    {
        id: 'willpower_iron',
        name: 'Vontade de Ferro',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥',
        description: '+10% XP em todas as quests',
        check: (attrs) => attrs.willpower.level >= 3,
        bonusXpPct: 0.10,
        bonusSkillXp: 0,
        bonusGoldPct: 0
    },
    {
        id: 'sharp_mind',
        name: 'Mente Afiada',
        icon: 'ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Â ',
        description: '+1 Skill XP em cada quest',
        check: (attrs) => attrs.intellect.level >= 3,
        bonusXpPct: 0,
        bonusSkillXp: 1,
        bonusGoldPct: 0
    },
    {
        id: 'body_mind',
        name: 'Corpo e Mente',
        icon: 'ÃƒÂ¢Ã…Â¡Ã¢â‚¬â€œÃƒÂ¯Ã‚Â¸Ã‚Â',
        description: '+5% Ouro em todas as quests',
        check: (attrs) => attrs.willpower.level >= 3 && attrs.health.level >= 3,
        bonusXpPct: 0,
        bonusSkillXp: 0,
        bonusGoldPct: 0.05
    },
    {
        id: 'the_system',
        name: 'O Sistema',
        icon: 'ÃƒÂ¢Ã…Â¡Ã‚Â¡',
        description: '+15% XP, +1 Skill XP, +5% Ouro',
        check: (attrs) => attrs.willpower.level >= 3 && attrs.intellect.level >= 3 && attrs.health.level >= 3,
        bonusXpPct: 0.15,
        bonusSkillXp: 1,
        bonusGoldPct: 0.05
    },
    {
        id: 'immortal_legend',
        name: 'Lenda Imortal',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ¢â‚¬Ëœ',
        description: '+25% XP + Escudo bÃƒÆ’Ã‚Â´nus a cada 7-streak',
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

// Calcula o bÃƒÆ’Ã‚Â´nus total de XP de sinergias (somativo, ex: 0.10 + 0.15 = 0.25)
function getSynergyXpBonus() {
    return computeSynergies().reduce((sum, s) => sum + (s.bonusXpPct || 0), 0);
}

// Calcula o bÃƒÆ’Ã‚Â´nus total de Skill XP de sinergias
function getSynergySkillXpBonus() {
    return computeSynergies().reduce((sum, s) => sum + (s.bonusSkillXp || 0), 0);
}

// Calcula o bÃƒÆ’Ã‚Â´nus total de Ouro de sinergias
function getSynergyGoldBonus() {
    return computeSynergies().reduce((sum, s) => sum + (s.bonusGoldPct || 0), 0);
}

// Verifica se a sinergia "Lenda Imortal" estÃƒÆ’Ã‚Â¡ ativa (escudo bÃƒÆ’Ã‚Â´nus no 7-streak)
function hasSynergyShieldBonus() {
    return computeSynergies().some(s => s.shieldBonus);
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Conquistas (Achievements) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const ACHIEVEMENTS_DEFS = [
    // CONSISTÃƒÆ’Ã…Â NCIA
    {
        id: 'first_quest', category: 'consistÃƒÆ’Ã‚Âªncia',
        title: 'O InÃƒÆ’Ã‚Â­cio da Jornada', desc: 'Conclua sua primeira MissÃƒÆ’Ã‚Â£o',
        icon: 'ÃƒÂ¢Ã…Â¡Ã¢â‚¬ÂÃƒÂ¯Ã‚Â¸Ã‚Â', rewardGold: 10, rarity: 'comum',
        check: (gs) => gs.quests.some(q => q.completed) || (gs.sideQuests && gs.sideQuests.some(q => q.completed)),
        progress: (gs) => ({ cur: Math.min(gs.quests.filter(q => q.completed).length + (gs.sideQuests || []).filter(q => q.completed).length, 1), max: 1 })
    },
    {
        id: 'streak_3', category: 'consistÃƒÆ’Ã‚Âªncia',
        title: 'Primeiros Passos', desc: 'Atinja um Streak de 3 dias',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥', rewardGold: 15, rarity: 'comum',
        check: (gs) => gs.streak >= 3,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 3), max: 3 })
    },
    {
        id: 'streak_7', category: 'consistÃƒÆ’Ã‚Âªncia',
        title: 'Sangue Frio', desc: 'Atinja um Streak de 7 dias',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥', rewardGold: 25, rarity: 'incomum',
        check: (gs) => gs.streak >= 7,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 7), max: 7 })
    },
    {
        id: 'streak_30', category: 'consistÃƒÆ’Ã‚Âªncia',
        title: 'Disciplina de Ferro', desc: 'Atinja um Streak de 30 dias',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â¡ÃƒÂ¯Ã‚Â¸Ã‚Â', rewardGold: 100, rarity: 'raro',
        check: (gs) => gs.streak >= 30,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 30), max: 30 })
    },
    {
        id: 'streak_100', category: 'consistÃƒÆ’Ã‚Âªncia',
        title: 'A Lenda NÃƒÆ’Ã‚Â£o Para', desc: 'Atinja um Streak de 100 dias',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ¢â‚¬Ëœ', rewardGold: 400, rarity: 'lendÃƒÆ’Ã‚Â¡rio',
        check: (gs) => gs.streak >= 100,
        progress: (gs) => ({ cur: Math.min(gs.streak || 0, 100), max: 100 })
    },
    // RANK
    {
        id: 'rank_d', category: 'rank',
        title: 'O Despertar', desc: 'Chegue ao Rank D (NÃƒÆ’Ã‚Â­vel 5)',
        icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã¢â‚¬Â¦', rewardGold: 30, rarity: 'incomum',
        check: (gs) => gs.level >= 5,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 5), max: 5 })
    },
    {
        id: 'rank_c', category: 'rank',
        title: 'AscensÃƒÆ’Ã‚Â£o', desc: 'Chegue ao Rank C (NÃƒÆ’Ã‚Â­vel 10)',
        icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã…Â¸', rewardGold: 80, rarity: 'raro',
        check: (gs) => gs.level >= 10,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 10), max: 10 })
    },
    {
        id: 'rank_s', category: 'rank',
        title: 'CaÃƒÆ’Ã‚Â§ador de Rank', desc: 'Chegue ao Rank S (NÃƒÆ’Ã‚Â­vel 30)',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ¢â‚¬Ëœ', rewardGold: 500, rarity: 'lendÃƒÆ’Ã‚Â¡rio',
        check: (gs) => gs.level >= 30,
        progress: (gs) => ({ cur: Math.min(gs.level || 1, 30), max: 30 })
    },
    // HABILIDADES
    {
        id: 'skill_3', category: 'habilidades',
        title: 'Especialista Iniciante', desc: 'Alcance o NÃƒÆ’Ã‚Â­vel 3 em qualquer Skill',
        icon: 'ÃƒÂ¢Ã‚Â­Ã‚Â', rewardGold: 20, rarity: 'comum',
        check: (gs) => Object.values(gs.skills || {}).some(s => s.level >= 3),
        progress: (gs) => ({ cur: Math.min(Math.max(...Object.values(gs.skills || {1:1}).map(s => s.level || 1)), 3), max: 3 })
    },
    {
        id: 'skill_5', category: 'habilidades',
        title: 'Especialista', desc: 'Alcance o NÃƒÆ’Ã‚Â­vel 5 em qualquer Skill',
        icon: 'ÃƒÂ¢Ã‚Â­Ã‚Â', rewardGold: 50, rarity: 'raro',
        check: (gs) => Object.values(gs.skills || {}).some(s => s.level >= 5),
        progress: (gs) => ({ cur: Math.min(Math.max(...Object.values(gs.skills || {1:1}).map(s => s.level || 1)), 5), max: 5 })
    },
    {
        id: 'all_skills_3', category: 'habilidades',
        title: 'Mestre do Sistema', desc: 'Alcance o NÃƒÆ’Ã‚Â­vel 3 em TODAS as Skills',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â ', rewardGold: 150, rarity: 'lendÃƒÆ’Ã‚Â¡rio',
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
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã¢â€šÂ¬', rewardGold: 20, rarity: 'comum',
        check: (gs) => (gs._dungeonsCompleted || 0) >= 1,
        progress: (gs) => ({ cur: Math.min(gs._dungeonsCompleted || 0, 1), max: 1 })
    },
    {
        id: 'dungeon_5', category: 'masmorras',
        title: 'CaÃƒÆ’Ã‚Â§ador de Dungeons', desc: 'Complete 5 Dungeons',
        icon: 'ÃƒÂ¢Ã…Â¡Ã¢â‚¬ÂÃƒÂ¯Ã‚Â¸Ã‚Â', rewardGold: 80, rarity: 'raro',
        check: (gs) => (gs._dungeonsCompleted || 0) >= 5,
        progress: (gs) => ({ cur: Math.min(gs._dungeonsCompleted || 0, 5), max: 5 })
    },
    {
        id: 'boss_defeated', category: 'masmorras',
        title: 'Mata-Boss', desc: 'Derrote 1 Chefe Semanal',
        icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â ', rewardGold: 100, rarity: 'raro',
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
                    showSystemToast(`ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â  *CONQUISTA DESBLOQUEADA!* VocÃƒÆ’Ã‚Âª obteve o trofÃƒÆ’Ã‚Â©u *"${ach.title}"*. Recompensa: +${ach.rewardGold} ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â°.`);

                }, 1500);
            }
        }
    });

    if (newlyUnlocked) {
        renderAchievements();
        // saveGameData jÃƒÆ’Ã‚Â¡ ÃƒÆ’Ã‚Â© chamado em todos os pontos que alteram estado.
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
        'consistÃƒÆ’Ã‚Âªncia': { label: 'CONSISTÃƒÆ’Ã…Â NCIA', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥' },
        'rank':         { label: 'RANK & NÃƒÆ’Ã‚ÂVEL', icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã…Â¸' },
        'habilidades':  { label: 'HABILIDADES', icon: 'ÃƒÂ¢Ã‚Â­Ã‚Â' },
        'masmorras':    { label: 'MASMORRAS & BOSS', icon: 'ÃƒÂ¢Ã…Â¡Ã¢â‚¬ÂÃƒÂ¯Ã‚Â¸Ã‚Â' }
    };

    const rarityColors = {
        'comum':     { bg: 'rgba(120,120,140,0.1)', border: 'rgba(120,120,140,0.3)', label: 'rgba(170,170,190,0.7)' },
        'incomum':   { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.35)',  label: 'rgba(34,197,94,0.8)' },
        'raro':      { bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.4)',  label: 'rgba(129,140,248,0.9)' },
        'lendÃƒÆ’Ã‚Â¡rio':  { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.5)',  label: 'rgba(251,191,36,1)' }
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
                <div class="ach-icon">${isUnlocked ? ach.icon : 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬â„¢'}</div>
                <div class="ach-title">${ach.title}</div>
                <div class="ach-desc">${ach.desc}</div>
                ${isUnlocked
                    ? `<div class="ach-rarity-badge" style="color:${rc.label}; border-color:${rc.border}">${ach.rarity.toUpperCase()}</div>
                       <div class="ach-reward">+${ach.rewardGold} ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â°</div>`
                    : prog ? `<div class="ach-prog-track"><div class="ach-prog-fill" style="width:${progPct}%"></div></div>
                              <div class="ach-prog-label">${prog.cur}/${prog.max}</div>` : ''
                }
            </div>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Rank Perks ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const RANK_PERKS = {
    'd': {
        id: 'foco_matinal',
        name: 'Foco Matinal',
        icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã¢â‚¬Â¦',
        description: '+5 XP bÃƒÆ’Ã‚Â´nus na primeira quest do dia',
        rank: 'RANK D'
    },
    'c': {
        id: 'mente_diamante',
        name: 'Mente de Diamante',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã…Â½',
        description: '+10 XP bÃƒÆ’Ã‚Â´nus ao completar todas as dailies',
        rank: 'RANK C'
    },
    'b': {
        id: 'momentum',
        name: 'Momentum',
        icon: 'ÃƒÂ¢Ã…Â¡Ã‚Â¡',
        description: '+1 XP por quest consecutiva (acumula atÃƒÆ’Ã‚Â© 5)',
        rank: 'RANK B'
    },
    'a': {
        id: 'o_sistema',
        name: 'O Sistema',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Å¾',
        description: '1 skill XP de bÃƒÆ’Ã‚Â´nus ao completar todas as dailies',
        rank: 'RANK A'
    },
    's': {
        id: 'lenda_imortal',
        name: 'Lenda Imortal',
        icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ¢â‚¬Ëœ',
        description: '+25% XP em todas as recompensas',
        rank: 'RANK S'
    }
};

// Retorna os perks ativos com base no rank atual (todos os ranks atingidos atÃƒÆ’Ã‚Â© o atual)
function getActivePerks() {
    const rankKey = getRankForLevel(gameState.level).css.replace('rank-', ''); // 'e','d','c','b','a','s'
    const rankOrder = ['e', 'd', 'c', 'b', 'a', 's'];
    const currentIndex = rankOrder.indexOf(rankKey);
    // Inclui todos os perks dos ranks atingidos (exceto 'e' que nÃƒÆ’Ã‚Â£o tem perk)
    return rankOrder
        .slice(0, currentIndex + 1)
        .filter(r => RANK_PERKS[r])
        .map(r => RANK_PERKS[r]);
}

// Verifica se um perk especÃƒÆ’Ã‚Â­fico estÃƒÆ’Ã‚Â¡ ativo
function hasPerk(perkId) {
    return getActivePerks().some(p => p.id === perkId);
}

// BÃƒÆ’Ã‚Â´nus de XP do perk Lenda Imortal
function getPerkXpBonus() {
    return hasPerk('lenda_imortal') ? 0.25 : 0;
}

// ==========================================================================
// RADAR CHART ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â declarada no topo para garantir escopo global total
// ==========================================================================
function drawRadarChart() {
    try {
        const canvas = document.getElementById('skills-radar-chart');
        if (!canvas) { console.error('[Radar] canvas nÃƒÆ’Ã‚Â£o encontrado!'); return; }

        // ForÃƒÆ’Ã‚Â§a display:block via JS (algo sobrescrevia para 'inline')
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
            physical:'FÃƒÆ’Ã‚ÂSICO', mental:'MENTAL', productivity:'FOCO',
            social:'CONEXÃƒÆ’Ã†â€™O', wisdom:'SABEDORIA', routine:'ROTINA'
        };
        const N = skillTypes.length;

        // Helper: raio e skill
        const getR = (type) => {
            const skill = (gameState.skills && gameState.skills[type])
                || { level: 1, xp: 0, xpToNext: 5 };
            const val  = (skill.level - 1) + (skill.xp / (skill.xpToNext || 5));
            const frac = Math.min(val / 5, 1.0);
            // Raio mÃƒÆ’Ã‚Â­nimo de 4px apenas para manter o marcador visÃƒÆ’Ã‚Â­vel no vÃƒÆ’Ã‚Â©rtice
            // Escala real comeÃƒÆ’Ã‚Â§a do zero
            const minR = 4;
            return { r: minR + (frac * (maxR - minR)), skill };
        };

        // 1. Grades concÃƒÆ’Ã‚Âªntricas
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

        // 3. PolÃƒÆ’Ã‚Â­gono preenchido com gradiente
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

        // Contorno usa a cor da skill de maior nÃƒÆ’Ã‚Â­vel
        const maxSkillLevel = Math.max(...skillTypes.map(t =>
            (gameState.skills && gameState.skills[t]) ? gameState.skills[t].level : 1
        ));
        ctx.strokeStyle = getSkillColor(maxSkillLevel);
        ctx.lineWidth   = 2;
        ctx.stroke();

        // 4. Marcadores nos vÃƒÆ’Ã‚Â©rtices (polÃƒÆ’Ã‚Â­gono evolutivo)
        for (let i = 0; i < N; i++) {
            const { r, skill } = getR(skillTypes[i]);
            const a = (i * 2 * Math.PI / N) - Math.PI / 2;
            const vx = cx + r * Math.cos(a);
            const vy = cy + r * Math.sin(a);
            const color = getSkillColor(skill.level);
            drawVertexMarker(ctx, vx, vy, skill.level, color);
        }

        // 5. RÃƒÆ’Ã‚Â³tulos (nome + nÃƒÆ’Ã‚Â­vel)
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
// ExpÃƒÆ’Ã‚Âµe no window para garantir acesso global em qualquer contexto
window.drawRadarChart = drawRadarChart;

// Retorna a cor da ponta do hexÃƒÆ’Ã‚Â¡gono baseada no nÃƒÆ’Ã‚Â­vel da skill
function getSkillColor(level) {
    if (level >= 5) return '#fbbf24'; // Dourado
    if (level >= 3) return '#C0C0C0'; // Prata
    return '#00f0ff';                 // Ciano (padrÃƒÆ’Ã‚Â£o)
}

// Desenha o marcador no vÃƒÆ’Ã‚Â©rtice do hexÃƒÆ’Ã‚Â¡gono ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â polÃƒÆ’Ã‚Â­gono com N lados = nÃƒÆ’Ã‚Â­vel da skill
function drawVertexMarker(ctx, x, y, level, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    if (level <= 1) {
        // LV1: cÃƒÆ’Ã‚Â­rculo vazio (apenas contorno)
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.stroke();
        return;
    }

    if (level === 2) {
        // LV2: cÃƒÆ’Ã‚Â­rculo preenchido
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        return;
    }

    // LV3+: polÃƒÆ’Ã‚Â­gono com N = level lados
    const sides = level; // LV3 = triÃƒÆ’Ã‚Â¢ngulo, LV4 = quadrado, LV5 = pentÃƒÆ’Ã‚Â¡gono...
    const radius = 5;
    const startAngle = -Math.PI / 2; // ComeÃƒÆ’Ã‚Â§a do topo

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
// INICIALIZAÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã†â€™O DO APLICATIVO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    if (typeof initFirebase === 'function') initFirebase();
    initTabs();
    renderQuests();
    renderRewards();

    updateUI();
    setupEventListeners();
    
    // Inicializa motor PWA e ConfiguraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes
    registerServiceWorker();
    setupSettingsListeners();
    setupInstallPrompt();

    // Garante o primeiro draw do radar chart apÃƒÆ’Ã‚Â³s DOM+fontes carregarem
    setTimeout(() => { drawRadarChart(); }, 150);

    // Mensagem de boas-vindas na primeira vez
    if (gameState.messages.length === 0 && gameState.playerName) {
        setTimeout(() => {
            showSystemToast(`Bem-vindo ao LifeRPG, ${gameState.playerName}. O Sistema estÃƒÆ’Ã‚Â¡ ativo. Complete suas missÃƒÆ’Ã‚Âµes.`);
        }, 1000);
    }
    
    // Inicia o Wizard se o usuÃƒÆ’Ã‚Â¡rio nÃƒÆ’Ã‚Â£o tem nome definido
    if (!gameState.playerName) {
        initOnboardingWizard();
    }
});

// ==========================================================================
// SELEÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã†â€™O E GERENCIAMENTO DE ABAS
// ==========================================================================
function initTabs() {
    const navButtons = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = document.getElementById(`tab-${tabName}`);
            targetTab.classList.add('active');

            // Se for a aba Global, renderiza os grÃƒÆ’Ã‚Â¡ficos e o heatmap
            if (tabName === 'global') {
                renderGlobalDashboard();
            }

            // No Mobile, rola a tela atÃƒÆ’Ã‚Â© o conteÃƒÆ’Ã‚Âºdo da aba, respeitando o header fixo
            if (window.innerWidth <= 1023) {
                const appContainer = document.getElementById('app-container');
                const offset = targetTab.getBoundingClientRect().top + appContainer.scrollTop - appContainer.getBoundingClientRect().top - 130;
                appContainer.scrollTo({ top: offset, behavior: 'smooth' });
            }
        });
    });
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Tab Gating: Unlock tabs progressively by level ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
// NÃƒÆ’Ã‚Â­vel 1-2: SÃƒÆ’Ã‚Â³ MissÃƒÆ’Ã‚Âµes visÃƒÆ’Ã‚Â­vel
// NÃƒÆ’Ã‚Â­vel 3+:  VisÃƒÆ’Ã‚Â£o Global desbloqueada
// NÃƒÆ’Ã‚Â­vel 5+:  Taverna desbloqueada
// NÃƒÆ’Ã‚Â­vel 7+:  TrofÃƒÆ’Ã‚Â©us desbloqueados
function updateTabVisibility() {
    const level = gameState.level || 1;

    const tabGlobal = document.getElementById('tab-btn-global');
    const tabRewards = document.getElementById('tab-btn-rewards');
    const tabAch = document.getElementById('tab-btn-achievements');

    const setTabState = (btn, unlocked, unlockLevel) => {
        if (!btn) return;
        if (unlocked) {
            btn.disabled = false;
            btn.classList.remove('tab-locked');
            btn.removeAttribute('title');
        } else {
            btn.disabled = true;
            btn.classList.add('tab-locked');
            btn.setAttribute('title', `Desbloqueado no NÃƒÆ’Ã‚Â­vel ${unlockLevel}`);
        }
    };

    setTabState(tabGlobal,  level >= 3,  3);
    setTabState(tabRewards, level >= 5,  5);
    setTabState(tabAch,     level >= 7,  7);
}

// ==========================================================================
// SUB-ABAS DA TAVERNA E INVENTÃƒÆ’Ã‚ÂRIO
// ==========================================================================
window.switchTavernaTab = function(mode) {
    const btnShop = document.getElementById('subtab-btn-shop');
    const btnInventory = document.getElementById('subtab-btn-inventory');
    const panelShop = document.getElementById('taverna-shop');
    const panelInventory = document.getElementById('taverna-inventory');

    if (!btnShop || !btnInventory) return;

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

window.equipItem = function(type, itemId) {
    if (type === 'title') {
        gameState.inventory.activeTitle = itemId;
    } else if (type === 'border') {
        gameState.inventory.activeBorder = itemId;
    }
    
    saveGameData();
    renderInventory();
    updateUI();
};

window.renderInventory = function() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const inv = gameState.inventory || { unlockedTitles: [], unlockedBorders: [], activeTitle: null, activeBorder: null };
    
    const catalog = {
        'title_implacavel': { name: 'O ImplacÃƒÆ’Ã‚Â¡vel', type: 'title', icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â·ÃƒÂ¯Ã‚Â¸Ã‚Â', color: 'var(--neon-purple)' },
        'title_mestre': { name: 'Mestre do Tempo', type: 'title', icon: 'ÃƒÂ¢Ã‚ÂÃ‚Â³', color: 'var(--neon-gold)' },
        'border_neonred': { name: 'DemÃƒÆ’Ã‚Â´nio Carmesim', type: 'border', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â€œÃ‚Â¼ÃƒÂ¯Ã‚Â¸Ã‚Â', color: 'var(--neon-red)' }
    };

    const allUnlocked = [...inv.unlockedTitles, ...inv.unlockedBorders];
    
    if (allUnlocked.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; width: 100%; padding: 20px;">Seu armazÃƒÆ’Ã‚Â©m estÃƒÆ’Ã‚Â¡ vazio. Compre itens no Mercado Clandestino.</p>';
        return;
    }

    allUnlocked.forEach(itemId => {
        const item = catalog[itemId];
        if (!item) return;

        const isEquipped = (item.type === 'title' && inv.activeTitle === itemId) || 
                           (item.type === 'border' && inv.activeBorder === itemId);

        const card = document.createElement('div');
        card.className = 'reward-card';
        card.style.border = isEquipped ? `1px solid ${item.color}` : '1px solid var(--border-glass)';
        if (isEquipped) {
            card.style.boxShadow = `0 0 10px ${item.color}`;
        }

        const btnLabel = isEquipped ? 'EQUIPADO' : 'EQUIPAR';
        const btnStyle = isEquipped ? `background: ${item.color}; color: #fff;` : '';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="color: ${item.color};">${item.type === 'title' ? 'TÃƒÆ’Ã‚Â­tulo' : 'Borda'}: ${item.name}</h3>
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
    
    wizardModal.style.display = 'flex';
    
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

    // Passo 2: ArquÃƒÆ’Ã‚Â©tipo
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

    // Passo 3: Comprometimento e FinalizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o
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
            
            // Adapta o deck de missÃƒÆ’Ã‚Âµes com base no arquÃƒÆ’Ã‚Â©tipo e no tempo
            applyArchetypeDeck(selectedArch, gameState.dailyCommitmentMins);
            
            wizardModal.style.display = 'none';
            saveGameData();
            updateUI();
            
            setTimeout(() => {
                showSystemToast(`Despertar concluÃƒÆ’Ã‚Â­do, ${gameState.playerName}. O Sistema iniciou sua jornada.`);
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
        lblHabit.innerText = 'Beber 1 copo de ÃƒÆ’Ã‚Â¡gua ao acordar';
        icon.innerText = 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â§';
    } else if (archetype === 'foco') {
        lblArch.innerText = 'Foco & Produtividade';
        lblHabit.innerText = '15 minutos de leitura (sem celular)';
        icon.innerText = 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â¡';
    } else if (archetype === 'zen') {
        lblArch.innerText = 'Zen & SaÃƒÆ’Ã‚Âºde Mental';
        lblHabit.innerText = 'Meditar por 3 minutos';
        icon.innerText = 'ÃƒÂ°Ã…Â¸Ã‚Â§Ã‹Å“';
    } else if (archetype === 'rotina') {
        lblArch.innerText = 'Estilo de Vida & Rotina';
        lblHabit.innerText = 'Arrumar a cama ao levantar';
        icon.innerText = 'ÃƒÂ°Ã…Â¸Ã…â€™Ã¢â‚¬Â¦';
    }
}

function applyArchetypeDeck(archetype, minutes) {
    let deck = [];
    
    // 1. O Micro-hÃƒÆ’Ã‚Â¡bito base (sempre garantido pelo Hook)
    if (archetype === 'corpo') {
        deck.push({ id: 'q-agua', title: 'Beber 1 copo de ÃƒÆ’Ã‚Â¡gua ao acordar', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â§', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'physical' });
    } else if (archetype === 'foco') {
        deck.push({ id: 'q-ler', title: '15 minutos de leitura (sem celular)', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â¡', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'wisdom' });
    } else if (archetype === 'zen') {
        deck.push({ id: 'q-meditar', title: 'Meditar por 3 minutos', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã‚Â§Ã‹Å“', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'mental' });
    } else if (archetype === 'rotina') {
        deck.push({ id: 'q-cama', title: 'Arrumar a cama ao levantar', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã¢â‚¬Â¦', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'routine' });
    } else {
        deck.push({ id: 'q-foco', title: 'Dar o primeiro passo no meu objetivo', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â¯', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'productivity' });
    }

    // 2. Escalonando a quantidade de hÃƒÆ’Ã‚Â¡bitos pelo Tempo (minutos)
    if (minutes >= 30) {
        // Adiciona mais um hÃƒÆ’Ã‚Â¡bito rÃƒÆ’Ã‚Â¡pido
        deck.push({ id: 'q-acordar', title: 'Acordar Cedo (HorÃƒÆ’Ã‚Â¡rio Fixo)', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã¢â‚¬Â¦', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'routine' });
        if (archetype !== 'corpo') deck.push({ id: 'q-agua2', title: 'Beber ÃƒÆ’Ã‚Âgua (8 copos)', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â§', completed: false, xp: 15, gold: 8, target: 8, current: 0, minLevel: 1, skill: 'physical' });
    }

    if (minutes >= 60) {
        // Adiciona hÃƒÆ’Ã‚Â¡bitos de esforÃƒÆ’Ã‚Â§o mÃƒÆ’Ã‚Â©dio/alto (1 hora permite treino ou estudos intensos)
        if (archetype === 'corpo' || archetype === 'zen') {
            deck.push({ id: 'q-malhar', title: 'Treinar de ForÃƒÆ’Ã‚Â§a / Corrida (45min)', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â¹ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€žÂ¢Ã¢â‚¬Å¡ÃƒÂ¯Ã‚Â¸Ã‚Â', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'physical' });
        } else {
            deck.push({ id: 'q-estudo', title: 'Deep Work / Foco ininterrupto (1h)', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â»', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'productivity' });
        }
    }

    if (minutes >= 120) {
        // Hardcore: Um mix completo (FÃƒÆ’Ã‚Â­sico + Mental + Sabedoria + Social)
        deck.push({ id: 'q-detox', title: '1h sem celular antes de dormir', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Âµ', completed: false, xp: 20, gold: 10, minLevel: 1, skill: 'mental' });
        
        // Se jÃƒÆ’Ã‚Â¡ nÃƒÆ’Ã‚Â£o tiver Treino, adiciona Treino. Se jÃƒÆ’Ã‚Â¡ nÃƒÆ’Ã‚Â£o tiver Deep Work, adiciona Deep Work.
        const hasTreino = deck.some(q => q.id === 'q-malhar');
        const hasEstudo = deck.some(q => q.id === 'q-estudo');
        
        if (!hasTreino) deck.push({ id: 'q-malhar', title: 'Treinar de ForÃƒÆ’Ã‚Â§a / Corrida', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â¹ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€žÂ¢Ã¢â‚¬Å¡ÃƒÂ¯Ã‚Â¸Ã‚Â', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'physical' });
        if (!hasEstudo) deck.push({ id: 'q-estudo', title: 'Deep Work / Estudos', type: 'daily', icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â»', completed: false, xp: 30, gold: 15, minLevel: 1, skill: 'productivity' });
        
        deck.push({ id: 'q-social', title: 'Conectar com FamÃƒÆ’Ã‚Â­lia/Amigo (Sem tela)', type: 'daily', icon: 'ÃƒÂ¢Ã‚ÂÃ‚Â¤ÃƒÂ¯Ã‚Â¸Ã‚Â', completed: false, xp: 15, gold: 8, minLevel: 1, skill: 'social' });
    }
    
    // Substitui o banco ativo e re-renderiza
    gameState.quests = deck;
    renderQuests();
}


// ==========================================================================
// RENDERIZADORES DE INTERFACE (UI)
// ==========================================================================

// Atualiza informaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes gerais do Personagem
function updateUI() {
    document.getElementById('lbl-level').innerText = gameState.level;
    document.getElementById('lbl-gold').innerText = gameState.gold;
    // RANK badge
    const rankInfo = getRankForLevel(gameState.level);
    const rankBadge = document.getElementById('lbl-rank');
    if (rankBadge) {
        rankBadge.innerText = rankInfo.rank;
        rankBadge.className = 'rank-badge ' + rankInfo.css;
    }

    // COSMÃƒÆ’Ã¢â‚¬Â°TICOS (TÃƒÆ’Ã‚Â­tulos e Bordas)
    const titleLabels = {
        'title_implacavel': 'O ImplacÃƒÆ’Ã‚Â¡vel',
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
        const mult = calcStreakMultiplier();
        const multStr = mult > 1 ? ` Ãƒâ€šÃ‚Â· x${mult.toFixed(2)}` : '';
        const shields = gameState.shields || 0;
        const shieldStr = shields > 0
            ? '  ' + 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â¡ÃƒÂ¯Ã‚Â¸Ã‚Â'.repeat(shields) + 'ÃƒÂ¢Ã¢â‚¬â€œÃ¢â‚¬Ëœ'.repeat(3 - shields)
            : '';
        streakEl.innerText = `${gameState.streak}${multStr}${shieldStr}`;
    }

    // Barra de XP
    document.getElementById('lbl-xp-current').innerText = gameState.xp;
    document.getElementById('lbl-xp-next').innerText = gameState.xpToNext;
    const xpPercent = Math.min((gameState.xp / gameState.xpToNext) * 100, 100);
    document.getElementById('xp-bar-inner').style.width = `${xpPercent}%`;

    // Progresso diÃƒÆ’Ã‚Â¡rio
    const totalDailies = gameState.quests.length;
    const completedDailies = gameState.quests.filter(q => q.completed).length;
    document.getElementById('lbl-daily-progress').innerText = `${completedDailies}/${totalDailies}`;

    // RANK badge

    // 3 Barras de atributos (Willpower / Intellect / Health)
    const attrs = computeAttributes();
    const minPct = 0; // Preenchimento diretamente proporcional ao nÃƒÆ’Ã‚Â­vel/progresso
    ['willpower', 'intellect', 'health'].forEach(key => {
        const lvlEl  = document.getElementById(`attr-lvl-${key}`);
        const fillEl = document.getElementById(`attr-fill-${key}`);
        if (lvlEl)  lvlEl.innerText  = attrs[key].level;
        if (fillEl) fillEl.style.width = `${minPct + (attrs[key].pct * (100 - minPct))}%`;
    });

    // Player Title DinÃƒÆ’Ã‚Â¢mico
    const titleLabel = document.getElementById('lbl-player-title');
    if (titleLabel) {
        titleLabel.innerText = computePlayerTitle(attrs);
    }

    // Avatar e radar chart
    updateAvatarImage();
    renderSkills();

    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Sinergias ativas ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
    renderSynergies();
    renderRankPerks();
    renderWeeklyBoss();
    renderAchievements();
    updateTabVisibility();
}

// Renderiza badges de sinergias ativas abaixo das barras de atributo
function renderSynergies() {
    const container = document.getElementById('synergies-container');
    if (!container) return; // Elemento ainda nÃƒÆ’Ã‚Â£o existe no HTML ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â seguro ignorar

    const active = computeSynergies();
    if (active.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '<div style="width:100%; font-size:10px; color:#fbbf24; font-family:var(--font-hud); letter-spacing:2px; margin-bottom:4px; border-bottom: 1px solid rgba(251,191,36,0.3); padding-bottom: 2px;">âš¡ SINERGIAS ATIVAS</div>' + active.map(s => `
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
    container.innerHTML = '<div style="width:100%; font-size:10px; color:#00f0ff; font-family:var(--font-hud); letter-spacing:2px; margin-bottom:4px; margin-top:8px; border-bottom: 1px solid rgba(0,240,255,0.3); padding-bottom: 2px;">â­ RANK PERKS</div>' + active.map(p => `
        <div class="perk-badge" title="${p.description}">
            <span class="perk-icon">${p.icon}</span>
            <span class="perk-name">${p.name}</span>
        </div>
    `).join('');
}

function updateAvatarImage() {
    const avatarEl = document.getElementById('char-avatar-img');
    if (!avatarEl) return;
    
    // Usa os nomes de rank combinados com prefixo numÃ©rico (1.rank-e.png, 2.rank-d.png, ...)
    const rank = getRankForLevel(gameState.level);
    const rankKey = rank.css.replace('rank-', ''); // 'e', 'd', 'c', etc.
    const prefixMap = { e: '1', d: '2', c: '3', b: '4', a: '5', s: '6' };
    const num = prefixMap[rankKey] || '1';
    
    avatarEl.src = `avatars/${num}.rank-${rankKey}.png`;
    avatarEl.onerror = () => { avatarEl.src = 'avatars/1.rank-e.png'; }; // fallback
}

// Renderiza a Ã¡rvore de atributos (Hexagonal Radar Chart) dinamicamente
function renderSkills() {
    // Inicializa se nÃ£o existir no save
    initSkillsState();
    
    // Desenha o grÃ¡fico Radar Hexagonal no Canvas
    drawRadarChart();
}

// Inicializa a Ã¡rvore de skills caso nÃ£o esteja presente no estado (retrocompatibilidade robusta)
function initSkillsState() {
    if (!gameState.skills) {
        gameState.skills = {};
    }
    const skillTypes = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
    skillTypes.forEach(type => {
        if (!gameState.skills[type]) {
            gameState.skills[type] = { level: 1, xp: 0, xpToNext: 5 };
        } else {
            // Recalcula xpToNext com a nova fÃ³rmula (migra saves antigos automaticamente)
            gameState.skills[type].xpToNext = calcSkillXpToNext(gameState.skills[type].level);
        }
    });
}

// FÃ³rmula de XP necessÃ¡rio para subir de nÃ­vel de skill (curva x1.4)
function calcSkillXpToNext(level) {
    return Math.max(5, Math.round(5 * Math.pow(1.4, level - 1)));
}

// XP ganho por conclusÃ£o de quest escala com o level geral do personagem
function calcSkillXpGain() {
    const lvl = gameState.level;
    if (lvl >= 30) return 4;
    if (lvl >= 20) return 3;
    if (lvl >= 10) return 2;
    return 1;
}

// Multiplicador de XP baseado no streak atual: 1 + (streak * 0.005)
// Streak de 14 dias = x1.07, streak de 30 dias = x1.15
function calcStreakMultiplier() {
    return 1 + ((gameState.streak || 0) * 0.005);
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
            physical: 'FÃ­sico ðŸ‹ï¸â€â™‚ï¸',
            mental: 'Mental ðŸ§˜',
            productivity: 'Foco ðŸ’»',
            social: 'ConexÃ£o â¤ï¸',
            wisdom: 'Sabedoria ðŸ“š',
            routine: 'Rotina ðŸŒ…'
        };
        
        setTimeout(() => {
            showSystemToast(`â­ *ATRIBUTO UP!* ${gameState.playerName || 'Guerreiro'}, seu treino diÃ¡rio elevou o seu nÃ­vel de *${skillNamesPT[skillType]}* para o *NÃ­vel ${skillObj.level}*! A consistÃªncia lapida a mente e o corpo. Muito bem!`);

        }, 1200);
    }
    
    checkAndActivateBossQuest(); // â† NOVO: verifica conclusÃ£o de boss quest ao evoluir skill
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

    // Ã¢â€â‚¬Ã¢â€â‚¬ Dungeon ativa Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
                <div class="quest-icon">Ã¢Å¡â€Ã¯Â¸Â</div>
                <div class="quest-title-wrap">
                    <span class="quest-title">${_d.title}</span>
                    <div class="quest-payouts">
                        <span class="diff-badge dungeon-badge">DUNGEON</span>
                        <span class="payout-xp">+${_d.xp} XP</span>
                        <span class="payout-gold">+${_d.gold} Ã°Å¸â€™Â°</span>
                    </div>
                    <div class="dungeon-timer${_urgent ? ' dungeon-timer-urgent' : ''}">Ã¢ÂÂ³ ${_timeLabel}</div>
                </div>
            </div>
            <button class="quest-complete-btn dungeon-btn" data-dungeon="true">Ã¢Å“â€œ</button>
        `;
        sideContainer.appendChild(_dc);
    }
    // Ã¢â€â‚¬Ã¢â€â‚¬ fim dungeon Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    // Ã¢â€â‚¬Ã¢â€â‚¬ Daily Quests Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    gameState.quests.forEach(quest => {
        const card = document.createElement('div');
        card.className = `quest-card ${quest.completed ? 'completed' : ''}`;
        card.setAttribute('data-skill', quest.skill || 'routine');

        const diffMap = { routine: 'RANK E', physical: 'RANK E', wisdom: 'RANK D', mental: 'RANK D', productivity: 'RANK C', social: 'RANK D' };
        const diffLabel = diffMap[quest.skill] || 'RANK E';

        let extraHTML = '';
        if (quest.id === 'q-agua') {
            extraHTML = `<div class="water-adjust-row">
                <button class="water-btn btn-minus" data-id="${quest.id}">Ã¢Ë†â€™</button>
                <span class="water-val">${quest.current || 0}/8 copos</span>
                <button class="water-btn btn-plus" data-id="${quest.id}">+</button>
            </div>`;
        }

        card.innerHTML = `
            <div class="quest-details">
                <div class="quest-icon">${quest.icon}</div>
                <div class="quest-title-wrap">
                    <span class="quest-title">${quest.title}</span>
                    <div class="quest-payouts">
                        <span class="diff-badge">${diffLabel}</span>
                        <span class="payout-xp">+${quest.xp} XP</span>
                        <span class="payout-gold">+${quest.gold} Ã°Å¸Âªâ„¢</span>
                    </div>
                    ${extraHTML}
                </div>
            </div>
            <button class="quest-complete-btn" data-id="${quest.id}">Ã¢Å“â€œ</button>
        `;
        dailyContainer.appendChild(card);
    });

    // Ã¢â€â‚¬Ã¢â€â‚¬ Side Quests Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const activeDungeon = gameState.activeDungeon;
    if (gameState.sideQuests.length === 0 && !(activeDungeon && !activeDungeon.completed)) {
        sideContainer.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;padding:24px;font-family:var(--font-hud);letter-spacing:1px">NENHUMA MISSÃƒÆ’O ATIVA</div>`;
    } else {
        gameState.sideQuests.forEach(quest => {
            const card = document.createElement('div');
            card.className = `quest-card ${quest.completed ? 'completed' : ''}`;
            card.setAttribute('data-skill', 'productivity');
            const diffLabel = quest.difficulty === 'hard' ? 'RANK C' : quest.difficulty === 'medium' ? 'RANK D' : 'RANK E';
            card.innerHTML = `
                <div class="quest-details">
                    <div class="quest-icon">Ã¢Å¡â€Ã¯Â¸Â</div>
                    <div class="quest-title-wrap">
                        <span class="quest-title">${quest.title}</span>
                        <div class="quest-payouts">
                            <span class="diff-badge">${diffLabel}</span>
                            <span class="payout-xp">+${quest.xp} XP</span>
                            <span class="payout-gold">+${quest.gold} Ã°Å¸Âªâ„¢</span>
                        </div>
                    </div>
                </div>
                <button class="quest-complete-btn" data-id="${quest.id}">Ã¢Å“â€œ</button>
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
            <div class="store-info"><span>Ã°Å¸Â§Âª PoÃƒÂ§ÃƒÂ£o de Cura</span><small>Protege o streak por 1 erro</small></div>
            <button>100 Ã°Å¸Âªâ„¢</button>
        </div>
        <div class="store-item" onclick="buyStoreItem('buff_doubleXp')">
            <div class="store-info"><span>Ã°Å¸â€œÅ“ Pergaminho de Dobro XP</span><small>XP x2 por um dia</small></div>
            <button>50 Ã°Å¸Âªâ„¢</button>
        </div>
        <div class="store-item" onclick="buyStoreItem('buff_shield')">
            <div class="store-info"><span>Ã°Å¸â€ºÂ¡Ã¯Â¸Â Carga de Escudo</span><small>Reforce sua defesa</small></div>
            <button>150 Ã°Å¸Âªâ„¢</button>
        </div>
    `;
}

// ==========================================================================
// SISTEMA DE REGRAS DO JOGO E GAMIFICAÃƒâ€¡ÃƒÆ’O
// ==========================================================================

// Finaliza ou altera status de uma Quest (Suporta desmarcar / cancelar)
function toggleQuest(id) {
    // Se for dungeon, roteia para completeDungeon
    if (id === 'dungeon-true') {
        completeDungeon();
        return;
    }

    // Procura nas Quests DiÃƒÂ¡rias
    let quest = gameState.quests.find(q => q.id === id);
    let isDaily = true;

    // Se nÃƒÂ£o achar, procura nas Side Quests
    if (!quest) {
        quest = gameState.sideQuests.find(q => q.id === id);
        isDaily = false;
    }

    if (!quest) return;

    const skillType = quest.skill || 'productivity';

    if (quest.completed) {
        // CANCELAR / DESMARCAR QUEST
        quest.completed = false;
        if (quest.id === 'q-agua') {
            quest.current = 0; // Reseta contador de ÃƒÂ¡gua
        }
        deductRewards(quest.xp, quest.gold);
        
        // Deduz pontos no atributo
        deductSkillXP(skillType);
    } else {
        // CONCLUIR QUEST
        if (quest.id === 'q-agua') {
            quest.current = 8;
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

        // Perk: Foco Matinal Ã¢â‚¬â€ +5 XP na primeira quest concluÃƒÂ­da do dia
        if (hasPerk('foco_matinal') && !gameState._firstQuestBonusGiven) {
            gameState.xp = (gameState.xp || 0) + 5;
            gameState._firstQuestBonusGiven = true;
        }

        // Perk: Momentum Ã¢â‚¬â€ +1 XP por quest consecutiva (acumula atÃƒÂ© 5)
        if (hasPerk('momentum')) {
            gameState._momentumStack = Math.min((gameState._momentumStack || 0) + 1, 5);
            const momentumBonus = gameState._momentumStack;
            gameState.xp = (gameState.xp || 0) + momentumBonus;
        }

        // ApÃƒÂ³s addSkillXP(skillType), antes de showQuestCleared(quest):
        if (!isDaily && gameState.bossQuest?.id === 'd-to-c' && !gameState.bossQuest.completed) {
            gameState.bossQuest.sideQuestsCompleted = (gameState.bossQuest.sideQuestsCompleted || 0) + 1;
        }

        // Quest Cleared animation (Arise-style)
        showQuestCleared(quest);

        
        if (isDaily) {
            checkAllDailies();
        } else {
            // Remove a side quest concluÃƒÂ­da apÃƒÂ³s um tempo para limpar a lista
            setTimeout(() => {
                // Apenas remove se ela continuar marcada como concluÃƒÂ­da (nÃƒÂ£o foi desmarcada)
                const currentQuest = gameState.sideQuests.find(q => q.id === id);
                if (currentQuest && currentQuest.completed) {
                    gameState.sideQuests = gameState.sideQuests.filter(q => q.id !== id);
                    renderQuests();
                    saveGameData();
                }
            }, 2000);
        }
    }

    saveGameData();
    renderQuests();
    updateUI();
}

// Gerencia copos de ÃƒÂ¡gua individualmente
function adjustWater(id, operation) {
    const quest = gameState.quests.find(q => q.id === id);
    if (!quest) return;

    const skillType = quest.skill || 'physical';

    if (quest.completed && operation === 'minus') {
        // Se jÃƒÂ¡ estava concluÃƒÂ­da e diminuiu a ÃƒÂ¡gua, desmarca
        quest.completed = false;
        quest.current = 7;
        deductRewards(quest.xp, quest.gold);
        deductSkillXP(skillType);
    } else if (!quest.completed) {
        if (operation === 'plus' && quest.current < 8) {
            quest.current++;
            if (quest.current === 8) {
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

// Soma XP e Gold, gerencia Level Up
function addRewards(xpGained, goldGained) {
    // Aplica multiplicador de streak e bÃƒÂ´nus de sinergias
    const multiplier = calcStreakMultiplier();
    const synergyXp   = getSynergyXpBonus();
    const synergyGold = getSynergyGoldBonus();
    
    const perkXp = getPerkXpBonus(); // +25% se Lenda Imortal ativo
    const bonusXp = Math.round(xpGained * (multiplier + synergyXp + perkXp));
    const bonusGold = Math.round(goldGained * (1 + synergyGold));
    
    gameState.xp += bonusXp;
    gameState.gold += bonusGold;

    // LÃƒÂ³gica de Level Up
    if (gameState.xp >= gameState.xpToNext) {
        gameState.level++;
        gameState.xp = gameState.xp - gameState.xpToNext;
        gameState.xpToNext = Math.round(gameState.xpToNext * 1.3); // Escalabilidade de XP
        
        // Sincroniza hÃƒÂ¡bitos do novo nÃƒÂ­vel desbloqueado
        syncQuestsByLevel();
        
        triggerLevelUpOverlay();
        checkAndActivateBossQuest(); // verifica boss quest ao subir de nÃƒÂ­vel
    }

    // Verifica conclusÃƒÂ£o de boss quest mesmo sem level up
    checkAndActivateBossQuest();
}

// Sincroniza a lista de hÃƒÂ¡bitos ativos de acordo com o nÃƒÂ­vel do jogador (Skill Tree)
function syncQuestsByLevel() {
    let level = gameState.level;
    
    // Filtra todos os hÃƒÂ¡bitos desbloqueados atÃƒÂ© o nÃƒÂ­vel atual
    let unlockedHabits = ALL_HABITS_DATABASE.filter(h => h.minLevel <= level);
    
    let updatedQuests = [];
    
    unlockedHabits.forEach(dbHabit => {
        // Verifica se o usuÃƒÂ¡rio jÃƒÂ¡ tem essa quest na sua lista ativa de hoje
        let activeQuest = gameState.quests.find(q => q.id === dbHabit.id);
        if (activeQuest) {
            // MantÃƒÂ©m a quest ativa (preserva o status "completada" e contagem de ÃƒÂ¡gua)
            updatedQuests.push(activeQuest);
        } else {
            // Adiciona a nova quest desbloqueada
            updatedQuests.push({ ...dbHabit });
            
            // Notifica o usuÃƒÂ¡rio no chat via Iroh caso nÃƒÂ£o seja a primeira carga do app
            if (gameState.messages.length > 0) {
                setTimeout(() => {
                    showSystemToast(`Ã°Å¸â€Â¥ *SISTEMA:* IncrÃƒÂ­vel, ${gameState.playerName || 'Guerreiro'}! Ao alcanÃƒÂ§ar o nÃƒÂ­vel *${level}*, vocÃƒÂª desbloqueou uma nova quest diÃƒÂ¡ria: *"${dbHabit.title}"*! Que ela fortaleÃƒÂ§a a sua rotina!`);

                }, 1500);
            }
        }
    });
    
    gameState.quests = updatedQuests;
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

// Dispara Overlay de evoluÃƒÂ§ÃƒÂ£o (estilo Arise)
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
            ? `Ã¢Å¡Â¡ LEVEL UP! NÃƒÂ­vel ${gameState.level} atingido! E mais: ${oldRank.rank} Ã¢â€ â€™ ${newRank.rank}! O Sistema reconhece sua evoluÃƒÂ§ÃƒÂ£o!`
            : `Ã¢Å¡Â¡ LEVEL UP! NÃƒÂ­vel ${gameState.level}! O Sistema reconhece sua evoluÃƒÂ§ÃƒÂ£o!`;
        showSystemToast(msg);

    }, 1200);
}

function checkAllDailies() {
    const allDone = gameState.quests.every(q => q.completed);
    if (allDone) {
        gameState.streak++;
        gameState.consecutiveMisses = 0; // zera contador de falhas ao completar o dia

        // Perk: Mente de Diamante Ã¢â‚¬â€ +10 XP ao completar todas as dailies
        if (hasPerk('mente_diamante')) {
            gameState.xp = (gameState.xp || 0) + 10;
        }

        // Perk: O Sistema Ã¢â‚¬â€ +1 Skill XP em uma skill aleatÃƒÂ³ria ao completar todas as dailies
        if (hasPerk('o_sistema')) {
            const skillTypes = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
            const randomSkill = skillTypes[Math.floor(Math.random() * skillTypes.length)];
            if (gameState.skills && gameState.skills[randomSkill]) {
                gameState.skills[randomSkill].xp = (gameState.skills[randomSkill].xp || 0) + 1;
            }
        }

        // Reseta flags de perks diÃƒÂ¡rios
        gameState._firstQuestBonusGiven = false;
        gameState._momentumStack = 0;

        // Incrementa contador para escudo (a cada 7 dias = +1 escudo, mÃƒÂ¡x 3)
        gameState.consecutiveStreak7Days = (gameState.consecutiveStreak7Days || 0) + 1;
        if (gameState.consecutiveStreak7Days >= 7) {
            gameState.consecutiveStreak7Days = 0;
            const maxShields = hasSynergyShieldBonus() ? 4 : 3;
            if ((gameState.shields || 0) < maxShields) {
                gameState.shields = (gameState.shields || 0) + 1;
                setTimeout(() => {
                    showSystemToast(`Ã°Å¸â€ºÂ¡Ã¯Â¸Â *ESCUDO GERADO!* VocÃƒÂª manteve a consistÃƒÂªncia por 7 dias seguidos. Um escudo foi adicionado ao seu arsenal Ã¢â‚¬â€ ele protege sua sequÃƒÂªncia em um dia difÃƒÂ­cil. Escudos ativos: ${gameState.shields}/${maxShields}`, 'toast-alert');
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

// Ã¢â€â‚¬Ã¢â€â‚¬ QUEST CLEARED Animation Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function showQuestCleared(quest) {
    const skillToAttr = {
        mental: 'FORÃƒâ€¡A DE VONTADE Ã¢â€ â€˜', routine: 'FORÃƒâ€¡A DE VONTADE Ã¢â€ â€˜',
        wisdom: 'INTELECTO Ã¢â€ â€˜', productivity: 'INTELECTO Ã¢â€ â€˜',
        physical: 'SAÃƒÅ¡DE Ã¢â€ â€˜', social: 'SAÃƒÅ¡DE Ã¢â€ â€˜'
    };
    const overlay = document.getElementById('quest-cleared-overlay');
    document.getElementById('quest-cleared-rewards').innerText = `+${quest.xp} XP Ã‚Â· +${quest.gold} OURO`;
    document.getElementById('quest-cleared-attr').innerText = skillToAttr[quest.skill] || 'ATRIBUTO Ã¢â€ â€˜';
    overlay.classList.add('show');
    setTimeout(() => overlay.classList.remove('show'), 1800);
}

function applyDailyPenalty() {
    // Incrementa contador de dias faltosos consecutivos
    gameState.consecutiveMisses = (gameState.consecutiveMisses || 0) + 1;
    const misses = gameState.consecutiveMisses;

    // Ã¢â€â‚¬Ã¢â€â‚¬ Verifica escudo (sÃƒÂ³ absorve no 1Ã‚Âº dia faltoso) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    if (misses === 1 && (gameState.shields || 0) > 0) {
        gameState.shields--;
        gameState.consecutiveStreak7Days = 0;

        setTimeout(() => {
            showSystemToast(`Ã°Å¸â€ºÂ¡Ã¯Â¸Â *ESCUDO ATIVADO!* VocÃƒÂª falhou hoje, mas seu escudo absorveu a penalidade. Streak preservada em ${gameState.streak} dias. Escudos restantes: ${gameState.shields}/3. NÃƒÂ£o abuse dessa proteÃƒÂ§ÃƒÂ£o.`);

        }, 500);

        saveGameData();
        updateUI();
        return;
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Determina nÃƒÂ­vel da penalidade Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

    // Ã¢â€â‚¬Ã¢â€â‚¬ Aplica penalidade de XP Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const penalty = Math.max(5, Math.round(gameState.xp * xpPenaltyPct));
    gameState.xp  = Math.max(0, gameState.xp - penalty);

    // Ã¢â€â‚¬Ã¢â€â‚¬ Reseta streak se necessÃƒÂ¡rio Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    if (streakReset) {
        gameState.streak = 0;
        gameState.consecutiveStreak7Days = 0;
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Aplica penalidade nas skills (Ã¢Ë†â€™1 XP nas skills com falhas comuns) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    if (skillPenalty && gameState.skills) {
        // Penaliza skills ligadas a quests nÃƒÂ£o concluÃƒÂ­das
        const failedSkills = new Set();
        (gameState.quests || []).forEach(q => {
            if (!q.completed && q.skill) failedSkills.add(q.skill);
        });
        failedSkills.forEach(skillType => {
            const sk = gameState.skills[skillType];
            if (sk && sk.xp > 0) {
                sk.xp = Math.max(0, sk.xp - 1);
            }
        });
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Debuff visual no player card Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const card = document.getElementById('player-card');
    if (card) {
        card.classList.add('debuffed');
        setTimeout(() => card.classList.remove('debuffed'), debuffDurationMs);
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ Overlay de penalidade Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    document.getElementById('penalty-loss-text').innerText = `Ã¢Ë†â€™${penalty} XP`;
    document.getElementById('penalty-overlay').style.display = 'flex';

    // Ã¢â€â‚¬Ã¢â€â‚¬ Mensagem do Iroh por tom Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    setTimeout(() => {
        const irohMessages = {
            motivational: `Ã¢Ëœâ‚¬Ã¯Â¸Â *SISTEMA:* VocÃƒÂª falhou hoje, ${gameState.playerName || 'Guerreiro'}. Mas um tropeÃƒÂ§o nÃƒÂ£o define sua jornada. _"A jornada mais longa comeÃƒÂ§a com um ÃƒÂºnico passo Ã¢â‚¬â€ e vocÃƒÂª ainda pode dar o de amanhÃƒÂ£."_ Penalidade leve aplicada: Ã¢Ë†â€™${penalty} XP. Levante-se.`,
            firm: `Ã¢Å¡Â Ã¯Â¸Â *SISTEMA:* Dois dias, ${gameState.playerName || 'Guerreiro'}. O Sistema registrou. Sua sequÃƒÂªncia foi zerada. _"O rio que para de correr logo apodrece."_ Ã¢Ë†â€™${penalty} XP deduzidos. NÃƒÂ£o deixe virar hÃƒÂ¡bito.`,
            angry: `Ã¢ËœÂ Ã¯Â¸Â *SISTEMA:* TrÃƒÂªs dias consecutivos de falha. Penalidade severa aplicada. Ã¢Ë†â€™${penalty} XP. Suas habilidades sofreram regressÃƒÂ£o. _"VocÃƒÂª conhece seu potencial e ainda assim escolheu a fraqueza."_ Corrija isso agora.`,
            severe: `Ã°Å¸â€™â‚¬ *SISTEMA Ã¢â‚¬â€ ALERTA CRÃƒÂTICO:* Cinco dias ou mais sem cumprir suas missÃƒÂµes. Penalidade mÃƒÂ¡xima: Ã¢Ë†â€™${penalty} XP. Debuff de 48h ativo. RegressÃƒÂ£o de habilidades aplicada. _"Um guerreiro que abandona sua disciplina por dias nÃƒÂ£o ÃƒÂ© mais um guerreiro Ã¢â‚¬â€ ÃƒÂ© apenas alguÃƒÂ©m com o uniforme."_ Retorne. Agora.`
        };
        showSystemToast(irohMessages[irohTone]);

    }, 600);

    saveGameData();
    updateUI();
}

// ==========================================================================
// LOJA E TAVERNA (COMPRA DE BUFFS E COSMÃƒâ€°TICOS)
// ==========================================================================
function buyStoreItem(itemId) {
    const prices = {
        'buff_autoHeal': 100,
        'buff_doubleXp': 50,
        'buff_shield': 150,
        'title_implacavel': 300,
        'title_mestre': 300,
        'border_neonred': 500
    };

    const cost = prices[itemId];
    if (!cost) return;

    if ((gameState.gold || 0) < cost) {
        showSystemToast(`Ã¢Å¡Â Ã¯Â¸Â *OURO INSUFICIENTE.* O Sistema nÃƒÂ£o faz caridade. VocÃƒÂª precisa de ${cost} Ã°Å¸â€™Â°.`);
        return;
    }

    // Processamento do Item
    if (itemId.startsWith('buff_')) {
        if (!gameState.buffs) gameState.buffs = { autoHeal: false, doubleXp: false, shieldDays: 0 };
        
        if (itemId === 'buff_autoHeal') {
            if (gameState.buffs.autoHeal) {
                showSystemToast("Ã¢Å¡Â Ã¯Â¸Â VocÃƒÂª jÃƒÂ¡ possui uma PoÃƒÂ§ÃƒÂ£o de Cura ativa no inventÃƒÂ¡rio.");
                return;
            }
            gameState.buffs.autoHeal = true;
            showSystemToast("Ã°Å¸Â§Âª *POÃƒâ€¡ÃƒÆ’O COMPRADA!* Seu prÃƒÂ³ximo erro serÃƒÂ¡ perdoado. O Sistema protege os preparados.");
        } 
        else if (itemId === 'buff_doubleXp') {
            if (gameState.buffs.doubleXp) {
                showSystemToast("Ã¢Å¡Â Ã¯Â¸Â Seu Pergaminho jÃƒÂ¡ estÃƒÂ¡ ativo atÃƒÂ© meia-noite!");
                return;
            }
            gameState.buffs.doubleXp = true;
            showSystemToast("Ã°Å¸â€œÅ“ *CONHECIMENTO ADQUIRIDO!* Todo XP ganho hoje serÃƒÂ¡ DOBRADO. VÃƒÂ¡ trabalhar.");
        }
        else if (itemId === 'buff_shield') {
            gameState.shields = (gameState.shields || 0) + 1;
            showSystemToast(`Ã°Å¸â€ºÂ¡Ã¯Â¸Â *ESCUDO COMPRADO!* VocÃƒÂª adicionou 1 carga ao seu escudo principal. Total: ${gameState.shields}`);
        }
    } 
    else if (itemId.startsWith('title_') || itemId.startsWith('border_')) {
        if (!gameState.inventory) gameState.inventory = { unlockedTitles: [], unlockedBorders: [], activeTitle: "", activeBorder: "default" };
        
        const isTitle = itemId.startsWith('title_');
        const inventoryList = isTitle ? gameState.inventory.unlockedTitles : gameState.inventory.unlockedBorders;
        const activeKey = isTitle ? 'activeTitle' : 'activeBorder';
        const displayType = isTitle ? 'TÃƒÂ­tulo' : 'Borda';

        if (inventoryList.includes(itemId)) {
            // Se jÃƒÂ¡ tem, apenas equipa
            gameState.inventory[activeKey] = itemId;
            showSystemToast(`Ã¢Å“Â¨ *${displayType} Equipado(a)!* Atualizado no seu perfil.`);
            saveGameData();
            updateUI(); // Vai atualizar a UI do header
            return; // Retorna para nÃƒÂ£o cobrar ouro de novo
        } else {
            // Compra e equipa
            inventoryList.push(itemId);
            gameState.inventory[activeKey] = itemId;
            showSystemToast(`Ã°Å¸â€™Å½ *${displayType} Desbloqueado(a) e Equipado(a)!*`);
        }
    }

    // Cobra o ouro
    gameState.gold -= cost;
    saveGameData();
    updateUI();
}

// ==========================================================================
// SISTEMA DE NOTIFICAÃƒâ€¡Ãƒâ€¢ES (TOASTS) E IMPACT QUOTES
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
    authorEl.innerText = `Ã¢â‚¬â€ ${randomQuote.author}`;
    
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
    document.getElementById('daily-quests-list').addEventListener('click', handleQuestAction);
    document.getElementById('side-quests-list').addEventListener('click', handleQuestAction);

    // Taverna
    // Modais
    const modalSq  = document.getElementById('modal-sidequest');
    const modalAv  = document.getElementById('modal-avatar-zoom');

    document.getElementById('btn-add-sidequest').addEventListener('click', () => modalSq.style.display = 'flex');
    document.getElementById('close-sq-modal').addEventListener('click', () => modalSq.style.display = 'none');

    window.addEventListener('click', (e) => {
        if (e.target === modalSq) modalSq.style.display = 'none';
        if (e.target === modalAv) modalAv.style.display = 'none';
    });

    // Form: Side Quest
    document.getElementById('form-sidequest').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('sq-title').value;
        const difficulty = document.getElementById('sq-difficulty').value;
        let xp = 25, gold = 15;
        if (difficulty === 'easy') { xp = 10; gold = 5; }
        else if (difficulty === 'hard') { xp = 50; gold = 30; }
        gameState.sideQuests.push({ id: 'sq-' + Date.now(), title, type: 'side', difficulty, completed: false, xp, gold });
        saveGameData(); renderQuests();
        modalSq.style.display = 'none';
        document.getElementById('form-sidequest').reset();
    });

    // Form: Recompensa


    // Level Up Overlay
    document.getElementById('btn-close-levelup').addEventListener('click', () => {
        document.getElementById('level-up-overlay').style.display = 'none';
        saveGameData(); updateUI();
    });

    // Penalty Overlay
    document.getElementById('btn-close-penalty').addEventListener('click', () => {
        document.getElementById('penalty-overlay').style.display = 'none';
    });

    // Avatar Zoom
    document.getElementById('char-avatar-img').addEventListener('click', openAvatarZoom);
    document.getElementById('close-avatar-zoom').addEventListener('click', () => modalAv.style.display = 'none');
}

// Abre o modal de zoom do avatar com o tÃƒÂ­tulo correto e imagem ampliada
function openAvatarZoom() {
    const modal = document.getElementById('modal-avatar-zoom');
    const imgLarge = document.getElementById('img-avatar-large');
    const titleEl = document.getElementById('avatar-zoom-title');
    
    if (!modal || !imgLarge || !titleEl) return;
    
    let level = gameState.level;
    let title = "Recruta - NÃ­vel " + level;
    
    // Calcula rank e arquivo de imagem com base nos arquivos numerados
    const rank = getRankForLevel(level);
    const rankKey = rank.css.replace('rank-', ''); // 'e', 'd', 'c', etc.
    const prefixMap = { e: '1', d: '2', c: '3', b: '4', a: '5', s: '6' };
    const num = prefixMap[rankKey] || '1';
    let src = `avatars/${num}.rank-${rankKey}.png`;
    
    const titleMap = { e: 'Recruta', d: 'Aventureiro', c: 'CaÃ§ador', b: 'Elite', a: 'HerÃ³i LendÃ¡rio', s: 'O Sistema' };
    let titleName = titleMap[rankKey] || 'Recruta';
    title = `${titleName} - NÃ­vel ${level}`;
    
    imgLarge.src = src;
    titleEl.innerText = title;
    modal.style.display = 'flex';
}
function handleQuestAction(e) {
    const target = e.target;
    
    // Dungeon: clique no botÃƒÆ’Ã‚Â£o ou no card
    if (target.classList.contains('dungeon-btn') || target.closest('.dungeon-card')) {
        const btn = target.classList.contains('dungeon-btn')
            ? target
            : target.closest('.dungeon-card')?.querySelector('.dungeon-btn');
        if (btn?.dataset.dungeon) {
            completeDungeon();
            return;
        }
    }

    // Se for clique nos botÃƒÆ’Ã‚Âµes de ajustar ÃƒÆ’Ã‚Â¡gua
    if (target.classList.contains('water-btn')) {
        const id = target.getAttribute('data-id');
        const operation = target.classList.contains('btn-plus') ? 'plus' : 'minus';
        adjustWater(id, operation);
        return;
    }
    
    // Caso contrÃƒÆ’Ã‚Â¡rio, se clicou em qualquer lugar no card, completa a quest
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
// PERSISTÃƒÆ’Ã…Â NCIA DE DADOS (LOCALSTORAGE)
// ==========================================================================
function saveGameData() {
    checkAchievements();
    localStorage.setItem('lifeRPG_gameState', JSON.stringify(gameState));
    if (typeof saveToCloud === 'function') saveToCloud();
}

function loadGameData() {
    // FORÃƒÆ’Ã¢â‚¬Â¡AR RESET ÃƒÆ’Ã…Â¡NICO PEDIDO PELO USUÃƒÆ’Ã‚ÂRIO (NÃƒÆ’Ã‚Â­vel 1, 0 Gold, 0 Streak)
    if (localStorage.getItem('force_reset_v3') !== 'true') {
        localStorage.removeItem('lifeRPG_gameState_Mateus');
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
                { id: 'r-serie', title: 'Assistir 1 Hora de SÃƒÆ’Ã‚Â©rie', cost: 35, icon: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Âº' },
                { id: 'r-cheat', title: 'RefeiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o Livre / Doce', cost: 80, icon: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â' },
                { id: 'r-game',  title: 'Jogar Videogame por 1h',  cost: 45, icon: 'ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â®' }
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
            inventory: { unlockedTitles: [], unlockedBorders: [], activeTitle: null, activeBorder: null }
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
        const parsed = JSON.parse(data);
        
        // Migration: Ensure history exists
        if (!parsed.history) {
            parsed.history = {};
        }

        // MOCK DATA (Gera 90 dias caso nÃƒÆ’Ã‚Â£o exista histÃƒÆ’Ã‚Â³rico e o level for > 1)
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

        // Migration: Ensure buffs and inventory exist
        if (!parsed.buffs) {
            parsed.buffs = { autoHeal: false, doubleXp: false, shieldDays: 0 };
        }
        if (!parsed.inventory) {
            parsed.inventory = { unlockedTitles: [], unlockedBorders: [], activeTitle: null, activeBorder: null };
        } else {
            if (!parsed.inventory.unlockedTitles) parsed.inventory.unlockedTitles = [];
            if (!parsed.inventory.unlockedBorders) parsed.inventory.unlockedBorders = [];
            
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

        // Verifica reset diÃƒÆ’Ã‚Â¡rio
        const todayStr = localDateStr();
        if (parsed.lastCheckedDate && parsed.lastCheckedDate !== todayStr) {
            const completedCount = (parsed.quests || []).filter(q => q.completed).length;
            const totalCount = (parsed.quests || []).length;
            const allWereDone = completedCount >= totalCount && totalCount > 0;
            
            // Grava o HistÃƒÆ’Ã‚Â³rico do dia anterior
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
            // Reseta hÃƒÆ’Ã‚Â¡bitos diÃƒÆ’Ã‚Â¡rios para um novo dia
            parsed.quests.forEach(q => {
                q.completed = false;
                if (q.id === 'q-agua') q.current = 0;
            });
            // Reseta flags de perks diÃƒÆ’Ã‚Â¡rios
            parsed._firstQuestBonusGiven = false;
            parsed._momentumStack = 0;
            
            parsed.lastCheckedDate = todayStr;
        } else if (!parsed.lastCheckedDate) {
            parsed.lastCheckedDate = todayStr;
        }

        gameState = parsed;
        initSkillsState(); // Garante inicializaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o das skills caso seja um save antigo
        
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
    
    // Garante que a lista de hÃƒÆ’Ã‚Â¡bitos esteja sincronizada com o nÃƒÆ’Ã‚Â­vel atual na carga do app
    syncQuestsByLevel();

    // Dungeons e Boss: verifica expiraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o e gera se nÃƒÆ’Ã‚Â£o houver ativa
    checkDungeonExpiry();
    checkWeeklyBossExpiry();
    if (!gameState.activeDungeon && hasSkillLV3()) {
        setTimeout(() => spawnDungeon(), 3000);
    }
}

// ==========================================================================
// CONFIGURAÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã¢â‚¬Â¢ES & PWA MOBILE ENGINE
// ==========================================================================
let serviceWorkerRegistration = null;
let deferredPrompt = null;

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                serviceWorkerRegistration = reg;
                console.log('[App] SW Registrado:', reg.scope);
                
                // Configura notificaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes iniciais assim que o SW estiver pronto
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

        // Clique fora para fechar
        window.addEventListener('click', (e) => {
            if (e.target === modalSettings) {
                modalSettings.style.display = 'none';
            }
        });
    }

    // Solicitar permissÃƒÆ’Ã‚Â£o de notificaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o
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

    // Salvar horÃƒÆ’Ã‚Â¡rios
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
            btnSaveNotif.innerText = 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ SALVO';
            btnSaveNotif.style.background = 'linear-gradient(90deg, var(--neon-green), #34d399)';
            setTimeout(() => {
                btnSaveNotif.innerText = originalText;
                btnSaveNotif.style.background = '';
            }, 1500);
        });
    }

    // Testar notificaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o
    const btnTestNotif = document.getElementById('btn-test-notif');
    if (btnTestNotif) {
        btnTestNotif.addEventListener('click', () => {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'TEST_NOTIFICATION'
                });
            } else {
                alert('Service Worker nÃƒÆ’Ã‚Â£o estÃƒÆ’Ã‚Â¡ ativo ou nÃƒÆ’Ã‚Â£o foi registrado. Aguarde e tente novamente.');
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
                setTimeout(() => showSystemToast('ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¾ *BACKUP EXPORTADO!* Seu arquivo de save foi baixado com sucesso. Guarde-o em local seguro ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ele ÃƒÆ’Ã‚Â© sua memÃƒÆ’Ã‚Â³ria.'), 300);
            } catch(err) {
                showSystemToast('ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Erro ao exportar o save. Tente novamente.');
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
                        showSystemToast('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¥ *SAVE IMPORTADO!* MemÃƒÆ’Ã‚Â³ria restaurada com sucesso. O Sistema estÃƒÆ’Ã‚Â¡ reiniciando...');
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        showSystemToast('ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â *ARQUIVO INVÃƒÆ’Ã‚ÂLIDO.* O arquivo nÃƒÆ’Ã‚Â£o parece ser um backup vÃƒÆ’Ã‚Â¡lido do The System.');
                    }
                } catch (err) {
                    showSystemToast('ÃƒÂ¢Ã‚ÂÃ…â€™ *ERRO AO IMPORTAR.* Arquivo corrompido ou formato desconhecido.');
                }
            };
            reader.readAsText(file);
        });
    }

    // Hard Reset (DestruiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do Sistema)
    const btnHardReset = document.getElementById('btn-hard-reset');
    if (btnHardReset) {
        btnHardReset.addEventListener('click', () => {
            const confirmed = confirm("ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥ TEM CERTEZA QUE DESEJA APAGAR TODO O SEU PROGRESSO?\n\nEsta aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o destruirÃƒÆ’Ã‚Â¡ seu histÃƒÆ’Ã‚Â³rico, atributos, missÃƒÆ’Ã‚Âµes e inventÃƒÆ’Ã‚Â¡rio. VocÃƒÆ’Ã‚Âª voltarÃƒÆ’Ã‚Â¡ ao nÃƒÆ’Ã‚Â­vel 1 e o Onboarding serÃƒÆ’Ã‚Â¡ reiniciado.\n\nESTA AÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã†â€™O NÃƒÆ’Ã†â€™O PODE SER DESFEITA.");
            if (confirmed) {
                localStorage.removeItem('lifeRPG_gameState');
                alert("O Sistema foi resetado. Reiniciando simulaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o...");
                window.location.reload();
            }
        });
    }
}

// Carrega as configuraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes guardadas para a UI dos inputs
function loadSettingsToUI() {
    const times = gameState.notificationTimes || { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 };
    
    const pad = (n) => String(n).padStart(2, '0');
    
    document.getElementById('notif-morning-hour').value = times.morningHour;
    document.getElementById('notif-morning-min').value = pad(times.morningMin);
    document.getElementById('notif-evening-hour').value = times.eveningHour;
    document.getElementById('notif-evening-min').value = pad(times.eveningMin);
}

// Atualiza a badge visual de permissÃƒÆ’Ã‚Â£o
function updateNotificationPermissionUI() {
    const badge = document.getElementById('notif-permission-badge');
    const btnRequest = document.getElementById('btn-request-notif');
    
    if (!badge) return;
    
    if (!('Notification' in window)) {
        badge.innerText = 'NÃƒÆ’Ã†â€™O SUPORTADO';
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
        badge.innerText = 'NÃƒÆ’Ã†â€™O CONFIGURADO';
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

// PWA Install promotion banner
function setupInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    const btnInstall = document.getElementById('btn-pwa-install');
    const btnDismiss = document.getElementById('btn-pwa-dismiss');
    const instructionsText = document.getElementById('install-banner-instructions');
    const btnFooterInstall = document.getElementById('btn-pwa-install-footer');

    // Detecta se ÃƒÆ’Ã‚Â© iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone) {
        console.log('[PWA] Rodando em standalone mode.');
        // Esconde o botÃƒÆ’Ã‚Â£o de rodapÃƒÆ’Ã‚Â© e banner quando jÃƒÆ’Ã‚Â¡ instalado
        if (btnFooterInstall) btnFooterInstall.style.display = 'none';
        const footerWrapper = document.querySelector('.pwa-install-mobile-footer');
        if (footerWrapper) footerWrapper.style.display = 'none';
        return; // PWA jÃƒÆ’Ã‚Â¡ instalado e ativo
    }

    // === BotÃƒÆ’Ã‚Â£o de rodapÃƒÆ’Ã‚Â© ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â SEMPRE visÃƒÆ’Ã‚Â­vel (CSS jÃƒÆ’Ã‚Â¡ faz display:block) ===
    if (btnFooterInstall) {
        btnFooterInstall.addEventListener('click', () => {
            if (isIOS) {
                // iOS nÃƒÆ’Ã‚Â£o suporta prompt nativo ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â mostra instruÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes manuais
                alert('Para instalar no iPhone/iPad:\n\n1. Toque no ÃƒÆ’Ã‚Â­cone de "Compartilhar" (quadrado com seta ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Ëœ no Safari)\n2. Role a lista e toque em "Adicionar ÃƒÆ’Ã‚Â  Tela de InÃƒÆ’Ã‚Â­cio"');
            } else if (deferredPrompt) {
                // Android/Desktop com prompt nativo disponÃƒÆ’Ã‚Â­vel
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
                // Fallback: prompt nativo nÃƒÆ’Ã‚Â£o disponÃƒÆ’Ã‚Â­vel
                alert('Para instalar o LifeRPG:\n\nÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ No Chrome: Toque no menu (ÃƒÂ¢Ã¢â‚¬Â¹Ã‚Â®) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ "Instalar app" ou "Adicionar ÃƒÆ’Ã‚Â  tela de inÃƒÆ’Ã‚Â­cio"\nÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ No Safari: Toque em Compartilhar ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ "Adicionar ÃƒÆ’Ã‚Â  Tela de InÃƒÆ’Ã‚Â­cio"\nÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ No Firefox: Toque no menu ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ "Instalar"');
            }
        });
    }

    // === Banner flutuante ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â lÃƒÆ’Ã‚Â³gica original ===
    if (isIOS) {
        if (instructionsText && btnInstall) {
            instructionsText.innerText = 'Para instalar no iOS: Toque em Compartilhar e depois "Adicionar ÃƒÆ’Ã‚Â  Tela de InÃƒÆ’Ã‚Â­cio".';
            btnInstall.style.display = 'none';
        }
        setTimeout(() => {
            if (banner && localStorage.getItem('pwa_install_dismissed') !== 'true') {
                banner.classList.add('show');
            }
        }, 3000);
    } else {
        // Android/Desktop ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â captura o prompt nativo
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
                    console.log('[PWA] UsuÃƒÆ’Ã‚Â¡rio aceitou a instalaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.');
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
// ABA VISÃƒÆ’Ã†â€™O GLOBAL E HEATMAP
// ==========================================================================
function renderGlobalDashboard() {
    const tabGlobal = document.getElementById('tab-global');
    if (!tabGlobal || !tabGlobal.classList.contains('active')) return;

    const history = gameState.history || {};
    const dates = Object.keys(history).sort((a,b) => new Date(a) - new Date(b));
    
    // 1. Preencher Heatmap Anual (365 dias)
    const heatmapGrid = document.getElementById('heatmap-grid');
    if(heatmapGrid) heatmapGrid.innerHTML = '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Dia inicial (364 dias atrÃƒÆ’Ã‚Â¡s + hoje = 365)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    // Padding para alinhar verticalmente (Semana comeÃƒÆ’Ã‚Â§a domingo = 0)
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
        // setTimeout para garantir que a renderizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o no DOM rolou antes do scroll
        setTimeout(() => {
            heatmapGrid.parentElement.scrollLeft = heatmapGrid.parentElement.scrollWidth;
        }, 10);
    }

    // 2. Preencher MÃƒÆ’Ã‚Â©tricas de Topo
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

    // 3. GrÃƒÆ’Ã‚Â¡fico de Barras Mensais
    const barChart = document.getElementById('dash-bar-chart');
    if(barChart) {
        barChart.innerHTML = '';
        const monthsNames = ['J','F','M','A','M','J','J','A','S','O','N','D'];
        const maxMonthly = Math.max(...monthlyData, 1); // Evita divisÃƒÆ’Ã‚Â£o por zero

        for (let i = 0; i < 12; i++) {
            const hPercent = (monthlyData[i] / maxMonthly) * 100;
            
            const col = document.createElement('div');
            col.className = 'dash-bar-col';
            col.innerHTML = `
                <div class="dash-bar-fill" style="height: ${hPercent}%" title="${monthlyData[i]} hÃƒÆ’Ã‚Â¡bitos em ${monthsNames[i]}"></div>
                <div class="dash-bar-lbl">${monthsNames[i]}</div>
            `;
            barChart.appendChild(col);
        }
    }

    // 4. Top HÃƒÆ’Ã‚Â¡bitos
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
            showSystemToast('☁️ *SAVE SINCRONIZADO!* Progresso atualizado da nuvem.');
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
        const name = user.displayName || (user.isAnonymous ? 'AnÃƒÂ´nimo' : user.email);
        el.innerHTML = <span class="cloud-dot online"></span> ;
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'inline-flex';
    } else {
        el.innerHTML = <span class="cloud-dot offline"></span> NÃƒÂ£o sincronizado;
        if (btnLogin) btnLogin.style.display = 'inline-flex';
        if (btnLogout) btnLogout.style.display = 'none';
    }
}
