-- Seed football leagues for predictions worker
-- These match the TARGET_LEAGUES in workers/predictions-worker/src/api-football.ts

INSERT INTO public.leagues (name, slug, sport, country, api_source, api_league_id, is_active)
VALUES
  ('Premier League', 'premier-league', 'football', 'England', 'api-sports', 39, true),
  ('La Liga', 'la-liga', 'football', 'Spain', 'api-sports', 140, true),
  ('Serie A', 'serie-a', 'football', 'Italy', 'api-sports', 135, true),
  ('Bundesliga', 'bundesliga', 'football', 'Germany', 'api-sports', 78, true),
  ('Ligue 1', 'ligue-1', 'football', 'France', 'api-sports', 61, true)
ON CONFLICT (slug) DO NOTHING;

-- Add unique index on teams.api_team_id for Worker upsert pattern
-- This allows the Worker to upsert teams by their API-Football team ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_api_team_id
  ON public.teams (api_team_id)
  WHERE api_team_id IS NOT NULL;
