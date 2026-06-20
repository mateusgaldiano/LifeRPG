-- ================================================================
-- LifeRPG OS v2.0 — Supabase Schema — FASE 5 (DUELOS PVP)
-- Execute no SQL Editor do Supabase Dashboard
-- ================================================================

-- 1. TABELA DE DUELOS PVP
CREATE TABLE IF NOT EXISTS pvp_duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gold_bet INT NOT NULL CHECK (gold_bet > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'finished')) DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    challenger_score INT DEFAULT 0,
    opponent_score INT DEFAULT 0,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT challenger_opponent_different CHECK (challenger_id <> opponent_id)
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE pvp_duels ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "pvp_select_own" ON pvp_duels;
CREATE POLICY "pvp_select_own" ON pvp_duels
    FOR SELECT USING (
        challenger_id IN (SELECT id FROM users WHERE person_id = auth.uid())
        OR opponent_id IN (SELECT id FROM users WHERE person_id = auth.uid())
    );

DROP POLICY IF EXISTS "pvp_insert_own" ON pvp_duels;
CREATE POLICY "pvp_insert_own" ON pvp_duels
    FOR INSERT WITH CHECK (
        challenger_id IN (SELECT id FROM users WHERE person_id = auth.uid())
    );

-- 3. ÍNDICES DE PERFORMANCE E UNICIDADE
-- Garante que apenas um duelo pendente ou ativo possa existir entre um par de amigos
CREATE UNIQUE INDEX IF NOT EXISTS uq_pvp_active_pair
    ON pvp_duels (
        LEAST(challenger_id, opponent_id),
        GREATEST(challenger_id, opponent_id)
    )
    WHERE status IN ('pending', 'active');

-- Índice para busca rápida em check_and_finalize_duels
CREATE INDEX IF NOT EXISTS idx_pvp_status_enddate
    ON pvp_duels (status, end_date)
    WHERE status = 'active';

-- Índice para busca rápida de duelos de um usuário
CREATE INDEX IF NOT EXISTS idx_pvp_challenger_id ON pvp_duels (challenger_id);
CREATE INDEX IF NOT EXISTS idx_pvp_opponent_id ON pvp_duels (opponent_id);

-- Índice composto para otimizar a contagem de dias perfeitos no histórico
CREATE INDEX IF NOT EXISTS idx_history_userid_date_status
    ON history (user_id, date, status);


-- 4. FUNÇÕES RPC (SECURITY DEFINER)

-- RPC 1: Criar Desafio PvP
CREATE OR REPLACE FUNCTION create_pvp_challenge(
    p_opponent_id UUID,
    p_gold_bet INT
) RETURNS UUID AS $$
DECLARE
    v_challenger_id UUID;
    v_challenger_gold INT;
    v_duel_id UUID;
BEGIN
    -- Obter o ID do desafiante correspondente ao auth.uid() do Supabase Auth
    SELECT id, gold INTO v_challenger_id, v_challenger_gold
    FROM users
    WHERE person_id = auth.uid();

    IF v_challenger_id IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_USER_NOT_FOUND] Perfil do desafiante nao encontrado.';
    END IF;

    -- Validar aposta minima
    IF p_gold_bet <= 0 THEN
        RAISE EXCEPTION '[VAL_ERR_INVALID_BET] Aposta de ouro deve ser maior que zero.';
    END IF;

    -- Validar saldo de ouro
    IF v_challenger_gold < p_gold_bet THEN
        RAISE EXCEPTION '[VAL_ERR_INSUFFICIENT_GOLD] Ouro insuficiente para realizar aposta.';
    END IF;

    -- Validar se o oponente existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_opponent_id) THEN
        RAISE EXCEPTION '[VAL_ERR_OPPONENT_NOT_FOUND] Oponente nao encontrado.';
    END IF;

    -- Validar amizade
    IF NOT EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
          AND ((requester_id = v_challenger_id AND target_id = p_opponent_id)
            OR (requester_id = p_opponent_id AND target_id = v_challenger_id))
    ) THEN
        RAISE EXCEPTION '[VAL_ERR_NOT_FRIENDS] Voce so pode desafiar amigos aceitos.';
    END IF;

    -- A verificação de duelo existente é reforçada pelo índice uq_pvp_active_pair.
    -- Tratamos a exceção caso ocorra concorrência.
    BEGIN
        -- Subtrair o ouro do desafiante
        UPDATE users
        SET gold = gold - p_gold_bet
        WHERE id = v_challenger_id;

        -- Inserir o duelo pendente
        INSERT INTO pvp_duels (challenger_id, opponent_id, gold_bet, status)
        VALUES (v_challenger_id, p_opponent_id, p_gold_bet, 'pending')
        RETURNING id INTO v_duel_id;

        RETURN v_duel_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION '[VAL_ERR_DUEL_EXISTS] Ja existe um duelo ativo ou pendente com este amigo.';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC 2: Aceitar Desafio PvP
