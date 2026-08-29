-- ============================================================================
-- fix_users_insert_policy.sql  (v2.3.1)
-- Corrige: "new row violates row-level security policy for table 'users'"
-- no PRIMEIRO login com Google (criação do perfil do jogador).
-- ============================================================================
--
-- CAUSA RAIZ (política antiga, definida em rpc_validation.sql):
--
--   CREATE POLICY "users_insert_secure" ON users
--     FOR INSERT WITH CHECK (
--       auth.uid() = person_id AND level = 1 AND xp = 0 AND gold = 0 AND rank = 'E'
--     );
--
--   Dois defeitos:
--   1) O app envia o progresso LOCAL do convidado no 1o login (ex.: 15 XP,
--      18 Ouro). A cláusula "xp = 0 AND gold = 0" rejeita qualquer progresso.
--   2) No nível 1 o rank do jogo é 'CANDIDATO' (o 'E' só aparece a partir do
--      nível 3 — ver RANK_THRESHOLDS em state.js). O app NUNCA envia rank='E'
--      no nível 1, então a política era IMPOSSÍVEL de satisfazer — bloqueava
--      inclusive contas totalmente zeradas. Nenhum login novo funcionava.
--
-- FIX:
--   Mantém a fronteira de segurança REAL — cada pessoa só pode inserir a
--   PRÓPRIA linha (auth.uid() = person_id). Os limites de sanidade de valores
--   continuam garantidos pelas CHECK constraints já existentes na tabela
--   (check_user_level 1..100, check_user_xp >= 0, check_user_gold >= 0,
--   check_user_streak >= 0). E TODAS as atualizações seguem passando apenas
--   pela RPC validada sync_user_state_secure (não existe política de UPDATE
--   direto na tabela users), que limita ganhos a +2000 XP/Ouro por sync.
--
-- COMO APLICAR:
--   Supabase → SQL Editor → cole este bloco → RUN.
--   Depois, o amigo só precisa recarregar/relogar; o progresso local dele
--   (que continua no localStorage do navegador dele) sobe no login.
-- ============================================================================

DROP POLICY IF EXISTS "users_insert_secure" ON users;

CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  WITH CHECK ( auth.uid() = person_id );

-- ============================================================================
-- OPCIONAL — anti-cheat mais rígido para o ranking/leaderboard.
-- Se você quiser impedir que alguém crie um perfil já inflado no 1o insert
-- (ex.: nível 100 direto), use a versão abaixo NO LUGAR da de cima. Atenção:
-- limites baixos podem bloquear quem jogou MUITO como convidado antes de logar.
-- ----------------------------------------------------------------------------
-- DROP POLICY IF EXISTS "users_insert_own" ON users;
-- CREATE POLICY "users_insert_own" ON users
--   FOR INSERT WITH CHECK (
--     auth.uid() = person_id
--     AND level BETWEEN 1 AND 10
--     AND xp   >= 0 AND xp   <= 2000
--     AND gold >= 0 AND gold <= 5000
--     AND streak >= 0
--   );
-- ============================================================================
