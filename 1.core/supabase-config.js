// ==========================================================================
// SUPABASE CONFIG — LifeRPG OS v2.0
// ==========================================================================

const SUPABASE_URL = 'https://ppsqvppnunzagxqruoqf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nu9f4NzPEemdC4zm2bg1kw_88j7xeAz';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --------------------------------------------------------------------------
// MAPA DE SKINS — local skin id → UUID da tabela items
// --------------------------------------------------------------------------
const SKIN_ID_MAP = {
  'default':            'b1a990aa-68f5-4e51-befa-baa6d9fb6f26',
  'skin_shadow_master': '560e058f-3b14-47a1-8738-6225f56240b2',
  'skin_mist_monarch':  '244e480e-7526-4fe8-8480-11567994819b',
  'skin_arise_emperor': 'ec38df83-b822-4220-a816-aea29d83ac05',
};
// Mapa inverso (UUID → local id) para reconstruir o inventário local
const SKIN_ID_MAP_REVERSE = Object.fromEntries(
  Object.entries(SKIN_ID_MAP).map(([k, v]) => [v, k])
);

// --------------------------------------------------------------------------
// SESSION ID — gerado uma vez por sessão de app, usado no analytics
// --------------------------------------------------------------------------
const _sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);

// --------------------------------------------------------------------------
// ANALYTICS — substitui Firebase Analytics
// Nunca deve quebrar o app, mesmo se Supabase estiver fora do ar
// --------------------------------------------------------------------------
window.trackEvent = function(eventName, params = {}) {
  try {
    supabaseClient.auth.getUser().then(({ data }) => {
      const userId = data?.user ? window._currentUserDbId : null;
      supabaseClient.from('analytics_events').insert({
        user_id: userId,
        event_name: eventName,
        params: { ...params, app_version: '2.0' },
        session_id: _sessionId,
      }).then(({ error }) => {
        if (error) console.warn('[Analytics]', error.message);
      });
    });
  } catch (e) {
    // silencioso — analytics nunca quebra o app
  }
};

// --------------------------------------------------------------------------
// ESTADO INTERNO
// --------------------------------------------------------------------------
window._currentUserDbId = null; // id (uuid) da linha em 'users', preenchido após login

// --------------------------------------------------------------------------
// AUTH — login/logout com Google
// --------------------------------------------------------------------------
window.loginWithGoogle = async function() {
  const redirectUrl = window.location.origin + window.location.pathname;
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
  if (error) console.error('[Supabase Auth]', error.message);
};

window.logoutSupabase = async function() {
  await supabaseClient.auth.signOut();
  window._currentUserDbId = null;
  // Atualizar UI para estado "Não sincronizado"
  updateCloudStatusUI(false);
};

// --------------------------------------------------------------------------
// INIT — chamado no lugar de initFirebase()
// --------------------------------------------------------------------------
window.initSupabase = function() {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      updateCloudStatusUI(true);
      await ensureUserProfile(session.user);
      await syncFromCloud();
    } else {
      updateCloudStatusUI(false);
    }
  });

  // Checar sessão existente ao carregar
  supabaseClient.auth.getSession().then(({ data }) => {
    if (data?.session?.user) {
      updateCloudStatusUI(true);
      ensureUserProfile(data.session.user).then(() => syncFromCloud());
    }
  });
};

function updateCloudStatusUI(online) {
  const dot = document.querySelector('.cloud-dot');
  const label = document.getElementById('cloud-status-label');
  if (dot) dot.classList.toggle('online', online);
  if (label) label.innerText = online ? 'ONLINE' : 'NÃO SINCRONIZADO';

  document.getElementById('btn-cloud-login')?.style?.setProperty(
    'display', online ? 'none' : 'block'
  );
  document.getElementById('btn-cloud-logout')?.style?.setProperty(
    'display', online ? 'block' : 'none'
  );
}

