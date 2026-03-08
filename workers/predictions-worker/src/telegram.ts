/**
 * Telegram Bot API integration for publishing predictions, results,
 * and daily recaps to a Telegram channel.
 *
 * All functions are non-blocking: failures are logged but never thrown,
 * so Telegram issues never disrupt prediction/resolution pipelines.
 */
import type { Env } from './types';
import { createSupabaseClient } from './supabase';

const TELEGRAM_API = 'https://api.telegram.org/bot';

/**
 * Send a photo to a Telegram chat via the Bot API.
 * Returns the message_id on success, null on failure.
 */
async function sendPhoto(
  token: string,
  channelId: string,
  photoUrl: string,
  caption: string
): Promise<number | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        photo: photoUrl,
        caption,
        parse_mode: 'HTML',
      }),
    });

    const data = (await res.json()) as { ok: boolean; result?: { message_id: number } };
    if (data.ok && data.result) {
      return data.result.message_id;
    }

    console.error('Telegram sendPhoto failed:', JSON.stringify(data));
    return null;
  } catch (err) {
    console.error('Telegram sendPhoto error:', err);
    return null;
  }
}

/**
 * Send a text message to a Telegram chat via the Bot API.
 * Returns the message_id on success, null on failure.
 */
async function sendMessage(
  token: string,
  channelId: string,
  text: string
): Promise<number | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = (await res.json()) as { ok: boolean; result?: { message_id: number } };
    if (data.ok && data.result) {
      return data.result.message_id;
    }

    console.error('Telegram sendMessage failed:', JSON.stringify(data));
    return null;
  } catch (err) {
    console.error('Telegram sendMessage error:', err);
    return null;
  }
}

/**
 * Build bilingual caption for a prediction photo post.
 */
function buildPredictionCaption(pred: {
  homeTeam: string;
  awayTeam: string;
  pickLabelEn: string;
  pickLabelTl: string;
  odds: number;
  slug: string;
}): string {
  return [
    `${pred.homeTeam} vs ${pred.awayTeam}`,
    `Pick: ${pred.pickLabelEn} @ ${pred.odds.toFixed(2)}`,
    `Hula: ${pred.pickLabelTl} @ ${pred.odds.toFixed(2)}`,
    '',
    `https://mytaya.com/en/predictions/${pred.slug}/`,
  ].join('\n');
}

/**
 * Build bilingual caption for a result photo post.
 */
function buildResultCaption(pred: {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  result: string;
  slug: string;
}): string {
  const resultEn = pred.result.toUpperCase();
  const resultTl =
    pred.result === 'win'
      ? 'PANALO'
      : pred.result === 'loss'
        ? 'TALO'
        : 'PUSH';

  return [
    `${pred.homeTeam} ${pred.homeScore} - ${pred.awayScore} ${pred.awayTeam}`,
    `Result: ${resultEn}`,
    `Resulta: ${resultTl}`,
    '',
    `https://mytaya.com/en/predictions/${pred.slug}/`,
  ].join('\n');
}

/**
 * Send a prediction card photo to Telegram and update DB with telegram metadata.
 * Requires pred to have card_image_url.
 */
export async function sendPredictionToTelegram(
  env: Env,
  pred: {
    id: string;
    slug: string;
    card_image_url: string;
    homeTeam: string;
    awayTeam: string;
    pick_label_en: string;
    pick_label_tl: string;
    odds: number;
  }
): Promise<void> {
  const caption = buildPredictionCaption({
    homeTeam: pred.homeTeam,
    awayTeam: pred.awayTeam,
    pickLabelEn: pred.pick_label_en,
    pickLabelTl: pred.pick_label_tl,
    odds: pred.odds,
    slug: pred.slug,
  });

  const messageId = await sendPhoto(
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHANNEL_ID,
    pred.card_image_url,
    caption
  );

  if (messageId !== null) {
    const supabase = createSupabaseClient(env);
    const { error } = await supabase
      .from('predictions')
      .update({
        published_telegram: true,
        telegram_message_id: messageId,
      })
      .eq('id', pred.id);

    if (error) {
      console.error(`Error updating telegram status for ${pred.slug}:`, error.message);
    } else {
      console.log(`Published prediction to Telegram: ${pred.slug} (msg ${messageId})`);
    }
  }
}

/**
 * Send a result card photo to Telegram after match settlement.
 */
export async function sendResultToTelegram(
  env: Env,
  pred: {
    slug: string;
    card_image_url: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    result: string;
  }
): Promise<void> {
  const caption = buildResultCaption({
    homeTeam: pred.homeTeam,
    awayTeam: pred.awayTeam,
    homeScore: pred.homeScore,
    awayScore: pred.awayScore,
    result: pred.result,
    slug: pred.slug,
  });

  const messageId = await sendPhoto(
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHANNEL_ID,
    pred.card_image_url,
    caption
  );

  if (messageId !== null) {
    console.log(`Published result to Telegram: ${pred.slug} (msg ${messageId})`);
  }
}

