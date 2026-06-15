-- ================================================================
-- LifeRPG OS v2.0 — Supabase Schema — FASE 2.1 (COMUNIDADE)
-- Execute no SQL Editor do Supabase Dashboard
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. CONFIGURAR COLUNA USERNAME EM USERS (GARANTIR UNIQUE E NOT NULL)
-- ────────────────────────────────────────────────────────────────
-- Garante que a coluna username exista
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- Adiciona a constraint UNIQUE (caso não exista)
-- Usamos um bloco anônimo para evitar erros caso a constraint já exista no banco
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- Define a coluna como NOT NULL
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- ────────────────────────────────────────────────────────────────
-- 2. TABELA CHAT_MESSAGES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  level INT NOT NULL,
  rank TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'global',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para carregamento rápido das mensagens do canal ordenadas por data
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created
  ON chat_messages (channel, created_at DESC);

-- Habilita Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança do Chat
DROP POLICY IF EXISTS "Leitura do chat global" ON chat_messages;
CREATE POLICY "Leitura do chat global"
  ON chat_messages FOR SELECT
  USING (channel = 'global');

DROP POLICY IF EXISTS "Postagem no chat global" ON chat_messages;
CREATE POLICY "Postagem no chat global"
  ON chat_messages FOR INSERT
  WITH CHECK (
    channel = 'global' 
    AND user_id IN (SELECT id FROM users WHERE person_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────────
-- 3. TABELA FRIENDSHIPS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending','accepted','blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (requester_id, target_id)
);

-- Habilita Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança de Amizades
DROP POLICY IF EXISTS "Ver próprias relações" ON friendships;
CREATE POLICY "Ver próprias relações"
  ON friendships FOR SELECT
  USING (
    requester_id IN (SELECT id FROM users WHERE person_id = auth.uid())
    OR target_id IN (SELECT id FROM users WHERE person_id = auth.uid())
  );

DROP POLICY IF EXISTS "Enviar pedido" ON friendships;
CREATE POLICY "Enviar pedido"
  ON friendships FOR INSERT
  WITH CHECK (
    requester_id IN (SELECT id FROM users WHERE person_id = auth.uid())
  );

DROP POLICY IF EXISTS "Atualizar status (aceitar/bloquear)" ON friendships;
CREATE POLICY "Atualizar status (aceitar/bloquear)"
  ON friendships FOR UPDATE
  USING (
    requester_id IN (SELECT id FROM users WHERE person_id = auth.uid())
    OR target_id IN (SELECT id FROM users WHERE person_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────────
-- 4. VIEW DE PERFIS PÚBLICOS (BUSCA DE JOGADORES)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public_profiles AS 
  SELECT id, username, level, rank FROM users;

-- Garante que apenas usuários autenticados possam buscar jogadores
REVOKE ALL ON public_profiles FROM public;
REVOKE ALL ON public_profiles FROM anon;
GRANT SELECT ON public_profiles TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 5. ATIVAR REALTIME PARA O CHAT
-- ────────────────────────────────────────────────────────────────
-- Adiciona a tabela de mensagens ao canal de publicação em tempo real do Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
