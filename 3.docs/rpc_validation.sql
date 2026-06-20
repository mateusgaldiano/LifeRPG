-- ==========================================================================
-- LifeRPG OS v2.0 — Secure RPC Validation & RLS Constraints — FASE 2
-- Execute no SQL Editor do Supabase Dashboard
-- ==========================================================================

-- 1. CRIAR A FUNÇÃO SECURE RPC PARA SINCRONIZAÇÃO DE USUÁRIO
CREATE OR REPLACE FUNCTION sync_user_state_secure(
  p_username TEXT,
  p_level INT,
  p_xp INT,
  p_gold INT,
  p_streak INT,
  p_rank TEXT,
  p_archetype TEXT,
  p_active_skin TEXT,
  p_skills JSONB,
  p_settings JSONB
) RETURNS VOID AS $$
DECLARE
  v_current_level INT;
  v_current_xp INT;
  v_current_gold INT;
  v_current_streak INT;
  v_user_id UUID;
  v_xp_needed INT;
  v_xp_total_old INT := 0;
  v_xp_total_new INT := 0;
  i INT;
BEGIN
  -- Obter o ID do usuário e o estado atual correspondente ao auth.uid() do Supabase Auth
  SELECT id, level, xp, gold, streak 
  INTO v_user_id, v_current_level, v_current_xp, v_current_gold, v_current_streak
  FROM users
  WHERE person_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '[VAL_ERR_USER_NOT_FOUND] Perfil de usuário correspondente ao auth.uid() não encontrado.';
  END IF;

  -- ── VALIDAÇÃO 1: SANITIZAÇÃO E VALIDAÇÃO DE USERNAME
  -- Permite letras, números, acentuação padrão PT-BR, espaço, hífen e underline
  IF length(p_username) > 30 OR p_username !~ '^[a-zA-Z0-9 _áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ-]+$' THEN
    RAISE EXCEPTION '[VAL_ERR_INVALID_USERNAME] Username inválido. Deve ter no máximo 30 caracteres e conter apenas letras, números e caracteres especiais básicos.';
  END IF;

  -- ── VALIDAÇÃO 2: REGRESSÃO DE NÍVEL
  IF p_level < v_current_level THEN
    RAISE EXCEPTION '[VAL_ERR_LEVEL_REGRESSION] O nível não pode regredir. Atual no banco: %, Enviado: %', v_current_level, p_level;
  END IF;

  -- ── VALIDAÇÃO 3: CONSISTÊNCIA DE XP
  v_xp_needed := round(100 * (p_level::double precision ^ 1.5))::int;
  IF p_xp >= v_xp_needed AND p_level < 30 THEN
    RAISE EXCEPTION '[VAL_ERR_XP_OVERFLOW] XP enviado (%) é maior ou igual ao limite de subida (%) para o nível %.', p_xp, v_xp_needed, p_level;
  END IF;

  -- ── VALIDAÇÃO 4: REGRESSÃO DE STREAK (Só permite aumentar ou resetar para 0)
  IF p_streak < v_current_streak AND p_streak <> 0 THEN
    RAISE EXCEPTION '[VAL_ERR_STREAK_REGRESSION] Streak só pode aumentar ou resetar para 0. Atual: %, Enviado: %', v_current_streak, p_streak;
  END IF;

  -- ── VALIDAÇÃO 5: VALORES NEGATIVOS
  IF p_gold < 0 THEN
    RAISE EXCEPTION '[VAL_ERR_NEGATIVE_GOLD] Ouro não pode ser negativo.';
  END IF;
  IF p_xp < 0 THEN
    RAISE EXCEPTION '[VAL_ERR_NEGATIVE_XP] XP não pode ser negativo.';
  END IF;

  -- ── VALIDAÇÃO 6: CONSISTÊNCIA DE RANK OBRIGATÓRIA POR FAIXA
  -- Faixas: 1-2 -> E | 3-4 -> D | 5-9 -> C | 10-14 -> B | 15-19 -> A | 20+ -> S
  IF (p_level >= 20 AND p_rank <> 'S') OR
     (p_level >= 15 AND p_level < 20 AND p_rank <> 'A') OR
     (p_level >= 10 AND p_level < 15 AND p_rank <> 'B') OR
     (p_level >= 5 AND p_level < 10 AND p_rank <> 'C') OR
     (p_level >= 3 AND p_level < 5 AND p_rank <> 'D') OR
     (p_level < 3 AND p_rank <> 'E') THEN
    RAISE EXCEPTION '[VAL_ERR_INVALID_RANK] Rank "%" inválido para o nível %.', p_rank, p_level;
  END IF;

  -- ── VALIDAÇÃO 7: LIMITE FIXO DE GANHO DE RECURSOS (MÁX +2000 GOLD E +2000 XP)
  
  -- A. Validação de Ganho de Ouro (Máximo de +2.000 Ouro por sync)
  IF (p_gold - v_current_gold) > 2000 THEN
    RAISE EXCEPTION '[VAL_ERR_GOLD_LIMIT_EXCEEDED] Ganho de Ouro (%) excede o limite fixo de 2000 por sync.', (p_gold - v_current_gold);
  END IF;

  -- B. Validação de Ganho de XP (Máximo de +2.000 XP por sync)
  -- Calcula XP total acumulado do nível 1 até o nível antigo
  FOR i IN 1..(v_current_level - 1) LOOP
    v_xp_total_old := v_xp_total_old + round(100 * (i::double precision ^ 1.5))::int;
  END LOOP;
  v_xp_total_old := v_xp_total_old + v_current_xp;

  -- Calcula XP total acumulado do nível 1 até o novo nível
  FOR i IN 1..(p_level - 1) LOOP
    v_xp_total_new := v_xp_total_new + round(100 * (i::double precision ^ 1.5))::int;
  END LOOP;
  v_xp_total_new := v_xp_total_new + p_xp;

  IF (v_xp_total_new - v_xp_total_old) > 2000 THEN
    RAISE EXCEPTION '[VAL_ERR_XP_LIMIT_EXCEEDED] Ganho de XP (%) excede o limite fixo de 2000 por sync.', (v_xp_total_new - v_xp_total_old);
  END IF;

  -- 8. ATUALIZAÇÃO SEGURA NO BANCO (SECURITY DEFINER ignora a falta de RLS de UPDATE)
  UPDATE users
  SET
    username = p_username,
    level = p_level,
    xp = p_xp,
    gold = p_gold,
    streak = p_streak,
    rank = p_rank,
    archetype = p_archetype,
    active_skin = p_active_skin,
    skills = p_skills,
    settings = p_settings,
    last_active_at = now()
  WHERE id = v_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RECONFIGURAR ROW LEVEL SECURITY (RLS) NA TABELA USERS
