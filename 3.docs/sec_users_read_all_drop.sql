-- ============================================================================
-- SEC · Dropar a policy `users_read_all` (leitura irrestrita da tabela users)
-- ----------------------------------------------------------------------------
-- Problema: `users_read_all` era SELECT com qual = true para o role
-- `authenticated`. Ou seja, qualquer usuário logado podia fazer
--     GET /rest/v1/users?select=*
-- e ler TODAS as colunas de TODOS os usuários — inclusive `settings` (jsonb de
-- preferências pessoais) e `person_id` (o auth.uid() de cada um). Isso também
-- tornava a view `public_profiles` inútil: ela existe justamente para expor só
-- o subconjunto público, mas o caminho direto pela tabela continuava aberto.
--
-- Depois deste script a RLS de `users` fica assim:
--   • users_select_own  (SELECT, auth.uid() = person_id) → cada um lê a própria linha
--   • users_insert_own  (INSERT, with_check auth.uid() = person_id)
--   • users_delete_own  (DELETE, auth.uid() = person_id)
-- Não há UPDATE por policy: a escrita de progressão passa pela RPC
-- sync_user_state_secure (que valida level/xp/rank server-side).
--
-- ────────────────────────────────────────────────────────────────────────────
-- PRÉ-REQUISITO — NÃO RODE ISTO ANTES DE (1) E (2):
--   (1) fix_public_profiles_view.sql aplicado com streak/gold/skills na view;
--   (2) app em v2.5.27+, onde social.js lê perfis alheios via `public_profiles`
--       (busca, solicitantes de amizade, lista de amigos e openPlayerProfile).
-- Rodar antes disso quebra busca, lista de amigos e o modal de perfil para
-- todo mundo — a leitura de `.from('users')` de outro usuário passa a voltar 0
-- linhas (RLS não dá erro, só filtra). As leituras do PRÓPRIO usuário em
-- supabase-config.js (ensureUserProfile, syncWithSupabase, refreshGoldFromCloud)
-- seguem em `users` de propósito: são cobertas por users_select_own.
-- ────────────────────────────────────────────────────────────────────────────
--
-- Por que a view continua enxergando todo mundo mesmo com a RLS restrita:
-- `public_profiles` não é security_invoker e `users` não tem force_rls, então a
-- view roda como o dono (postgres) e ATRAVESSA a RLS. Esse bypass é intencional
-- (o ranking global depende dele) e está documentado em
-- fix_public_profiles_view.sql — que é onde mora o controle de acesso de fato
-- (GRANT SELECT só para `authenticated`, e SÓ SELECT).
--
-- Rodar no SQL Editor do Supabase (Role: postgres). Idempotente.
-- ============================================================================

DROP POLICY IF EXISTS users_read_all ON public.users;

-- ── Verificação ─────────────────────────────────────────────────────────────
-- Deve listar APENAS users_select_own / users_insert_own / users_delete_own.
-- Se `users_read_all` ainda aparecer, o DROP não pegou — investigue antes de
-- considerar a correção aplicada.
SELECT policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;
