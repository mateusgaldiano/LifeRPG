-- ============================================================================
-- setup_push_notifications.sql  (v2.3.1)
-- Setup COMPLETO e AUTORITATIVO das notificações push do LifeRPG.
-- Rode INTEIRO no Supabase → SQL Editor (depois de trocar <SERVICE_ROLE_KEY>).
--
-- Supersede: supabase_push_setup.sql e streak_reminder_cron.sql — esses dois
-- tinham definições CONFLITANTES da tabela push_subscriptions (um usava
-- user_id → users(id), o outro user_id → auth.users(id)). O correto é
-- users(id), porque é o que o cliente envia (window._currentUserDbId) e o que
-- a Edge Function usa (quests.user_id → users.id).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────
-- 1) Tabela push_subscriptions (schema CORRETO)
--    Recriada do zero: as inscrições antigas ficaram inválidas porque a chave
--    VAPID foi trocada. Os clientes se re-inscrevem sozinhos no próximo login.
-- ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS push_subscriptions CASCADE;

CREATE TABLE push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada jogador só gerencia as próprias inscrições (via a tabela users).
DROP POLICY IF EXISTS "select_own_subscriptions" ON push_subscriptions;
CREATE POLICY "select_own_subscriptions" ON push_subscriptions
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE person_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_subscriptions" ON push_subscriptions;
CREATE POLICY "insert_own_subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE person_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_subscriptions" ON push_subscriptions;
CREATE POLICY "delete_own_subscriptions" ON push_subscriptions
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE person_id = auth.uid()));

-- ────────────────────────────────────────────────────────────────
-- 2) Extensões do agendador
-- ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ────────────────────────────────────────────────────────────────
-- 3) Agendamento do lembrete noturno
--    pg_cron roda em UTC. 22:00 UTC = 19:00 no horário de Brasília (UTC-3).
--    Ajuste o horário do cron se quiser outro (formato: minuto hora * * *).
--    ⚠️ TROQUE <SERVICE_ROLE_KEY> pela sua service_role key:
--       Supabase → Settings → API → Project API keys → service_role (secret).
-- ────────────────────────────────────────────────────────────────
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'liferpg-lembrete-noturno';

SELECT cron.schedule(
  'liferpg-lembrete-noturno',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ppsqvppnunzagxqruoqf.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{"action":"trigger_all_reminders"}'::jsonb
  );
  $$
);

-- Conferir o job agendado:
--   SELECT jobname, schedule, active FROM cron.job;
