-- NBA Support Migration
-- Adds spread/total line columns, conference column, NBA league seed, and stats index

-- ============================================================
-- ADD SPREAD AND TOTAL LINE COLUMNS TO PREDICTIONS
-- ============================================================
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS spread_line DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS total_line DECIMAL(5,1);

-- ============================================================
-- ADD CONFERENCE COLUMN TO TEAMS
-- ============================================================
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS conference TEXT CHECK (conference IN ('Eastern', 'Western'));

-- ============================================================
-- SEED NBA LEAGUE
-- ============================================================
INSERT INTO public.leagues (name, slug, sport, country, api_source, api_league_id, is_active)
VALUES ('NBA', 'nba', 'basketball', 'USA', 'api-sports', 12, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STATS PERFORMANCE INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_predictions_stats
  ON public.predictions (sport, status, settled_at)
  WHERE status = 'settled' AND published_site = true;
