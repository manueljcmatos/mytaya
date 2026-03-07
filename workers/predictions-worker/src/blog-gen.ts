import type { Env, BlogPostInsert } from './types';
import { createSupabaseClient } from './supabase';

/**
 * Slugify a string for URL-safe usage.
 */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Calculate estimated read time in minutes based on word count.
 * Uses 200 WPM average reading speed.
 */
function calculateReadTime(contentEn: string, contentTl: string): number {
  const totalWords =
    contentEn.split(/\s+/).length + contentTl.split(/\s+/).length;
  return Math.max(1, Math.ceil(totalWords / 200));
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
 * Generate a fallback template-based article when AI fails.
 */
function generateFallbackArticle(prediction: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  pick: string;
  pickLabelEn: string;
  pickLabelTl: string;
  analysisEn: string;
  analysisTl: string;
  odds: number;
}): {
  title_en: string;
  title_tl: string;
  content_en: string;
  content_tl: string;
  excerpt_en: string;
  excerpt_tl: string;
} {
  const { homeTeam, awayTeam, league, pickLabelEn, pickLabelTl, analysisEn, analysisTl, odds } = prediction;

  return {
    title_en: `${homeTeam} vs ${awayTeam} Prediction - ${league}`,
    title_tl: `${homeTeam} vs ${awayTeam} Hula - ${league}`,
    content_en: `## ${homeTeam} vs ${awayTeam} Preview\n\n${analysisEn}\n\n## Our Pick\n\n**${pickLabelEn}** at odds of ${odds.toFixed(2)}.\n\nThis ${league} clash presents an interesting betting opportunity. Based on our analysis of recent form and key matchup factors, we recommend ${pickLabelEn} as the best value play.\n\n## Betting Value\n\nThe current odds of ${odds.toFixed(2)} represent fair value for this selection. We recommend a measured stake on this pick.\n`,
    content_tl: `## ${homeTeam} vs ${awayTeam} Preview\n\n${analysisTl}\n\n## Aming Hula\n\n**${pickLabelTl}** sa odds na ${odds.toFixed(2)}.\n\nAng ${league} laban na ito ay nagpapakita ng magandang pagkakataon sa pagtaya. Batay sa aming pagsusuri ng mga kamakailang resulta at mahahalagang salik, inirerekomenda namin ang ${pickLabelTl} bilang pinakamahusay na halaga.\n\n## Halaga ng Pagtaya\n\nAng kasalukuyang odds na ${odds.toFixed(2)} ay kumakatawan sa patas na halaga para sa seleksyon na ito. Inirerekomenda namin ang masukat na stake sa hula na ito.\n`,
    excerpt_en: `Expert prediction for ${homeTeam} vs ${awayTeam} in ${league}. Our pick: ${pickLabelEn}.`,
    excerpt_tl: `Ekspertong hula para sa ${homeTeam} vs ${awayTeam} sa ${league}. Aming hula: ${pickLabelTl}.`,
  };
}

/**
 * Generate bilingual blog articles for today's predictions using Workers AI.
 * Queries predictions created today with published_site=true, generates
 * long-form articles, and upserts them into the posts table.
 */
export async function generateBlogArticles(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);
  const today = getTodayPHT();

  console.log(`Generating blog articles for predictions on ${today}`);

  // Query today's predictions with team and league data
  const { data: predictions, error } = await supabase
    .from('predictions')
    .select(
      `
      id,
      slug,
      sport,
      pick,
      pick_label_en,
      pick_label_tl,
      analysis_en,
      analysis_tl,
      odds,
      confidence,
      match_date,
      home_team:teams!home_team_id(name),
      away_team:teams!away_team_id(name),
      league:leagues!league_id(name)
    `
    )
    .eq('published_site', true)
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`);

  if (error) {
    console.error('Error fetching predictions for blog generation:', error.message);
    return;
  }

  if (!predictions?.length) {
    console.log('No predictions found for today, skipping blog generation');
    return;
  }

  // Check which predictions already have linked blog posts
  const predictionIds = predictions.map((p) => p.id);
  const { data: existingPosts } = await supabase
    .from('posts')
    .select('prediction_id')
    .in('prediction_id', predictionIds);

  const existingPredictionIds = new Set(
    (existingPosts ?? []).map((p) => p.prediction_id)
  );

  const newPredictions = predictions.filter(
    (p) => !existingPredictionIds.has(p.id)
  );

  if (newPredictions.length === 0) {
    console.log('All predictions already have blog posts');
    return;
  }

  console.log(
    `Generating ${newPredictions.length} blog articles (${predictions.length} total predictions today)`
  );

  let created = 0;

  for (const pred of newPredictions) {
    // Extract team/league names from joined data
    const homeTeam =
      (pred.home_team as unknown as { name: string })?.name ?? 'Home';
    const awayTeam =
      (pred.away_team as unknown as { name: string })?.name ?? 'Away';
    const leagueName =
      (pred.league as unknown as { name: string })?.name ?? 'League';
    const sport = pred.sport as 'football' | 'basketball';

    // Generate slugs programmatically (NOT from AI -- per research pitfall #5)
    const slugEn = `${sport}-${slugify(homeTeam)}-vs-${slugify(awayTeam)}-prediction-${today}`;
    const slugTl = `${sport}-${slugify(homeTeam)}-vs-${slugify(awayTeam)}-hula-${today}`;
    const slug = slugEn; // Canonical slug = English slug

    try {
      // Build AI prompt for long-form bilingual article
      const prompt = `You are an expert sports analyst for MyTaya, a Filipino sports betting tips website. Write a detailed bilingual prediction article for this match.

