-- ============================================================================
-- setup_push_phase2_horarios.sql  (v2.3.2)
-- FASE 2 das notificações push: respeitar o horário que cada usuário escolhe
-- no app (slider Manhã/Noite). Rode no Supabase → SQL Editor.
-- Requer a fase 1 já aplicada (setup_push_notifications.sql).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────
-- 1) Tabela de preferências de horário (já em UTC)
--    O cliente grava morning/evening_utc_min = minutos do dia em UTC
--    (0..1439), convertidos do horário local usando o fuso do próprio
--    dispositivo. Assim o servidor não precisa saber timezone de ninguém.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notif_prefs (
  user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled         bool DEFAULT true,
  morning_utc_min int,   -- minuto do dia em UTC (0..1439); null = sem lembrete de manhã
  evening_utc_min int,
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE user_notif_prefs ENABLE ROW LEVEL SECURITY;

-- Cada jogador gerencia só as próprias preferências.
DROP POLICY IF EXISTS "user_notif_prefs_own" ON user_notif_prefs;
CREATE POLICY "user_notif_prefs_own" ON user_notif_prefs
  FOR ALL
  USING      (user_id IN (SELECT id FROM users WHERE person_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE person_id = auth.uid()));

-- ────────────────────────────────────────────────────────────────
-- 2) Agendador: troca o lembrete diário fixo por um que roda a cada 15 min
--    e dispara pra quem tem horário batendo no bloco de 15 min atual.
--    ⚠️ TROQUE <SERVICE_ROLE_KEY> pela sua service_role key (sb_secret_...).
-- ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove o cron fixo antigo da fase 1 (não é mais necessário).
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'liferpg-lembrete-noturno';

-- Remove o cron por horário se já existir (idempotente).
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'liferpg-notif-scheduled';

SELECT cron.schedule(
  'liferpg-notif-scheduled',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ppsqvppnunzagxqruoqf.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{"action":"trigger_scheduled"}'::jsonb
  );
  $$
);

-- Conferir:
--   SELECT jobname, schedule, active FROM cron.job;
--   SELECT * FROM user_notif_prefs;
