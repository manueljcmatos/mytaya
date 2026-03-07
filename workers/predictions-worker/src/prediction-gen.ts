import type { MatchContext, PickType, NbaMatchContext, NbaPickType } from './types';

/** Valid pick types for validation */
const VALID_PICKS: PickType[] = [
  'home',
  'away',
  'draw',
  'over',
  'under',
  'btts_yes',
  'btts_no',
];

/** Valid NBA pick types for validation */
const VALID_NBA_PICKS: NbaPickType[] = [
  'moneyline_home',
  'moneyline_away',
  'spread_home',
  'spread_away',
  'over',
  'under',
];

interface PredictionResult {
  pick: PickType;
  pick_label_en: string;
  pick_label_tl: string;
  analysis_en: string;
  analysis_tl: string;
  confidence: 'high' | 'medium' | 'low';
  stake: number;
}

/**
 * Generate a bilingual AI prediction for a given match using Workers AI.
 * Uses @cf/meta/llama-3.1-8b-instruct model.
 */
export async function generatePrediction(
  ai: Ai,
  match: MatchContext
): Promise<PredictionResult> {
  const prompt = `You are a sports prediction analyst for MyTaya, a Filipino betting tips website.

Match: ${match.homeTeam} vs ${match.awayTeam}
League: ${match.league}
Date: ${match.matchDate}
Odds: Home ${match.odds.home}, Draw ${match.odds.draw}, Away ${match.odds.away}

Analyze this match and provide your prediction. You MUST respond with valid JSON only (no markdown, no extra text).

The JSON must have these exact keys:
- "pick": one of "home", "away", "draw", "over", "under", "btts_yes", "btts_no"
- "pick_label_en": short English label (e.g. "Manchester City to win")
- "pick_label_tl": short Filipino/Tagalog label (e.g. "Manchester City mananalo")
- "analysis_en": 2-3 paragraph English analysis covering form, key stats, and reasoning
- "analysis_tl": 2-3 paragraph Filipino/Tagalog analysis (same content, naturally translated)
- "confidence": one of "high", "medium", "low"
- "stake": integer 1-10 representing recommended stake level

Prediction types:
- "home"/"away"/"draw": Match Winner (1X2)
- "over"/"under": Over/Under 2.5 goals
- "btts_yes"/"btts_no": Both Teams to Score

Respond with JSON only:`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (ai as any).run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
      }
    );

    const text: string =
      typeof response === 'string'
        ? response
        : response?.response ?? '';

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as PredictionResult;

    // Validate pick type
    if (!VALID_PICKS.includes(parsed.pick)) {
      parsed.pick = 'home'; // Fallback to safest pick
    }

    // Validate confidence
    if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
      parsed.confidence = 'medium';
    }

    // Validate stake
    if (
      typeof parsed.stake !== 'number' ||
      parsed.stake < 1 ||
      parsed.stake > 10
    ) {
      parsed.stake = 5;
    }

    return parsed;
  } catch (error) {
    console.error('AI prediction generation failed:', error);

    // Fallback: generate a basic prediction from odds
    const favored =
      match.odds.home < match.odds.away
        ? { pick: 'home' as PickType, team: match.homeTeam }
        : { pick: 'away' as PickType, team: match.awayTeam };

    return {
      pick: favored.pick,
      pick_label_en: `${favored.team} to win`,
      pick_label_tl: `${favored.team} mananalo`,
      analysis_en: `Based on the odds, ${favored.team} is favored in this ${match.league} match against ${favored.pick === 'home' ? match.awayTeam : match.homeTeam}. The odds suggest a clear advantage for the ${favored.pick} side.`,
      analysis_tl: `Batay sa odds, paborito ang ${favored.team} sa ${match.league} laban kay ${favored.pick === 'home' ? match.awayTeam : match.homeTeam}. Nagpapahiwatig ang odds ng malinaw na kalamangan para sa ${favored.pick === 'home' ? 'home' : 'away'} team.`,
      confidence: 'medium',
      stake: 5,
    };
  }
}

