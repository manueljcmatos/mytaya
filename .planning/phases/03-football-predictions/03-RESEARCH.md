# Phase 3: Football Predictions - Research

**Researched:** 2026-03-07
**Domain:** API-Football data pipeline + Astro prediction pages + Cloudflare Workers cron automation
**Confidence:** MEDIUM-HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Text-only for teams (no team logos/crests) -- avoids copyright issues, can add later
- Prediction types: Core 3 only -- Match Winner (1X2), Over/Under goals, Both Teams to Score
- AI-generated predictions via Cloudflare Worker using API-Football match data + odds
- 3-5 curated picks per day (quality over quantity)
- Medium-depth analysis: 2-3 paragraphs covering form, key stats, reasoning for the pick
- Separate URLs per language: /tl/mga-hula/[slug] and /en/predictions/[slug] (consistent with site i18n)
- Use Schema.org SportsEvent JSON-LD from Phase 2 on prediction pages
- Resolved predictions update in place with final score and WIN/LOSS outcome (same URL stays alive for SEO)
- Tab navigation: "Today's Picks" and "Past Results" tabs on the predictions page
- League filter chips: horizontal scrollable chips (All | Premier League | La Liga | etc.)
- Results history: last 30 days with pagination
- Predictions grouped by date with section headers (e.g. "Today -- March 7")

### Claude's Discretion
- Prediction card density (compact vs rich)
- Win/loss visual treatment (color-coded borders, badges, etc.)
- League selection and count
- Odds display format (decimal only vs multiple formats)
- Loading states and empty states
- Exact card layout, spacing, typography

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FTBL-01 | Daily football predictions are fetched automatically from API-Football | Cloudflare Worker cron trigger + API-Football fixtures/odds/predictions endpoints |
| FTBL-02 | Each prediction displays match details: teams, league, time, odds, prediction type | Existing Supabase predictions table has all needed columns; Astro pages query and render |
| FTBL-03 | Predictions are resolved automatically when match results come in | Second cron job fetches fixture results (status=FT), updates predictions table |
| FTBL-04 | User can browse today's pending predictions and past resolved predictions | Tab-based predictions page with Supabase queries filtered by status and date |
| FTBL-05 | Individual prediction pages with detailed analysis in both languages | Dynamic [slug] routes with bilingual content from predictions table |

</phase_requirements>

## Summary

This phase has two distinct halves: (1) a Cloudflare Worker that runs on cron to fetch matches from API-Football, generate AI predictions with bilingual analysis, and store them in Supabase, and (2) Astro frontend pages that display predictions with tabs, filters, and individual detail pages with SEO schema.

The existing codebase already has: the Supabase predictions table with bilingual columns and odds fields (foundation migration), the buildSportsEventSchema() function in lib/seo.ts, i18n infrastructure with route mapping, and placeholder prediction/results pages showing EmptyState. The Worker is the new piece -- it lives in a separate `workers/` directory with its own wrangler.toml and uses API-Football v3 endpoints (fixtures by date, odds by fixture, predictions by fixture) plus Cloudflare Workers AI or OpenAI for generating bilingual analysis text.

The Astro site is currently fully static (no SSR adapter). Since predictions change daily and need fresh data, the frontend pages should use the Supabase client to fetch at build time or use on-demand rendering. Given the site is small and predictions update at predictable times, a hybrid approach works: the predictions listing pages can be on-demand rendered (SSR) while static pages remain static. This requires adding the @astrojs/cloudflare adapter. Alternatively, predictions pages can be React islands that fetch client-side from Supabase, avoiding SSR complexity entirely.

