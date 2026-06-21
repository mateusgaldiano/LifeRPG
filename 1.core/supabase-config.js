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
window._isSupabaseAuthenticated = false; // flag síncrono — atualizado por onAuthStateChange

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
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true  // ← nós mesmos fazemos o redirect
      }
    });
    if (error) {
      console.error('[Supabase Auth]', error.message);
      if (typeof showSystemToast === 'function') showSystemToast('Erro ao iniciar login: ' + error.message);
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg> ENTRAR COM GOOGLE'; }
      return;
    }
    if (data?.url) {
      window.location.href = data.url;  // ← redirect explícito
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
  if (typeof window.unsubscribeUserFromPush === 'function') {
    try {
      await window.unsubscribeUserFromPush();
    } catch (e) {
      console.error('[Supabase Auth] Erro ao remover push no logout:', e);
    }
  }
  // Limpa o cache local do chat de outros usuários por privacidade
  localStorage.removeItem('lifeRPG_chatCache');

  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    console.error('[Supabase Auth signOut error]', err);
  }

  localStorage.removeItem('lifeRPG_gameState');
  localStorage.removeItem('force_reset_v4');
  window._currentUserDbId = null;

  // Atualizar UI e recarregar
  updateCloudStatusUI(false);
  window.location.reload();
};

// --------------------------------------------------------------------------
// INIT — chamado no lugar de initFirebase()
// --------------------------------------------------------------------------
window.initSupabase = function() {
  return new Promise((resolve) => {
    let resolved = false;
    const done = (status = { isReturningUser: false, tutorialCompleted: false }) => {
      if (!resolved) {
        resolved = true;
        resolve(status);
      }
    };

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        updateCloudStatusUI(true);
        const profile = await ensureUserProfile(session.user);
        await syncFromCloud();
        if (typeof window.subscribeUserToPush === 'function' && 'Notification' in window && Notification.permission === 'granted') {
          window.subscribeUserToPush();
        }
        if (typeof window.refreshActiveSocialTab === 'function') {
          window.refreshActiveSocialTab();
        }
        done(profile);
      } else {
        updateCloudStatusUI(false);
        if (typeof window.refreshActiveSocialTab === 'function') {
          window.refreshActiveSocialTab();
        }
        done({ isReturningUser: false, tutorialCompleted: false });
      }
    });

    // Checar sessão existente ao carregar
    supabaseClient.auth.getSession().then(async ({ data }) => {
      if (data?.session?.user) {
        updateCloudStatusUI(true);
        try {
          const profile = await ensureUserProfile(data.session.user);
          await syncFromCloud();
          if (typeof window.subscribeUserToPush === 'function' && 'Notification' in window && Notification.permission === 'granted') {
            window.subscribeUserToPush();
          }
          done(profile);
        } catch (e) {
          console.error('[Supabase init session error]', e);
          done({ isReturningUser: false, tutorialCompleted: false });
        }
      } else {
        done({ isReturningUser: false, tutorialCompleted: false });
      }
    }).catch((err) => {
      console.error('[Supabase getSession error]', err);
      done({ isReturningUser: false, tutorialCompleted: false });
    });
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

window.updateCloudStatusUI = function(online) {
  window._isSupabaseAuthenticated = online; // mantém flag síncrono atualizado

  const dot = document.querySelector('.cloud-dot');
  const label = document.getElementById('cloud-status-label');
  if (dot) dot.classList.toggle('online', online);
  if (label) label.innerText = online ? 'ONLINE' : 'NÃO SINCRONIZADO';

  const btnLogin = document.getElementById('btn-cloud-login');
  const btnLogout = document.getElementById('btn-cloud-logout');

  if (btnLogin) {
    btnLogin.style.display = online ? 'none' : '';
    btnLogin.disabled = false;
    // Restaurar sempre o label, independente do estado (evita ficar preso em "Abrindo Google...")
    btnLogin.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg> ENTRAR COM GOOGLE';
  }
  if (btnLogout) {
    btnLogout.style.display = online ? '' : 'none';
  }
  const btnSync = document.getElementById('btn-cloud-sync');
  if (btnSync) {
    btnSync.style.display = online ? '' : 'none';
  }
}

