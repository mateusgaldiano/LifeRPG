-- ============================================================================
-- migration_04_sync_cap_time_based.sql
-- Aplicada no projeto remoto como a migração `harden_sync_cap_time_based`.
--
-- CONTEXTO / BUG:
-- A RPC sync_user_state_secure tinha um teto FIXO de +2000 de XP e +2000 de Ouro
-- POR sync (anti-cheat). Quando um jogador acumulava mais que isso entre dois
-- syncs (ex.: jogando offline, ou após um sync que falhou), a RPC rejeitava o
-- sync INTEIRO. Como o delta é medido contra o estado atual do banco, ele só
-- CRESCIA a cada tentativa — então todo sync seguinte também era rejeitado e a
-- nuvem ficava travada permanentemente no valor antigo. Isso, combinado com o
-- botão "atualizar" do cliente (forceLoadFromCloud) que puxava a nuvem por cima
-- do local, derrubou o nível de um jogador (14 -> 13).
--
-- CORREÇÃO:
-- O limite de ganho por sync agora é PROPORCIONAL ao tempo desde o último sync:
--   piso 2000 + 4000 por hora (medido de last_active_at; fallback created_at).
-- Isso ainda barra saltos absurdos INSTANTÂNEOS (cheat), mas o limite cresce com
-- o tempo, então progresso legítimo acumulado NUNCA fica travado — e um sync que
-- falhou se auto-cura: como o UPDATE só roda em sucesso, last_active_at não
-- avança, o tempo passa, o allowance sobe e o sync eventualmente entra.
--
-- Todas as outras validações (regressão de nível, overflow de XP, consistência de
-- rank) permanecem IDÊNTICAS.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_user_state_secure(
  p_username text DEFAULT NULL::text,
  p_level integer DEFAULT 1,
  p_xp integer DEFAULT 0,
  p_gold integer DEFAULT 0,
  p_streak integer DEFAULT 0,
  p_rank text DEFAULT 'CANDIDATO'::text,
  p_archetype text DEFAULT NULL::text,
  p_active_skin text DEFAULT 'default'::text,
  p_skills jsonb DEFAULT '{}'::jsonb,
  p_settings jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_level INT;
  v_current_xp INT;
  v_current_gold INT;
  v_current_streak INT;
  v_user_id UUID;
  v_xp_needed INT;
  v_xp_total_old INT := 0;
  v_xp_total_new INT := 0;
  v_expected_rank TEXT;
  i INT;
  -- Limite de ganho por sync proporcional ao tempo (correção anti-trava).
  v_last_active TIMESTAMPTZ;
  v_created_at TIMESTAMPTZ;
  v_hours DOUBLE PRECISION;
  v_allowance INT;
BEGIN
  SELECT id, level, xp, gold, streak, last_active_at, created_at
  INTO v_user_id, v_current_level, v_current_xp, v_current_gold, v_current_streak, v_last_active, v_created_at
  FROM users
  WHERE person_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[VAL_ERR_USER_NOT_FOUND] Perfil de usuário correspondente ao auth.uid() não encontrado.';
  END IF;

  -- VALIDAÇÃO 1: REGRESSÃO DE NÍVEL
  IF p_level < v_current_level THEN
    RAISE EXCEPTION '[VAL_ERR_LEVEL_REGRESSION] O nível não pode regredir. Atual no banco: %, Enviado: %', v_current_level, p_level;
  END IF;

  -- VALIDAÇÃO 2: CONSISTÊNCIA DE XP
  v_xp_needed := round(100 * (p_level::double precision ^ 1.5))::int;
  IF p_xp >= v_xp_needed AND p_level < 30 THEN
    RAISE EXCEPTION '[VAL_ERR_XP_OVERFLOW] XP enviado (%) é maior ou igual ao limite de subida (%) para o nível %.', p_xp, v_xp_needed, p_level;
  END IF;

  -- VALIDAÇÃO 3: CONSISTÊNCIA DE RANK (alinhada aos tiers do client em state.js)
  v_expected_rank := CASE
    WHEN p_level >= 35 THEN 'MONARCA'
    WHEN p_level >= 30 THEN 'NACIONAL'
    WHEN p_level >= 25 THEN 'S'
    WHEN p_level >= 20 THEN 'A'
    WHEN p_level >= 15 THEN 'B'
    WHEN p_level >= 10 THEN 'C'
    WHEN p_level >= 5  THEN 'D'
    WHEN p_level >= 3  THEN 'E'
    ELSE 'CANDIDATO'
  END;
  IF upper(p_rank) <> v_expected_rank THEN
    RAISE EXCEPTION '[VAL_ERR_INVALID_RANK] Rank "%" inválido para o nível % (esperado %).', p_rank, p_level, v_expected_rank;
  END IF;

  -- Limite de ganho deste sync: piso 2000 + 4000 por hora desde o último sync.
  v_hours := GREATEST(0, EXTRACT(EPOCH FROM (now() - COALESCE(v_last_active, v_created_at, now()))) / 3600.0);
  v_allowance := GREATEST(2000, CEIL(v_hours * 4000))::int;

  -- VALIDAÇÃO 4: LIMITE DE GANHO DE OURO (proporcional ao tempo)
  IF (p_gold - v_current_gold) > v_allowance THEN
    RAISE EXCEPTION '[VAL_ERR_GOLD_LIMIT_EXCEEDED] Ganho de Ouro (%) excede o limite deste sync (%).', (p_gold - v_current_gold), v_allowance;
  END IF;

  FOR i IN 1..(v_current_level - 1) LOOP
    v_xp_total_old := v_xp_total_old + round(100 * (i::double precision ^ 1.5))::int;
  END LOOP;
  v_xp_total_old := v_xp_total_old + v_current_xp;

  FOR i IN 1..(p_level - 1) LOOP
    v_xp_total_new := v_xp_total_new + round(100 * (i::double precision ^ 1.5))::int;
  END LOOP;
  v_xp_total_new := v_xp_total_new + p_xp;

  -- VALIDAÇÃO 5: LIMITE DE GANHO DE XP (proporcional ao tempo)
  IF (v_xp_total_new - v_xp_total_old) > v_allowance THEN
    RAISE EXCEPTION '[VAL_ERR_XP_LIMIT_EXCEEDED] Ganho de XP (%) excede o limite deste sync (%).', (v_xp_total_new - v_xp_total_old), v_allowance;
  END IF;

  -- ATUALIZAÇÃO SEGURA (SECURITY DEFINER ignora RLS de UPDATE)
  UPDATE users
  SET
    username = COALESCE(p_username, username),
    level = p_level,
    xp = p_xp,
    gold = p_gold,
    streak = p_streak,
    rank = p_rank,
    archetype = COALESCE(p_archetype, archetype),
    active_skin = p_active_skin,
    skills = p_skills,
    settings = p_settings,
    last_active_at = now()
  WHERE id = v_user_id;

  -- Espelha o username em persons (fonte de leitura do client).
  IF p_username IS NOT NULL THEN
    UPDATE persons SET username = p_username WHERE id = auth.uid();
  END IF;

END;
$function$;