**Primary recommendation:** Build the Cloudflare Worker data pipeline first (fetch, predict, store), then build frontend pages as client-side React islands fetching from Supabase, avoiding the SSR adapter complexity for now.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| API-Football (api-sports.io) | v3 | Football fixtures, odds, results data | 1200+ leagues, proven reliability, used by betpro reference project |
| @supabase/supabase-js | ^2.98.0 | Already installed -- database queries from frontend and Worker | Already in project, RLS policies in place |
| Cloudflare Workers | -- | Cron-triggered data pipeline | Free tier 100K requests/day, cron triggers built-in |
| Workers AI (or OpenAI) | -- | Generate bilingual prediction analysis | Cloudflare-native, low latency, no extra infra |
| Astro | ^5.18.0 | Already installed -- frontend framework | Already in project |
| React | ^19.2.4 | Already installed -- client-side islands for dynamic data | Already in project, used for LeadCaptureForm |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| wrangler | latest | Cloudflare Worker dev/deploy tooling | Worker development and deployment |
| date-fns | latest | Date formatting for match times in PH timezone | Display match dates in "Asia/Manila" timezone |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side React islands | @astrojs/cloudflare SSR adapter | SSR adds deployment complexity; client-side is simpler for a small number of dynamic pages |
| Workers AI | OpenAI API | Workers AI is free/cheap and Cloudflare-native; OpenAI has better quality but adds cost and external dependency |
| date-fns | Native Intl.DateTimeFormat | Intl API is sufficient for basic formatting; date-fns only needed if complex date math required |

**Installation (Worker -- separate package.json):**
```bash
npm create cloudflare@latest workers/predictions-worker
cd workers/predictions-worker
npm install @supabase/supabase-js
```

**Installation (Astro frontend -- if date formatting needed):**
```bash
npm install date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
mytaya/
├── src/                          # Existing Astro site
│   ├── components/
│   │   └── predictions/          # NEW: prediction-specific components
│   │       ├── PredictionCard.astro
│   │       ├── PredictionList.tsx  # React island for client-side data fetching
│   │       ├── PredictionTabs.tsx  # React island for Today/Past tab switching
│   │       ├── LeagueFilter.astro
│   │       └── ResultBadge.astro
│   ├── pages/
│   │   ├── tl/hula/
│   │   │   ├── index.astro       # MODIFY: replace EmptyState with PredictionList
│   │   │   └── [slug].astro      # NEW: individual prediction detail page
│   │   ├── en/predictions/
│   │   │   ├── index.astro       # MODIFY: same as tl counterpart
│   │   │   └── [slug].astro      # NEW: individual prediction detail page
│   │   ├── tl/resulta/
│   │   │   └── index.astro       # MODIFY: settled predictions list
│   │   └── en/results/
│   │       └── index.astro       # MODIFY: settled predictions list
│   ├── lib/
│   │   └── predictions.ts        # NEW: Supabase query helpers for predictions
│   └── i18n/
│       ├── ui.ts                 # MODIFY: add prediction-specific i18n keys
│       └── routes.ts             # MODIFY: add prediction slug routes
├── workers/
│   └── predictions-worker/       # NEW: Cloudflare Worker
│       ├── wrangler.toml         # Cron triggers + env bindings
│       ├── src/
│       │   ├── index.ts          # Scheduled handler entry point
│       │   ├── api-football.ts   # API-Football client (fixtures, odds, predictions)
│       │   ├── prediction-gen.ts # AI analysis generation (bilingual)
│       │   ├── resolver.ts       # Match result resolution logic
│       │   └── supabase.ts       # Supabase client for Worker context
│       └── package.json
└── supabase/
    └── migrations/
        └── 003_seed_leagues.sql  # NEW: seed football leagues used for predictions
```

### Pattern 1: Cloudflare Worker Cron Pipeline
**What:** Two scheduled jobs -- one fetches daily matches and generates predictions, another resolves finished matches.
**When to use:** Every day, fetching at a fixed time (e.g., 06:00 UTC) and resolving every 30 minutes.

