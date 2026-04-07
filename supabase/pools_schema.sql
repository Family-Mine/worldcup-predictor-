-- ============================================================
-- WC26 Predictor — Pools (Quinelas entre amigos)
-- ============================================================

-- ── 1. TABLES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url   text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pools (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
  invite_code  text NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pool_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id   uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id)
);

CREATE TABLE IF NOT EXISTS pool_picks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id        uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id       uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score     smallint NOT NULL CHECK (home_score >= 0 AND home_score <= 30),
  away_score     smallint NOT NULL CHECK (away_score >= 0 AND away_score <= 30),
  points_awarded smallint DEFAULT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id, match_id)
);

CREATE TABLE IF NOT EXISTS pool_special_picks (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id                uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  top_scorer_tournament  text CHECK (char_length(top_scorer_tournament) <= 100),
  top_scorer_group_phase text CHECK (char_length(top_scorer_group_phase) <= 100),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id)
);

CREATE TABLE IF NOT EXISTS pool_leaderboard (
  pool_id         uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points    int NOT NULL DEFAULT 0,
  exact_scores    int NOT NULL DEFAULT 0,
  correct_results int NOT NULL DEFAULT 0,
  last_updated    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pool_id, user_id)
);

-- ── 2. INDEXES ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS pools_invite_code_idx      ON pools(invite_code);
CREATE INDEX IF NOT EXISTS pools_created_by_idx       ON pools(created_by);
CREATE INDEX IF NOT EXISTS pool_members_pool_id_idx   ON pool_members(pool_id);
CREATE INDEX IF NOT EXISTS pool_members_user_id_idx   ON pool_members(user_id);
CREATE INDEX IF NOT EXISTS pool_picks_pool_user_idx   ON pool_picks(pool_id, user_id);
CREATE INDEX IF NOT EXISTS pool_picks_match_idx       ON pool_picks(match_id);
CREATE INDEX IF NOT EXISTS pool_leaderboard_rank_idx  ON pool_leaderboard(pool_id, total_points DESC);
CREATE INDEX IF NOT EXISTS pool_special_picks_pool_idx ON pool_special_picks(pool_id);

-- ── 3. RLS ───────────────────────────────────────────────────

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_picks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_special_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_leaderboard ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- pools (now pool_members exists)
CREATE POLICY "pools_select" ON pools FOR SELECT USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM pool_members pm WHERE pm.pool_id = pools.id AND pm.user_id = auth.uid())
);
CREATE POLICY "pools_insert" ON pools FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "pools_update" ON pools FOR UPDATE USING (auth.uid() = created_by);

-- pool_members
CREATE POLICY "pool_members_select" ON pool_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM pool_members pm WHERE pm.pool_id = pool_members.pool_id AND pm.user_id = auth.uid())
);
CREATE POLICY "pool_members_insert" ON pool_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pool_members_delete" ON pool_members FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM pools p WHERE p.id = pool_members.pool_id AND p.created_by = auth.uid())
);

-- pool_picks
CREATE POLICY "pool_picks_select" ON pool_picks FOR SELECT USING (
  EXISTS (SELECT 1 FROM pool_members pm WHERE pm.pool_id = pool_picks.pool_id AND pm.user_id = auth.uid())
);
CREATE POLICY "pool_picks_insert" ON pool_picks FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM pool_members pm WHERE pm.pool_id = pool_picks.pool_id AND pm.user_id = auth.uid()) AND
  (SELECT scheduled_at FROM matches WHERE id = pool_picks.match_id) > now()
);
CREATE POLICY "pool_picks_update" ON pool_picks FOR UPDATE USING (
  auth.uid() = user_id AND
  (SELECT scheduled_at FROM matches WHERE id = pool_picks.match_id) > now()
);

-- pool_special_picks
CREATE POLICY "pool_special_picks_select" ON pool_special_picks FOR SELECT USING (
  EXISTS (SELECT 1 FROM pool_members pm WHERE pm.pool_id = pool_special_picks.pool_id AND pm.user_id = auth.uid())
);
CREATE POLICY "pool_special_picks_upsert" ON pool_special_picks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- pool_leaderboard
CREATE POLICY "pool_leaderboard_select" ON pool_leaderboard FOR SELECT USING (
  EXISTS (SELECT 1 FROM pool_members pm WHERE pm.pool_id = pool_leaderboard.pool_id AND pm.user_id = auth.uid())
);

-- ── 4. TRIGGER: auto-create profile on signup ─────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 5. FUNCTION: calculate points after match result ──────────

CREATE OR REPLACE FUNCTION calculate_pool_points(
  p_match_id uuid,
  p_actual_home int,
  p_actual_away int
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  actual_result text;
BEGIN
  actual_result := CASE
    WHEN p_actual_home > p_actual_away THEN 'home'
    WHEN p_actual_home < p_actual_away THEN 'away'
    ELSE 'draw'
  END;

  UPDATE pool_picks
  SET
    points_awarded = CASE
      WHEN home_score = p_actual_home AND away_score = p_actual_away THEN 3
      WHEN (CASE WHEN home_score > away_score THEN 'home'
                 WHEN home_score < away_score THEN 'away'
                 ELSE 'draw' END) = actual_result THEN 1
      ELSE 0
    END,
    updated_at = now()
  WHERE match_id = p_match_id;

  INSERT INTO pool_leaderboard (pool_id, user_id, total_points, exact_scores, correct_results, last_updated)
  SELECT
    pp.pool_id,
    pp.user_id,
    COALESCE(SUM(pp.points_awarded), 0),
    COUNT(*) FILTER (WHERE pp.points_awarded = 3),
    COUNT(*) FILTER (WHERE pp.points_awarded = 1),
    now()
  FROM pool_picks pp
  WHERE pp.pool_id IN (SELECT DISTINCT pool_id FROM pool_picks WHERE match_id = p_match_id)
    AND pp.points_awarded IS NOT NULL
  GROUP BY pp.pool_id, pp.user_id
  ON CONFLICT (pool_id, user_id) DO UPDATE SET
    total_points    = EXCLUDED.total_points,
    exact_scores    = EXCLUDED.exact_scores,
    correct_results = EXCLUDED.correct_results,
    last_updated    = EXCLUDED.last_updated;
END;
$$;
