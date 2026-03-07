import type { Env } from './types';
import { createSupabaseClient } from './supabase';
import { fetchFixtureResult } from './api-football';

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