```typescript
// workers/predictions-worker/src/index.ts
export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const cronPattern = controller.cron;

    if (cronPattern === '0 6 * * *') {
      // Morning: fetch today's fixtures, generate predictions, store in Supabase
      ctx.waitUntil(fetchAndGeneratePredictions(env));
    } else if (cronPattern === '*/30 * * * *') {
      // Every 30 min: check for finished matches, resolve predictions
      ctx.waitUntil(resolveFinishedMatches(env));
    }
  },
};
```

```toml
# wrangler.toml
[triggers]
crons = ["0 6 * * *", "*/30 * * * *"]

[vars]
SUPABASE_URL = "https://xxx.supabase.co"

# Secrets (set via wrangler secret put):
# SUPABASE_SERVICE_KEY
# API_FOOTBALL_KEY
```

### Pattern 2: API-Football Data Fetching
**What:** Fetch fixtures for target leagues, get odds, optionally get API-Football's own predictions.
**When to use:** In the morning cron job.

```typescript
// workers/predictions-worker/src/api-football.ts
const API_BASE = 'https://v3.football.api-sports.io';

// Target leagues for Filipino audience
const TARGET_LEAGUES = [
  { id: 39, name: 'Premier League', season: 2025 },
  { id: 140, name: 'La Liga', season: 2025 },
  { id: 135, name: 'Serie A', season: 2025 },
  { id: 78, name: 'Bundesliga', season: 2025 },
  { id: 61, name: 'Ligue 1', season: 2025 },
];

interface ApiFootballFixture {
  fixture: { id: number; date: string; timestamp: number; status: { short: string } };
  league: { id: number; name: string; country: string; round: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
}

export async function fetchTodayFixtures(apiKey: string, date: string): Promise<ApiFootballFixture[]> {
  const fixtures: ApiFootballFixture[] = [];
  for (const league of TARGET_LEAGUES) {
    const res = await fetch(`${API_BASE}/fixtures?league=${league.id}&season=${league.season}&date=${date}`, {
      headers: { 'x-apisports-key': apiKey },
    });
    const data = await res.json();
    fixtures.push(...data.response);
    // Rate limit: 1 second between calls on free tier
    await new Promise(r => setTimeout(r, 1100));
  }
  return fixtures;
}

export async function fetchOdds(apiKey: string, fixtureId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/odds?fixture=${fixtureId}`, {
    headers: { 'x-apisports-key': apiKey },
  });
  const data = await res.json();
  return data.response?.[0]; // First bookmaker's odds
}

export async function fetchFixtureResult(apiKey: string, fixtureId: number): Promise<ApiFootballFixture> {
  const res = await fetch(`${API_BASE}/fixtures?id=${fixtureId}`, {
    headers: { 'x-apisports-key': apiKey },
  });
  const data = await res.json();
  return data.response?.[0];
}
```

### Pattern 3: Client-Side React Island for Predictions List
**What:** A React component that fetches predictions from Supabase client-side, supports tab switching (Today/Past) and league filtering.
**When to use:** On the predictions listing page -- avoids need for SSR adapter.

```tsx
// src/components/predictions/PredictionList.tsx
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Props {
  lang: 'tl' | 'en';
  initialTab?: 'today' | 'past';
}

export default function PredictionList({ lang, initialTab = 'today' }: Props) {
  const [tab, setTab] = useState(initialTab);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );

    async function fetchPredictions() {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('predictions')
        .select('*, leagues(name, slug)')
        .eq('sport', 'football')
        .eq('published_site', true);

      if (tab === 'today') {
        query = query.eq('status', 'pending').gte('match_date', `${today}T00:00:00`);
      } else {
        query = query.eq('status', 'settled').order('match_date', { ascending: false }).limit(30);
      }

      if (league) {
        query = query.eq('leagues.slug', league);
      }

      const { data } = await query.order('match_date', { ascending: true });
      setPredictions(data || []);
      setLoading(false);
    }

    fetchPredictions();
  }, [tab, league]);

  // ... render tabs, filters, prediction cards
}
```

### Pattern 4: Dynamic Prediction Detail Pages
**What:** Astro page with [slug] parameter that fetches a single prediction and renders bilingual detail with SportsEvent schema.
**When to use:** Individual prediction pages for SEO.

```astro
---
// src/pages/en/predictions/[slug].astro
import Layout from '../../../layouts/Layout.astro';
import { supabase } from '../../../lib/supabase';
import { buildSportsEventSchema } from '../../../lib/seo';
import { getLangFromUrl } from '../../../i18n/utils';

