/** Cloudflare Worker environment bindings */
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  API_FOOTBALL_KEY: string;
  AI: Ai;
  CARDS_BUCKET: R2Bucket;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHANNEL_ID: string;
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

/** Pick types supported by the football prediction engine */
export type PickType =
  | 'home'
  | 'away'
  | 'draw'
  | 'over'
  | 'under'
  | 'btts_yes'
  | 'btts_no';

/** NBA-specific pick types */
export type NbaPickType =
  | 'moneyline_home'
  | 'moneyline_away'
  | 'spread_home'
  | 'spread_away'
  | 'over'
  | 'under';

/** Combined pick type for all sports */
export type AllPickType = PickType | NbaPickType;

/** Context for NBA match prediction generation */
export interface NbaMatchContext {
  homeTeam: string;
  awayTeam: string;
  league: string;
  leagueSlug: string;
  fixtureId: number;
  matchDate: string;
  spread: number;
  totalLine: number;
  odds: {
    moneyline_home: number;
    moneyline_away: number;
    spread_home: number;
    spread_away: number;
    over: number;
    under: number;
  };
}

/** Shape for inserting a blog post into Supabase */
export interface BlogPostInsert {
  slug: string;
  slug_en: string;
  slug_tl: string;
  title_tl: string;
  title_en: string;
  content_tl: string;
  content_en: string;
  excerpt_tl: string;
  excerpt_en: string;
  category: 'analysis';
  sport: 'football' | 'basketball';
  prediction_id: string;
  read_time_minutes: number;
  is_published: boolean;
  published_at: string;
}

/** Shape for inserting a prediction into Supabase */
export interface PredictionInsert {
  slug: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  sport: 'football' | 'basketball';
  pick: PickType | NbaPickType;
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
  spread_line?: number;
  total_line?: number;
}
