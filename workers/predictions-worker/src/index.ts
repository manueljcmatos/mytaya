import type { Env, MatchContext, NbaMatchContext, PredictionInsert } from './types';
import { createSupabaseClient } from './supabase';
import { fetchTodayFixtures, fetchOdds, TARGET_LEAGUES } from './api-football';
import { fetchNbaGames, fetchNbaOdds, NBA_LEAGUE } from './api-basketball';
import type { ApiBasketballGame } from './api-basketball';
import { generatePrediction } from './prediction-gen';
import { generateNbaPrediction } from './prediction-gen';
import { resolveFinishedMatches, resolveNbaMatches } from './resolver';
import { generateBlogArticles } from './blog-gen';
import { generatePredictionCard } from './card-gen';
import type { PredictionCardData } from './card-gen';
import { publishDuePredictions, sendDailyRecap } from './telegram';
import type { ApiFootballFixture } from './types';

/** Delay helper for rate limiting */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Get today's date string in Asia/Manila timezone (YYYY-MM-DD).
 */
function getTodayPHT(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Generate a URL-safe slug for a prediction.
 * Format: league-home-vs-away-YYYY-MM-DD
 */
function buildSlug(
  leagueSlug: string,
  homeTeam: string,
  awayTeam: string,
  date: string
): string {
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  return `${leagueSlug}-${slugify(homeTeam)}-vs-${slugify(awayTeam)}-${date}`;
}

/**
 * Select 3-5 best fixtures from the pool.
 * Prefer matches with odds available and spread across leagues.
 */
function selectBestFixtures(
  fixtures: ApiFootballFixture[],
  maxPicks: number
): ApiFootballFixture[] {
  if (fixtures.length <= maxPicks) return fixtures;

  // Spread picks across leagues: take at most 1-2 per league
  const byLeague = new Map<number, ApiFootballFixture[]>();
  for (const f of fixtures) {
    const existing = byLeague.get(f.league.id) ?? [];
    existing.push(f);
    byLeague.set(f.league.id, existing);
  }

  const selected: ApiFootballFixture[] = [];

  // First pass: one per league
  for (const [, leagueFixtures] of byLeague) {
    if (selected.length >= maxPicks) break;
    selected.push(leagueFixtures[0]);
  }

  // Second pass: fill remaining from any league
  if (selected.length < maxPicks) {
    for (const f of fixtures) {
      if (selected.length >= maxPicks) break;
      if (!selected.includes(f)) {
        selected.push(f);
      }
    }
  }

  return selected;
}

/**
 * Upsert a team by API team ID. Returns the team's UUID.
 * Uses select-then-insert pattern since teams table uses slug as unique, not api_team_id.
 */
async function upsertTeam(
  supabase: ReturnType<typeof createSupabaseClient>,
  apiTeamId: number,
  teamName: string,
  leagueId: string
): Promise<string> {
  // Try to find existing team by api_team_id
  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('api_team_id', apiTeamId)
    .single();

  if (existing) return existing.id;

  // Insert new team
  const slug = teamName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data: inserted, error } = await supabase
    .from('teams')
    .upsert(
      {
        name: teamName,
        slug,
        league_id: leagueId,
        api_team_id: apiTeamId,
      },
      { onConflict: 'api_team_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  if (error) {
    // If slug conflict, try with api_team_id suffix
    const { data: fallback, error: fallbackErr } = await supabase
      .from('teams')
      .upsert(
        {
          name: teamName,
          slug: `${slug}-${apiTeamId}`,
          league_id: leagueId,
          api_team_id: apiTeamId,
        },
        { onConflict: 'api_team_id', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (fallbackErr) {
      throw new Error(`Failed to upsert team ${teamName}: ${fallbackErr.message}`);
    }
    return fallback!.id;
  }

  return inserted!.id;
}

/**
 * Look up league UUID by api_league_id.
 */
async function getLeagueId(
  supabase: ReturnType<typeof createSupabaseClient>,
  apiLeagueId: number
): Promise<string | null> {
  const { data } = await supabase
    .from('leagues')
    .select('id')
    .eq('api_league_id', apiLeagueId)
    .single();

  return data?.id ?? null;
}

/**
 * Main prediction pipeline: fetch today's fixtures, generate AI predictions,
 * and store them in Supabase.
 */
async function fetchAndGeneratePredictions(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);
  const today = getTodayPHT();

  console.log(`Fetching fixtures for ${today}`);

  // Fetch all fixtures for target leagues
  const allFixtures = await fetchTodayFixtures(env.API_FOOTBALL_KEY, today);
  console.log(`Found ${allFixtures.length} fixtures across target leagues`);

  if (allFixtures.length === 0) {
    console.log('No fixtures today, skipping prediction generation');
    return;
  }

  // Select 3-5 best fixtures
  const selected = selectBestFixtures(allFixtures, 5);
  console.log(`Selected ${selected.length} fixtures for predictions`);

  let created = 0;

  for (const fixture of selected) {
    try {
      // Find league slug from our config
      const leagueConfig = TARGET_LEAGUES.find(
        (l) => l.id === fixture.league.id
      );
      if (!leagueConfig) continue;

      // Look up league UUID
      const leagueId = await getLeagueId(supabase, fixture.league.id);
      if (!leagueId) {
        console.error(
          `League not found in DB for api_league_id ${fixture.league.id}`
        );
        continue;
      }

      // Fetch odds
      const odds = await fetchOdds(env.API_FOOTBALL_KEY, fixture.fixture.id);
      await delay(1100);

      // Default odds if not available
      const matchOdds = odds ?? {
        home: 2.0,
        draw: 3.0,
        away: 3.5,
        source: 'estimated',
      };

      // Upsert teams
      const homeTeamId = await upsertTeam(
        supabase,
        fixture.teams.home.id,
        fixture.teams.home.name,
        leagueId
      );
      const awayTeamId = await upsertTeam(
        supabase,
        fixture.teams.away.id,
        fixture.teams.away.name,
        leagueId
      );

      // Build match context for AI
      const matchContext: MatchContext = {
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        league: fixture.league.name,
        leagueSlug: leagueConfig.slug,
        fixtureId: fixture.fixture.id,
        matchDate: fixture.fixture.date,
        odds: {
          home: matchOdds.home,
          draw: matchOdds.draw,
          away: matchOdds.away,
        },
      };

      // Generate AI prediction
      const prediction = await generatePrediction(env.AI, matchContext);

      // Build slug (league-home-vs-away-date format per research pitfall #4)
      const slug = buildSlug(
        leagueConfig.slug,
        fixture.teams.home.name,
        fixture.teams.away.name,
        today
      );

      // Determine which odds value to store based on the pick
      let oddsValue = matchOdds.home;
      if (prediction.pick === 'away') oddsValue = matchOdds.away;
      else if (prediction.pick === 'draw') oddsValue = matchOdds.draw;
      else if (['over', 'under', 'btts_yes', 'btts_no'].includes(prediction.pick)) {
        oddsValue = 1.9; // Default for non-1X2 picks
      }

      // Insert prediction into Supabase
      const predictionInsert: PredictionInsert = {
        slug,
        league_id: leagueId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        match_date: fixture.fixture.date,
        sport: 'football',
        pick: prediction.pick,
        pick_label_tl: prediction.pick_label_tl,
        pick_label_en: prediction.pick_label_en,
        analysis_tl: prediction.analysis_tl,
        analysis_en: prediction.analysis_en,
        odds: oddsValue,
        odds_source: matchOdds.source,
        confidence: prediction.confidence,
        stake: prediction.stake,
        published_site: true,
        api_fixture_id: fixture.fixture.id,
      };

      const { error: insertError } = await supabase
        .from('predictions')
        .upsert(predictionInsert, { onConflict: 'slug' });

      if (insertError) {
        console.error(`Error inserting prediction for ${slug}:`, insertError.message);
      } else {
        created++;
        console.log(`Created prediction: ${slug} (${prediction.pick})`);

        // Generate prediction card (non-blocking: failure does not disrupt pipeline)
        try {
          const cardData: PredictionCardData = {
            slug,
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            league: fixture.league.name,
            matchDate: fixture.fixture.date,
            pick: prediction.pick_label_en,
            odds: oddsValue,
            confidence: prediction.confidence,
            sport: 'football',
          };
          await generatePredictionCard(env, cardData);
        } catch (cardErr) {
          console.error(`Card generation failed for ${slug}:`, cardErr);
        }
      }
    } catch (err) {
      console.error(
        `Error processing fixture ${fixture.fixture.id}:`,
        err
      );
    }
  }

  console.log(`Prediction generation complete: ${created}/${selected.length} created`);
}

/**
 * Select 3-5 best NBA games from the pool.
 */
function selectBestNbaGames(
  games: ApiBasketballGame[],
  maxPicks: number
): ApiBasketballGame[] {
  if (games.length <= maxPicks) return games;
  // NBA is single-league, just take first N games
  return games.slice(0, maxPicks);
}

/**
 * NBA prediction pipeline: fetch today's NBA games, generate AI predictions,
 * and store them in Supabase.
 */
async function fetchAndGenerateNbaPredictions(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);
  const today = getTodayPHT();

  console.log(`Fetching NBA games for ${today}`);

  const allGames = await fetchNbaGames(env.API_FOOTBALL_KEY, today);
  console.log(`Found ${allGames.length} NBA games`);

  if (allGames.length === 0) {
    console.log('No NBA games today');
    return;
  }

  // Select 3-5 best games
  const selected = selectBestNbaGames(allGames, 5);
  console.log(`Selected ${selected.length} NBA games for predictions`);

  // Get NBA league UUID
  const nbaLeagueId = await getLeagueId(supabase, NBA_LEAGUE.id);
  if (!nbaLeagueId) {
    console.error('NBA league not found in DB -- run migration 004 first');
    return;
  }

  let created = 0;

  for (const game of selected) {
    try {
      // Fetch odds
      const odds = await fetchNbaOdds(env.API_FOOTBALL_KEY, game.id);
      await delay(1100);

      // Default odds if not available
      const matchOdds = odds ?? {
        moneyline: { home: 1.9, away: 1.9 },
        spread: { home_line: -5.5, home_odds: 1.9, away_odds: 1.9 },
        totals: { line: 215.5, over_odds: 1.9, under_odds: 1.9 },
        source: 'estimated',
      };

      // Upsert teams
      const homeTeamId = await upsertTeam(
        supabase,
        game.teams.home.id,
        game.teams.home.name,
        nbaLeagueId
      );
      const awayTeamId = await upsertTeam(
        supabase,
        game.teams.away.id,
        game.teams.away.name,
        nbaLeagueId
      );

      // Build NBA match context for AI
      const matchContext: NbaMatchContext = {
        homeTeam: game.teams.home.name,
        awayTeam: game.teams.away.name,
        league: NBA_LEAGUE.name,
        leagueSlug: NBA_LEAGUE.slug,
        fixtureId: game.id,
        matchDate: game.date,
        spread: matchOdds.spread.home_line,
        totalLine: matchOdds.totals.line,
        odds: {
          moneyline_home: matchOdds.moneyline.home,
          moneyline_away: matchOdds.moneyline.away,
          spread_home: matchOdds.spread.home_odds,
          spread_away: matchOdds.spread.away_odds,
          over: matchOdds.totals.over_odds,
          under: matchOdds.totals.under_odds,
        },
      };

      // Generate AI prediction
      const prediction = await generateNbaPrediction(env.AI, matchContext);

      // Build slug (nba-home-vs-away-date)
      const slug = buildSlug(
        NBA_LEAGUE.slug,
        game.teams.home.name,
        game.teams.away.name,
        today
      );

      // Determine which odds value to store based on the pick
      let oddsValue = matchOdds.moneyline.home;
      switch (prediction.pick) {
        case 'moneyline_away':
          oddsValue = matchOdds.moneyline.away;
          break;
        case 'spread_home':
          oddsValue = matchOdds.spread.home_odds;
          break;
        case 'spread_away':
          oddsValue = matchOdds.spread.away_odds;
          break;
        case 'over':
          oddsValue = matchOdds.totals.over_odds;
          break;
        case 'under':
          oddsValue = matchOdds.totals.under_odds;
          break;
      }

      // Insert prediction into Supabase
      const predictionInsert: PredictionInsert = {
        slug,
        league_id: nbaLeagueId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        match_date: game.date,
        sport: 'basketball',
        pick: prediction.pick,
        pick_label_tl: prediction.pick_label_tl,
        pick_label_en: prediction.pick_label_en,
        analysis_tl: prediction.analysis_tl,
        analysis_en: prediction.analysis_en,
        odds: oddsValue,
        odds_source: matchOdds.source,
        confidence: prediction.confidence,
        stake: prediction.stake,
        published_site: true,
        api_fixture_id: game.id,
        spread_line: matchOdds.spread.home_line,
        total_line: matchOdds.totals.line,
      };

      const { error: insertError } = await supabase
        .from('predictions')
        .upsert(predictionInsert, { onConflict: 'slug' });

      if (insertError) {
        console.error(`Error inserting NBA prediction for ${slug}:`, insertError.message);
      } else {
        created++;
        console.log(`Created NBA prediction: ${slug} (${prediction.pick})`);

        // Generate prediction card (non-blocking: failure does not disrupt pipeline)
        try {
          const cardData: PredictionCardData = {
            slug,
            homeTeam: game.teams.home.name,
            awayTeam: game.teams.away.name,
            league: NBA_LEAGUE.name,
            matchDate: game.date,
            pick: prediction.pick_label_en,
            odds: oddsValue,
            confidence: prediction.confidence,
            sport: 'basketball',
          };
          await generatePredictionCard(env, cardData);
        } catch (cardErr) {
          console.error(`Card generation failed for ${slug}:`, cardErr);
        }
      }
    } catch (err) {
      console.error(`Error processing NBA game ${game.id}:`, err);
    }
  }

  console.log(`NBA prediction generation complete: ${created}/${selected.length} created`);
}

// Cloudflare Worker scheduled handler.
// Dispatches based on cron pattern:
// - "0 6 * * *": Daily fetch + generate predictions (06:00 UTC = 14:00 PHT)
// - "*/30 * * * *": Resolve finished matches every 30 minutes
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    try {
      if (controller.cron === '0 6 * * *') {
        // Run prediction pipelines sequentially so predictions exist in DB before blog generation
        console.log('Running daily prediction generation...');
        await fetchAndGeneratePredictions(env);

        // NBA pipeline -- wrapped in try/catch so football predictions are preserved even if NBA fails
        try {
          console.log('Running NBA prediction generation...');
          await fetchAndGenerateNbaPredictions(env);
        } catch (nbaError) {
          console.error('NBA prediction generation failed:', nbaError);
        }

        // Blog generation runs after all predictions exist (per research pitfall #4)
        try {
          console.log('Running blog article generation...');
          await generateBlogArticles(env);
        } catch (blogError) {
          console.error('Blog article generation failed:', blogError);
        }
      } else if (controller.cron === '0 * * * *') {
        // Hourly cron: drip-publish predictions 2-3h before match time
        try {
          console.log('Running hourly Telegram drip publishing...');
          await publishDuePredictions(env);
        } catch (telegramErr) {
          console.error('Telegram drip publishing failed:', telegramErr);
        }

        // End-of-day recap at 23:00 PHT (15:00 UTC)
        try {
          const phtHour = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',
            hour: 'numeric',
            hour12: false,
          }).format(new Date());

          if (parseInt(phtHour, 10) === 23) {
            console.log('Running daily recap...');
            await sendDailyRecap(env);
          }
        } catch (recapErr) {
          console.error('Daily recap failed:', recapErr);
        }
      } else if (controller.cron === '*/30 * * * *') {
        console.log('Running match resolution...');
        ctx.waitUntil(resolveFinishedMatches(env));

        // NBA resolution -- wrapped in try/catch so football resolution continues
        try {
          console.log('Running NBA match resolution...');
          ctx.waitUntil(resolveNbaMatches(env));
        } catch (nbaError) {
          console.error('NBA match resolution failed:', nbaError);
        }
      }
    } catch (error) {
      console.error('Scheduled handler error:', error);
    }
  },
};