CREATE OR REPLACE FUNCTION accept_pvp_challenge(
    p_duel_id UUID,
    p_client_date DATE
) RETURNS VOID AS $$
DECLARE
    v_opponent_id UUID;
    v_opponent_gold INT;
    v_gold_bet INT;
    v_status TEXT;
BEGIN
    -- Obter o ID do oponente (quem esta aceitando)
    SELECT id, gold INTO v_opponent_id, v_opponent_gold
    FROM users
    WHERE person_id = auth.uid();

    IF v_opponent_id IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_USER_NOT_FOUND] Perfil do oponente nao encontrado.';
    END IF;

    -- Validar se o cliente esta passando uma data compativel com o fuso local (+/- 1 dia do server)
    IF abs(p_client_date - CURRENT_DATE) > 1 THEN
        RAISE EXCEPTION '[VAL_ERR_INVALID_DATE] Data do cliente fora do limite aceitavel.';
    END IF;

    -- Obter os detalhes do duelo
    SELECT gold_bet, status INTO v_gold_bet, v_status
    FROM pvp_duels
    WHERE id = p_duel_id AND opponent_id = v_opponent_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_NOT_FOUND] Desafio nao encontrado ou voce nao e o destinatario.';
    END IF;

    IF v_status <> 'pending' THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_NOT_PENDING] O desafio nao esta mais pendente.';
    END IF;

    -- Validar saldo do oponente
    IF v_opponent_gold < v_gold_bet THEN
        RAISE EXCEPTION '[VAL_ERR_INSUFFICIENT_GOLD] Ouro insuficiente para cobrir a aposta.';
    END IF;

    -- Subtrair ouro do oponente
    UPDATE users
    SET gold = gold - v_gold_bet
    WHERE id = v_opponent_id;

    -- Ativar o duelo e definir o periodo de 7 dias
    UPDATE pvp_duels
    SET status = 'active',
        start_date = p_client_date,
        end_date = p_client_date + 6,
        challenger_score = 0,
        opponent_score = 0
    WHERE id = p_duel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC 3: Rejeitar ou Cancelar Desafio PvP
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
    SELECT id INTO v_user_id
    FROM users
    WHERE person_id = auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_USER_NOT_FOUND] Perfil de usuario nao encontrado.';
    END IF;

    -- Buscar informacoes do duelo
    SELECT challenger_id, opponent_id, gold_bet, status
    INTO v_challenger_id, v_opponent_id, v_gold_bet, v_status
    FROM pvp_duels
    WHERE id = p_duel_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_NOT_FOUND] Duelo nao encontrado.';
    END IF;

    IF v_status <> 'pending' THEN
        RAISE EXCEPTION '[VAL_ERR_DUEL_NOT_PENDING] O duelo nao esta pendente.';
    END IF;

    -- Apenas desafiante (cancela) ou oponente (rejeita) podem executar
    IF v_user_id <> v_challenger_id AND v_user_id <> v_opponent_id THEN
        RAISE EXCEPTION '[VAL_ERR_UNAUTHORIZED] Acao nao autorizada para este usuario.';
    END IF;

    -- Devolver o ouro para o desafiante
    UPDATE users
    SET gold = gold + v_gold_bet
    WHERE id = v_challenger_id;

    -- Marcar duelo como rejeitado
    UPDATE pvp_duels
    SET status = 'rejected'
    WHERE id = p_duel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC 4: Finalizar Duelos Vencidos
