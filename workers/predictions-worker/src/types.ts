/** Cloudflare Worker environment bindings */
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  API_FOOTBALL_KEY: string;
  AI: Ai;
}

/** API-Football v3 fixture response shape */
export interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    round: string;
  };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

/** Context passed to AI prediction generator */
export interface MatchContext {
  homeTeam: string;
  awayTeam: string;
  league: string;
  leagueSlug: string;
  fixtureId: number;
  matchDate: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

/** Pick types supported by the prediction engine */
export type PickType =
  | 'home'
  | 'away'
  | 'draw'
  | 'over'
  | 'under'
  | 'btts_yes'
  | 'btts_no';

/** Shape for inserting a prediction into Supabase */
export interface PredictionInsert {
  slug: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  sport: 'football';
  pick: PickType;
  pick_label_tl: string;
  pick_label_en: string;
  analysis_tl: string;
  analysis_en: string;
  odds: number;
  odds_source: string;
  confidence: 'high' | 'medium' | 'low';
  stake: number;
  published_site: boolean;
  api_fixture_id: number;
}