// --------------------------------------------------------------------------
// GARANTIR PERFIL — cria persons + users se for o primeiro login
// --------------------------------------------------------------------------
async function ensureUserProfile(authUser) {
  let isReturningUser = false;
  let tutorialCompleted = false;
  try {
    // ── PASSO 1: Verificar/criar em persons ──────────────────────────────
    const { data: person, error: personSelectError } = await supabaseClient
      .from('persons')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (personSelectError) {
      console.error('[Supabase] Erro ao buscar persons:', personSelectError.message);
    }

    if (!person) {
      const { error: personInsertError } = await supabaseClient
        .from('persons')
        .upsert({
          id:    authUser.id,
          email: authUser.email,
          name:  authUser.user_metadata?.full_name || authUser.email,
        }, { onConflict: 'id' });

      if (personInsertError) {
        console.error('[Supabase] Erro ao criar person:', personInsertError.message, personInsertError.code);
        if (typeof showSystemToast === 'function') {
          showSystemToast('Erro ao criar perfil: ' + personInsertError.message);
        }
        return { isReturningUser, tutorialCompleted };
      }
      console.log('[Supabase] Person criada com sucesso:', authUser.id);
    }

    // ── PASSO 2: Verificar/criar em users ────────────────────────────────
    const { data: userRow, error: userSelectError } = await supabaseClient
      .from('users')
      .select('id, settings')
      .eq('person_id', authUser.id)
      .maybeSingle();

    if (userSelectError) {
      console.error('[Supabase] Erro ao buscar users:', userSelectError.message);
    }

    if (!userRow) {
      isReturningUser = false;
      tutorialCompleted = gameState.tutorialCompleted || false;
      // PRIMEIRO LOGIN — fazer upload do progresso local atual
      const rankLetter = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
      const { data: newUser, error: userInsertError } = await supabaseClient
        .from('users')
        .upsert({
          person_id:      authUser.id,
          username:       gameState.playerName || authUser.email,
          level:          gameState.level,
          xp:             gameState.xp,
          gold:           gameState.gold,
          streak:         gameState.streak,
          rank:           rankLetter,
          archetype:      gameState.archetype,
          active_skin:    gameState.inventory?.activeSkin || 'default',
          skills:         gameState.skills,
          settings: {
            achievements:  gameState.achievements || [],
            unlockedSkins: gameState.inventory?.unlockedSkins || ['default'],
            tutorialCompleted: gameState.tutorialCompleted || false,
            tutorialStep: gameState.tutorialStep || null,
          },
          last_active_at: new Date().toISOString(),
        }, { onConflict: 'person_id' })
        .select('id')
        .maybeSingle();

      if (userInsertError || !newUser) {
        console.error('[Supabase] Erro ao criar user:', userInsertError?.message, userInsertError?.code);
        if (typeof showSystemToast === 'function') {
          showSystemToast('Erro ao salvar perfil do jogador: ' + (userInsertError?.message || 'resposta vazia'));
        }
        return { isReturningUser, tutorialCompleted };
      }

      console.log('[Supabase] User criado com sucesso:', newUser.id);
      window._currentUserDbId = newUser.id;

      // Upload de quests e history existentes localmente
      await syncQuestsToSupabase();
      await saveAllHistoryToSupabase();
      await syncInventoryToSupabase();

    } else {
      isReturningUser = true;
      tutorialCompleted = userRow.settings?.tutorialCompleted ?? false;
      window._currentUserDbId = userRow.id;
      console.log('[Supabase] User existente carregado:', userRow.id);
    }

    // ── PRESENÇA GLOBAL ──────────────────────────────────────────────────
    if (window._currentUserDbId) {
      const userRankLetter = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
      window.initPresence(window._currentUserDbId, gameState.playerName || authUser.email, gameState.level, userRankLetter);
    }

  } catch (err) {
    console.error('[Supabase] Exceção inesperada em ensureUserProfile:', err);
    if (typeof showSystemToast === 'function') {
      showSystemToast('Erro inesperado no login. Verifique o console.');
    }
  }
  return { isReturningUser, tutorialCompleted };
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
    gameState.tutorialCompleted = cloudUser.settings?.tutorialCompleted ?? false;
    gameState.tutorialStep = cloudUser.settings?.tutorialStep ?? null;

    await loadQuestsFromSupabase();
    await loadHistoryFromSupabase();
    await loadInventoryFromSupabase();

    saveGameData(); // persiste no localStorage também
    updateUI();
    if (typeof showSystemToast === 'function') {
        showSystemToast('☁️ Dados da nuvem carregados com sucesso.');
    }
  } else {
    // Local ganha — subir para a nuvem
    await saveToSupabase();
    await syncQuestsToSupabase();
    await saveAllHistoryToSupabase();
    await syncInventoryToSupabase();
  }

  // Sincronizar contagem de amigos aceitos para o multiplicador de grupo
  try {
    const { count, error: countError } = await supabaseClient
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${window._currentUserDbId},target_id.eq.${window._currentUserDbId}`);
    
    if (!countError && gameState) {
      gameState.friendsCount = count || 0;
      localStorage.setItem('lifeRPG_gameState', JSON.stringify(gameState));
    }
  } catch (err) {
    console.error('[Supabase] Erro ao contar amigos:', err);
  }

  // Finalizar duelos vencidos (lazy loading/finalizacao)
  try {
    await window.checkAndFinalizeDuels();
  } catch (err) {
    console.error('[Supabase] Erro ao finalizar duelos:', err);
  }
};

// --------------------------------------------------------------------------
// SAVE TO CLOUD — chamado a cada saveGameData(), se logado
// --------------------------------------------------------------------------
window.saveToSupabase = async function() {
  if (!window._currentUserDbId) return;

  const isAbsolutelyEmpty = !gameState.playerName
      && gameState.level <= 1
      && gameState.xp === 0
      && gameState.gold === 0
      && (gameState.quests || []).length === 0
      && (gameState.streak || 0) === 0;

  if (isAbsolutelyEmpty) {
      console.warn('[Sync] Estado completamente vazio – sync abortado');
      return;
  }

  const rankLetter = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
  
  const { error } = await supabaseClient.rpc('sync_user_state_secure', {
    p_username:    gameState.playerName,
    p_level:       gameState.level,
    p_xp:          gameState.xp,
    p_gold:        gameState.gold,
    p_streak:      gameState.streak,
    p_rank:        rankLetter,
    p_archetype:   gameState.archetype,
    p_active_skin: gameState.inventory?.activeSkin || 'default',
    p_skills:      gameState.skills,
    p_settings: {
      achievements: gameState.achievements || [],
      unlockedSkins: gameState.inventory?.unlockedSkins || ['default'],
      tutorialCompleted: gameState.tutorialCompleted || false,
      tutorialStep: gameState.tutorialStep || null,
    }
  });

  if (error) {
    let friendlyMessage = `Erro inesperado: ${error.message}`;
    if (error.message.includes('[VAL_ERR_LEVEL_REGRESSION]')) {
      friendlyMessage = 'Falha de validação: Regressão de Nível não permitida.';
    } else if (error.message.includes('[VAL_ERR_XP_OVERFLOW]')) {
      friendlyMessage = 'Falha de validação: Consistência de XP (overflow de XP sem subir de nível).';
    } else if (error.message.includes('[VAL_ERR_INVALID_RANK]')) {
      friendlyMessage = 'Falha de validação: Rank inválido para o nível enviado.';
    } else if (error.message.includes('[VAL_ERR_GOLD_LIMIT_EXCEEDED]')) {
      friendlyMessage = 'Falha de validação: Limite fixo de ganho de Ouro (+2000) excedido.';
    } else if (error.message.includes('[VAL_ERR_XP_LIMIT_EXCEEDED]')) {
      friendlyMessage = 'Falha de validação: Limite fixo de ganho de XP (+2000) excedido.';
    } else if (error.message.includes('[VAL_ERR_USER_NOT_FOUND]')) {
      friendlyMessage = 'Falha de validação: Usuário não encontrado no banco.';
    } else if (error.status === 401 || error.status === 403) {
      friendlyMessage = 'Acesso RLS ou permissão negada.';
    }
    console.error(`[Supabase Sync Error] ${friendlyMessage}`, error);
    if (typeof showSystemToast === 'function') {
      showSystemToast(`⚠️ Erro de Sincronização: ${friendlyMessage}`);
    }
  } else {
    // Re-trackear presença com os dados de nível/rank atualizados
    if (typeof window.initPresence === 'function') {
      window.initPresence(window._currentUserDbId, gameState.playerName, gameState.level, rankLetter);
    }
    if (typeof showSystemToast === 'function') {
        showSystemToast('☁️ Dados sincronizados com a nuvem.');
    }
  }
};

// --------------------------------------------------------------------------
// QUESTS — sync bidirecional usando local_id
// --------------------------------------------------------------------------
async function syncQuestsToSupabase() {
  if (!window._currentUserDbId) return;

  const allQuests = [
    ...(gameState.quests || []).map(q => ({ ...q, type: q.type || 'daily' })),
    ...(gameState.sideQuests || []).map(q => ({ ...q, type: q.type || 'side' })),
  ];

  const rows = allQuests.map(q => {
    let serializedType = q.type;
    if (q.type === 'weekly') {
      serializedType = `weekly-${(q.daysOfWeek || []).join('-')}`;
    }
    return {
      user_id: window._currentUserDbId,
      local_id: q.id,
      title: q.title,
      skill: q.skill,
      type: serializedType,
      difficulty: q.difficulty || 'medium',
      xp: q.xp,
      gold: q.gold,
      emoji: q.emoji || q.icon,
      completed: !!q.completed,
      completed_at: q.completed ? new Date().toISOString() : null,
      from_library: !!q.fromLibrary,
      recurring: q.type === 'daily' || q.type === 'weekly',
      current: q.current ?? null,
      target: q.target ?? null,
    };
  });

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

  const completedToday = new Set(
    (gameState.quests || [])
      .filter(q => q.completed)
      .map(q => q.id)
  );
  const completedTodaySide = new Set(
    (gameState.sideQuests || [])
      .filter(q => q.completed)
      .map(q => q.id)
  );

  gameState.quests = data
    .filter(q => q.type === 'daily' || (typeof q.type === 'string' && q.type.startsWith('weekly-')))
    .map(q => {
      let questType = q.type;
      let daysOfWeek = [];
      if (typeof q.type === 'string' && q.type.startsWith('weekly-')) {
        questType = 'weekly';
        daysOfWeek = q.type.split('-').slice(1).map(Number);
      }
      return {
        id: q.local_id,
        title: q.title,
        skill: q.skill,
        type: questType,
        daysOfWeek: daysOfWeek,
        difficulty: q.difficulty,
        xp: q.xp,
        gold: q.gold,
        emoji: q.emoji,
        icon: q.emoji,
        completed: completedToday.has(q.local_id) ? true : !!q.completed,
        fromLibrary: q.from_library,
        duration: (() => {
          const match = q.title?.match(/\((\d+)\s*min\)/i);
          if (match) return parseInt(match[1]);
          const t = q.title?.toLowerCase() || '';
          if (t.includes('treinar') || t.includes('força') || t.includes('corrida') || t.includes('academia') || t.includes('calistenia')) {
            return 45;
          } else if (t.includes('projeto pessoal') || t.includes('estudo') || t.includes('curso')) {
            return 30;
          }
          return 5;
        })(),
        current: (q.local_id?.includes('agua') || q.title?.toLowerCase().includes('água') || q.title?.toLowerCase().includes('agua') || q.emoji === '💧')
          ? (q.current !== null && q.current !== undefined ? q.current : 0)
          : undefined,
        target: (q.local_id?.includes('agua') || q.title?.toLowerCase().includes('água') || q.title?.toLowerCase().includes('agua') || q.emoji === '💧')
          ? (q.target !== null && q.target !== undefined ? q.target : 8)
          : undefined,
      };
    });

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
      completed: completedTodaySide.has(q.local_id) ? true : !!q.completed,
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

// --------------------------------------------------------------------------
// DUELOS PVP (FASE 5)
// --------------------------------------------------------------------------
window.getLocalDateString = function() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

window.createPvpChallenge = async (opponentId, goldBet) => {
  return await supabaseClient.rpc('create_pvp_challenge', { p_opponent_id: opponentId, p_gold_bet: goldBet });
};

window.acceptPvpChallenge = async (duelId) => {
  return await supabaseClient.rpc('accept_pvp_challenge', { p_duel_id: duelId });
};

window.rejectPvpChallenge = async (duelId) => {
  return await supabaseClient.rpc('reject_pvp_challenge', { p_duel_id: duelId });
};

window.checkAndFinalizeDuels = async () => {
  return await supabaseClient.rpc('check_and_finalize_duels');
};

window.getUserDuelsWithScores = async () => {
  return await supabaseClient.rpc('get_user_duels_with_scores');
};

window.deleteCurrentUserCloudProfile = async function() {
  if (!window._currentUserDbId) return;
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  const { error } = await supabaseClient.from('users').delete().eq('person_id', user.id);
  if (error) {
    console.error('[Supabase] Erro ao deletar perfil da nuvem:', error);
    throw error;
  } else {
    console.log('[Supabase] Perfil da nuvem deletado com sucesso');
  }
};