const lang = getLangFromUrl(Astro.url);
const { slug } = Astro.params;

// For static generation, define getStaticPaths
export async function getStaticPaths() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('predictions')
    .select('slug')
    .eq('sport', 'football')
    .eq('published_site', true);
  return (data || []).map(p => ({ params: { slug: p.slug } }));
}

const { data: prediction } = await supabase
  ?.from('predictions')
  .select('*, leagues(name), home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
  .eq('slug', slug)
  .single() ?? { data: null };

const schema = prediction ? buildSportsEventSchema({
  title: `${prediction.home_team.name} vs ${prediction.away_team.name}`,
  homeTeam: prediction.home_team.name,
  awayTeam: prediction.away_team.name,
  sport: 'Football',
  startDate: prediction.match_date,
  url: Astro.url.href,
}) : undefined;
---
```

### Anti-Patterns to Avoid
- **Fetching API-Football from the browser:** Never expose the API key client-side. All API-Football calls go through the Cloudflare Worker.
- **Storing raw API responses in Supabase:** Transform and extract only needed fields before storing. The predictions table schema is already defined.
- **Using SSR for all pages:** Only prediction listing needs dynamic data. Keep everything else static. Client-side React islands are simpler than adding an SSR adapter for just 2-3 dynamic pages.
- **Generating predictions without rate limit awareness:** Free tier is 100 requests/day. With 5 leagues + odds calls, budget carefully (5 fixture calls + 5-10 odds calls + 5-10 prediction calls = 20-25 calls per run).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Football match data | Custom web scraping | API-Football v3 | Reliable, structured, 1200+ leagues, already decided |
| Bilingual AI text generation | Template strings with variables | Workers AI or OpenAI | Natural language, context-aware, handles both TL and EN |
| Cron scheduling | Custom timer/polling | Cloudflare Workers cron triggers | Built-in, reliable, free tier, managed infrastructure |
| Slug generation | Custom slug function | Template: `${homeTeam}-vs-${awayTeam}-${date}` | Simple kebab-case from team names and date is sufficient |
| Timezone handling | Manual UTC offset math | `Intl.DateTimeFormat` with `timeZone: 'Asia/Manila'` | Browser-native, handles DST, no library needed |
| Pagination | Custom offset/limit logic | Supabase `.range(from, to)` with page parameter | Built into Supabase client, handles count |

**Key insight:** The core value is in the curation and AI analysis, not in reinventing data pipelines. API-Football provides the data, Workers AI generates analysis, Supabase stores everything, and Astro/React renders it.

## Common Pitfalls

### Pitfall 1: API-Football Rate Limiting on Free Tier
**What goes wrong:** Exceeding 100 requests/day causes 429 errors, breaking the daily prediction pipeline.
**Why it happens:** Each league needs a separate fixtures call, plus odds and predictions per fixture. 5 leagues x (1 fixtures + 3-5 odds + 3-5 predictions) = 35-55 calls.
**How to avoid:** Batch fixture IDs where possible (up to 20 per request). Cache responses. Only fetch odds for fixtures you'll actually use (the 3-5 daily picks). Consider Pro plan ($9.99/month) for 7,500 requests/day.
**Warning signs:** Logging 429 responses from API-Football.

### Pitfall 2: Supabase Client Null in Build
**What goes wrong:** `supabase` is null when env vars aren't set, causing build failures for getStaticPaths.
**Why it happens:** Conditional client creation pattern (already in codebase) returns null if env vars missing.
**How to avoid:** Always guard with `if (!supabase)` checks. Return empty arrays from getStaticPaths when supabase is null. This means first build without data works (empty site), then predictions appear after Worker runs.
**Warning signs:** Build errors referencing "cannot read property of null".

### Pitfall 3: Timezone Mismatch Between API-Football and Display
**What goes wrong:** Match times show in UTC instead of Philippine Time (PHT, UTC+8).
**Why it happens:** API-Football returns timestamps in UTC. Displaying without timezone conversion confuses Filipino users.
**How to avoid:** Always pass `timezone=Asia/Manila` parameter to API-Football (it supports it), or convert on display using `Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila' })`.
**Warning signs:** Matches showing at wrong times, user confusion about kickoff times.

### Pitfall 4: Prediction Slug Conflicts
**What goes wrong:** Two matches with same teams on same day (e.g., cup + league) create duplicate slugs.
**Why it happens:** Slug generation from team names + date isn't unique enough.
**How to avoid:** Include league slug in prediction slug: `${leagueSlug}-${homeTeam}-vs-${awayTeam}-${date}`. Add fixture_id as final fallback.
**Warning signs:** Supabase unique constraint violations on slug column.

### Pitfall 5: Stale getStaticPaths for Detail Pages
**What goes wrong:** New predictions added by Worker don't get detail pages until next build.
**Why it happens:** Static site generation runs getStaticPaths only at build time.
**How to avoid:** Two options: (a) trigger a rebuild after Worker stores new predictions (Cloudflare Pages deploy hook), or (b) use on-demand rendering for [slug] pages only. Option (a) is simpler and keeps the fully static approach.
**Warning signs:** 404 errors on prediction detail pages for recent predictions.

### Pitfall 6: Empty Predictions Before Worker First Run
**What goes wrong:** Site deploys with no predictions data, showing empty states indefinitely.
**Why it happens:** Worker hasn't run yet, or free tier API key not configured.
**How to avoid:** Seed initial predictions manually or run Worker manually once after deploy. Include clear "coming soon" messaging in empty states.
**Warning signs:** Predictions page always empty after launch.

## Code Examples

### Supabase Query: Today's Pending Football Predictions
```typescript
// src/lib/predictions.ts
import { supabase } from './supabase';

export async function getTodayPredictions() {
  if (!supabase) return [];
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('predictions')
    .select(`
      id, slug, pick, pick_label_tl, pick_label_en,
      analysis_tl, analysis_en, odds, confidence, stake,
      match_date, status, result,
      leagues(name, slug),
      home_team:teams!home_team_id(name),
      away_team:teams!away_team_id(name)
    `)
    .eq('sport', 'football')
    .eq('published_site', true)
    .eq('status', 'pending')
    .gte('match_date', `${today}T00:00:00`)
    .lte('match_date', `${today}T23:59:59`)
    .order('match_date', { ascending: true });

  return data || [];
}

export async function getPastPredictions(page = 1, perPage = 10) {
  if (!supabase) return { data: [], count: 0 };
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count } = await supabase
    .from('predictions')
    .select(`
      id, slug, pick, pick_label_tl, pick_label_en,
      odds, match_date, status, result, settled_at,
      leagues(name, slug),
      home_team:teams!home_team_id(name),
      away_team:teams!away_team_id(name)
    `, { count: 'exact' })
    .eq('sport', 'football')
    .eq('published_site', true)
    .eq('status', 'settled')
    .order('match_date', { ascending: false })
    .range(from, to);

  return { data: data || [], count: count || 0 };
}

export async function getPredictionBySlug(slug: string) {
  if (!supabase) return null;

  const { data } = await supabase
    .from('predictions')
    .select(`
      *,
      leagues(name, slug),
      home_team:teams!home_team_id(name),
      away_team:teams!away_team_id(name)
    `)
    .eq('slug', slug)
    .single();

  return data;
}
```

### Worker: AI Prediction Generation (Bilingual)
```typescript
// workers/predictions-worker/src/prediction-gen.ts
interface MatchContext {
  homeTeam: string;
  awayTeam: string;
  league: string;
  odds: { home: number; draw: number; away: number; overUnder?: number };
  apiPrediction?: { winner: string; advice: string };
}

export async function generatePrediction(
  ai: any, // Workers AI binding
  match: MatchContext
): Promise<{ pick: string; pick_label_tl: string; pick_label_en: string; analysis_tl: string; analysis_en: string }> {
  const prompt = `You are a sports prediction analyst for a Filipino betting tips website.
Given this match: ${match.homeTeam} vs ${match.awayTeam} (${match.league})
Odds: Home ${match.odds.home}, Draw ${match.odds.draw}, Away ${match.odds.away}
${match.apiPrediction ? `API prediction suggests: ${match.apiPrediction.advice}` : ''}

Generate:
1. Your pick (one of: "home", "away", "draw", "over", "under", "btts_yes", "btts_no")
2. Pick label in English (e.g., "Manchester City to win")
3. Pick label in Filipino/Tagalog (e.g., "Manchester City mananalo")
4. Analysis in English (2-3 paragraphs with form, stats, reasoning)
5. Analysis in Filipino/Tagalog (2-3 paragraphs, same content translated)

Respond in JSON format with keys: pick, pick_label_en, pick_label_tl, analysis_en, analysis_tl`;

  const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
  });

  return JSON.parse(response.response);
}
```

### Worker: Match Resolution
```typescript
// workers/predictions-worker/src/resolver.ts
import { createClient } from '@supabase/supabase-js';

export async function resolveFinishedMatches(env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Get pending predictions with fixture IDs
  const { data: pendingPredictions } = await supabase
    .from('predictions')
    .select('id, api_fixture_id, pick, odds')
    .eq('status', 'pending')
    .eq('sport', 'football')
    .not('api_fixture_id', 'is', null);

  if (!pendingPredictions?.length) return;

  for (const pred of pendingPredictions) {
    // Check fixture status via API-Football
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${pred.api_fixture_id}`,
      { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } }
    );
    const data = await res.json();
    const fixture = data.response?.[0];

    if (!fixture || fixture.fixture.status.short !== 'FT') continue;

    // Determine result based on pick type and final score
    const homeGoals = fixture.goals.home;
    const awayGoals = fixture.goals.away;
    const result = determineResult(pred.pick, homeGoals, awayGoals);

    await supabase
      .from('predictions')
      .update({
        result,
        status: 'settled',
        settled_at: new Date().toISOString(),
      })
      .eq('id', pred.id);

    // Rate limit
    await new Promise(r => setTimeout(r, 1100));
  }
}

