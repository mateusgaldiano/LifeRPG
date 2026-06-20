-- supabase/rpc_validation.sql
-- ==========================================================================
-- LifeRPG OS — Consolidated Secure RPC Validation & RLS Constraints
-- Execute este script completo no SQL Editor do seu Supabase Dashboard.
-- ==========================================================================

-- ==========================================================================
-- PARTE 1: SEGURANÇA E INTEGRIDADE DO ESTADO DO JOGADOR (Fase 2)
-- ==========================================================================

-- 1.1. FUNÇÃO SECURE RPC PARA SINCRONIZAÇÃO DE USUÁRIO
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

  -- ── VALIDAÇÃO 7: LIMITE FIXO DE GANHO DE RECURSOS (MÁX +2.000 GOLD E +2.000 XP)
  
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

  -- 1.2. ATUALIZAÇÃO SEGURA NO BANCO (SECURITY DEFINER ignora a falta de RLS de UPDATE)
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


-- 1.3. RECONFIGURAR ROW LEVEL SECURITY (RLS) NA TABELA USERS
-- Ativar RLS se não estiver ativo
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover a política genérica antiga que permitia UPDATE direto do cliente (revogação de UPDATE direto)
DROP POLICY IF EXISTS "users_own_data" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_secure" ON users;

-- Criar a política de leitura (SELECT) própria
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = person_id);

-- Criar a política de inserção (INSERT) com restrições rígidas para novos registros de nível 1
CREATE POLICY "users_insert_secure" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = person_id
    AND level = 1
    AND xp = 0
    AND gold = 0
    AND rank = 'E'
  );


-- 1.4. CHECK CONSTRAINTS DE SEGURANÇA E INTEGRIDADE
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


-- ==========================================================================
-- PARTE 2: INFRAESTRUTURA E REGRAS DE SEGURANÇA DO PVP ASSÍNCRONO (Fase 5)
-- ==========================================================================

-- 2.0. TABELA DE DUELOS PVP E POLÍTICAS RLS
CREATE TABLE IF NOT EXISTS pvp_duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gold_bet INT NOT NULL CHECK (gold_bet > 0), -- Exige aposta positiva (Crítica 5 do Claude)
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'finished')) DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    challenger_score INT DEFAULT 0,
    opponent_score INT DEFAULT 0,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT challenger_opponent_different CHECK (challenger_id <> opponent_id)
);

-- Ativar Row Level Security
ALTER TABLE pvp_duels ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de RLS para evitar duplicatas
DROP POLICY IF EXISTS "pvp_select_own" ON pvp_duels;
DROP POLICY IF EXISTS "pvp_insert_own" ON pvp_duels;

-- Política de Leitura (SELECT): Participantes podem ler seus duelos
CREATE POLICY "pvp_select_own" ON pvp_duels
    FOR SELECT USING (
        challenger_id IN (SELECT id FROM users WHERE person_id = auth.uid())
        OR opponent_id IN (SELECT id FROM users WHERE person_id = auth.uid())
    );

-- Política de Inserção (INSERT): O desafiante pode criar o duelo em seu próprio nome
CREATE POLICY "pvp_insert_own" ON pvp_duels
    FOR INSERT WITH CHECK (
        challenger_id IN (SELECT id FROM users WHERE person_id = auth.uid())
    );


-- 2.1. RESTRIÇÕES E ÍNDICES DE DESEMPENHO

-- Garante unicidade de pares ativos/pendentes (evita race condition de criar desafios duplicados concorrentes)
CREATE UNIQUE INDEX IF NOT EXISTS uq_pvp_active_pair
    ON pvp_duels (
        LEAST(challenger_id, opponent_id),
        GREATEST(challenger_id, opponent_id)
    )
    WHERE status IN ('pending', 'active');

-- Para o loop de finalização (status + end_date)
CREATE INDEX IF NOT EXISTS idx_pvp_status_enddate
    ON pvp_duels (status, end_date)
    WHERE status = 'active';

-- Para a checagem de par existente na criação
CREATE INDEX IF NOT EXISTS idx_pvp_challenger_opponent
    ON pvp_duels (challenger_id, opponent_id);

-- Para as políticas RLS (busca por participant)
CREATE INDEX IF NOT EXISTS idx_pvp_opponent_id
    ON pvp_duels (opponent_id);

-- Para a query de histórico no check_and_finalize_duels
CREATE INDEX IF NOT EXISTS idx_history_userid_date_status
    ON history (user_id, date, status);


