/**
 * Card generation module: creates branded PNG prediction/result cards via workers-og,
 * uploads them to Cloudflare R2, and updates the prediction's card_image_url.
 */
import { ImageResponse } from 'workers-og';
import { createSupabaseClient } from './supabase';
import {
  buildPredictionCardHtml,
  buildResultCardHtml,
  buildBoxingCardHtml,
  type PredictionCardInput,
  type ResultCardInput,
  type BoxingCardInput,
} from './card-templates';
import type { Env } from './types';

/** Base public URL for R2 card images (configure R2 public access) */
const R2_PUBLIC_BASE = 'https://cards.mytaya.com';

/** Data needed to generate a prediction card */
export interface PredictionCardData {
  slug: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  pick: string;
  odds: number;
  confidence: 'high' | 'medium' | 'low';
  sport: 'football' | 'basketball' | 'boxing';
  fighter1Record?: string;
  fighter2Record?: string;
  weightClass?: string;
  scheduledRounds?: number;
}

/** Data needed to generate a result card */
export interface ResultCardData {
  slug: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  pick: string;
  result: 'win' | 'loss' | 'push';
  sport: 'football' | 'basketball' | 'boxing';
}

/**
 * Load a TTF font file from the R2 CARDS_BUCKET at fonts/{fontFile}.
 * Fonts must be uploaded to R2 manually (e.g., BebasNeue-Regular.ttf, Inter-Regular.ttf).
 */
async function loadFont(env: Env, fontFile: string): Promise<ArrayBuffer> {
  const obj = await env.CARDS_BUCKET.get(`fonts/${fontFile}`);
  if (!obj) {
    throw new Error(`Font not found in R2: fonts/${fontFile}`);
  }
  return obj.arrayBuffer();
}

/**
 * Generate a prediction card PNG and upload to R2.
 * Updates the prediction's card_image_url in Supabase.
 * Returns the public URL of the card image.
 */
export async function generatePredictionCard(
  env: Env,
  data: PredictionCardData
): Promise<string> {
  let html: string;

  if (data.sport === 'boxing') {
    const boxingInput: BoxingCardInput = {
      fighter1: data.homeTeam,
      fighter2: data.awayTeam,
      fighter1Record: data.fighter1Record ?? '',
      fighter2Record: data.fighter2Record ?? '',
      weightClass: data.weightClass ?? 'Boxing',
      scheduledRounds: data.scheduledRounds ?? 12,
      league: data.league,
      matchDate: data.matchDate,
      pick: data.pick,
      odds: data.odds,
      confidence: data.confidence,
    };
    html = buildBoxingCardHtml(boxingInput);
  } else {
    const cardInput: PredictionCardInput = {
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      league: data.league,
      matchDate: data.matchDate,
      pick: data.pick,
      odds: data.odds,
      confidence: data.confidence,
      sport: data.sport,
    };
    html = buildPredictionCardHtml(cardInput);
  }

  // Load fonts from R2
  const [bebasFont, interFont] = await Promise.all([
    loadFont(env, 'BebasNeue-Regular.ttf'),
    loadFont(env, 'Inter-Regular.ttf'),
  ]);

  // Generate PNG via workers-og
  const response = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Bebas Neue', data: bebasFont, style: 'normal' },
      { name: 'Inter', data: interFont, style: 'normal' },
    ],
  });

  const pngBuffer = await response.arrayBuffer();
  const r2Key = `cards/${data.slug}.png`;

  // Upload to R2
  await env.CARDS_BUCKET.put(r2Key, pngBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });

  const publicUrl = `${R2_PUBLIC_BASE}/${r2Key}`;

  // Update prediction with card URL
  const supabase = createSupabaseClient(env);
  const { error } = await supabase
    .from('predictions')
    .update({ card_image_url: publicUrl })
    .eq('slug', data.slug);

  if (error) {
    console.error(`Error updating card_image_url for ${data.slug}:`, error.message);
  }

  console.log(`Generated prediction card: ${publicUrl}`);
  return publicUrl;
}

