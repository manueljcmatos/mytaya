/**
 * Card generation module: creates branded PNG prediction/result cards via workers-og,
 * uploads them to Cloudflare R2, and updates the prediction's card_image_url.
 */
import { ImageResponse } from 'workers-og';
import { createSupabaseClient } from './supabase';
import {
  buildPredictionCardHtml,
  buildResultCardHtml,
  type PredictionCardInput,
  type ResultCardInput,
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
  sport: 'football' | 'basketball';
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
  sport: 'football' | 'basketball';
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

  const html = buildPredictionCardHtml(cardInput);

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