-- 2.2. RPC: CRIAR DESAFIO PVP
CREATE OR REPLACE FUNCTION create_pvp_challenge(
    p_opponent_id UUID,
    p_gold_bet INT
) RETURNS UUID AS $$
DECLARE
    v_challenger_id UUID;
    v_challenger_gold INT;
    v_duel_id UUID;
BEGIN
    -- Obter o ID do desafiante com base na sessão autenticada (auth.uid())
    SELECT id, gold INTO v_challenger_id, v_challenger_gold
    FROM users
    WHERE person_id = auth.uid();

    IF v_challenger_id IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_USER_NOT_FOUND] Usuário não encontrado.';
    END IF;

    -- Impedir desafiar a si mesmo
    IF v_challenger_id = p_opponent_id THEN
        RAISE EXCEPTION '[VAL_ERR_SELF_CHALLENGE] Você não pode desafiar a si mesmo.';
    END IF;

    -- Validar aposta mínima (exige mais de 0 ouro)
    IF p_gold_bet <= 0 THEN
        RAISE EXCEPTION '[VAL_ERR_INVALID_BET] A aposta deve ser maior que zero ouro.';
    END IF;

    -- Validar saldo
    IF v_challenger_gold < p_gold_bet THEN
        RAISE EXCEPTION '[VAL_ERR_INSUFFICIENT_GOLD] Ouro insuficiente para apostar.';
    END IF;

    -- Validar se são amigos aceitos
    IF NOT EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
          AND ((requester_id = v_challenger_id AND target_id = p_opponent_id)
            OR (requester_id = p_opponent_id AND target_id = v_challenger_id))
    ) THEN
        RAISE EXCEPTION '[VAL_ERR_NOT_FRIENDS] Você só pode desafiar amigos aceitos.';
    END IF;

    -- Subtrair o ouro do desafiante
    UPDATE users
    SET gold = gold - p_gold_bet
    WHERE id = v_challenger_id;

    -- Inserir o duelo
    INSERT INTO pvp_duels (challenger_id, opponent_id, gold_bet, status)
    VALUES (v_challenger_id, p_opponent_id, p_gold_bet, 'pending')
    RETURNING id INTO v_duel_id;

    RETURN v_duel_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_EXISTS] Já existe um duelo ativo ou pendente com este amigo.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2.3. RPC: ACEITAR DESAFIO PVP
CREATE OR REPLACE FUNCTION accept_pvp_challenge(
    p_duel_id UUID
) RETURNS VOID AS $$
DECLARE
    v_opponent_id UUID;
    v_opponent_gold INT;
    v_gold_bet INT;
    v_status TEXT;
    v_server_date DATE;
BEGIN
    -- Obter o ID do oponente logado com base no auth.uid()
    SELECT id, gold INTO v_opponent_id, v_opponent_gold
    FROM users
    WHERE person_id = auth.uid();

    IF v_opponent_id IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_USER_NOT_FOUND] Usuário não encontrado.';
    END IF;

    -- Carregar o duelo
    SELECT gold_bet, status INTO v_gold_bet, v_status
    FROM pvp_duels
    WHERE id = p_duel_id AND opponent_id = v_opponent_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_NOT_FOUND] Desafio não encontrado ou você não é o destinatário.';
    END IF;

    IF v_status <> 'pending' THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_NOT_PENDING] O desafio não está pendente.';
    END IF;

    IF v_opponent_gold < v_gold_bet THEN
        RAISE EXCEPTION '[VAL_ERR_INSUFFICIENT_GOLD] Ouro insuficiente para cobrir a aposta.';
    END IF;

    -- Obter a data atual do servidor no fuso de Brasília
    v_server_date := (timezone('America/Sao_Paulo', now()))::date;

    -- Subtrair ouro do oponente
    UPDATE users
    SET gold = gold - v_gold_bet
    WHERE id = v_opponent_id;

    -- Ativar o duelo e fixar as datas com base no relógio do servidor
    UPDATE pvp_duels
    SET status = 'active',
        start_date = v_server_date,
        end_date = v_server_date + 6,
        challenger_score = 0,
        opponent_score = 0
    WHERE id = p_duel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2.4. RPC: REJEITAR/CANCELAR DESAFIO PVP