CREATE OR REPLACE FUNCTION check_and_finalize_duels(
    p_client_date DATE
) RETURNS VOID AS $$
DECLARE
    r RECORD;
    v_challenger_perfect_days INT;
    v_opponent_perfect_days INT;
    v_winner_id UUID;
BEGIN
    -- Validar se o cliente esta passando uma data compativel com o fuso local (+/- 1 dia do server)
    IF abs(p_client_date - CURRENT_DATE) > 1 THEN
        RAISE EXCEPTION '[VAL_ERR_INVALID_DATE] Data do cliente fora do limite aceitavel.';
    END IF;

    -- Iterar por todos os duelos ativos que ja passaram da data de termino
    FOR r IN 
        SELECT id, challenger_id, opponent_id, gold_bet, start_date, end_date
        FROM pvp_duels
        WHERE status = 'active' AND end_date < p_client_date
    LOOP
        -- Contar dias perfeitos no historico do desafiante no periodo
        SELECT COUNT(*)::int INTO v_challenger_perfect_days
        FROM history
        WHERE user_id = r.challenger_id
          AND date BETWEEN r.start_date AND r.end_date
          AND status = 'perfect';

        -- Contar dias perfeitos no historico do oponente no periodo
        SELECT COUNT(*)::int INTO v_opponent_perfect_days
        FROM history
        WHERE user_id = r.opponent_id
          AND date BETWEEN r.start_date AND r.end_date
          AND status = 'perfect';

        -- Determinar o vencedor e aplicar recompensas
        IF v_challenger_perfect_days > v_opponent_perfect_days THEN
            v_winner_id := r.challenger_id;
            UPDATE users SET gold = gold + (2 * r.gold_bet) WHERE id = r.challenger_id;
        ELSIF v_opponent_perfect_days > v_challenger_perfect_days THEN
            v_winner_id := r.opponent_id;
            UPDATE users SET gold = gold + (2 * r.gold_bet) WHERE id = r.opponent_id;
        ELSE
            -- Empate: devolve a aposta para os dois
            v_winner_id := NULL;
            UPDATE users SET gold = gold + r.gold_bet WHERE id = r.challenger_id;
            UPDATE users SET gold = gold + r.gold_bet WHERE id = r.opponent_id;
        END IF;

        -- Atualizar duelo para finalizado com os placares finais
        UPDATE pvp_duels
        SET status = 'finished',
            challenger_score = v_challenger_perfect_days,
            opponent_score = v_opponent_perfect_days,
            winner_id = v_winner_id
        WHERE id = r.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC 5: Buscar Duelos do Usuario com Placares Calculados On-The-Fly (Bypass de RLS do Historico)
CREATE OR REPLACE FUNCTION get_user_duels_with_scores()
RETURNS TABLE (
    id UUID,
    challenger_id UUID,
    opponent_id UUID,
    gold_bet INT,
    status TEXT,
    start_date DATE,
    end_date DATE,
    challenger_username TEXT,
    opponent_username TEXT,
    challenger_score INT,
    opponent_score INT,
    winner_id UUID,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Obter o ID do usuario logado
    SELECT id INTO v_user_id FROM users WHERE person_id = auth.uid();

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
        -- Calcular score do desafiante
        CASE 
            WHEN d.status = 'finished' THEN d.challenger_score
            WHEN d.status = 'active' THEN (
                SELECT COUNT(*)::int FROM history h 
                WHERE h.user_id = d.challenger_id 
                  AND h.date BETWEEN d.start_date AND d.end_date 
                  AND h.status = 'perfect'
            )
            ELSE 0
        END AS challenger_score,
        -- Calcular score do oponente
        CASE 
            WHEN d.status = 'finished' THEN d.opponent_score
            WHEN d.status = 'active' THEN (
                SELECT COUNT(*)::int FROM history h 
                WHERE h.user_id = d.opponent_id 
                  AND h.date BETWEEN d.start_date AND d.end_date 
                  AND h.status = 'perfect'
            )
            ELSE 0
        END AS opponent_score,
        d.winner_id,
        d.created_at
    FROM pvp_duels d
    JOIN users u1 ON d.challenger_id = u1.id
    JOIN users u2 ON d.opponent_id = u2.id
    WHERE (d.challenger_id = v_user_id OR d.opponent_id = v_user_id)
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