function determineResult(pick: string, homeGoals: number, awayGoals: number): string {
  switch (pick) {
    case 'home': return homeGoals > awayGoals ? 'win' : 'loss';
    case 'away': return awayGoals > homeGoals ? 'win' : 'loss';
    case 'draw': return homeGoals === awayGoals ? 'win' : 'loss';
    case 'over': return (homeGoals + awayGoals) > 2.5 ? 'win' : 'loss'; // Default 2.5 line
    case 'under': return (homeGoals + awayGoals) < 2.5 ? 'win' : 'loss';
    case 'btts_yes': return (homeGoals > 0 && awayGoals > 0) ? 'win' : 'loss';
    case 'btts_no': return (homeGoals === 0 || awayGoals === 0) ? 'win' : 'loss';
    default: return 'void';
  }
}
```

### Display: Philippine Time Formatting
```typescript
// src/lib/predictions.ts
export function formatMatchTime(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatMatchDate(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro `output: 'hybrid'` config | Astro 5: static default + per-page `prerender = false` | Astro 5.0 (Dec 2024) | No need for `output: 'hybrid'` -- just add adapter and set prerender=false on specific pages |
| Separate Cloudflare Pages Functions | Cloudflare Workers (recommended over Pages for new projects) | 2025 | Workers offer more flexibility; the Worker for cron is separate from the site deploy anyway |
| API-Football via RapidAPI | Direct API-Sports endpoint (v3.football.api-sports.io) | Ongoing | Direct access avoids RapidAPI middleman latency and costs |

**Deprecated/outdated:**
- Astro `output: 'hybrid'` is now redundant in Astro 5 -- use default static + adapter + per-page prerender=false
- API-Football v2 endpoints -- v3 is the current version with different response structure

## Open Questions

1. **API-Football Plan Selection**
   - What we know: Free tier = 100 requests/day. 5 leagues need ~25-55 calls per daily run + resolution calls.
   - What's unclear: Whether free tier is sufficient for daily operations with resolution checks every 30 minutes.
   - Recommendation: Start with free tier, monitor usage. Upgrade to Pro ($9.99/month, 7,500/day) if free tier proves insufficient. Budget resolution calls carefully -- only check pending predictions, not all fixtures.

2. **Workers AI vs OpenAI for Analysis Generation**
   - What we know: Workers AI (Llama 3.1 8B) is free on Cloudflare, built-in binding. OpenAI produces higher quality text but costs money.
   - What's unclear: Whether Llama 3.1 8B produces good enough Filipino/Tagalog text for the analysis.
   - Recommendation: Start with Workers AI (free, simpler). Test Tagalog output quality manually. Switch to OpenAI if Tagalog quality is poor.

3. **Rebuild Trigger for Static Detail Pages**
   - What we know: Static [slug] pages need getStaticPaths which runs at build time only.
   - What's unclear: Whether Cloudflare Pages supports deploy hooks for automated rebuilds.
   - Recommendation: For v1, make detail pages work as React islands that fetch data client-side (like the listing page). This sidesteps the rebuild issue entirely. SEO schema can be added via client-side JSON-LD injection.

4. **League Season Year Handling**
   - What we know: API-Football uses `season` parameter (e.g., 2025). European leagues span two calendar years (2025-2026).
   - What's unclear: Exact season year values needed at any given time.
   - Recommendation: Store target leagues with their current season in the Worker config. Update season values manually at the start of each new season (August/September).

## Sources

### Primary (HIGH confidence)
- API-Football official site (api-football.com) -- endpoints, pricing, rate limits
- API-Sports documentation (api-sports.io/documentation/football/v3) -- v3 API structure
- Cloudflare Workers docs (developers.cloudflare.com/workers/) -- cron triggers, scheduled handlers
- Astro docs (docs.astro.build) -- on-demand rendering, Cloudflare adapter
- Existing codebase -- Supabase schema, seo.ts, i18n setup, page structure

### Secondary (MEDIUM confidence)
- Blog post on automated betting notifier using API-Football -- pipeline patterns, header format (`x-apisports-key`), rate limiting approach
- API-Football blog post on fixtures endpoint -- batch ID fetching (max 20 per request), status codes (FT, NS, etc.)

### Tertiary (LOW confidence)
- Workers AI Llama 3.1 quality for Filipino/Tagalog -- needs manual validation
- Exact API call counts needed for daily pipeline -- depends on number of matches per day across leagues

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- API-Football is locked decision, Supabase schema exists, Cloudflare Workers well-documented
- Architecture: MEDIUM-HIGH -- Worker pipeline pattern is well-established, client-side React islands follow existing project patterns (LeadCaptureForm)
- Pitfalls: MEDIUM -- Rate limiting and timezone issues are well-known; Tagalog AI quality is genuinely uncertain
- Code patterns: MEDIUM -- API-Football response structure not fully verified from official docs (documentation pages didn't render), but cross-referenced with multiple blog posts

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- API-Football and Cloudflare Workers are stable)