// --------------------------------------------------------------------------
// GARANTIR PERFIL — cria persons + users se for o primeiro login
// --------------------------------------------------------------------------
async function ensureUserProfile(authUser) {
  // 1. Verificar/criar em persons
  let { data: person } = await supabaseClient
    .from('persons')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (!person) {
    await supabaseClient.from('persons').insert({
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.email,
    });
  }

  // 2. Verificar/criar em users
  let { data: userRow } = await supabaseClient
    .from('users')
    .select('id')
    .eq('person_id', authUser.id)
    .maybeSingle();

  if (!userRow) {
    // PRIMEIRO LOGIN — fazer upload do progresso local atual
    const { data: newUser } = await supabaseClient
      .from('users')
      .insert({
        person_id: authUser.id,
        username: gameState.playerName || authUser.email,
        level: gameState.level,
        xp: gameState.xp,
        gold: gameState.gold,
        streak: gameState.streak,
        rank: getRankForLevel(gameState.level),
        archetype: gameState.archetype,
        active_skin: gameState.inventory?.activeSkin || 'default',
        skills: gameState.skills,
        settings: {
          achievements: gameState.achievements || [],
          unlockedSkins: gameState.inventory?.unlockedSkins || ['default'],
        },
        last_active_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    window._currentUserDbId = newUser.id;

    // Upload de quests e history existentes localmente
    await syncQuestsToSupabase();
    await saveAllHistoryToSupabase();
    await syncInventoryToSupabase();

  } else {
    window._currentUserDbId = userRow.id;
  }
}

// --------------------------------------------------------------------------
// SYNC FROM CLOUD — chamado após login, resolve conflitos
// --------------------------------------------------------------------------
window.syncFromCloud = async function() {
  if (!window._currentUserDbId) return;

  const { data: cloudUser } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', window._currentUserDbId)
    .single();

  if (!cloudUser) return;

  const cloudIsNewer =
    cloudUser.level > gameState.level ||
    (cloudUser.level === gameState.level && cloudUser.streak > gameState.streak);

  if (cloudIsNewer) {
    // Nuvem ganha — sobrescrever estado local
    gameState.level     = cloudUser.level;
    gameState.xp        = cloudUser.xp;
    gameState.gold      = cloudUser.gold;
    gameState.streak    = cloudUser.streak;
    gameState.archetype = cloudUser.archetype;
    gameState.skills    = cloudUser.skills;
    gameState.playerName = cloudUser.username;

    gameState.achievements = cloudUser.settings?.achievements || [];

    await loadQuestsFromSupabase();
    await loadHistoryFromSupabase();
    await loadInventoryFromSupabase();

    saveGameData(); // persiste no localStorage também
    updateUI();
  } else {
    // Local ganha — subir para a nuvem
    await saveToSupabase();
    await syncQuestsToSupabase();
    await saveAllHistoryToSupabase();
    await syncInventoryToSupabase();
  }
};

// --------------------------------------------------------------------------
// SAVE TO CLOUD — chamado a cada saveGameData(), se logado
// --------------------------------------------------------------------------
window.saveToSupabase = async function() {
  if (!window._currentUserDbId) return;

  const { error } = await supabaseClient
    .from('users')
    .update({
      username:    gameState.playerName,
      level:       gameState.level,
      xp:          gameState.xp,
      gold:        gameState.gold,
      streak:      gameState.streak,
      rank:        getRankForLevel(gameState.level),
      archetype:   gameState.archetype,
      active_skin: gameState.inventory?.activeSkin || 'default',
      skills:      gameState.skills,
      settings: {
        achievements: gameState.achievements || [],
        unlockedSkins: gameState.inventory?.unlockedSkins || ['default'],
      },
      last_active_at: new Date().toISOString(),
    })
    .eq('id', window._currentUserDbId);

  if (error) console.error('[Supabase] saveToSupabase:', error.message);
};

// --------------------------------------------------------------------------
// QUESTS — sync bidirecional usando local_id
// --------------------------------------------------------------------------
async function syncQuestsToSupabase() {
  if (!window._currentUserDbId) return;

  const allQuests = [
    ...(gameState.quests || []).map(q => ({ ...q, type: 'daily' })),
    ...(gameState.sideQuests || []).map(q => ({ ...q, type: 'side' })),
  ];

  const rows = allQuests.map(q => ({
    user_id: window._currentUserDbId,
    local_id: q.id,
    title: q.title,
    skill: q.skill,
    type: q.type,
    difficulty: q.difficulty || 'medium',
    xp: q.xp,
    gold: q.gold,
    emoji: q.emoji || q.icon,
    completed: !!q.completed,
    completed_at: q.completed ? new Date().toISOString() : null,
    from_library: !!q.fromLibrary,
    recurring: q.type === 'daily',
    current: q.current ?? null,
    target: q.target ?? null,
  }));

  if (rows.length === 0) return;

  const { error } = await supabaseClient
    .from('quests')
    .upsert(rows, { onConflict: 'user_id,local_id' });

  if (error) console.error('[Supabase] syncQuestsToSupabase:', error.message);
}

window.loadQuestsFromSupabase = async function() {
  if (!window._currentUserDbId) return;

  const { data, error } = await supabaseClient
    .from('quests')
    .select('*')
    .eq('user_id', window._currentUserDbId);

  if (error || !data) return;

  gameState.quests = data
    .filter(q => q.type === 'daily')
    .map(q => ({
      id: q.local_id,
      title: q.title,
      skill: q.skill,
      type: 'daily',
      difficulty: q.difficulty,
      xp: q.xp,
      gold: q.gold,
      emoji: q.emoji,
      icon: q.emoji,
      completed: q.completed,
      fromLibrary: q.from_library,
      current: q.current,
      target: q.target,
    }));

  gameState.sideQuests = data
    .filter(q => q.type === 'side')
    .map(q => ({
      id: q.local_id,
      title: q.title,
      skill: q.skill,
      type: 'side',
      difficulty: q.difficulty,
      xp: q.xp,
      gold: q.gold,
      emoji: q.emoji,
      icon: q.emoji,
      completed: q.completed,
      fromLibrary: q.from_library,
    }));
};

// --------------------------------------------------------------------------
// HISTORY — sync em lote
// --------------------------------------------------------------------------
async function saveAllHistoryToSupabase() {
  if (!window._currentUserDbId) return;

  const historyEntries = Object.entries(gameState.history || {});
  if (historyEntries.length === 0) return;

  const rows = historyEntries.map(([date, entry]) => ({
    user_id: window._currentUserDbId,
    date: date,
    xp_earned: entry.xpEarned || 0,
    gold_earned: entry.goldEarned || 0,
    quests_done: entry.questsDone || 0,
    quests_total: entry.questsTotal || 0,
    status: entry.status || 'partial',
    penalty_applied: !!entry.penaltyApplied,
    skills_xp: entry.skillsXp || {},
  }));

  const { error } = await supabaseClient
    .from('history')
    .upsert(rows, { onConflict: 'user_id,date' });

  if (error) console.error('[Supabase] saveAllHistoryToSupabase:', error.message);
}

window.loadHistoryFromSupabase = async function() {
  if (!window._currentUserDbId) return;

  const { data, error } = await supabaseClient
    .from('history')
    .select('*')
    .eq('user_id', window._currentUserDbId);

  if (error || !data) return;

  gameState.history = {};
  data.forEach(row => {
    gameState.history[row.date] = {
      xpEarned: row.xp_earned,
      goldEarned: row.gold_earned,
      questsDone: row.quests_done,
      questsTotal: row.quests_total,
      status: row.status,
      penaltyApplied: row.penalty_applied,
      skillsXp: row.skills_xp,
    };
  });
};

// --------------------------------------------------------------------------
// INVENTORY — sync usando SKIN_ID_MAP
// --------------------------------------------------------------------------
async function syncInventoryToSupabase() {
  if (!window._currentUserDbId) return;

  const unlockedSkins = gameState.inventory?.unlockedSkins || ['default'];
  const activeSkin = gameState.inventory?.activeSkin || 'default';

  const rows = unlockedSkins
    .filter(skinKey => SKIN_ID_MAP[skinKey])
    .map(skinKey => ({
      user_id: window._currentUserDbId,
      item_id: SKIN_ID_MAP[skinKey],
      equipped: skinKey === activeSkin,
    }));

  if (rows.length === 0) return;

  const { error } = await supabaseClient
    .from('inventory')
    .upsert(rows, { onConflict: 'user_id,item_id' });

  if (error) console.error('[Supabase] syncInventoryToSupabase:', error.message);
}

window.loadInventoryFromSupabase = async function() {
  if (!window._currentUserDbId) return;

  const { data, error } = await supabaseClient
    .from('inventory')
    .select('item_id, equipped')
    .eq('user_id', window._currentUserDbId);

  if (error || !data) return;

  const unlockedSkins = data
    .map(row => SKIN_ID_MAP_REVERSE[row.item_id])
    .filter(Boolean);

  const equippedRow = data.find(row => row.equipped);
  const activeSkin = equippedRow
    ? SKIN_ID_MAP_REVERSE[equippedRow.item_id]
    : 'default';

  if (!gameState.inventory) gameState.inventory = {};
  gameState.inventory.unlockedSkins = unlockedSkins.length ? unlockedSkins : ['default'];
  gameState.inventory.activeSkin = activeSkin;
};