CREATE OR REPLACE FUNCTION reject_pvp_challenge(
    p_duel_id UUID
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_challenger_id UUID;
    v_opponent_id UUID;
    v_gold_bet INT;
    v_status TEXT;
BEGIN
    -- Obter o ID do usuário logado
    SELECT id INTO v_user_id
    FROM users
    WHERE person_id = auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_USER_NOT_FOUND] Usuário não encontrado.';
    END IF;

    -- Carregar o duelo
    SELECT challenger_id, opponent_id, gold_bet, status
    INTO v_challenger_id, v_opponent_id, v_gold_bet, v_status
    FROM pvp_duels
    WHERE id = p_duel_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_NOT_FOUND] Duelo não encontrado.';
    END IF;

    IF v_status <> 'pending' THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_NOT_PENDING] O duelo não está pendente.';
    END IF;

    -- Apenas o desafiante pode cancelar ou o oponente pode rejeitar
    IF v_user_id <> v_challenger_id AND v_user_id <> v_opponent_id THEN
        RAISE EXCEPTION '[VAL_ERR_UNAUTHORIZED] Ação não autorizada.';
    END IF;

    -- Devolver o ouro para o desafiante
    UPDATE users
    SET gold = gold + v_gold_bet
    WHERE id = v_challenger_id;

    -- Marcar como rejeitado (ou cancelado)
    UPDATE pvp_duels
    SET status = 'rejected'
    WHERE id = p_duel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2.5. RPC: FINALIZAR DUELOS VENCIDOS
CREATE OR REPLACE FUNCTION check_and_finalize_duels()
RETURNS VOID AS $$
DECLARE
    r RECORD;
    v_challenger_perfect_days INT;
    v_opponent_perfect_days INT;
    v_winner_id UUID;
    v_server_date DATE;
BEGIN
    -- Obter a data atual do servidor no fuso de Brasília
    v_server_date := (timezone('America/Sao_Paulo', now()))::date;

    FOR r IN 
        SELECT id, challenger_id, opponent_id, gold_bet, start_date, end_date
        FROM pvp_duels
        WHERE status = 'active' AND end_date < v_server_date
    LOOP
        -- Contar dias perfeitos no histórico do desafiante
        SELECT COUNT(*)::int INTO v_challenger_perfect_days
        FROM history
        WHERE user_id = r.challenger_id
          AND date BETWEEN r.start_date AND r.end_date
          AND status = 'perfect';

        -- Contar dias perfeitos no histórico do oponente
        SELECT COUNT(*)::int INTO v_opponent_perfect_days
        FROM history
        WHERE user_id = r.opponent_id
          AND date BETWEEN r.start_date AND r.end_date
          AND status = 'perfect';

        -- Determinar vencedor
        IF v_challenger_perfect_days > v_opponent_perfect_days THEN
            v_winner_id := r.challenger_id;
            -- Desafiante ganha a aposta de ambos (2x o ouro apostado)
            UPDATE users SET gold = gold + (2 * r.gold_bet) WHERE id = r.challenger_id;
        ELSIF v_opponent_perfect_days > v_challenger_perfect_days THEN
            v_winner_id := r.opponent_id;
            -- Oponente ganha a aposta de ambos (2x o ouro apostado)
            UPDATE users SET gold = gold + (2 * r.gold_bet) WHERE id = r.opponent_id;
        ELSE
            -- Empate: devolve a aposta para ambos
            v_winner_id := NULL;
            UPDATE users SET gold = gold + r.gold_bet WHERE id = r.challenger_id;
            UPDATE users SET gold = gold + r.gold_bet WHERE id = r.opponent_id;
        END IF;

        -- Atualizar duelo para finalizado
        UPDATE pvp_duels
        SET status = 'finished',
            challenger_score = v_challenger_perfect_days,
            opponent_score = v_opponent_perfect_days,
            winner_id = v_winner_id
        WHERE id = r.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2.6. RPC: LISTAR DUELOS COM DETALHES (E SCORE DE CONSISTÊNCIA)
CREATE OR REPLACE FUNCTION get_user_duels_with_scores()
RETURNS TABLE (
    id UUID,
    challenger_id UUID,
    opponent_id UUID,
    gold_bet INT,
    status TEXT,
    start_date DATE,
    end_date DATE,
    challenger_username VARCHAR,
    opponent_username VARCHAR,
    challenger_score INT,
    opponent_score INT,
    winner_id UUID,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Obter o ID do usuário logado
    SELECT u.id INTO v_user_id
    FROM users u
    WHERE u.person_id = auth.uid();

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        d.id,
        d.challenger_id,
        d.opponent_id,
        d.gold_bet,
        d.status,
        d.start_date,
        d.end_date,
        u1.username AS challenger_username,
        u2.username AS opponent_username,
        d.challenger_score,
        d.opponent_score,
        d.winner_id,
        d.created_at
    FROM pvp_duels d
    JOIN users u1 ON d.challenger_id = u1.id
    JOIN users u2 ON d.opponent_id = u2.id
    WHERE d.challenger_id = v_user_id OR d.opponent_id = v_user_id
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
