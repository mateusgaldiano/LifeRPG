// ==========================================================================
// SUPABASE CONFIG — LifeRPG OS v2.0
// ==========================================================================

const SUPABASE_URL = 'https://ppsqvppnunzagxqruoqf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nu9f4NzPEemdC4zm2bg1kw_88j7xeAz';

// Blindagem offline: se a lib do Supabase não carregou (ex.: 1º boot sem rede e
// vendor ainda não cacheado), NÃO quebra o script. supabaseClient fica null e o
// app segue 100% offline-first via localStorage. initSupabase resolve gracioso.
const SUPABASE_AVAILABLE = (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function');
const supabaseClient = SUPABASE_AVAILABLE
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;
if (!SUPABASE_AVAILABLE) {
  console.warn('[Supabase] Lib indisponível — rodando em modo offline (sem nuvem).');
}

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

// Aplica cosméticos (títulos/bordas) e reavaliações de rank vindos de settings da nuvem.
function applyCloudCosmetics(settings) {
  if (!settings) return;
  if (settings.rankEvaluationsClaimed) gameState.rankEvaluationsClaimed = settings.rankEvaluationsClaimed;
  if (!gameState.inventory) return;
  if (settings.unlockedTitles)  gameState.inventory.unlockedTitles  = settings.unlockedTitles;
  if (settings.unlockedBorders) gameState.inventory.unlockedBorders = settings.unlockedBorders;
  if (settings.activeTitle !== undefined)  gameState.inventory.activeTitle  = settings.activeTitle;
  if (settings.activeBorder !== undefined) gameState.inventory.activeBorder = settings.activeBorder;
}

// --------------------------------------------------------------------------
// AUTH — login/logout com Google
// --------------------------------------------------------------------------
window.loginWithGoogle = async function() {
  const btn = document.getElementById('btn-cloud-login');
  const GOOGLE_BTN_HTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg> ENTRAR COM GOOGLE';
  const restoreBtn = () => { if (btn) { btn.disabled = false; btn.innerHTML = GOOGLE_BTN_HTML; } };

  // Guarda: se o SDK do Supabase não carregou (CDN bloqueada/offline), o clique
  // não pode falhar em silêncio — avisa o usuário e o console.
  if (typeof supabaseClient === 'undefined' || !supabaseClient || !supabaseClient.auth) {
    console.error('[Supabase Auth] supabaseClient indisponível — o SDK do Supabase não carregou.');
    if (typeof showSystemToast === 'function') showSystemToast('Erro: o SDK do Supabase não carregou. Verifique sua conexão e recarregue.');
    restoreBtn();
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Abrindo Google...'; }

  try {
    const redirectUrl = window.location.origin + window.location.pathname;
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true  // nós mesmos navegamos — controle total + erro visível
      }
    });

    if (error) {
      console.error('[Supabase Auth] signInWithOAuth retornou erro:', error.message);
      if (typeof showSystemToast === 'function') showSystemToast('Erro ao iniciar login: ' + error.message);
      restoreBtn();
      return;
    }

    if (data && data.url) {
      console.log('[Supabase Auth] Redirecionando para o Google OAuth...');
      window.location.assign(data.url);  // navegação explícita e confiável
      return;
    }

    // Chegou aqui sem url e sem error → estado inesperado (não fica em silêncio)
    console.error('[Supabase Auth] Nenhuma URL de OAuth retornada pelo Supabase.', data);
    if (typeof showSystemToast === 'function') showSystemToast('Erro: não foi possível abrir o login do Google. Verifique se o provedor Google está habilitado no Supabase.');
    restoreBtn();
  } catch(e) {
    console.error('[Supabase Auth] Exceção ao iniciar login:', e);
    if (typeof showSystemToast === 'function') showSystemToast('Erro inesperado no login: ' + (e.message || e));
    restoreBtn();
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
let authBootStarted = false;

window.initSupabase = function() {
  return new Promise((resolve) => {
    let resolved = false;
    const done = (status = { isReturningUser: false, tutorialCompleted: false }) => {
      if (!resolved) {
        resolved = true;
        resolve(status);
      }
    };

    // Sem lib do Supabase (offline / vendor não carregado): segue offline-first.
    if (!supabaseClient) {
      updateCloudStatusUI(false);
      done();
      return;
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      // Evitar processamento de boot duplicado
      if (authBootStarted) {
        // Se for um evento de mudança real de usuário pós-boot, podemos tratar
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          const currentUserId = session?.user?.id || null;
          if (currentUserId !== window._currentAuthUserId) {
            window._currentAuthUserId = currentUserId;
            window.location.reload(); // Recarrega para limpar estado e sincronizar o novo usuário
          }
        }
        return;
      }
      authBootStarted = true;
      window._currentAuthUserId = session?.user?.id || null;

      if (session?.user) {
        updateCloudStatusUI(true);
        try {
          const profile = await ensureUserProfile(session.user);
          await syncFromCloud();
          if (typeof window.subscribeUserToPush === 'function' && 'Notification' in window
              && Notification.permission === 'granted'
              && gameState.notificationsEnabled !== false) {
            window.subscribeUserToPush();
          }
          if (typeof window.refreshActiveSocialTab === 'function') {
            window.refreshActiveSocialTab();
          }
          done(profile);
        } catch (e) {
          console.error('[Supabase auth change boot error]', e);
          done({ isReturningUser: false, tutorialCompleted: false });
        }
      } else {
        updateCloudStatusUI(false);
        if (typeof window.refreshActiveSocialTab === 'function') {
          window.refreshActiveSocialTab();
        }
        done({ isReturningUser: false, tutorialCompleted: false });
      }
    });
  });
};

