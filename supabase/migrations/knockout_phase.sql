-- supabase/migrations/knockout_phase.sql
-- ============================================================
-- WC26 Predictor — Knockout Phase Migration
-- ============================================================

-- 1. Agregar group_points y knockout_points a pool_leaderboard
ALTER TABLE pool_leaderboard
  ADD COLUMN IF NOT EXISTS group_points    int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS knockout_points int NOT NULL DEFAULT 0;

-- 2. Hacer nullable los FK de equipos en matches (para partidos TBD)
ALTER TABLE matches
  ALTER COLUMN home_team_id DROP NOT NULL,
  ALTER COLUMN away_team_id DROP NOT NULL;

-- 3. Agregar columnas de slot para mostrar posición antes de conocer equipos
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_slot text,
  ADD COLUMN IF NOT EXISTS away_slot text;

-- 4. Crear tabla global de goleador real
CREATE TABLE IF NOT EXISTS tournament_top_scorer (
  id          int PRIMARY KEY DEFAULT 1,
  player_name text NOT NULL,
  team_name   text NOT NULL,
  goals       int  NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE tournament_top_scorer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "top_scorer_select" ON tournament_top_scorer FOR SELECT USING (true);

-- 5. Actualizar función calculate_pool_points para separar por fase
CREATE OR REPLACE FUNCTION calculate_pool_points(
  p_match_id   uuid,
  p_actual_home smallint,
  p_actual_away smallint
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Paso 1: asignar puntos a cada pick de este partido
  UPDATE pool_picks
  SET points_awarded = CASE
    WHEN home_score = p_actual_home AND away_score = p_actual_away THEN 3
    WHEN (
      CASE WHEN home_score > away_score THEN 'home'
           WHEN home_score < away_score THEN 'away'
           ELSE 'draw' END
    ) = (
      CASE WHEN p_actual_home > p_actual_away THEN 'home'
           WHEN p_actual_home < p_actual_away THEN 'away'
           ELSE 'draw' END
    ) THEN 1
    ELSE 0
  END
  WHERE match_id = p_match_id;

  -- Paso 2: recalcular leaderboard con puntos separados por fase
  INSERT INTO pool_leaderboard (
    pool_id, user_id,
    total_points, group_points, knockout_points,
    exact_scores, correct_results, last_updated
  )
  SELECT
    pp.pool_id,
    pp.user_id,
    COALESCE(SUM(pp.points_awarded), 0),
    COALESCE(SUM(pp.points_awarded) FILTER (WHERE m.stage = 'group'), 0),
    COALESCE(SUM(pp.points_awarded) FILTER (WHERE m.stage <> 'group'), 0),
    COUNT(*) FILTER (WHERE pp.points_awarded = 3),
    COUNT(*) FILTER (WHERE pp.points_awarded >= 1),
    now()
  FROM pool_picks pp
  JOIN matches m ON m.id = pp.match_id
  WHERE pp.pool_id IN (
    SELECT DISTINCT pool_id FROM pool_picks WHERE match_id = p_match_id
  )
    AND pp.points_awarded IS NOT NULL
  GROUP BY pp.pool_id, pp.user_id
  ON CONFLICT (pool_id, user_id) DO UPDATE SET
    total_points    = EXCLUDED.total_points,
    group_points    = EXCLUDED.group_points,
    knockout_points = EXCLUDED.knockout_points,
    exact_scores    = EXCLUDED.exact_scores,
    correct_results = EXCLUDED.correct_results,
    last_updated    = EXCLUDED.last_updated;
END;
$$;
