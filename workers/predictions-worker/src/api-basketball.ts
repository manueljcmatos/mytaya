const API_BASE = 'https://v1.basketball.api-sports.io';

/** NBA league configuration for API-Basketball */
export const NBA_LEAGUE = {
  id: 12,
  name: 'NBA',
  slug: 'nba',
  season: '2025-2026',
} as const;

/** API-Basketball game response shape */
export interface ApiBasketballGame {
  id: number;
  date: string;
  timestamp: number;
  status: {
    short: string;
    long: string;
  };
  league: {
    id: number;
    name: string;
    season: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  scores: {
    home: { total: number | null };
    away: { total: number | null };
  };
}

/** Parsed NBA odds from API-Basketball */
export interface NbaOdds {
  moneyline: { home: number; away: number };
  spread: { home_line: number; home_odds: number; away_odds: number };
  totals: { line: number; over_odds: number; under_odds: number };
  source: string;
}

/** Delay helper for rate limiting */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch NBA games for a given date from API-Basketball.
 * Uses the same x-apisports-key header as API-Football.
 */
export async function fetchNbaGames(
  apiKey: string,
  date: string
): Promise<ApiBasketballGame[]> {
  const url = `${API_BASE}/games?league=${NBA_LEAGUE.id}&season=${NBA_LEAGUE.season}&date=${date}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });

  if (!res.ok) {
    console.error(`API-Basketball error: ${res.status}`);
    return [];
  }

  const data = (await res.json()) as { response: ApiBasketballGame[] };
  return data.response ?? [];
}

/**
 * Fetch odds for a single NBA game.
 * Parses spread (handicap), moneyline (h2h), and totals from first bookmaker.
 * Returns null if odds are unavailable.
 */
export async function fetchNbaOdds(
  apiKey: string,
  gameId: number
): Promise<NbaOdds | null> {
  const url = `${API_BASE}/odds?game=${gameId}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    response: Array<{
      bookmakers: Array<{
        name: string;
        bets: Array<{
          name: string;
          values: Array<{ value: string; odd: string }>;
        }>;
      }>;
    }>;
  };

  const bookmaker = data.response?.[0]?.bookmakers?.[0];
  if (!bookmaker) return null;

  // Parse moneyline (Home/Away or Match Winner)
  const mlBet = bookmaker.bets.find(
    (b) => b.name === 'Home/Away' || b.name === 'Match Winner'
  );
  const homeML = parseFloat(
    mlBet?.values.find((v) => v.value === 'Home')?.odd ?? '1.9'
  );
  const awayML = parseFloat(
    mlBet?.values.find((v) => v.value === 'Away')?.odd ?? '1.9'
  );

  // Parse spread (Handicap)
  const spreadBet = bookmaker.bets.find(
    (b) => b.name === 'Handicap' || b.name === 'Asian Handicap'
  );
  const spreadHome = spreadBet?.values.find((v) => v.value.includes('Home'));
  const spreadAway = spreadBet?.values.find((v) => v.value.includes('Away'));
  const homeLine = parseFloat(
    spreadHome?.value.replace(/[^-\d.]/g, '') || '-5.5'
  );

  // Parse totals (Over/Under)
  const totalsBet = bookmaker.bets.find(
    (b) => b.name === 'Over/Under' || b.name === 'Total'
  );
  const overVal = totalsBet?.values.find((v) => v.value.includes('Over'));
  const underVal = totalsBet?.values.find((v) => v.value.includes('Under'));
  const totalLine = parseFloat(
    overVal?.value.replace(/[^.\d]/g, '') || '215.5'
  );

  return {
    moneyline: { home: homeML, away: awayML },
    spread: {
      home_line: homeLine,
      home_odds: parseFloat(spreadHome?.odd ?? '1.9'),
      away_odds: parseFloat(spreadAway?.odd ?? '1.9'),
    },
    totals: {
      line: totalLine,
      over_odds: parseFloat(overVal?.odd ?? '1.9'),
      under_odds: parseFloat(underVal?.odd ?? '1.9'),
    },
    source: bookmaker.name,
  };
}

/**
 * Fetch a single NBA game result by game ID.
 * Used by the resolver to check final scores.
 */
export async function fetchNbaGameResult(
  apiKey: string,
  gameId: number
): Promise<ApiBasketballGame | null> {
  const url = `${API_BASE}/games?id=${gameId}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { response: ApiBasketballGame[] };
  return data.response?.[0] ?? null;
}
