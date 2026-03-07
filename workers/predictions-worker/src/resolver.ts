import type { Env } from './types';
import { createSupabaseClient } from './supabase';
import { fetchFixtureResult } from './api-football';
import { fetchNbaGameResult } from './api-basketball';

/** Delay helper for rate limiting */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Determine the result of a prediction based on pick type and final score.
 * Returns 'win', 'loss', or 'void'.
 */
export function determineResult(
  pick: string,
  homeGoals: number,
  awayGoals: number
): 'win' | 'loss' | 'void' {
  const totalGoals = homeGoals + awayGoals;

  switch (pick) {
    case 'home':
      return homeGoals > awayGoals ? 'win' : 'loss';
    case 'away':
      return awayGoals > homeGoals ? 'win' : 'loss';
    case 'draw':
      return homeGoals === awayGoals ? 'win' : 'loss';
    case 'over':
      return totalGoals > 2.5 ? 'win' : 'loss';
    case 'under':
      return totalGoals < 2.5 ? 'win' : 'loss';
    case 'btts_yes':
      return homeGoals > 0 && awayGoals > 0 ? 'win' : 'loss';
    case 'btts_no':
      return homeGoals === 0 || awayGoals === 0 ? 'win' : 'loss';
    default:
      return 'void';
  }
}

/**
 * Resolve finished matches by checking API-Football for final scores.
 * Queries pending football predictions with api_fixture_id, checks
 * if the fixture status is 'FT' (Full Time), and updates accordingly.
 */
export async function resolveFinishedMatches(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);

  // Get pending football predictions that have an API fixture ID
  const { data: pendingPredictions, error } = await supabase
    .from('predictions')
    .select('id, api_fixture_id, pick')
    .eq('status', 'pending')
    .eq('sport', 'football')
    .not('api_fixture_id', 'is', null);

  if (error) {
    console.error('Error fetching pending predictions:', error.message);
    return;
  }

  if (!pendingPredictions?.length) {
    console.log('No pending predictions to resolve');
    return;
  }

  console.log(`Resolving ${pendingPredictions.length} pending predictions`);

  let resolved = 0;

  for (const pred of pendingPredictions) {
    try {
      const fixture = await fetchFixtureResult(
        env.API_FOOTBALL_KEY,
        pred.api_fixture_id!
      );

      if (!fixture || fixture.fixture.status.short !== 'FT') {
        continue; // Match not finished yet
      }

      const homeGoals = fixture.goals.home;
      const awayGoals = fixture.goals.away;

      if (homeGoals === null || awayGoals === null) {
        continue; // No score data available
      }

      const result = determineResult(pred.pick, homeGoals, awayGoals);

      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          result,
          status: 'settled',
          settled_at: new Date().toISOString(),
        })
        .eq('id', pred.id);

      if (updateError) {
        console.error(
          `Error updating prediction ${pred.id}:`,
          updateError.message
        );
      } else {
        resolved++;
        console.log(
          `Resolved prediction ${pred.id}: ${result} (${homeGoals}-${awayGoals})`
        );
      }
    } catch (err) {
      console.error(`Error resolving fixture ${pred.api_fixture_id}:`, err);
    }

    // Rate limit: 1.1s between API calls
    await delay(1100);
  }

  console.log(
    `Resolution complete: ${resolved}/${pendingPredictions.length} resolved`
  );
}

/**
 * Determine the result of an NBA prediction based on pick type and final score.
 * NBA has no draws. Half-point lines (e.g., -5.5) prevent pushes on spread/totals.
 * Returns 'win', 'loss', or 'push'.
 */
export function determineNbaResult(
  pick: string,
  homeScore: number,
  awayScore: number,
  spreadLine?: number,
  totalLine?: number
): 'win' | 'loss' | 'push' {
  const totalPoints = homeScore + awayScore;

  switch (pick) {
    case 'moneyline_home':
      return homeScore > awayScore ? 'win' : 'loss';
    case 'moneyline_away':
      return awayScore > homeScore ? 'win' : 'loss';
    case 'spread_home': {
      if (spreadLine === undefined) return 'loss';
      // spreadLine is from home perspective (e.g., -5.5 means home favored by 5.5)
      const adjustedHome = homeScore + spreadLine;
      if (adjustedHome > awayScore) return 'win';
      if (adjustedHome === awayScore) return 'push';
      return 'loss';
    }
    case 'spread_away': {
      if (spreadLine === undefined) return 'loss';
      // Away spread is inverse of home spread
      const adjustedAway = awayScore - spreadLine;
      if (adjustedAway > homeScore) return 'win';
      if (adjustedAway === homeScore) return 'push';
      return 'loss';
    }
    case 'over': {
      if (totalLine === undefined) return 'loss';
      if (totalPoints > totalLine) return 'win';
      if (totalPoints === totalLine) return 'push';
      return 'loss';
    }
    case 'under': {
      if (totalLine === undefined) return 'loss';
      if (totalPoints < totalLine) return 'win';
      if (totalPoints === totalLine) return 'push';
      return 'loss';
    }
    default:
      return 'loss';
  }
}

/**
 * Resolve finished NBA matches by checking API-Basketball for final scores.
 * Queries pending basketball predictions with api_fixture_id, checks
 * if the game status is 'FT' (Final), and updates accordingly.
 */
export async function resolveNbaMatches(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);

  // Get pending basketball predictions that have an API fixture ID
  const { data: pendingPredictions, error } = await supabase
    .from('predictions')
    .select('id, api_fixture_id, pick, spread_line, total_line')
    .eq('status', 'pending')
    .eq('sport', 'basketball')
    .not('api_fixture_id', 'is', null);

  if (error) {
    console.error('Error fetching pending NBA predictions:', error.message);
    return;
  }

  if (!pendingPredictions?.length) {
    console.log('No pending NBA predictions to resolve');
    return;
  }

  console.log(`Resolving ${pendingPredictions.length} pending NBA predictions`);

  let resolved = 0;

  for (const pred of pendingPredictions) {
    try {
      const game = await fetchNbaGameResult(
        env.API_FOOTBALL_KEY,
        pred.api_fixture_id!
      );

      if (!game || game.status.short !== 'FT') {
        continue; // Game not finished yet
      }

      const homeScore = game.scores.home.total;
      const awayScore = game.scores.away.total;

      if (homeScore === null || awayScore === null) {
        continue; // No score data available
      }

      const result = determineNbaResult(
        pred.pick,
        homeScore,
        awayScore,
        pred.spread_line,
        pred.total_line
      );

      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          result,
          status: 'settled',
          settled_at: new Date().toISOString(),
        })
        .eq('id', pred.id);

      if (updateError) {
        console.error(
          `Error updating NBA prediction ${pred.id}:`,
          updateError.message
        );
      } else {
        resolved++;
        console.log(
          `Resolved NBA prediction ${pred.id}: ${result} (${homeScore}-${awayScore})`
        );
      }
    } catch (err) {
      console.error(`Error resolving NBA game ${pred.api_fixture_id}:`, err);
    }

    // Rate limit: 1.1s between API calls
    await delay(1100);
  }

  console.log(
    `NBA resolution complete: ${resolved}/${pendingPredictions.length} resolved`
  );
}
