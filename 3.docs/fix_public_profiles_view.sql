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
-- Segurança: expõe apenas colunas públicas e somente para usuários autenticados.
-- View comum (sem security_invoker) de propósito: precisa enxergar TODOS os
-- perfis para o ranking, independente da RLS da tabela users — o controle de
-- acesso é feito pelo GRANT abaixo.
--
-- ESTA VIEW É A ÚNICA PORTA para ler dados de OUTRO usuário. Desde
-- sec_users_read_all_drop.sql a policy `users_read_all` não existe mais: a RLS
-- de `users` só deixa cada um ler a própria linha (users_select_own). Qualquer
-- leitura de perfil alheio no app tem que passar por aqui — não repontar código
-- de volta para `.from('users')`.
--
-- O QUE É PÚBLICO E POR QUÊ: as colunas abaixo são exatamente as que a UI mostra
-- de outros jogadores (ranking, busca, lista de amigos e o modal de perfil —
-- que exibe Streak, Ouro, XP e a barra de ATRIBUTOS). Ficam DE FORA, e devem
-- continuar fora:
--   • settings   — jsonb de preferências pessoais (inclui gender), não é de jogo;
--   • person_id  — é o auth.uid() do usuário; vazá-lo entrega o identificador de
--                  autenticação de todo mundo para qualquer logado;
--   • email e afins — nunca estiveram aqui, mantenha assim.
-- Ao adicionar coluna nova em `users`, o default é NÃO entrar nesta view.
--
-- ATENÇÃO ao mexer nos GRANTs: esta view é um SELECT simples de uma tabela só,
-- portanto AUTO-UPDATABLE no Postgres. Como ela não é security_invoker e users
-- não tem force_rls, uma escrita através dela roda como o dono (postgres) e
-- ATRAVESSA a RLS — virando um caminho livre para forjar level/xp/rank de
-- qualquer usuário, furando as validações de sync_user_state_secure. Só o
-- SELECT pode ser concedido. Revogar de `public`/`anon` NÃO basta: os default
-- privileges do Supabase dão ALL a `authenticated` na criação da view.
--
-- ATENÇÃO à ordem das colunas: é CREATE OR REPLACE, que só aceita ACRESCENTAR
-- colunas no FIM (não dá para reordenar/renomear). Por isso streak/gold/skills
-- vêm depois de avatar_url, fora do agrupamento lógico. Para reordenar seria
-- preciso DROP + CREATE — o que RESSUSCITA os default privileges (view gravável,
-- ver ATENÇÃO acima). Não vale o risco: deixe no fim.
--
-- Rodar no SQL Editor do Supabase (Role: postgres). Idempotente.
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
    avatar_url,
    -- Acrescentadas depois (ver ATENÇÃO à ordem das colunas no cabeçalho).
    -- Alimentam o modal de perfil do jogador (social.js openPlayerProfile).
    streak,
    gold,
    skills
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