-- Remover a política genérica antiga que permitia UPDATE direto do cliente
DROP POLICY IF EXISTS "users_own_data" ON users;

-- Criar a política de leitura (SELECT) própria
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = person_id);

-- Criar a política de inserção (INSERT) com restrições rígidas
CREATE POLICY "users_insert_secure" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = person_id
    AND level = 1
    AND xp = 0
    AND gold = 0
    AND rank = 'E'
  );


-- 3. ADICIONAR CHECK CONSTRAINTS DE SEGURANÇA E INTEGRIDADE
-- Validações a nível de banco para garantir valores sãos
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_level;
ALTER TABLE users ADD CONSTRAINT check_user_level CHECK (level >= 1 AND level <= 100);

ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_gold;
ALTER TABLE users ADD CONSTRAINT check_user_gold CHECK (gold >= 0);

ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_xp;
ALTER TABLE users ADD CONSTRAINT check_user_xp CHECK (xp >= 0);

ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_streak;
ALTER TABLE users ADD CONSTRAINT check_user_streak CHECK (streak >= 0);

-- Limites de recompensa por quest na tabela quests
ALTER TABLE quests DROP CONSTRAINT IF EXISTS check_quest_gold_limit;
ALTER TABLE quests ADD CONSTRAINT check_quest_gold_limit CHECK (gold <= 500);

ALTER TABLE quests DROP CONSTRAINT IF EXISTS check_quest_xp_limit;
ALTER TABLE quests ADD CONSTRAINT check_quest_xp_limit CHECK (xp <= 500);
