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

-- Políticas de acesso para a tabela persons
CREATE POLICY "persons_insert_own" ON persons
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "persons_select_own" ON persons
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "persons_update_own" ON persons
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory         ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE items             ENABLE ROW LEVEL SECURITY;

-- Cada usuário só acessa os próprios dados
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = person_id);

CREATE POLICY "users_insert_secure" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = person_id
    AND level = 1
    AND xp = 0
    AND gold = 0
    AND rank = 'E'
  );

CREATE POLICY "users_delete_own" ON users
  FOR DELETE USING (auth.uid() = person_id);

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


-- ================================================================
-- CONSTRAINTS — Validações de Integridade Física no Banco
-- ================================================================
ALTER TABLE users ADD CONSTRAINT check_user_level CHECK (level >= 1 AND level <= 100);
ALTER TABLE users ADD CONSTRAINT check_user_gold CHECK (gold >= 0);
ALTER TABLE users ADD CONSTRAINT check_user_xp CHECK (xp >= 0);
ALTER TABLE users ADD CONSTRAINT check_user_streak CHECK (streak >= 0);

ALTER TABLE quests ADD CONSTRAINT check_quest_gold_limit CHECK (gold <= 500);
ALTER TABLE quests ADD CONSTRAINT check_quest_xp_limit CHECK (xp <= 500);


-- ================================================================
-- RPC FUNCTIONS — Funções Seguras do Sistema (Security Definer)
-- ================================================================
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

  -- ── VALIDAÇÃO 1: REGRESSÃO DE NÍVEL
  IF p_level < v_current_level THEN
    RAISE EXCEPTION '[VAL_ERR_LEVEL_REGRESSION] O nível não pode regredir. Atual no banco: %, Enviado: %', v_current_level, p_level;
  END IF;

  -- ── VALIDAÇÃO 2: CONSISTÊNCIA DE XP
  v_xp_needed := round(100 * (p_level::double precision ^ 1.5))::int;
  IF p_xp >= v_xp_needed AND p_level < 30 THEN
    RAISE EXCEPTION '[VAL_ERR_XP_OVERFLOW] XP enviado (%) é maior ou igual ao limite de subida (%) para o nível %.', p_xp, v_xp_needed, p_level;
  END IF;

  -- ── VALIDAÇÃO 3: CONSISTÊNCIA DE RANK OBRIGATÓRIA POR FAIXA
  IF (p_level >= 20 AND p_rank <> 'S') OR
     (p_level >= 15 AND p_level < 20 AND p_rank <> 'A') OR
     (p_level >= 10 AND p_level < 15 AND p_rank <> 'B') OR
     (p_level >= 5 AND p_level < 10 AND p_rank <> 'C') OR
     (p_level >= 3 AND p_level < 5 AND p_rank <> 'D') OR
     (p_level < 3 AND p_rank <> 'E') THEN
    RAISE EXCEPTION '[VAL_ERR_INVALID_RANK] Rank "%" inválido para o nível %.', p_rank, p_level;
  END IF;

  -- ── VALIDAÇÃO 4: LIMITE FIXO DE GANHO DE RECURSOS (2000 Gold / 2000 XP)
  IF (p_gold - v_current_gold) > 2000 THEN
    RAISE EXCEPTION '[VAL_ERR_GOLD_LIMIT_EXCEEDED] Ganho de Ouro (%) excede o limite fixo de 2000 por sync.', (p_gold - v_current_gold);
  END IF;

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

  -- 5. ATUALIZAÇÃO SEGURA NO BANCO (SECURITY DEFINER ignora a falta de RLS de UPDATE)
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
