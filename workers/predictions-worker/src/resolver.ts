import type { Env } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase';
import { fetchFixtureResult } from './api-football';
import { fetchNbaGameResult } from './api-basketball';
import { generateResultCard } from './card-gen';
import type { ResultCardData } from './card-gen';
import { sendResultToTelegram } from './telegram';

/** Delay helper for rate limiting */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Append a bilingual result section to the linked blog post after a prediction is settled.
 */
async function appendResultToPost(
  supabase: SupabaseClient,
  predictionId: string,
  result: string,
  homeScore: number,
  awayScore: number
): Promise<void> {
  const { data: linkedPost } = await supabase
    .from('posts')
    .select('id, content_en, content_tl')
    .eq('prediction_id', predictionId)
    .single();

  if (!linkedPost) return;

  const resultLabelTl =
    result === 'win'
      ? 'PANALO'
      : result === 'loss'
        ? 'TALO'
        : 'PUSH';

  const resultEn = `\n\n## Result\n\n**Final Score:** ${homeScore}-${awayScore}\n**Outcome:** ${result.toUpperCase()}\n\n`;
  const resultTl = `\n\n## Resulta\n\n**Pinal na Iskor:** ${homeScore}-${awayScore}\n**Kinalabasan:** ${resultLabelTl}\n\n`;

  const { error } = await supabase
    .from('posts')
    .update({
      content_en: linkedPost.content_en + resultEn,
      content_tl: linkedPost.content_tl + resultTl,
    })
    .eq('id', linkedPost.id);

  if (error) {
    console.error(
      `Error appending result to blog post ${linkedPost.id}:`,
      error.message
    );
  } else {
    console.log(`Appended result to blog post ${linkedPost.id}`);
  }
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

  // Get pending football predictions that have an API fixture ID (join teams for card gen)
  const { data: pendingPredictions, error } = await supabase
    .from('predictions')
    .select('id, api_fixture_id, pick, slug, home_team:teams!predictions_home_team_id_fkey(name), away_team:teams!predictions_away_team_id_fkey(name)')
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

        // Append result to linked blog post
        await appendResultToPost(supabase, pred.id, result, homeGoals, awayGoals);

        // Generate result card (non-blocking: failure does not disrupt pipeline)
        try {
          const homeTeamName = (pred.home_team as any)?.name ?? 'Home';
          const awayTeamName = (pred.away_team as any)?.name ?? 'Away';
          const resultCardData: ResultCardData = {
            slug: pred.slug,
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeScore: homeGoals,
            awayScore: awayGoals,
            league: 'Football',
            pick: pred.pick,
            result: result as 'win' | 'loss' | 'push',
            sport: 'football',
          };
          await generateResultCard(env, resultCardData);
        } catch (cardErr) {
          console.error(`Result card generation failed for ${pred.slug}:`, cardErr);
        }

        // Send result to Telegram (non-blocking)
        try {
          const homeTeamName = (pred.home_team as any)?.name ?? 'Home';
          const awayTeamName = (pred.away_team as any)?.name ?? 'Away';
          // Fetch updated card_image_url after result card generation
          const { data: updatedPred } = await supabase
            .from('predictions')
            .select('card_image_url')
            .eq('id', pred.id)
            .single();

          if (updatedPred?.card_image_url) {
            await sendResultToTelegram(env, {
              slug: pred.slug,
              card_image_url: updatedPred.card_image_url,
              homeTeam: homeTeamName,
              awayTeam: awayTeamName,
              homeScore: homeGoals,
              awayScore: awayGoals,
              result,
            });
          }
        } catch (telegramErr) {
          console.error(`Telegram result posting failed for ${pred.slug}:`, telegramErr);
        }
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

  // Get pending basketball predictions that have an API fixture ID (join teams for card gen)
  const { data: pendingPredictions, error } = await supabase
    .from('predictions')
    .select('id, api_fixture_id, pick, spread_line, total_line, slug, home_team:teams!predictions_home_team_id_fkey(name), away_team:teams!predictions_away_team_id_fkey(name)')
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

        // Append result to linked blog post
        await appendResultToPost(supabase, pred.id, result, homeScore, awayScore);

        // Generate result card (non-blocking: failure does not disrupt pipeline)
        try {
          const homeTeamName = (pred.home_team as any)?.name ?? 'Home';
          const awayTeamName = (pred.away_team as any)?.name ?? 'Away';
          const resultCardData: ResultCardData = {
            slug: pred.slug,
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeScore: homeScore,
            awayScore: awayScore,
            league: 'NBA',
            pick: pred.pick,
            result: result as 'win' | 'loss' | 'push',
            sport: 'basketball',
          };
          await generateResultCard(env, resultCardData);
        } catch (cardErr) {
          console.error(`Result card generation failed for ${pred.slug}:`, cardErr);
        }

        // Send result to Telegram (non-blocking)
        try {
          const homeTeamName = (pred.home_team as any)?.name ?? 'Home';
          const awayTeamName = (pred.away_team as any)?.name ?? 'Away';
          // Fetch updated card_image_url after result card generation
          const { data: updatedPred } = await supabase
            .from('predictions')
            .select('card_image_url')
            .eq('id', pred.id)
            .single();

          if (updatedPred?.card_image_url) {
            await sendResultToTelegram(env, {
              slug: pred.slug,
              card_image_url: updatedPred.card_image_url,
              homeTeam: homeTeamName,
              awayTeam: awayTeamName,
              homeScore: homeScore,
              awayScore: awayScore,
              result,
            });
          }
        } catch (telegramErr) {
          console.error(`Telegram result posting failed for ${pred.slug}:`, telegramErr);
        }
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
