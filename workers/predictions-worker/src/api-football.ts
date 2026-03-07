import type { ApiFootballFixture } from './types';

const API_BASE = 'https://v3.football.api-sports.io';

/** Target leagues for Filipino audience -- top 5 European leagues */
export const TARGET_LEAGUES = [
  { id: 39, name: 'Premier League', slug: 'premier-league', season: 2025 },
  { id: 140, name: 'La Liga', slug: 'la-liga', season: 2025 },
  { id: 135, name: 'Serie A', slug: 'serie-a', season: 2025 },
  { id: 78, name: 'Bundesliga', slug: 'bundesliga', season: 2025 },
  { id: 61, name: 'Ligue 1', slug: 'ligue-1', season: 2025 },
] as const;

/** Delay helper for rate limiting (free tier: 10 req/min) */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch today's fixtures for all target leagues on a given date.
 * Adds 1100ms delay between league calls to respect free tier rate limits.
 */
export async function fetchTodayFixtures(
  apiKey: string,
  date: string
): Promise<ApiFootballFixture[]> {
  const fixtures: ApiFootballFixture[] = [];

  for (const league of TARGET_LEAGUES) {
    const url = `${API_BASE}/fixtures?league=${league.id}&season=${league.season}&date=${date}&timezone=Asia/Manila`;
    const res = await fetch(url, {
      headers: { 'x-apisports-key': apiKey },
    });

    if (!res.ok) {
      console.error(
        `API-Football error for league ${league.name}: ${res.status}`
      );
      continue;
    }

    const data = (await res.json()) as { response: ApiFootballFixture[] };
    fixtures.push(...data.response);

    // Rate limit: 1.1s between calls on free tier
    await delay(1100);
  }

  return fixtures;
}

/**
 * Fetch odds for a single fixture.
 * Returns the first bookmaker's match-winner odds, or null if unavailable.
 */
export async function fetchOdds(
  apiKey: string,
  fixtureId: number
): Promise<{ home: number; draw: number; away: number; source: string } | null> {
  const url = `${API_BASE}/odds?fixture=${fixtureId}`;
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

  // Find "Match Winner" bet (id: 1)
  const matchWinner = bookmaker.bets.find(
    (b) => b.name === 'Match Winner' || b.name === '1X2'
  );
  if (!matchWinner) return null;

  const homeOdd = matchWinner.values.find((v) => v.value === 'Home');
  const drawOdd = matchWinner.values.find((v) => v.value === 'Draw');
  const awayOdd = matchWinner.values.find((v) => v.value === 'Away');

  return {
    home: parseFloat(homeOdd?.odd ?? '0'),
    draw: parseFloat(drawOdd?.odd ?? '0'),
    away: parseFloat(awayOdd?.odd ?? '0'),
    source: bookmaker.name,
  };
}

/**
 * Fetch a single fixture result by its fixture ID.
 */
export async function fetchFixtureResult(
  apiKey: string,
  fixtureId: number
): Promise<ApiFootballFixture | null> {
  const url = `${API_BASE}/fixtures?id=${fixtureId}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { response: ApiFootballFixture[] };
  return data.response?.[0] ?? null;
}