Match: ${homeTeam} vs ${awayTeam}
League: ${leagueName}
Sport: ${sport}
Date: ${pred.match_date}
Our Pick: ${pred.pick_label_en}
Confidence: ${pred.confidence}
Odds: ${pred.odds}

Write a comprehensive 800-1200 word article per language (English and Filipino/Tagalog). The article should have these sections:
1. Introduction - Match context, stakes, narrative hook
2. Form Guide - Recent results for both teams
3. Head-to-Head History - Previous meetings between these teams
4. Key Factors - Injuries, motivation, venue advantages
5. Our Pick - The prediction with detailed reasoning
6. Betting Value - Odds assessment and stake recommendation

Tone: Authoritative, data-driven, confident but not hype-y. Write like a professional tipster analyst.

You MUST respond with valid JSON only (no markdown wrapping, no extra text). The JSON must have these exact keys:
- "title_en": English article title (compelling, SEO-friendly)
- "title_tl": Filipino/Tagalog article title
- "content_en": Full English article with markdown formatting (## for section headers)
- "content_tl": Full Filipino/Tagalog article with markdown formatting
- "excerpt_en": 1-2 sentence English excerpt/summary
- "excerpt_tl": 1-2 sentence Filipino/Tagalog excerpt/summary

Respond with JSON only:`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (env.AI as any).run(
        '@cf/meta/llama-3.1-8b-instruct',
        {
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
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

      const parsed = JSON.parse(jsonMatch[0]) as {
        title_en: string;
        title_tl: string;
        content_en: string;
        content_tl: string;
        excerpt_en: string;
        excerpt_tl: string;
      };

      // Validate required fields
      if (
        !parsed.title_en ||
        !parsed.title_tl ||
        !parsed.content_en ||
        !parsed.content_tl
      ) {
        throw new Error('AI response missing required fields');
      }

      const readTime = calculateReadTime(parsed.content_en, parsed.content_tl);

      const blogPost: BlogPostInsert = {
        slug,
        slug_en: slugEn,
        slug_tl: slugTl,
        title_en: parsed.title_en,
        title_tl: parsed.title_tl,
        content_en: parsed.content_en,
        content_tl: parsed.content_tl,
        excerpt_en: parsed.excerpt_en ?? '',
        excerpt_tl: parsed.excerpt_tl ?? '',
        category: 'analysis',
        sport,
        prediction_id: pred.id,
        read_time_minutes: readTime,
        is_published: true,
        published_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('posts')
        .upsert(blogPost, { onConflict: 'slug' });

      if (upsertError) {
        console.error(
          `Error upserting blog post for ${slug}:`,
          upsertError.message
        );
      } else {
        created++;
        console.log(`Created blog article: ${slug}`);
      }
    } catch (aiError) {
      console.error(
        `AI blog generation failed for ${slug}, using fallback:`,
        aiError
      );

      // Fallback: generate a shorter template-based article
      const fallback = generateFallbackArticle({
        homeTeam,
        awayTeam,
        league: leagueName,
        sport,
        pick: pred.pick,
        pickLabelEn: pred.pick_label_en,
        pickLabelTl: pred.pick_label_tl,
        analysisEn: pred.analysis_en ?? '',
        analysisTl: pred.analysis_tl ?? '',
        odds: pred.odds,
      });

      const readTime = calculateReadTime(
        fallback.content_en,
        fallback.content_tl
      );

      const blogPost: BlogPostInsert = {
        slug,
        slug_en: slugEn,
        slug_tl: slugTl,
        title_en: fallback.title_en,
        title_tl: fallback.title_tl,
        content_en: fallback.content_en,
        content_tl: fallback.content_tl,
        excerpt_en: fallback.excerpt_en,
        excerpt_tl: fallback.excerpt_tl,
        category: 'analysis',
        sport,
        prediction_id: pred.id,
        read_time_minutes: readTime,
        is_published: true,
        published_at: new Date().toISOString(),
      };

      const { error: fallbackError } = await supabase
        .from('posts')
        .upsert(blogPost, { onConflict: 'slug' });

      if (fallbackError) {
        console.error(
          `Error upserting fallback blog post for ${slug}:`,
          fallbackError.message
        );
      } else {
        created++;
        console.log(`Created fallback blog article: ${slug}`);
      }
    }
  }

  console.log(
    `Blog generation complete: ${created}/${newPredictions.length} articles created`
  );
}
