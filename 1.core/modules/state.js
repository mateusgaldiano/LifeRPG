// state.js
import { localDateStr, getXpToNextForLevel, hasSkillLV3, initSkillsState, isQuestActiveOnDay } from './utils.js';
import { syncQuestsByLevel, checkDungeonExpiry, checkWeeklyBossExpiry, spawnDungeon, checkAchievements, saveToCloud, checkWeeklyChallengeReset } from './game-logic.js';
// RANK_THRESHOLDS agora vive no núcleo puro; re-exportado abaixo p/ compatibilidade.
import { RANK_THRESHOLDS } from './game-math.js';

// Versão vem da fonte única (1.core/version.js, carregado antes dos módulos).
export const APP_VERSION = (typeof self !== 'undefined' && self.APP_VERSION) ? self.APP_VERSION : 'v0.0.0';

/* ==========================================================================
   LIFERPG - CORE GAME LOGIC & COMPANION SYSTEM (2026)
   ========================================================================== */

// Banco de dados mestre de hábitos por nível do LifeRPG
const ALL_HABITS_DATABASE = []; // conceito de auto-unlock por nível removido (v2.1.43)

// Biblioteca mestre de 60 hábitos curados para a aba Biblioteca do modal
const HABIT_LIBRARY = [
    // Físico (physical)
    { id: 'lib-agua', title: 'Beber 2L de água', icon: '💧', difficulty: 'easy', duration: 5, skill: 'physical' },
    { id: 'lib-along-easy', title: 'Alongar ao acordar', icon: '🧘', difficulty: 'easy', duration: 10, skill: 'physical' },
    { id: 'lib-exerc15-easy', title: '15 min de exercício', icon: '💪', difficulty: 'easy', duration: 15, skill: 'physical' },
    { id: 'lib-banho-frio-easy', title: '30s de banho frio', icon: '🚿', difficulty: 'easy', duration: 2, skill: 'physical' },
    { id: 'lib-caminhada-med', title: 'Caminhada', icon: '🚶', difficulty: 'medium', duration: 30, skill: 'physical' },
    { id: 'lib-hiit-med', title: 'Treino HIIT', icon: '🔥', difficulty: 'medium', duration: 20, skill: 'physical' },
    { id: 'lib-mobilidade-med', title: 'Treino de mobilidade', icon: '🤸', difficulty: 'medium', duration: 20, skill: 'physical' },
    { id: 'lib-ciclo-hard', title: 'Ciclismo', icon: '🚴', difficulty: 'hard', duration: 60, skill: 'physical' },
    { id: 'lib-forca-hard', title: 'Treino de força', icon: '🏋️‍♂️', difficulty: 'hard', duration: 45, skill: 'physical' },
    { id: 'lib-musc-hard', title: 'Natação', icon: '🏊', difficulty: 'hard', duration: 60, skill: 'physical' },
    { id: 'lib-corridalonga-hard', title: 'Corrida longa', icon: '🏃', difficulty: 'hard', duration: 45, skill: 'physical' },
    { id: 'lib-hiking-hard', title: 'Trilha / hiking', icon: '🥾', difficulty: 'hard', duration: 60, skill: 'physical' },
    { id: 'lib-marciais-hard', title: 'Artes marciais', icon: '🥋', difficulty: 'hard', duration: 60, skill: 'physical' },

    // Mental (mental)
    { id: 'lib-bd-easy', title: 'Brain Dump', icon: '🧠', difficulty: 'easy', duration: 5, skill: 'mental' },
    { id: 'lib-filosofia-easy', title: 'Leitura filosófica', icon: '📖', difficulty: 'easy', duration: 10, skill: 'mental' },
    { id: 'lib-gratidao-easy', title: 'Diário de gratidão', icon: '🙏', difficulty: 'easy', duration: 5, skill: 'mental' },
    { id: 'lib-medguiada-easy', title: 'Meditação guiada', icon: '🎧', difficulty: 'easy', duration: 10, skill: 'mental' },
    { id: 'lib-express-med', title: 'Escrever diário', icon: '✍️', difficulty: 'medium', duration: 15, skill: 'mental' },
    { id: 'lib-escrever-ideias-med', title: 'Escrever sobre ideias futuras', icon: '💡', difficulty: 'medium', duration: 15, skill: 'mental' },
    { id: 'lib-escrever-preoc-med', title: 'Escrever sobre preocupações', icon: '🌧️', difficulty: 'medium', duration: 15, skill: 'mental' },
    { id: 'lib-medplena-med', title: 'Meditação profunda', icon: '🧘', difficulty: 'medium', duration: 20, skill: 'mental' },
    { id: 'lib-silencio-hard', title: 'Meio dia de silêncio', icon: '🤫', difficulty: 'hard', duration: 180, skill: 'mental' },
    { id: 'lib-semredes-hard', title: 'Dia sem redes', icon: '📴', difficulty: 'hard', duration: 120, skill: 'mental' },
    { id: 'lib-terapia-hard', title: 'Sessão de terapia', icon: '🛋️', difficulty: 'hard', duration: 60, skill: 'mental' },

    // Foco / Produtividade (productivity)
    { id: 'lib-networking-easy', title: 'Mensagem de networking', icon: '🔗', difficulty: 'easy', duration: 5, skill: 'productivity' },
    { id: 'lib-inbox-easy', title: 'Inbox zero', icon: '📥', difficulty: 'easy', duration: 10, skill: 'productivity' },
    { id: 'lib-aviao-easy', title: 'Celular no modo avião', icon: '✈️', difficulty: 'easy', duration: 5, skill: 'productivity' },
    { id: 'lib-reuniao-med', title: 'Planejar reunião', icon: '🗓️', difficulty: 'medium', duration: 20, skill: 'productivity' },
    { id: 'lib-carreira-prop-med', title: 'Planejar minha carreira', icon: '🧭', difficulty: 'medium', duration: 30, skill: 'productivity' },
    { id: 'lib-carreira-soc-med', title: 'Carreira dos liderados', icon: '🤝', difficulty: 'medium', duration: 30, skill: 'productivity' },
    { id: 'lib-automatizar-med', title: 'Automatizar uma tarefa', icon: '⚙️', difficulty: 'medium', duration: 30, skill: 'productivity' },
    { id: 'lib-trimestre-hard', title: 'Planejar o trimestre', icon: '📊', difficulty: 'hard', duration: 60, skill: 'productivity' },
    { id: 'lib-feedback-hard', title: 'Estruturar Feedback/Meritocracia', icon: '⚖️', difficulty: 'hard', duration: 60, skill: 'productivity' },

    // Saber / Sabedoria (wisdom)
    { id: 'lib-ted-easy', title: 'TED Talk', icon: '📺', difficulty: 'easy', duration: 15, skill: 'wisdom' },
    { id: 'lib-duolingo-easy', title: 'Estudar idioma', icon: '🗣️', difficulty: 'easy', duration: 15, skill: 'wisdom' },
    { id: 'lib-podcast-easy', title: 'Podcast educativo', icon: '🎙️', difficulty: 'easy', duration: 20, skill: 'wisdom' },
    { id: 'lib-livro-med', title: 'Ler livro', icon: '📚', difficulty: 'medium', duration: 30, skill: 'wisdom' },
    { id: 'lib-doc-med', title: 'Documentário', icon: '🎬', difficulty: 'medium', duration: 45, skill: 'wisdom' },
    { id: 'lib-curso-hard', title: 'Curso online', icon: '🧠', difficulty: 'hard', duration: 45, skill: 'wisdom' },
    { id: 'lib-cert-hard', title: 'Estudar para certificação', icon: '🎓', difficulty: 'hard', duration: 120, skill: 'wisdom' },
    // Rotina (routine)
    { id: 'lib-financas-easy', title: 'Lançar finanças', icon: '💰', difficulty: 'easy', duration: 5, skill: 'routine' },
    { id: 'lib-dente-easy', title: 'Higiene bucal', icon: '🪥', difficulty: 'easy', duration: 5, skill: 'routine', current: 0, target: 2 },
    { id: 'lib-skincare-easy', title: 'Skincare', icon: '🧴', difficulty: 'easy', duration: 5, skill: 'routine' },
    { id: 'lib-roupa-easy', title: 'Preparar roupas do dia', icon: '💼', difficulty: 'easy', duration: 5, skill: 'routine' },
    { id: 'lib-casa-easy', title: 'Organizar a casa', icon: '🍽️', difficulty: 'easy', duration: 15, skill: 'routine' },
    { id: 'lib-louca-easy', title: 'Lavar a louça', icon: '🍽️', difficulty: 'easy', duration: 15, skill: 'routine' },
    { id: 'lib-plantas-easy', title: 'Regar as plantas', icon: '🪴', difficulty: 'easy', duration: 10, skill: 'routine' },
    { id: 'lib-doar-easy', title: 'Doar 1 objeto', icon: '🎁', difficulty: 'easy', duration: 5, skill: 'routine' },
    { id: 'lib-vitaminas-easy', title: 'Tomar vitaminas/remédio', icon: '💊', difficulty: 'easy', duration: 5, skill: 'routine' },
    { id: 'lib-cozinhar-med', title: 'Cozinhar refeição saudável', icon: '🥦', difficulty: 'medium', duration: 30, skill: 'routine' },
    { id: 'lib-rotnoite-med', title: 'Rotina noturna', icon: '📵', difficulty: 'medium', duration: 30, skill: 'routine' },
    { id: 'lib-comodo-med', title: 'Organizar um cômodo', icon: '🧹', difficulty: 'medium', duration: 20, skill: 'routine' },
    { id: 'lib-faxina-hard', title: 'Faxina diária', icon: '🧼', difficulty: 'hard', duration: 45, skill: 'routine' },
    { id: 'lib-banho-gelado-hard', title: 'Banho frio completo', icon: '🧊', difficulty: 'hard', duration: 10, skill: 'routine' },
    { id: 'lib-orcamento-hard', title: 'Revisar orçamento do mês', icon: '🧾', difficulty: 'hard', duration: 30, skill: 'routine' },

    // Social (social)
    { id: 'lib-elogio-easy', title: 'Elogiar alguém', icon: '💬', difficulty: 'easy', duration: 2, skill: 'social' },
    { id: 'lib-amigo-easy', title: 'Mensagem para família/amigo', icon: '💬', difficulty: 'easy', duration: 3, skill: 'social' },
    { id: 'lib-ligar-med', title: 'Ligar família/amigos', icon: '📞', difficulty: 'medium', duration: 15, skill: 'social' },
    { id: 'lib-qualidade-hard', title: 'Tempo com a família', icon: '👥', difficulty: 'hard', duration: 60, skill: 'social' },
    { id: 'lib-familia-hard', title: 'Escuta ativa', icon: '❤️', difficulty: 'hard', duration: 45, skill: 'social' },
    { id: 'lib-voluntariado-hard', title: 'Voluntariado', icon: '🤲', difficulty: 'hard', duration: 60, skill: 'social' },

    // Vícios (addiction) — nascem completos (abstinência). Desmarcar = recaída.
    { id: 'lib-vicio-cigarro', title: 'Não fumar', icon: '🚬', skill: 'addiction' },
    { id: 'lib-vicio-alcool', title: 'Não beber álcool', icon: '🍺', skill: 'addiction' },
    { id: 'lib-vicio-acucar', title: 'Evitar açúcar', icon: '🍬', skill: 'addiction' },
    { id: 'lib-vicio-fastfood', title: 'Evitar fast food', icon: '🍔', skill: 'addiction' },
    { id: 'lib-vicio-porn', title: 'Sem pornografia', icon: '🔞', skill: 'addiction' },
    { id: 'lib-vicio-redes', title: 'Sem redes sociais em excesso', icon: '📱', skill: 'addiction' },
    { id: 'lib-vicio-aposta', title: 'Não apostar', icon: '🎰', skill: 'addiction' },
    { id: 'lib-vicio-refri', title: 'Sem refrigerante', icon: '🥤', skill: 'addiction' },
    { id: 'lib-vicio-procrastinar', title: 'Não procrastinar', icon: '⏳', skill: 'addiction' },
    { id: 'lib-vicio-jogar', title: 'Não jogar', icon: '🎮', skill: 'addiction' },
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
    addictionStreak: 0,      // dias consecutivos sem nenhuma recaída em vícios
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
    buffs: { autoHeal: false, doubleXp: false, legendaryFocus: false, shieldDays: 0, addictionPenalty: false, addictionPenaltyExpiresAt: null },
    inventory: { unlockedTitles: [], unlockedBorders: [], unlockedSkins: ['default'], activeTitle: null, activeBorder: null, activeSkin: 'default' },
    notificationTimes: { morningHour: 7, morningMin: 0, eveningHour: 19, eveningMin: 0 },
    lastWeeklyReportYearWeek: "",
    lastWelcomeDateShown: "",   // guarda a data do último toast de boas-vindas (YYYY-MM-DD)
    tutorialStep: 1,
    tutorialCompleted: false,
    friendsCount: 0,
    _lastSyncedAt: "",
    questOps: []   // outbox de operações de quest (add/edit/delete) p/ sync confiável
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


//  Sistema de RANK (Solo Leveling) — RANK_THRESHOLDS movido para game-math.js.


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
    'b-to-s': {
        id: 'b-to-s',
        title: 'Vigília do Estoico',
        description: 'Mantenha uma sequência de 14 dias consecutivos.',
        rankFrom: 'RANK B', rankTo: 'RANK S',
        xpReward: 600, goldReward: 180,
        check: () => (gameState.streak || 0) >= 14,
        progress: () => `${Math.min(gameState.streak || 0, 14)}/14 dias de streak`
    },
    's-to-nacional': {
        id: 's-to-nacional',
        title: 'O Sistema Completo',
        description: 'Eleve TODAS as 6 skills para o Nível 5 simultaneamente.',
        rankFrom: 'RANK S', rankTo: 'Nacional',
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
    },
    'nacional-to-governante': {
        id: 'nacional-to-governante',
        title: 'Força de Autoridade',
        description: 'Chegue a uma sequência de 30 dias de streak.',
        rankFrom: 'Nacional', rankTo: 'Governante',
        xpReward: 1500, goldReward: 500,
        check: () => (gameState.streak || 0) >= 30,
        progress: () => `${Math.min(gameState.streak || 0, 30)}/30 dias de streak`
    },
    'governante-to-monarca': {
        id: 'governante-to-monarca',
        title: 'O Trono Vazio',
        description: 'Complete 100 quests no total.',
        rankFrom: 'Governante', rankTo: 'Monarca',
        xpReward: 2500, goldReward: 1000,
        check: () => true, // Auto-completa ou check simbólico
        progress: () => `Desafio Supremo Liberado`
    }
};


// ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ Banco de Dungeons ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬
const DUNGEON_POOL = [
    // mental
    { title: 'Hora do Silêncio',   skill: 'mental',       xp: 75,  gold: 35 },
    { title: 'Meditação Extrema',  skill: 'mental',       xp: 95,  gold: 48 },
    { title: 'Vazio Absoluto',     skill: 'mental',       xp: 120, gold: 60 },
    { title: 'Caos Controlado',    skill: 'mental',       xp: 70,  gold: 30 },

    // routine
    { title: 'Ritual Perfeito',    skill: 'routine',      xp: 75,  gold: 38 },
    { title: 'Sequência Sagrada',  skill: 'routine',      xp: 90,  gold: 45 },
    { title: 'Sincronia do Sono',  skill: 'routine',      xp: 110, gold: 55 },
    { title: 'Reinício de Ciclo',  skill: 'routine',      xp: 70,  gold: 35 },

    // wisdom
    { title: 'Leitura Profunda',   skill: 'wisdom',       xp: 80,  gold: 40 },
    { title: 'Tomo Proibido',      skill: 'wisdom',       xp: 95,  gold: 48 },
    { title: 'Revelação Arquivada',skill: 'wisdom',       xp: 130, gold: 65 },
    { title: 'Mente do Aprendiz',  skill: 'wisdom',       xp: 75,  gold: 35 },

    // productivity
    { title: 'Projeto Expresso',   skill: 'productivity', xp: 90,  gold: 45 },
    { title: 'Sprint de Foco',     skill: 'productivity', xp: 110, gold: 55 },
    { title: 'Hiperfoco Arise',    skill: 'productivity', xp: 140, gold: 70 },
    { title: 'Monge Produtivo',    skill: 'productivity', xp: 80,  gold: 40 },

    // physical
    { title: 'Treino Solitário',   skill: 'physical',     xp: 80,  gold: 40 },
    { title: 'Corrida do Dragão',  skill: 'physical',     xp: 100, gold: 50 },
    { title: 'Superação de Limites',skill: 'physical',    xp: 125, gold: 60 },
    { title: 'Templo de Ferro',    skill: 'physical',     xp: 75,  gold: 35 },

    // social
    { title: 'Conexão Rara',       skill: 'social',       xp: 70,  gold: 35 },
    { title: 'Aliança Inesperada', skill: 'social',       xp: 85,  gold: 42 },
    { title: 'Rede de Caçadores',  skill: 'social',       xp: 115, gold: 55 },
    { title: 'Apoio da Guilda',    skill: 'social',       xp: 75,  gold: 35 }
];

