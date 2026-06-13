// ============================================================
// supabase-config.js — LifeRPG OS v2.0
// Cliente Supabase inicializado para uso global no app
// ============================================================

const SUPABASE_URL  = 'https://ppsqvppnunzagxqruoqf.supabase.co';
const SUPABASE_ANON = 'sb_publishable_nu9f4NzPEemdC4zm2bg1kw_88j7xeAz';

// Inicializa o cliente global (SDK deve ser carregado antes via CDN no index.html)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── AUTH HELPERS ─────────────────────────────────────────────

/** Retorna o usuário logado (auth.uid) ou null */
async function getAuthUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user || null;
}

/** Login com Google OAuth */
async function loginWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
    if (error) console.error('[Auth] Erro no login Google:', error.message);
}

/** Logout */
async function logout() {
    await supabaseClient.auth.signOut();
}

// ── CLOUD SAVE — USERS ───────────────────────────────────────

/**
 * Salva o gameState atual no Supabase.
 * Usa upsert: cria se não existir, atualiza se já existir.
 */
async function saveToSupabase(gameState) {
    const user = await getAuthUser();
    if (!user) return false;

    const { error } = await supabaseClient
        .from('users')
        .upsert({
            person_id:      user.id,
            username:       gameState.playerName || 'Guerreiro',
            level:          gameState.level      || 1,
            xp:             gameState.xp         || 0,
            gold:           gameState.gold        || 0,
            streak:         gameState.streak      || 0,
            rank:           getRankForLevel ? getRankForLevel(gameState.level) : 'E',
            archetype:      gameState.archetype   || null,
            active_skin:    gameState.inventory?.activeSkin || 'default',
            active_title:   gameState.inventory?.activeTitle || null,
            skills:         gameState.skills      || {},
            settings:       { theme: gameState.theme || 'dark' },
            last_active_at: new Date().toISOString(),
        }, { onConflict: 'person_id' });

    if (error) {
        console.error('[Supabase] Erro ao salvar user:', error.message);
        return false;
    }
    return true;
}

/**
 * Carrega os dados do jogador do Supabase.
 * Retorna null se não logado ou sem dados.
 */
async function loadFromSupabase() {
    const user = await getAuthUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('person_id', user.id)
        .single();

    if (error || !data) return null;
    return data;
}

// ── CLOUD SAVE — HISTORY ─────────────────────────────────────

/**
 * Salva o registro de performance do dia no Supabase.
 */
async function saveHistoryToSupabase(userId, historyEntry) {
    const { error } = await supabaseClient
        .from('history')
        .upsert({
            user_id:         userId,
            date:            historyEntry.date,
            xp_earned:       historyEntry.xpEarned      || 0,
            gold_earned:     historyEntry.goldEarned     || 0,
            quests_done:     historyEntry.questsDone     || 0,
            quests_total:    historyEntry.questsTotal    || 0,
            status:          historyEntry.status         || 'partial',
            penalty_applied: historyEntry.penaltyApplied || false,
            skills_xp:       historyEntry.skillsXp       || {},
        }, { onConflict: 'user_id,date' });

    if (error) console.error('[Supabase] Erro ao salvar history:', error.message);
}

/**
 * Carrega o histórico dos últimos N dias do Supabase.
 */
async function loadHistoryFromSupabase(userId, days = 365) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabaseClient
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: false });

    if (error) { console.error('[Supabase] Erro ao carregar history:', error.message); return []; }
    return data || [];
}

// ── CLOUD SAVE — QUESTS ──────────────────────────────────────

/**
 * Sincroniza as quests do jogador com o Supabase.
 */
async function saveQuestsToSupabase(userId, quests) {
    if (!quests || quests.length === 0) return;

    const rows = quests.map(q => ({
        id:           q.id,
        user_id:      userId,
        title:        q.title,
        skill:        q.skill,
        type:         q.type       || 'daily',
        difficulty:   q.difficulty || 'medium',
        xp:           q.xp         || 0,
        gold:         q.gold       || 0,
        emoji:        q.emoji      || '⚔️',
        completed:    q.completed  || false,
        from_library: q.fromLibrary || false,
        recurring:    q.type === 'daily',
    }));

    const { error } = await supabaseClient
        .from('quests')
        .upsert(rows, { onConflict: 'id' });

    if (error) console.error('[Supabase] Erro ao salvar quests:', error.message);
}

console.log('[Supabase] Cliente inicializado ✓');
