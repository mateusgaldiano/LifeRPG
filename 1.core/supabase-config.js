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
  const btn = document.getElementById('btn-cloud-login');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Abrindo Google...';
  }
  try {
    const redirectUrl = window.location.origin + window.location.pathname;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false
      }
    });
    if (error) {
      console.error('[Supabase Auth]', error.message);
      if (typeof showSystemToast === 'function') showSystemToast('Erro ao iniciar login: ' + error.message);
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg> ENTRAR COM GOOGLE'; }
    }
  } catch(e) {
    console.error('[Supabase Auth] Exceção:', e);
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg> ENTRAR COM GOOGLE'; }
  }
};

window.logoutSupabase = async function() {
  if (presenceChannel) {
    presenceChannel.unsubscribe();
    presenceChannel = null;
    presenceSubscribed = false;
  }
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

// --------------------------------------------------------------------------
// PRESENCE — Controle de status online e jogadores ativos
// --------------------------------------------------------------------------
let presenceChannel = null;
let presenceSubscribed = false;
window.onlineUsersState = {};

window.initPresence = function(userId, username, level, rank) {
  const trackPayload = {
    user_id: userId,
    username: username,
    level: level,
    rank: rank,
    online_at: new Date().toISOString()
  };

  if (presenceChannel && presenceSubscribed) {
    presenceChannel.track(trackPayload);
    return;
  }

  if (presenceChannel) {
    presenceChannel.unsubscribe();
  }

  presenceChannel = supabaseClient.channel('presence:global');
  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      window.onlineUsersState = presenceChannel.presenceState();
      if (typeof updateOnlinePlayersUI === 'function') {
        updateOnlinePlayersUI();
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        presenceSubscribed = true;
        await presenceChannel.track(trackPayload);
      } else {
        presenceSubscribed = false;
      }
    });
};

function updateCloudStatusUI(online) {
  const dot = document.querySelector('.cloud-dot');
  const label = document.getElementById('cloud-status-label');
  if (dot) dot.classList.toggle('online', online);
  if (label) label.innerText = online ? 'ONLINE' : 'NÃO SINCRONIZADO';

  const btnLogin = document.getElementById('btn-cloud-login');
  const btnLogout = document.getElementById('btn-cloud-logout');

  if (btnLogin) {
    btnLogin.style.display = online ? 'none' : '';
    btnLogin.disabled = false;
    // Restaurar label original caso tenha sido alterado durante loading
    if (!online) {
      btnLogin.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg> ENTRAR COM GOOGLE';
    }
  }
  if (btnLogout) {
    btnLogout.style.display = online ? '' : 'none';
  }
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
    const rankLetter = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
    const { data: newUser } = await supabaseClient
      .from('users')
      .insert({
        person_id: authUser.id,
        username: gameState.playerName || authUser.email,
        level: gameState.level,
        xp: gameState.xp,
        gold: gameState.gold,
        streak: gameState.streak,
        rank: rankLetter,
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

  // Inicializar Presença Global pós login/restauração de sessão
  if (window._currentUserDbId) {
    const userRankLetter = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
    window.initPresence(window._currentUserDbId, gameState.playerName || authUser.email, gameState.level, userRankLetter);
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

  const rankLetter = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
  const { error } = await supabaseClient
    .from('users')
    .update({
      username:    gameState.playerName,
      level:       gameState.level,
      xp:          gameState.xp,
      gold:        gameState.gold,
      streak:      gameState.streak,
      rank:        rankLetter,
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

  if (error) {
    console.error('[Supabase] saveToSupabase:', error.message);
  } else {
    // Re-trackear presença com os dados de nível/rank atualizados
    if (typeof window.initPresence === 'function') {
      window.initPresence(window._currentUserDbId, gameState.playerName, gameState.level, rankLetter);
    }
  }
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

