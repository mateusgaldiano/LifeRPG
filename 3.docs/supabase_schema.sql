-- ================================================================
-- LifeRPG OS v2.0 — Supabase Schema — FASE 1
-- Execute no SQL Editor do Supabase Dashboard
-- ================================================================


-- ─────────────────────────────────────────
-- PERSONS — identidade real do usuário
-- ─────────────────────────────────────────
CREATE TABLE persons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  name       text NOT NULL,
  birth_date date,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- USERS — perfil do jogador
-- ─────────────────────────────────────────
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id      uuid REFERENCES persons(id) ON DELETE CASCADE,
  username       text UNIQUE NOT NULL,
  level          int DEFAULT 1,
  xp             int DEFAULT 0,
  gold           int DEFAULT 0,
  streak         int DEFAULT 0,
  rank           text DEFAULT 'E',
  archetype      text,
  active_skin    text DEFAULT 'default',
  active_title   text,
  settings       jsonb DEFAULT '{}',
  skills         jsonb DEFAULT '{
                   "physical": 0,
                   "routine":  0,
                   "mental":   0,
                   "wisdom":   0,
                   "focus":    0,
                   "social":   0
                 }',
  last_active_at timestamptz,
  created_at     timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- ACTIVITY_TEMPLATES — biblioteca de hábitos
-- ─────────────────────────────────────────
CREATE TABLE activity_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  skill      text NOT NULL,
  difficulty text NOT NULL,
  xp         int  NOT NULL,
  gold       int  NOT NULL,
  emoji      text,
  source     text DEFAULT 'system',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  public     bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- QUESTS — missões ativas do jogador
-- ─────────────────────────────────────────
CREATE TABLE quests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  template_id  uuid REFERENCES activity_templates(id) ON DELETE SET NULL,
  title        text NOT NULL,
  skill        text NOT NULL,
  type         text NOT NULL,
  difficulty   text NOT NULL,
  xp           int  NOT NULL,
  gold         int  NOT NULL,
  emoji        text,
  completed    bool DEFAULT false,
  completed_at timestamptz,
  from_library bool DEFAULT false,
  recurring    bool DEFAULT true,
  current      int,
  target       int,
  created_at   timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- HISTORY — registro diário de performance
-- ─────────────────────────────────────────
CREATE TABLE history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  date            date NOT NULL,
  xp_earned       int  DEFAULT 0,
  gold_earned     int  DEFAULT 0,
  quests_done     int  DEFAULT 0,
  quests_total    int  DEFAULT 0,
  status          text,
  penalty_applied bool DEFAULT false,
  skills_xp       jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),

  UNIQUE(user_id, date)
);

-- ─────────────────────────────────────────
-- ITEMS — catálogo da loja
-- ─────────────────────────────────────────
CREATE TABLE items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  type           text NOT NULL,
  cost_gold      int,
  min_level      int  DEFAULT 1,
  min_rank       text DEFAULT 'E',
  image_url      text,
  clan_exclusive bool DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- INVENTORY — itens do jogador
-- ─────────────────────────────────────────
CREATE TABLE inventory (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  item_id     uuid REFERENCES items(id) ON DELETE CASCADE,
  equipped    bool DEFAULT false,
  acquired_at timestamptz DEFAULT now(),

  UNIQUE(user_id, item_id)
);


-- ================================================================
-- POPULAR: activity_templates (hábitos padrão do sistema)
-- ================================================================
INSERT INTO activity_templates
  (title, skill, difficulty, xp, gold, emoji, source, public)
VALUES
  ('Meditar por 3 minutos',          'mental',   'easy',   15, 8,  '🧘',  'system', true),
  ('Arrumar a cama ao levantar',     'routine',  'easy',   15, 8,  '🛏️',  'system', true),
  ('Acordar Cedo (Horário Fixo)',    'routine',  'easy',   15, 8,  '🌅',  'system', true),
  ('Beber Água (8 copos)',           'focus',    'easy',   20, 10, '💧',  'system', true),
  ('Treinar de Força / Corrida',     'physical', 'medium', 30, 15, '🏋️',  'system', true),
  ('1h sem celular antes de dormir', 'mental',   'medium', 20, 10, '📵',  'system', true),
  ('Deep Work / Estudos',            'wisdom',   'medium', 30, 15, '💻',  'system', true),
  ('Conectar com Família/Amigo',     'social',   'easy',   15, 8,  '❤️',  'system', true),
  ('Leitura (Mínimo 15min)',         'wisdom',   'easy',   20, 10, '📚',  'system', true),
  ('Mandar mensagem/ligar Família',  'social',   'easy',   15, 8,  '📞',  'system', true);


-- ================================================================
-- POPULAR: items (skins e cosméticos da loja)
-- ================================================================
INSERT INTO items
  (name, type, cost_gold, min_level, min_rank, image_url)
VALUES
  ('Avatar Padrão',   'skin', 0,    1,  'E', 'avatars/1.rank-e.png'),
  ('Shadow Master',   'skin', 500,  10, 'C', 'avatars/skin_shadow_master.png'),
  ('Mist Monarch',    'skin', 750,  15, 'B', 'avatars/skin_mist_monarch.png'),
  ('Arise Emperor',   'skin', 1000, 20, 'A', 'avatars/skin_arise_emperor.png');


-- ================================================================
-- SEGURANÇA — Row Level Security (RLS)
-- ================================================================
ALTER TABLE persons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory         ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE items             ENABLE ROW LEVEL SECURITY;

-- Cada usuário só acessa os próprios dados
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid() = person_id);

CREATE POLICY "quests_own_data" ON quests
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE person_id = auth.uid())
  );

CREATE POLICY "history_own_data" ON history
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE person_id = auth.uid())
  );

CREATE POLICY "inventory_own_data" ON inventory
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE person_id = auth.uid())
  );

-- Templates e itens: leitura pública
CREATE POLICY "templates_public_read" ON activity_templates
  FOR SELECT USING (
    public = true
    OR created_by IN (SELECT id FROM users WHERE person_id = auth.uid())
  );

CREATE POLICY "items_public_read" ON items
  FOR SELECT USING (true);