const DUNGEON_DURATION_MS = 48 * 60 * 60 * 1000; // 48 horas em ms


// ==========================================================================
// OUTBOX DE OPERAÇÕES DE QUEST (add/edit/delete)
// Registra a INTENÇÃO de cada mutação. flushQuestOps() (em supabase-config.js)
// replica a fila no Supabase no próximo sync / reconexão. Garante que adições E
// exclusões subam de forma confiável, online ou offline — sem inferir intenção
// por diferença de conjuntos (que ambiguava "adicionei aqui" vs "deletei lá").
// ==========================================================================
function queueQuestOp(id, op) {
    if (!id || (op !== 'upsert' && op !== 'delete')) return;
    if (!Array.isArray(gameState.questOps)) gameState.questOps = [];
    // Dedup por id — a intenção mais recente vence (last-write-wins).
    gameState.questOps = gameState.questOps.filter(o => o.id !== id);
    gameState.questOps.push({ id, op, ts: Date.now() });
    localStorage.setItem('lifeRPG_gameState', JSON.stringify(gameState));
    // Online + logado: tenta subir na hora; offline fica na fila p/ próximo flush.
    if (navigator.onLine && window._currentUserDbId && typeof window.flushQuestOps === 'function') {
        window.flushQuestOps();
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


// Detecta uma entrada de histórico gerada pela antiga MOCK DATA (removida na
// v2.5.8). Assinatura exata do gerador: total sempre 8, count ∈ {0,2,5,8} e SEM
// os campos que o reset real grava (completedIds/xpEarned). Conservador de
// propósito — entradas reais (que carregam completedIds) nunca casam.
function isMockHistoryEntry(e) {
    return !!e && typeof e === 'object'
        && e.total === 8
        && [0, 2, 5, 8].includes(e.count)
        && e.completedIds === undefined
        && e.xpEarned === undefined;
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
            'q-db-faxina': '🧹',
            'q-db-conversa': '📞',
            'q-db-caminhada-easy': '🚶',
            'q-db-podcast-easy': '🎧',
            'q-db-estudomed': '🧠',
            'q-db-caminhada-med': '🚶',
            'q-faxina': '🧹',
            'q-conversa': '📞',
            'q-caminhada-easy': '🚶',
            'q-podcast-easy': '🎧',
            'q-estudomed': '🧠',
            'q-caminhada-med': '🚶',
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

        // (Removido em v2.5.8: geração de 90 dias de histórico FALSO quando o save
        // tinha level > 1 e history vazio. Poluía o heatmap/estatísticas de usuários
        // reais — era um artefato de desenvolvimento, não comportamento desejado.)
        //
        // Limpeza (v2.5.10): saves anteriores à v2.5.8 já GRAVARAM esse histórico
        // falso no localStorage — remover a geração não apaga o que já existe. Aqui
        // purgamos as entradas com a assinatura exata do mock (total===8, count em
        // {0,2,5,8}, SEM completedIds/xpEarned). Entradas reais carregam completedIds,
        // então não são afetadas.
        if (parsed.history && typeof parsed.history === 'object') {
            let purged = 0;
            for (const [date, e] of Object.entries(parsed.history)) {
                if (isMockHistoryEntry(e)) { delete parsed.history[date]; purged++; }
            }
            if (purged > 0) console.log(`[Migration] Removidas ${purged} entradas de histórico mock (v2.5.8-).`);
        }

        if (!parsed.lastWeeklyReportYearWeek) {
            parsed.lastWeeklyReportYearWeek = "";
        }

        // Migration: Ensure buffs and inventory exist
        if (!parsed.buffs) {
            parsed.buffs = { autoHeal: false, doubleXp: false, doubleXpExpiresAt: null, legendaryFocus: false, shieldDays: 0, addictionPenalty: false, addictionPenaltyExpiresAt: null };
        } else if (parsed.buffs.legendaryFocus === undefined) {
            parsed.buffs.legendaryFocus = false;
        }
        // Migração: debuff de recaída de vícios
        if (parsed.buffs.addictionPenalty === undefined) parsed.buffs.addictionPenalty = false;
        if (parsed.buffs.addictionPenaltyExpiresAt === undefined) parsed.buffs.addictionPenaltyExpiresAt = null;
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
        if (!parsed.lastWelcomeDateShown) {
            parsed.lastWelcomeDateShown = "";
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
            const completionRate = totalCount > 0 ? (completedCount / totalCount) : 1.0;
            const shouldPenalize = completionRate < 0.70;
            
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
                // Denormaliza skill+duration NO MOMENTO da conclusão (antes salvava só
                // o título e o relatório re-cruzava por título — frágil com títulos
                // repetidos, renomeados ou excluídos). Entradas legadas (strings) ainda
                // são aceitas pelos leitores via fallback.
                completedIds: activeYesterday.filter(q => q.completed).map(q => ({
                    id: q.id,
                    title: q.title,
                    skill: q.skill || 'routine',
                    duration: q.duration || 5
                }))
            };

            // Verifica penalidade (apenas se concluiu menos de 70% das missões ativas)
            if (totalCount > 0 && shouldPenalize && (parsed.streak || 0) > 0 && !isRestDay) {
                // Penalidade adiada para depois do DOM estar pronto
                const yesterdayStr = parsed.lastCheckedDate;
                setTimeout(() => window.applyDailyPenalty(yesterdayStr), 2000);
            } else if (completionRate >= 0.70) {
                parsed.consecutiveMisses = 0; // Reseta falhas consecutivas se completou 70%+ das quests
            }
            // Vícios: incrementa a streak de abstinência se nenhuma recaída ocorreu
            // ontem (o flag é setado em toggleQuest ao desmarcar um vício). Só conta
            // se o jogador de fato tem algum vício cadastrado.
            const hasAddictions = (parsed.quests || []).some(q => q.type === 'addiction');
            if (hasAddictions && !parsed._addictionRelapsedToday) {
                parsed.addictionStreak = (parsed.addictionStreak || 0) + 1;
            }
            parsed._addictionRelapsedToday = false;

            // Reseta hábitos diários para um novo dia
            parsed.quests.forEach(q => {
                const type = q.type || 'daily';
                if (type === 'daily') {
                    q.completed = false;
                    if (q.current !== undefined) q.current = 0;
                } else if (type === 'addiction') {
                    // Vícios nascem COMPLETOS a cada novo dia (abstinência por padrão).
                    q.completed = true;
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

            // Marca que o reset diário ocorreu hoje — impede a nuvem de reaplicar 'completed' antigo
            parsed._lastDailyResetDate = todayStr;
            parsed.lastCheckedDate = todayStr;
        } else if (!parsed.lastCheckedDate) {
            parsed.lastCheckedDate = todayStr;
        }

        for (const key in gameState) delete gameState[key]; Object.assign(gameState, parsed);
        if (!Array.isArray(gameState.questOps)) gameState.questOps = []; // migração: fila de ops
        if (!Array.isArray(gameState.quests)) gameState.quests = [];
        if (!Array.isArray(gameState.sideQuests)) gameState.sideQuests = [];
        if (!Array.isArray(gameState.rewards) || gameState.rewards.length === 0) {
            gameState.rewards = [
                { id: 'r-serie', title: 'Assistir 1 Hora de Série', cost: 35, icon: '📺' },
                { id: 'r-cheat', title: 'Refeição Livre / Doce', cost: 80, icon: '🍔' },
                { id: 'r-game', title: 'Jogar Videogame por 1h', cost: 45, icon: '🎮' }
            ];
        }
        
        // Sanitize legacy corrupted icons in saved quests
        const cleanQuestCounters = (q) => {
            // Higienização bucal: contador fixo 0/2 (não é checkbox simples e NÃO herda o 8 da água).
            // Auto-corrige saves antigos em que a quest ficou sem contador.
            const isOralHygiene = q.id?.includes('dente') || q.id?.includes('bucal') ||
                                  q.title?.toLowerCase().includes('higieniza') ||
                                  q.title?.toLowerCase().includes('bucal') ||
                                  q.icon === '🪥' || q.emoji === '🪥';
            if (isOralHygiene) {
                q.target = 2;
                if (q.current === undefined || q.current === null) q.current = 0;
                if (q.current > 2) q.current = 2;
            }

            const isWater = q.id?.includes('agua') ||
                            q.title?.toLowerCase().includes('água') ||
                            q.title?.toLowerCase().includes('agua') ||
                            q.icon === '💧' ||
                            q.emoji === '💧';

            // Preserva contador se target > 1 (água OU qualquer outra quest com contador, ex: higienização bucal 0/2)
            const hasExplicitCounter = q.target !== undefined && q.target !== null && q.target > 1;

            if (!isWater && !hasExplicitCounter) {
                // Quest simples sem contador — limpa campos residuais
                delete q.current;
                delete q.target;
            } else if (isWater && !hasExplicitCounter) {
                // Água sem target definido → garante padrão 8 copos
                if (q.current === undefined || q.current === null) q.current = 0;
                if (q.target === undefined || q.target === null) q.target = 8;
            }
            // Se hasExplicitCounter === true: preserva target e current como estão

            
            // Extrai a duração do título ou infere com base em palavras-chave
            if (!q.duration) {
                const match = q.title?.match(/\((\d+)\s*min\)/i);
                if (match) {
                    q.duration = parseInt(match[1]);
                } else {
                    const t = q.title?.toLowerCase() || '';
                    if (t.includes('treinar') || t.includes('força') || t.includes('corrida') || t.includes('academia') || t.includes('calistenia')) {
                        q.duration = 45;
                    } else if (t.includes('projeto pessoal') || t.includes('estudo') || t.includes('curso')) {
                        q.duration = 30;
                    } else {
                        q.duration = 5;
                    }
                }
            }
        };

        if (gameState.quests) {
            gameState.quests.forEach(q => {
                if (q.id === 'q-cama' && (!q.icon || q.icon.includes('<') || q.icon.includes('\u0005'))) {
                    q.icon = '🛏️';
                }
                cleanQuestCounters(q);
            });
        }
        if (gameState.sideQuests) {
            gameState.sideQuests.forEach(cleanQuestCounters);
        }

        if (typeof gameState.streak !== 'number') {
            gameState.streak = parseInt(gameState.streak) || 0;
        }
        initSkillsState(); // Garante inicialização das skills caso seja um save antigo
        
        // Inicializa campos novos caso seja um save antigo
        if (gameState.shields === undefined) gameState.shields = 0;
        if (gameState.addictionStreak === undefined) gameState.addictionStreak = 0;
        if (gameState.consecutiveStreak7Days === undefined) gameState.consecutiveStreak7Days = 0;
        if (gameState.consecutiveMisses === undefined) gameState.consecutiveMisses = 0;
        if (gameState.bossQuest === undefined) gameState.bossQuest = null;
        if (gameState.activeDungeon === undefined) gameState.activeDungeon = null;
        if (gameState.weeklyBoss === undefined) gameState.weeklyBoss = null;
        if (gameState.unlockedAchievements === undefined) gameState.unlockedAchievements = [];
        if (gameState._dungeonsCompleted === undefined) gameState._dungeonsCompleted = 0;
        // Backfill de masmorra antiga (pré-v2.1.40, sem objetivo): dá alvo/progresso.
        if (gameState.activeDungeon && typeof gameState.activeDungeon.target !== 'number') {
            const _l = gameState.level || 1;
            gameState.activeDungeon.target = _l >= 30 ? 5 : _l >= 20 ? 4 : _l >= 10 ? 3 : 2;
            gameState.activeDungeon.progress = gameState.activeDungeon.progress || 0;
        }
        // Migração v2.1.48: masmorra presa em completed:true (bug pré-v2.1.45 nunca
        // zerava activeDungeon ao concluir). Limpa o resíduo — XP/ouro já foram creditados.
        if (gameState.activeDungeon && gameState.activeDungeon.completed) {
            gameState.activeDungeon = null;
        }
        if (gameState._totalQuestsCompleted === undefined) gameState._totalQuestsCompleted = 0; // META-001
        if (gameState._maxDailyCompleted === undefined) gameState._maxDailyCompleted = 0;       // META-001
        if (gameState._pvpWins === undefined) gameState._pvpWins = 0;                           // META-001

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
    checkWeeklyChallengeReset();
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
    queueQuestOp,
    updateSWQuestStatus
};

export function resetGameState(defaultState) {
    for (const key in gameState) {
        delete gameState[key];
    }
    Object.assign(gameState, defaultState);
}
