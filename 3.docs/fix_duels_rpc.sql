-- ============================================================================
-- FIX · RPC get_user_duels_with_scores (aba Duelos mostrava "Erro ao carregar")
-- ----------------------------------------------------------------------------
-- CAUSA REAL (confirmada via API, erro 42702 "column reference id is ambiguous"):
-- o `SELECT id INTO v_user_id FROM users` usava `id` SEM qualificar, e como a
-- RETURNS TABLE também declara um parâmetro de saída `id`, o Postgres não sabia se
-- `id` era a variável ou a coluna users.id. Corrigido para `u.id` (alias da tabela).
--
-- Recria a função (idempotente), garante o EXECUTE e recarrega o schema do PostgREST.
-- Self-contained: NÃO depende do pvp_duels.sql. Rodar no SQL Editor (Role: postgres).
-- ============================================================================

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
    SELECT u.id INTO v_user_id FROM users u WHERE u.person_id = auth.uid();

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

GRANT EXECUTE ON FUNCTION get_user_duels_with_scores() TO authenticated;

-- Força o PostgREST a recarregar o schema e enxergar a função na hora.
NOTIFY pgrst, 'reload schema';