// --------------------------------------------------------------------------
// PRESENCE — Controle de status online e jogadores ativos
// --------------------------------------------------------------------------
let presenceChannel = null;
let presenceSubscribed = false;
window.onlineUsersState = {};

let _presenceUnloadHooked = false;
window.initPresence = function(userId, username, level, rank) {
  // SEC-003: ao fechar/ocultar o app, remove a presença para não deixar sessão zumbi
  if (!_presenceUnloadHooked) {
    _presenceUnloadHooked = true;
    window.addEventListener('pagehide', () => {
      try { if (presenceChannel && presenceSubscribed) presenceChannel.untrack(); } catch (e) {}
    });
  }

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
      .select('id, email, name, username')
      .eq('id', authUser.id)
      .maybeSingle();

    if (personSelectError) {
      console.error('[Supabase] Erro ao buscar persons:', personSelectError.message);
    }

    if (!person) {
      const { error: personInsertError } = await supabaseClient
        .from('persons')
        .upsert({
          id:       authUser.id,
          email:    authUser.email,
          name:     authUser.user_metadata?.full_name || authUser.email,
          username: gameState.playerName || authUser.email,
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
      // PRIMEIRO LOGIN ou recriação pós-reset — fazer upload do progresso local atual
      const rankLetter = getRankForLevel(gameState.level).css.replace('rank-', '').toUpperCase();
      const tempUsername = `Jogador_${authUser.id.slice(0, 8)}`;
      // Recupera username salvo em persons (preservado mesmo após hard reset)
      const savedPersonUsername = person?.username && !person.username.includes('@') ? person.username : null;
      const resolvedUsername = savedPersonUsername
        || ((gameState.playerName && !gameState.playerName.includes('@')) ? gameState.playerName : tempUsername);
      const { data: newUser, error: userInsertError } = await supabaseClient
        .from('users')
        .upsert({
          person_id:      authUser.id,
          username:       resolvedUsername,
          avatar_url:     authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
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
            unlockedTitles: gameState.inventory?.unlockedTitles || [],
            unlockedBorders: gameState.inventory?.unlockedBorders || [],
            activeTitle: gameState.inventory?.activeTitle || null,
            activeBorder: gameState.inventory?.activeBorder || null,
            rankEvaluationsClaimed: gameState.rankEvaluationsClaimed || [],
          },
          last_active_at: new Date().toISOString(),
        }, { onConflict: 'person_id' })
        .select('id, username')
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
      window._currentUsername = person?.username || null;

      // Upload de quests e history existentes localmente
      await syncQuestsToSupabase();
      await saveAllHistoryToSupabase();
      await syncInventoryToSupabase();

    } else {
      isReturningUser = true;
      tutorialCompleted = userRow.settings?.tutorialCompleted ?? false;
      window._currentUserDbId = userRow.id;
      window._currentUsername = person?.username || null;
      if (!gameState.playerName && person?.username && !person.username.includes('@')) {
        gameState.playerName = person.username;
      }
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
let syncStarted = false;

window.syncFromCloud = async function() {
  if (!window._currentUserDbId) return;
  if (syncStarted) return;
  syncStarted = true;

  const syncUserId = window._currentUserDbId;

  try {
    // Sobe a outbox ANTES de ler a nuvem: assim o que voltar já reflete as
    // adições/exclusões locais e nada é perdido nem ressuscitado.
    await window.flushQuestOps();
    if (window._currentUserDbId !== syncUserId) return; // Abort check

    const { data: cloudUser } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', syncUserId)
      .single();

    if (window._currentUserDbId !== syncUserId) return; // Abort check
    if (!cloudUser) return;

    const cloudIsNewer =
      cloudUser.level > gameState.level ||
      (cloudUser.level === gameState.level && cloudUser.streak > gameState.streak) ||
      (cloudUser.level === gameState.level && cloudUser.streak === gameState.streak && cloudUser.xp > gameState.xp) ||
      (cloudUser.level === gameState.level && cloudUser.streak === gameState.streak && cloudUser.xp === gameState.xp && cloudUser.gold > gameState.gold) ||
      (cloudUser.level === gameState.level && cloudUser.streak === gameState.streak && cloudUser.xp === gameState.xp && cloudUser.gold === gameState.gold &&
        cloudUser.last_active_at && new Date(cloudUser.last_active_at) > new Date(gameState._lastSyncedAt || 0));

    if (cloudIsNewer) {
      // Nuvem ganha — sobrescrever estado local
      gameState.level     = cloudUser.level;
      gameState.xp        = cloudUser.xp;
      gameState.gold      = cloudUser.gold;
      gameState.streak    = cloudUser.streak;
      gameState.archetype = cloudUser.archetype;
      gameState.skills    = cloudUser.skills;
      
      gameState.achievements = cloudUser.settings?.achievements || [];
      gameState.tutorialCompleted = cloudUser.settings?.tutorialCompleted ?? false;
      gameState.tutorialStep = cloudUser.settings?.tutorialStep ?? null;
      applyCloudCosmetics(cloudUser.settings);

      // Carregar dados adicionais em paralelo
      const authUserPromise = supabaseClient.auth.getUser();
      const personPromise = authUserPromise.then(({ data: { user } }) => {
        if (!user) return null;
        return supabaseClient.from('persons').select('username').eq('id', user.id).maybeSingle();
      }).catch(() => null);

      const [personResult] = await Promise.all([
        personPromise,
        loadQuestsFromSupabase(),
        loadHistoryFromSupabase(),
        loadInventoryFromSupabase(),
        window.loadBuffsFromSupabase()
      ]);

      if (window._currentUserDbId !== syncUserId) return; // Abort check

      const personData = personResult?.data;
      if (personData?.username && !personData.username.includes('@')) {
        gameState.playerName = personData.username;
        window._currentUsername = personData.username;
      }

      saveGameData(); // persiste no localStorage também
      updateUI();

      // Re-renderiza todos os componentes de UI para refletir os dados carregados da nuvem imediatamente
      if (typeof window.renderQuests === 'function') window.renderQuests();
      if (typeof window.renderRewards === 'function') window.renderRewards();
      if (typeof window.renderSkills === 'function') window.renderSkills();
      if (typeof window.drawRadarChart === 'function') window.drawRadarChart();
      if (typeof window.updateAvatarImage === 'function') window.updateAvatarImage();
    } else {
      // Local ganha — subir para a nuvem em paralelo
      await Promise.all([
        saveToSupabase(),
        syncQuestsToSupabase(),
        saveAllHistoryToSupabase(),
        syncInventoryToSupabase()
      ]);
      if (window._currentUserDbId !== syncUserId) return; // Abort check
    }

    // Sincronizar contagem de amigos aceitos para o multiplicador de grupo
    try {
      const { count, error: countError } = await supabaseClient
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${syncUserId},target_id.eq.${syncUserId}`);
      
      if (window._currentUserDbId !== syncUserId) return; // Abort check
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
  } finally {
    // Liberar lock apenas se o usuário atual do contexto for o mesmo do início do sync
    if (window._currentUserDbId === syncUserId) {
      syncStarted = false;
    }
  }
};

// --------------------------------------------------------------------------
// FORCE LOAD FROM CLOUD — botão sincronizar, sempre puxa da nuvem
// --------------------------------------------------------------------------
window.forceLoadFromCloud = async function() {
  if (!window._currentUserDbId) return;

  // Sem rede/lib: não tenta load (que seria no-op ou erro) e, principalmente,
  // não arrisca tocar no estado local. Os dados locais permanecem salvos.
  if (!supabaseClient || !navigator.onLine) {
    if (typeof showSystemToast === 'function') {
      showSystemToast('📴 Você está offline — sincronização adiada. Seus dados locais estão salvos.');
    }
    return;
  }

  const syncUserId = window._currentUserDbId;

  // Sobe a outbox ANTES de puxar, para a nuvem refletir as mutações locais.
  await window.flushQuestOps();
  if (window._currentUserDbId !== syncUserId) return; // Abort check

  const { data: cloudUser } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', syncUserId)
    .single();

  if (window._currentUserDbId !== syncUserId) return; // Abort check
  if (!cloudUser) return;

  // Sempre sobrescreve com dados da nuvem — sem comparação
  gameState.level     = cloudUser.level;
  gameState.xp        = cloudUser.xp;
  gameState.gold      = cloudUser.gold;
  gameState.streak    = cloudUser.streak;
  gameState.archetype = cloudUser.archetype;
  gameState.skills    = cloudUser.skills;

  gameState.achievements = cloudUser.settings?.achievements || [];
  gameState.tutorialCompleted = cloudUser.settings?.tutorialCompleted ?? false;
  gameState.tutorialStep = cloudUser.settings?.tutorialStep ?? null;
  applyCloudCosmetics(cloudUser.settings);

  // Carregar dados adicionais em paralelo
  const authUserPromise = supabaseClient.auth.getUser();
  const personPromise = authUserPromise.then(({ data: { user } }) => {
    if (!user) return null;
    return supabaseClient.from('persons').select('username').eq('id', user.id).maybeSingle();
  }).catch(() => null);

  const [personResult] = await Promise.all([
    personPromise,
    loadQuestsFromSupabase(),
    loadHistoryFromSupabase(),
    loadInventoryFromSupabase(),
    window.loadBuffsFromSupabase()
  ]);

  if (window._currentUserDbId !== syncUserId) return; // Abort check

  const personData = personResult?.data;
  if (personData?.username && !personData.username.includes('@')) {
    gameState.playerName = personData.username;
    window._currentUsername = personData.username;
  }

  saveGameData();
  updateUI();

  if (typeof window.renderQuests === 'function') window.renderQuests();
  if (typeof window.renderRewards === 'function') window.renderRewards();
  if (typeof window.renderSkills === 'function') window.renderSkills();
  if (typeof window.drawRadarChart === 'function') window.drawRadarChart();
  if (typeof window.updateAvatarImage === 'function') window.updateAvatarImage();

  // Contagem de amigos
  try {
    const { count } = await supabaseClient
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${window._currentUserDbId},target_id.eq.${window._currentUserDbId}`);
    if (gameState) {
      gameState.friendsCount = count || 0;
      localStorage.setItem('lifeRPG_gameState', JSON.stringify(gameState));
    }
  } catch (err) {
    console.error('[Supabase] Erro ao contar amigos:', err);
  }

  console.log('[Supabase] forceLoadFromCloud concluído.');
};

// --------------------------------------------------------------------------
// SAVE TO CLOUD — chamado a cada saveGameData(), se logado
// --------------------------------------------------------------------------
window.saveToSupabase = async function() {
  if (!window._currentUserDbId) return;
  if (!navigator.onLine) return;

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
  
  const cleanUsername = (name) => name && !name.includes('@') ? name : null;
  const usernameToSync = cleanUsername(gameState.playerName) || cleanUsername(window._currentUsername) || null;

  const { error } = await supabaseClient.rpc('sync_user_state_secure', {
    p_username:    usernameToSync,
    p_level:       gameState.level,
    p_xp:          gameState.xp,
    p_gold:        gameState.gold,
    p_streak:      gameState.streak,
    p_rank:        rankLetter,
    p_archetype:   gameState.archetype || null,
    p_active_skin: gameState.inventory?.activeSkin || 'default',
    p_skills:      gameState.skills || {},
    p_settings: {
      achievements: gameState.achievements || [],
      unlockedSkins: gameState.inventory?.unlockedSkins || ['default'],
      tutorialCompleted: gameState.tutorialCompleted || false,
      tutorialStep: gameState.tutorialStep || null,
      unlockedTitles: gameState.inventory?.unlockedTitles || [],
      unlockedBorders: gameState.inventory?.unlockedBorders || [],
      activeTitle: gameState.inventory?.activeTitle || null,
      activeBorder: gameState.inventory?.activeBorder || null,
      rankEvaluationsClaimed: gameState.rankEvaluationsClaimed || [],
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
    gameState._lastSyncedAt = new Date().toISOString();
    if (typeof window.initPresence === 'function') {
      window.initPresence(window._currentUserDbId, gameState.playerName, gameState.level, rankLetter);
    }
    await window.saveBuffsToSupabase();
  }
};

// --------------------------------------------------------------------------
// QUESTS — sync bidirecional usando local_id
// --------------------------------------------------------------------------
// Fonte única do mapeamento quest local → linha da tabela 'quests'.
function questToRow(q) {
  let serializedType = q.type || 'daily';
  if (serializedType === 'weekly') {
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
}

// Localiza uma quest no estado local (diárias/semanais ou side quests).
function findLocalQuest(id) {
  return (gameState.quests || []).find(q => q.id === id)
      || (gameState.sideQuests || []).find(q => q.id === id)
      || null;
}

async function syncQuestsToSupabase() {
  if (!window._currentUserDbId) return;
  if (!navigator.onLine) return;

  const allQuests = [
    ...(gameState.quests || []).map(q => ({ ...q, type: q.type || 'daily' })),
    ...(gameState.sideQuests || []).map(q => ({ ...q, type: q.type || 'side' })),
  ];

  const localIds = allQuests.map(q => q.id);

  const rows = allQuests.map(questToRow);

  if (rows.length > 0) {
    const { error } = await supabaseClient
      .from('quests')
      .upsert(rows, { onConflict: 'user_id,local_id' });
    if (error) console.error('[Supabase] syncQuestsToSupabase upsert:', error.message);
  }

  // Deletar do Supabase quests que não existem mais localmente (anti-orphan)
  if (localIds.length > 0) {
    const { error: delError } = await supabaseClient
      .from('quests')
      .delete()
      .eq('user_id', window._currentUserDbId)
      .not('local_id', 'in', `(${localIds.map(id => `"${id}"`).join(',')})`);
    if (delError) console.error('[Supabase] syncQuestsToSupabase delete orphans:', delError.message);
  } else {
    // Nenhuma quest local — deletar tudo do usuário no Supabase
    const { error: delAllError } = await supabaseClient
      .from('quests')
      .delete()
      .eq('user_id', window._currentUserDbId);
    if (delAllError) console.error('[Supabase] syncQuestsToSupabase delete all:', delAllError.message);
  }
}

// Deleta uma quest específica do Supabase imediatamente (chamado ao remover manualmente)
window.deleteQuestFromCloud = async function(localId) {
  if (!window._currentUserDbId || !localId) return;
  const { error } = await supabaseClient
    .from('quests')
    .delete()
    .eq('user_id', window._currentUserDbId)
    .eq('local_id', localId);
  if (error) console.error('[Supabase] deleteQuestFromCloud:', error.message);
  else console.log('[Supabase] Quest deletada da nuvem:', localId);
};

// --------------------------------------------------------------------------
// FLUSH DA OUTBOX — replica gameState.questOps no Supabase (add/edit/delete)
// Processa cada operação; remove da fila só em caso de sucesso. Falha (offline/
// transitória) mantém a op na fila para o próximo flush. Idempotente e seguro
// para chamar repetidamente (guard _flushingQuestOps evita sobreposição).
// --------------------------------------------------------------------------
let _flushingQuestOps = false;
window.flushQuestOps = async function() {
  if (!supabaseClient || !navigator.onLine || !window._currentUserDbId) return;
  if (_flushingQuestOps) return;
  if (!Array.isArray(gameState.questOps) || gameState.questOps.length === 0) return;

  _flushingQuestOps = true;
  try {
    // Cópia para iterar; a fila viva é mutada conforme cada op sobe com sucesso.
    const ops = [...gameState.questOps];
    for (const op of ops) {
      try {
        const localQuest = op.op === 'upsert' ? findLocalQuest(op.id) : null;
        if (op.op === 'delete' || !localQuest) {
          // delete explícito, ou upsert de algo que já não existe local → deleta.
          const { error } = await supabaseClient
            .from('quests')
            .delete()
            .eq('user_id', window._currentUserDbId)
            .eq('local_id', op.id);
          if (error) throw error;
        } else {
          const { error } = await supabaseClient
            .from('quests')
            .upsert(questToRow(localQuest), { onConflict: 'user_id,local_id' });
          if (error) throw error;
        }
        // Sucesso → remove esta op específica da fila viva.
        const idx = gameState.questOps.findIndex(o => o.id === op.id && o.ts === op.ts);
        if (idx !== -1) gameState.questOps.splice(idx, 1);
      } catch (e) {
        console.error('[Supabase] flushQuestOps: op falhou, mantida na fila:', op, e?.message || e);
        break; // provavelmente offline/transitório — tenta tudo de novo depois.
      }
    }
    localStorage.setItem('lifeRPG_gameState', JSON.stringify(gameState));
  } finally {
    _flushingQuestOps = false;
  }
};

// Reconexão: ao voltar a ficar online, sobe o que estiver pendente na fila.
window.addEventListener('online', () => {
  if (typeof window.flushQuestOps === 'function') window.flushQuestOps();
});

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

  // Conclusão de daily vinda da nuvem só vale se foi feita HOJE (completed_at de hoje).
  // Reflete os checks do dia entre dispositivos E impede reaplicar conclusão de ontem após
  // o reset diário local — substitui o antigo guard binário resetToday por checagem por data.
  const todayStr = typeof window.localDateStr === 'function' ? window.localDateStr() : null;
  const cloudDoneToday = (qq) => !!(qq.completed && qq.completed_at && todayStr
    && window.localDateStr(new Date(qq.completed_at)) === todayStr);

  const cloudQuests = data
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
        completed: completedToday.has(q.local_id) ? true
          : (questType === 'daily' ? cloudDoneToday(q) : !!q.completed),
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
        // Contador de copos: só ativo quando target > 1 está salvo no banco
        // (ex: 'Beber 2 litros' tem target=8; 'Beber 1 copo ao acordar' tem target=null → checkbox simples)
        current: (q.target !== null && q.target !== undefined && q.target > 1)
          ? (q.current !== null && q.current !== undefined ? q.current : 0)
          : undefined,
        target: (q.target !== null && q.target !== undefined && q.target > 1)
          ? q.target
          : undefined,
      };
    });

  const cloudSideQuests = data
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

  // MERGE GUIADO PELA OUTBOX: um load da nuvem só preserva quests locais que têm
  // um upsert PENDENTE na fila (adição/edição que ainda não subiu). Assim:
  //  • adição offline ainda não sincronizada → preservada;
  //  • quest deletada em OUTRO aparelho (sumiu da nuvem, sem op pendente aqui)
  //    → NÃO é ressuscitada. Some corretamente.
  const cloudIds = new Set(cloudQuests.map(q => q.id));
  const cloudSideIds = new Set(cloudSideQuests.map(q => q.id));
  const pendingUpsertIds = new Set(
    (gameState.questOps || []).filter(o => o.op === 'upsert').map(o => o.id)
  );
  const localOnly = (gameState.quests || [])
    .filter(q => q && !cloudIds.has(q.id) && pendingUpsertIds.has(q.id));
  const localOnlySide = (gameState.sideQuests || [])
    .filter(q => q && !cloudSideIds.has(q.id) && pendingUpsertIds.has(q.id));

  gameState.quests = [...cloudQuests, ...localOnly];
  gameState.sideQuests = [...cloudSideQuests, ...localOnlySide];

  // Adições preservadas ainda pendentes → garante o flush (online) p/ torná-las
  // duráveis na nuvem. flushQuestOps faz upsert por id (não usa delete-orphans).
  if ((localOnly.length || localOnlySide.length) && navigator.onLine) {
    try { await window.flushQuestOps(); } catch (e) {
      console.error('[Supabase] Falha ao subir quests locais preservadas:', e);
    }
  }
};

// --------------------------------------------------------------------------
// HISTORY — sync em lote
// --------------------------------------------------------------------------
async function saveAllHistoryToSupabase() {
  if (!window._currentUserDbId) return;
  if (!navigator.onLine) return;

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
  if (!navigator.onLine) return;

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

// --------------------------------------------------------------------------
// USER BUFFS — salva, carrega e consome buffs da tabela user_buffs
// --------------------------------------------------------------------------

window.saveBuffsToSupabase = async function() {
  if (!window._currentUserDbId) return;
  if (!navigator.onLine) return;

  const buffs = gameState.buffs || {};
  const rows = [];

  if (buffs.doubleXpExpiresAt && Date.now() < buffs.doubleXpExpiresAt) {
    const m = buffs.xpMult || 2;
    rows.push({
      user_id:    window._currentUserDbId,
      buff_type:  m >= 5 ? 'megaXp' : m >= 3 ? 'tripleXp' : 'doubleXp',
      expires_at: new Date(buffs.doubleXpExpiresAt).toISOString(),
    });
  }

  if (buffs.autoHeal) {
    rows.push({
      user_id:    window._currentUserDbId,
      buff_type:  'autoHeal',
      expires_at: null,
    });
  }

  if (buffs.legendaryFocus) {
    rows.push({
      user_id:    window._currentUserDbId,
      buff_type:  'legendaryFocus',
      expires_at: null,
    });
  }

  if (buffs.addictionPenalty && buffs.addictionPenaltyExpiresAt && Date.now() < buffs.addictionPenaltyExpiresAt) {
    rows.push({
      user_id:    window._currentUserDbId,
      buff_type:  'addictionPenalty',
      expires_at: new Date(buffs.addictionPenaltyExpiresAt).toISOString(),
    });
  }

  const activeTypes = rows.map(r => r.buff_type);
  if (activeTypes.length > 0) {
    await supabaseClient
      .from('user_buffs')
      .delete()
      .eq('user_id', window._currentUserDbId)
      .not('buff_type', 'in', `(${activeTypes.map(t => `"${t}"`).join(',')})`);
  } else {
    await supabaseClient
      .from('user_buffs')
      .delete()
      .eq('user_id', window._currentUserDbId);
  }

  if (rows.length > 0) {
    const { error } = await supabaseClient
      .from('user_buffs')
      .upsert(rows, { onConflict: 'user_id,buff_type' });
    if (error) console.error('[Supabase] saveBuffsToSupabase:', error.message);
  }
};

window.loadBuffsFromSupabase = async function() {
  if (!window._currentUserDbId) return;

  const { data, error } = await supabaseClient
    .from('user_buffs')
    .select('buff_type, expires_at')
    .eq('user_id', window._currentUserDbId);

  if (error || !data) return;

  if (!gameState.buffs) {
    gameState.buffs = { autoHeal: false, doubleXp: false, doubleXpExpiresAt: null, legendaryFocus: false, shieldDays: 0 };
  }

  gameState.buffs.autoHeal          = false;
  gameState.buffs.legendaryFocus    = false;
  gameState.buffs.doubleXp          = false;
  gameState.buffs.doubleXpExpiresAt = null;
  gameState.buffs.xpMult            = null;
  gameState.buffs.addictionPenalty          = false;
  gameState.buffs.addictionPenaltyExpiresAt = null;

  const now = Date.now();
  data.forEach(row => {
    if (row.buff_type === 'doubleXp' || row.buff_type === 'tripleXp' || row.buff_type === 'megaXp') {
      const expiresMs = row.expires_at ? new Date(row.expires_at).getTime() : 0;
      if (expiresMs > now) {
        gameState.buffs.doubleXpExpiresAt = expiresMs;
        gameState.buffs.xpMult = row.buff_type === 'megaXp' ? 5 : row.buff_type === 'tripleXp' ? 3 : 2;
      }
    } else if (row.buff_type === 'autoHeal') {
      gameState.buffs.autoHeal = true;
    } else if (row.buff_type === 'legendaryFocus') {
      gameState.buffs.legendaryFocus = true;
    } else if (row.buff_type === 'addictionPenalty') {
      const expiresMs = row.expires_at ? new Date(row.expires_at).getTime() : 0;
      if (expiresMs > now) {
        gameState.buffs.addictionPenalty = true;
        gameState.buffs.addictionPenaltyExpiresAt = expiresMs;
      }
    }
  });
};

window.deleteBuffFromSupabase = async function(buffType) {
  if (!window._currentUserDbId) return;
  if (!navigator.onLine) return;
  await supabaseClient
    .from('user_buffs')
    .delete()
    .eq('user_id', window._currentUserDbId)
    .eq('buff_type', buffType);
};

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

// Re-busca o ouro autoritativo do servidor após mutações PvP (a RPC já debitou
// server-side). Evita divergência por dedução/reembolso local "às cegas".
window.refreshGoldFromCloud = async function() {
  if (!window._currentUserDbId || !supabaseClient || !navigator.onLine) return;
  const { data, error } = await supabaseClient
    .from('users')
    .select('gold')
    .eq('id', window._currentUserDbId)
    .single();
  if (error || !data) {
    console.error('[PvP] Falha ao re-buscar ouro autoritativo:', error?.message);
    return;
  }
  gameState.gold = data.gold;
  localStorage.setItem('lifeRPG_gameState', JSON.stringify(gameState));
  if (typeof updateUI === 'function') updateUI();
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