/**
 * Send a daily recap message summarizing today's settled predictions.
 * Includes record (e.g., 3W-1L), streak, and simple ROI.
 * Only sends if there are results for today.
 */
export async function sendDailyRecap(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);

  // Get today's date in PHT
  const todayPHT = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  // Query today's settled predictions
  const { data: settled, error } = await supabase
    .from('predictions')
    .select('result, odds, stake')
    .eq('status', 'settled')
    .gte('settled_at', `${todayPHT}T00:00:00`)
    .lt('settled_at', `${todayPHT}T23:59:59`);

  if (error) {
    console.error('Error fetching settled predictions for recap:', error.message);
    return;
  }

  if (!settled || settled.length === 0) {
    console.log('No settled predictions today, skipping recap');
    return;
  }

  // Compute record
  let wins = 0;
  let losses = 0;
  let pushes = 0;

  for (const p of settled) {
    if (p.result === 'win') wins++;
    else if (p.result === 'loss') losses++;
    else pushes++;
  }

  const record = `${wins}W-${losses}L${pushes > 0 ? `-${pushes}P` : ''}`;

  // Compute streak from recent settled predictions (last 20)
  const { data: recent } = await supabase
    .from('predictions')
    .select('result')
    .eq('status', 'settled')
    .not('result', 'eq', 'push')
    .not('result', 'eq', 'void')
    .order('settled_at', { ascending: false })
    .limit(20);

  let streak = '';
  if (recent && recent.length > 0) {
    const firstResult = recent[0].result;
    let count = 0;
    for (const r of recent) {
      if (r.result === firstResult) count++;
      else break;
    }
    const streakLabel = firstResult === 'win' ? 'W' : 'L';
    streak = `${count}${streakLabel}`;
  }

  // Compute simple ROI: sum(profit) / sum(stakes)
  // profit = (odds - 1) * stake for wins, -stake for losses, 0 for pushes
  let totalProfit = 0;
  let totalStaked = 0;
  for (const p of settled) {
    const stakeAmt = p.stake ?? 1;
    totalStaked += stakeAmt;
    if (p.result === 'win') {
      totalProfit += (p.odds - 1) * stakeAmt;
    } else if (p.result === 'loss') {
      totalProfit -= stakeAmt;
    }
    // push = 0 profit
  }

  const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : '0.0';

  // Build bilingual recap message
  const message = [
    `<b>Daily Recap / Buod ng Araw</b>`,
    `<b>${todayPHT}</b>`,
    '',
    `Record: <b>${record}</b>`,
    streak ? `Streak: <b>${streak}</b>` : '',
    `ROI: <b>${roi}%</b>`,
    '',
    `https://mytaya.com/en/predictions/`,
  ]
    .filter(Boolean)
    .join('\n');

  await sendMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHANNEL_ID, message);
  console.log(`Sent daily recap: ${record}, streak ${streak}, ROI ${roi}%`);
}

/**
 * Query and publish predictions that are due for Telegram (2-3 hours before match).
 * Called by the hourly cron trigger.
 */
export async function publishDuePredictions(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);

  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

  // Find predictions due for Telegram publishing
  const { data: duePredictions, error } = await supabase
    .from('predictions')
    .select(`
      id, slug, card_image_url, pick_label_en, pick_label_tl, odds,
      home_team:teams!predictions_home_team_id_fkey(name),
      away_team:teams!predictions_away_team_id_fkey(name)
    `)
    .eq('published_telegram', false)
    .eq('published_site', true)
    .not('card_image_url', 'is', null)
    .gte('match_date', twoHoursFromNow)
    .lte('match_date', threeHoursFromNow);

  if (error) {
    console.error('Error fetching due predictions:', error.message);
    return;
  }

  if (!duePredictions || duePredictions.length === 0) {
    console.log('No predictions due for Telegram publishing');
    return;
  }

  console.log(`Publishing ${duePredictions.length} predictions to Telegram`);

  for (const pred of duePredictions) {
    try {
      await sendPredictionToTelegram(env, {
        id: pred.id,
        slug: pred.slug,
        card_image_url: pred.card_image_url!,
        homeTeam: (pred.home_team as any)?.name ?? 'Home',
        awayTeam: (pred.away_team as any)?.name ?? 'Away',
        pick_label_en: pred.pick_label_en,
        pick_label_tl: pred.pick_label_tl,
        odds: pred.odds,
      });
    } catch (err) {
      console.error(`Error publishing prediction ${pred.slug} to Telegram:`, err);
    }

    // 1s delay between sends to avoid rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }
}