/**
 * Generate a result card PNG and upload to R2.
 * Updates the prediction's card_image_url in Supabase (overwrites prediction card URL).
 * Returns the public URL of the result card image.
 */
export async function generateResultCard(
  env: Env,
  data: ResultCardData
): Promise<string> {
  const cardInput: ResultCardInput = {
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    homeScore: data.homeScore,
    awayScore: data.awayScore,
    league: data.league,
    pick: data.pick,
    result: data.result,
    sport: data.sport,
  };

  const html = buildResultCardHtml(cardInput);

  // Load fonts from R2
  const [bebasFont, interFont] = await Promise.all([
    loadFont(env, 'BebasNeue-Regular.ttf'),
    loadFont(env, 'Inter-Regular.ttf'),
  ]);

  // Generate PNG via workers-og
  const response = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Bebas Neue', data: bebasFont, style: 'normal' },
      { name: 'Inter', data: interFont, style: 'normal' },
    ],
  });

  const pngBuffer = await response.arrayBuffer();
  const r2Key = `cards/${data.slug}-result.png`;

  // Upload to R2
  await env.CARDS_BUCKET.put(r2Key, pngBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });

  const publicUrl = `${R2_PUBLIC_BASE}/${r2Key}`;

  // Update prediction card_image_url to result card (final state)
  const supabase = createSupabaseClient(env);
  const { error } = await supabase
    .from('predictions')
    .update({ card_image_url: publicUrl })
    .eq('slug', data.slug);

  if (error) {
    console.error(`Error updating result card_image_url for ${data.slug}:`, error.message);
  }

  console.log(`Generated result card: ${publicUrl}`);
  return publicUrl;
}

/**
 * Generate cards for published predictions that are missing card_image_url.
 * Called by the resolver cron to automatically pick up manual predictions.
 * Processes up to 10 predictions per run to stay within Worker limits.
 */
export async function generateMissingCards(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { data: predictions, error } = await supabase
    .from('predictions')
    .select(`
      slug, sport, match_date, pick_label_en, odds, confidence,
      fighter_1_record, fighter_2_record, weight_class, scheduled_rounds,
      home_team:teams!predictions_home_team_id_fkey(name),
      away_team:teams!predictions_away_team_id_fkey(name),
      league:leagues!predictions_league_id_fkey(name)
    `)
    .eq('published_site', true)
    .is('card_image_url', null)
    .limit(10);

  if (error) {
    console.error('Error fetching predictions without cards:', error.message);
    return;
  }

  if (!predictions?.length) {
    console.log('No predictions missing cards');
    return;
  }

  console.log(`Generating cards for ${predictions.length} predictions`);

  for (const pred of predictions) {
    try {
      const homeTeam = (pred.home_team as any)?.name ?? 'Fighter 1';
      const awayTeam = (pred.away_team as any)?.name ?? 'Fighter 2';
      const leagueName = (pred.league as any)?.name ?? 'Boxing';

      const cardData: PredictionCardData = {
        slug: pred.slug,
        homeTeam,
        awayTeam,
        league: leagueName,
        matchDate: pred.match_date,
        pick: pred.pick_label_en,
        odds: pred.odds,
        confidence: pred.confidence,
        sport: pred.sport as PredictionCardData['sport'],
        fighter1Record: pred.fighter_1_record ?? undefined,
        fighter2Record: pred.fighter_2_record ?? undefined,
        weightClass: pred.weight_class ?? undefined,
        scheduledRounds: pred.scheduled_rounds ?? undefined,
      };

      await generatePredictionCard(env, cardData);
      console.log(`Generated missing card for ${pred.slug}`);
    } catch (cardErr) {
      console.error(`Failed to generate card for ${pred.slug}:`, cardErr);
    }
  }
}
