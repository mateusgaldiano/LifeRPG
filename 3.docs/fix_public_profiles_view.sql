-- ============================================================================
-- FIX · Criar a view public_profiles (estava AUSENTE no banco live)
-- ----------------------------------------------------------------------------
-- Sintoma: o ranking global e o de amigos consultam `public_profiles`
-- (1.core/modules/social.js), mas a view nunca foi criada no banco → ambos
-- retornam "relation public_profiles does not exist" e a UI mostra
-- "⚠️ Erro ao carregar ranking".
--
-- Decisão de fonte do username: usa users.username, que é o valor MANTIDO
-- ATUALIZADO a cada sync (sync_user_state_secure). persons.username é write-once
-- (definido só na criação do perfil) e ficaria defasado — por isso NÃO é usado.
--
-- Segurança: expõe apenas colunas públicas (sem email/gold/settings/skills) e
-- somente para usuários autenticados. View comum (sem security_invoker) de
-- propósito: precisa enxergar TODOS os perfis para o ranking, independente da
-- RLS da tabela users — o controle de acesso é feito pelo GRANT abaixo.
--
-- ATENÇÃO ao mexer nos GRANTs: esta view é um SELECT simples de uma tabela só,
-- portanto AUTO-UPDATABLE no Postgres. Como ela não é security_invoker e users
-- não tem force_rls, uma escrita através dela roda como o dono (postgres) e
-- ATRAVESSA a RLS — virando um caminho livre para forjar level/xp/rank de
-- qualquer usuário, furando as validações de sync_user_state_secure. Só o
-- SELECT pode ser concedido. Revogar de `public`/`anon` NÃO basta: os default
-- privileges do Supabase dão ALL a `authenticated` na criação da view.
--
-- Rodar no SQL Editor do Supabase (Role: postgres).
-- ============================================================================

CREATE OR REPLACE VIEW public_profiles AS
  SELECT
    id,
    username,
    level,
    rank,
    xp,
    active_skin,
    active_title,
    avatar_url
  FROM users;

-- Acesso: só usuários autenticados podem ler perfis públicos, e SOMENTE ler.
-- O REVOKE de `authenticated` é obrigatório (ver ATENÇÃO no cabeçalho) — sem
-- ele o ALL dos default privileges permanece e a view fica gravável.
REVOKE ALL ON public_profiles FROM public;
REVOKE ALL ON public_profiles FROM anon;
REVOKE ALL ON public_profiles FROM authenticated;
GRANT SELECT ON public_profiles TO authenticated;

-- Garante que o PostgREST recarregue o schema e enxergue a nova view na hora.
NOTIFY pgrst, 'reload schema';