/** NBA prediction result shape */
export interface NbaPredictionResult {
  pick: NbaPickType;
  pick_label_en: string;
  pick_label_tl: string;
  analysis_en: string;
  analysis_tl: string;
  confidence: 'high' | 'medium' | 'low';
  stake: number;
}

/**
 * Generate a bilingual AI prediction for an NBA match using Workers AI.
 * Supports moneyline, spread, and over/under pick types.
 */
export async function generateNbaPrediction(
  ai: Ai,
  match: NbaMatchContext
): Promise<NbaPredictionResult> {
  const prompt = `You are a sports prediction analyst for MyTaya, a Filipino betting tips website specializing in NBA basketball.

Match: ${match.homeTeam} vs ${match.awayTeam}
League: ${match.league}
Date: ${match.matchDate}
Spread: ${match.homeTeam} ${match.spread > 0 ? '+' : ''}${match.spread}
Total Line: ${match.totalLine}
Moneyline Odds: Home ${match.odds.moneyline_home}, Away ${match.odds.moneyline_away}
Spread Odds: Home ${match.odds.spread_home}, Away ${match.odds.spread_away}
Totals: Over ${match.odds.over}, Under ${match.odds.under}

Analyze this NBA game and provide your prediction. You MUST respond with valid JSON only (no markdown, no extra text).

The JSON must have these exact keys:
- "pick": one of "moneyline_home", "moneyline_away", "spread_home", "spread_away", "over", "under"
- "pick_label_en": short English label (e.g. "Lakers -5.5" or "Over 215.5" or "Celtics to win")
- "pick_label_tl": short Filipino/Tagalog label (e.g. "Lakers -5.5" or "Over 215.5" or "Celtics mananalo")
- "analysis_en": 2-3 paragraph English analysis covering form, matchup, and reasoning
- "analysis_tl": 2-3 paragraph Filipino/Tagalog analysis (same content, naturally translated)
- "confidence": one of "high", "medium", "low"
- "stake": integer 1-10 representing recommended stake level

Pick types:
- "moneyline_home"/"moneyline_away": Straight up winner
- "spread_home"/"spread_away": Point spread (handicap)
- "over"/"under": Over/Under total points

Respond with JSON only:`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (ai as any).run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
      }
    );

    const text: string =
      typeof response === 'string'
        ? response
        : response?.response ?? '';

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as NbaPredictionResult;

    // Validate pick type
    if (!VALID_NBA_PICKS.includes(parsed.pick)) {
      parsed.pick = 'moneyline_home'; // Fallback to safest NBA pick
    }

    // Validate confidence
    if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
      parsed.confidence = 'medium';
    }

    // Validate stake
    if (
      typeof parsed.stake !== 'number' ||
      parsed.stake < 1 ||
      parsed.stake > 10
    ) {
      parsed.stake = 5;
    }

    return parsed;
  } catch (error) {
    console.error('NBA AI prediction generation failed:', error);

    // Fallback: pick moneyline for team with lower (better) odds
    const favored =
      match.odds.moneyline_home < match.odds.moneyline_away
        ? { pick: 'moneyline_home' as NbaPickType, team: match.homeTeam }
        : { pick: 'moneyline_away' as NbaPickType, team: match.awayTeam };

    return {
      pick: favored.pick,
      pick_label_en: `${favored.team} to win`,
      pick_label_tl: `${favored.team} mananalo`,
      analysis_en: `Based on the moneyline odds, ${favored.team} is favored in this ${match.league} game. The odds suggest a clear advantage for the ${favored.pick === 'moneyline_home' ? 'home' : 'away'} team.`,
      analysis_tl: `Batay sa moneyline odds, paborito ang ${favored.team} sa ${match.league} laro. Nagpapahiwatig ang odds ng malinaw na kalamangan para sa ${favored.pick === 'moneyline_home' ? 'home' : 'away'} team.`,
      confidence: 'medium',
      stake: 5,
    };
  }
}
