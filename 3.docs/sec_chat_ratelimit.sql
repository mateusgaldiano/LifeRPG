-- ==========================================================================
-- SEC-001 · Rate limit SERVER-SIDE do chat global
-- O frontend já bloqueia 1 msg / 2s (social.js handleSendMessage). Isto é a
-- defesa de servidor caso o frontend seja burlado: máx. 10 msgs/min por usuário.
--
-- Abordagem por TRIGGER (não por RLS com subquery COUNT — que é caro e avaliado
-- por linha). Rode no Supabase -> SQL Editor. Idempotente.
-- ==========================================================================

CREATE OR REPLACE FUNCTION enforce_chat_rate_limit()
RETURNS trigger AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM chat_messages
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION '[RATE_LIMIT] Limite de 10 mensagens por minuto excedido. Aguarde um pouco.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_rate_limit ON chat_messages;
CREATE TRIGGER trg_chat_rate_limit
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION enforce_chat_rate_limit();
