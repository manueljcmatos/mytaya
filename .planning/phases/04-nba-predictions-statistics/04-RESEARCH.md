# Phase 4: NBA Predictions & Statistics - Research

**Researched:** 2026-03-07
**Domain:** NBA API integration, statistics computation, charting
**Confidence:** HIGH

## Summary

Phase 4 extends the existing football predictions infrastructure to support NBA basketball and adds a statistics dashboard with win rate, ROI, streaks, and a profit chart. The architecture is well-positioned for this: the Supabase schema already has `sport` columns, the `prediction_stats` table exists, and the predictions-worker is designed for extension. The primary work is (a) adding NBA game fetching/resolution to the worker, (b) making the frontend sport-aware with tabs instead of hardcoded football, and (c) building a new statistics page with a charting library.

The project uses the API-Sports ecosystem (api-sports.io) for data. API-Basketball follows the same authentication and response patterns as API-Football, using the same `x-apisports-key` header. NBA games use spread, moneyline, and over/under as core bet types -- different from football's 1X2/BTTS model, requiring new pick types and resolution logic.

**Primary recommendation:** Extend the existing predictions-worker with an `api-basketball.ts` module mirroring `api-football.ts`, use Recharts for the profit chart (already React in the project), and compute statistics from the predictions table directly rather than maintaining a separate stats aggregation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Prediction types: Spread, Moneyline, and Over/Under total points (3 core NBA bet types)
- Show conference badge (Eastern/Western) on NBA prediction cards
- 3-5 curated picks per day (same quality-first approach as football)
- Extend the existing predictions-worker (not a separate Worker) -- add NBA logic to shared cron infrastructure
- Hero stat cards at top: Win Rate (% + W/L count), ROI (% + units), Current Streak (W/L count)
- Sport filter: Tabs -- All Sports | Football | Basketball
- Time period chips below sport tabs: 7 days | 30 days | All Time
- Recent picks table below the chart: last 10 resolved picks showing match, pick, result, profit
- Line chart showing cumulative profit in units (flat stake, 1 unit per bet)
- Interactive with hover/tap tooltips (date, cumulative profit, number of picks)
- Chart syncs with sport filter and time period -- updates when tabs/chips change
- Lightweight JS charting library (e.g. Recharts since React islands are already in use)
- Shared predictions listing page with sport tabs (Basketball | Football) -- not separate pages
- Homepage "Today's Predictions" shows both sports mixed, sorted by kickoff/tipoff time
- Same URL pattern for detail pages: /en/predictions/[slug] with sport identifiable from slug prefix
- Single "Predictions" nav item -- sport selection happens on the page via tabs

### Claude's Discretion
- Specific charting library choice (Recharts, Chart.js, or lightweight alternative)
- NBA prediction card layout details (how spread/conference badge are positioned)
- Color palette for the profit chart (should match site theme)
- Empty states when no data exists for a sport/time period
- How to handle the NBA offseason (no games available)
- Exact stat card visual design and responsive behavior

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BASK-01 | Daily NBA predictions are fetched via API-Basketball or API-Football | API-Basketball module in worker, games endpoint with date param, NBA league config |
| BASK-02 | NBA predictions display teams, conference, odds, spread, and prediction type | Extended prediction card with conference badge, spread display, NBA pick types |
| BASK-03 | NBA predictions are resolved automatically when game results come in | Extended resolver with NBA scoring logic (no draws, spread resolution) |
| STAT-01 | Dashboard shows overall win rate across all sports | Query predictions table with sport filter, compute from settled results |
| STAT-02 | Dashboard shows ROI based on tracked odds | ROI = (total_profit / total_stakes) * 100, 1 unit flat stake model |
| STAT-03 | Dashboard shows current streak (wins/losses) | Query last N settled predictions ordered by settled_at DESC, count consecutive same result |
| STAT-04 | Statistics can be filtered by sport (football, basketball, boxing) | Sport tabs in React island, parameterized Supabase queries |
| STAT-05 | Profit chart visualizes performance over time | Recharts LineChart with cumulative profit series, time period filtering |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | ^3.7.0 | Profit chart visualization | React-native API, SVG-based, works with existing React islands, ~60KB gzipped |
| @supabase/supabase-js | ^2.98.0 | Database queries (already installed) | Already in use for predictions and leads |
| React | ^19.2.4 | Interactive components (already installed) | Already powering PredictionList, LeagueFilter islands |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | not needed | Date manipulation | Intl.DateTimeFormat already used throughout -- keep consistent |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js (via react-chartjs-2) | Chart.js is tree-shakable (~40KB gzipped) but requires canvas, not SVG. Recharts fits better with React island pattern and provides hover tooltips natively. |
| Recharts | Lightweight SVG (hand-rolled) | Would avoid dependency but building interactive tooltips, responsive axes, and animations is complex -- not worth it. |
| Separate stats table | Direct query from predictions | Predictions table already has all data needed. Computing stats on-read avoids sync issues. Use `prediction_stats` table only if performance becomes a problem. |

**Installation:**
```bash
cd /Users/mjcmatos/Desktop/mytaya && npm install recharts
```

**Charting Library Recommendation (Claude's Discretion):** Use **Recharts 3.x**. Rationale:
- Project already uses React islands with `client:load` -- Recharts is pure React, zero adapter needed
- ~60KB gzipped is acceptable for a single statistics page (loaded on demand via Astro island)
- Built-in `<Tooltip>`, `<ResponsiveContainer>`, and `<LineChart>` cover all requirements
- The dataset is small (max hundreds of data points) -- SVG rendering is fine

## Architecture Patterns

### Recommended Project Structure
```
workers/predictions-worker/src/
  index.ts              # Add NBA cron dispatch (modify)
  api-football.ts       # Existing (no change)
  api-basketball.ts     # NEW: NBA fixtures + odds fetching
  prediction-gen.ts     # Extend prompt for NBA context (modify)
  resolver.ts           # Add NBA resolution logic (modify)
  types.ts              # Add NBA types + pick types (modify)

src/
  components/
    predictions/
      PredictionList.tsx   # Add sport tabs, remove hardcoded 'football' (modify)
      PredictionCard.astro # Add conference badge, spread display (modify)
      LeagueFilter.tsx     # Now loads leagues for selected sport (modify)
    statistics/
      StatsDashboard.tsx   # NEW: React island -- hero cards + chart + table
      ProfitChart.tsx      # NEW: Recharts line chart component
      StatCard.tsx         # NEW: Individual stat card (win rate, ROI, streak)
      RecentPicks.tsx      # NEW: Last 10 resolved picks table
  lib/
    predictions.ts         # Remove hardcoded 'football', accept sport param (modify)
    statistics.ts          # NEW: Stats computation functions
  pages/
    en/statistics/index.astro  # NEW: Statistics page
    tl/estadistika/index.astro # NEW: Filipino statistics page
```

### Pattern 1: Sport-Parameterized Queries
**What:** All prediction queries accept an optional `sport` parameter instead of hardcoding `'football'`
**When to use:** Every prediction fetch, both server-side (Astro) and client-side (React islands)
**Example:**
```typescript
// src/lib/predictions.ts -- modified
export async function getTodayPredictions(sport?: string) {
  if (!supabase) return [];
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('predictions')
    .select(PREDICTION_FIELDS)
    .eq('published_site', true)
    .eq('status', 'pending')
    .gte('match_date', `${today}T00:00:00`)
    .lte('match_date', `${today}T23:59:59`)
    .order('match_date', { ascending: true });

  if (sport) {
    query = query.eq('sport', sport);
  }
  // If no sport filter, returns all sports mixed

  const { data } = await query;
  return data || [];
}
```

### Pattern 2: NBA Pick Types and Resolution
**What:** NBA uses different pick types than football: `moneyline_home`, `moneyline_away`, `spread_home`, `spread_away`, `over`, `under`
**When to use:** Worker prediction generation and resolution
**Example:**
```typescript
// NBA-specific pick types to add to types.ts
export type NbaPickType =
  | 'moneyline_home'
  | 'moneyline_away'
  | 'spread_home'    // e.g., Lakers -5.5
  | 'spread_away'    // e.g., Celtics +5.5
  | 'over'           // Over total points
  | 'under';         // Under total points

// NBA result determination
export function determineNbaResult(
  pick: string,
  homeScore: number,
  awayScore: number,
  spread?: number,    // e.g., -5.5
  totalLine?: number  // e.g., 220.5
): 'win' | 'loss' | 'push' {
  const totalPoints = homeScore + awayScore;
  const margin = homeScore - awayScore;

  switch (pick) {
    case 'moneyline_home':
      return homeScore > awayScore ? 'win' : 'loss';
    case 'moneyline_away':
      return awayScore > homeScore ? 'win' : 'loss';
    case 'spread_home':
      // spread is negative for favorites (e.g., -5.5)
      return (margin + (spread ?? 0)) > 0 ? 'win' : 'loss';
    case 'spread_away':
      return (margin + (spread ?? 0)) < 0 ? 'win' : 'loss';
    case 'over':
      return totalPoints > (totalLine ?? 0) ? 'win' : 'loss';
    case 'under':
      return totalPoints < (totalLine ?? 0) ? 'win' : 'loss';
    default:
      return 'loss';
  }
}
```

### Pattern 3: Statistics Computation from Predictions Table
**What:** Compute stats directly from the predictions table rather than maintaining a separate aggregation table
**When to use:** Statistics dashboard queries
**Example:**
```typescript
// src/lib/statistics.ts
interface StatsResult {
  totalPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  roi: number;
  currentStreak: { type: 'win' | 'loss'; count: number };
  profitHistory: { date: string; cumProfit: number; pickCount: number }[];
}

export async function getStatistics(
  sport?: string,
  days?: number // 7, 30, or undefined for all time
): Promise<StatsResult> {
  if (!supabase) return defaultStats();

  let query = supabase
    .from('predictions')
    .select('id, result, odds, settled_at, sport, match_date')
    .eq('status', 'settled')
    .eq('published_site', true)
    .order('settled_at', { ascending: true });

  if (sport && sport !== 'all') {
    query = query.eq('sport', sport);
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte('settled_at', since.toISOString());
  }

  const { data } = await query;
  if (!data || data.length === 0) return defaultStats();

  // Compute stats
  const wins = data.filter(p => p.result === 'win').length;
  const losses = data.filter(p => p.result === 'loss').length;
  const pushes = data.filter(p => p.result === 'push').length;
  const totalPicks = wins + losses + pushes;
  const winRate = totalPicks > 0 ? (wins / (wins + losses)) * 100 : 0;

  // ROI: flat 1 unit per bet
  // profit per win = odds - 1, loss = -1, push = 0
  let totalProfit = 0;
  for (const p of data) {
    if (p.result === 'win') totalProfit += (p.odds - 1);
    else if (p.result === 'loss') totalProfit -= 1;
    // push = 0
  }
  const roi = totalPicks > 0 ? (totalProfit / totalPicks) * 100 : 0;

  // Current streak (from most recent backward)
  const reversed = [...data].reverse();
  let streakType = reversed[0]?.result as 'win' | 'loss';
  let streakCount = 0;
  for (const p of reversed) {
    if (p.result === streakType) streakCount++;
    else break;
  }

  // Profit history for chart
  let cumProfit = 0;
  let pickCount = 0;
  const profitHistory = data.map(p => {
    pickCount++;
    if (p.result === 'win') cumProfit += (p.odds - 1);
    else if (p.result === 'loss') cumProfit -= 1;
    const dateStr = new Date(p.settled_at || p.match_date).toISOString().split('T')[0];
    return { date: dateStr, cumProfit: Math.round(cumProfit * 100) / 100, pickCount };
  });

  return {
    totalPicks, wins, losses, pushes,
    winRate: Math.round(winRate * 10) / 10,
    roi: Math.round(roi * 10) / 10,
    currentStreak: { type: streakType, count: streakCount },
    profitHistory,
  };
}
```

### Pattern 4: Recharts Profit Chart
**What:** Interactive line chart for cumulative profit over time
**When to use:** Statistics dashboard
**Example:**
```tsx
// src/components/statistics/ProfitChart.tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DataPoint {
  date: string;
  cumProfit: number;
  pickCount: number;
}

interface Props {
  data: DataPoint[];
}

export default function ProfitChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border, #374151)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--t-text-sec, #9ca3af)', fontSize: 12 }}
          tickFormatter={(d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
        />
        <YAxis
          tick={{ fill: 'var(--t-text-sec, #9ca3af)', fontSize: 12 }}
          tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}u`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--t-bg-card, #1f2937)',
            border: '1px solid var(--t-border, #374151)',
            borderRadius: '8px',
            color: 'var(--t-text, #f9fafb)',
          }}
          formatter={(value: number) => [`${value > 0 ? '+' : ''}${value} units`, 'Profit']}
        />
        <Line
          type="monotone"
          dataKey="cumProfit"
          stroke="var(--brand-primary, #0F766E)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: 'var(--brand-primary, #0F766E)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Anti-Patterns to Avoid
- **Separate predictions pages per sport:** Decision is a single page with sport tabs. Do NOT create `/en/predictions/basketball/` and `/en/predictions/football/`.
- **Hardcoded football in queries:** Currently `getTodayPredictions()` hardcodes `.eq('sport', 'football')`. Must be parameterized.
- **Maintaining separate stats aggregation table:** The `prediction_stats` table exists in the schema but computing on-read from predictions is simpler and avoids sync bugs. Only use if query performance degrades.
- **Canvas-based charts:** Stick with SVG (Recharts) -- it matches the site's dark/light theme via CSS vars better than canvas.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive chart with tooltips | Custom SVG chart | Recharts `<LineChart>` + `<Tooltip>` | Responsive sizing, animations, touch support, axis formatting -- weeks of work to replicate |
| Date range filtering | Custom date math | Supabase `.gte()` with calculated ISO dates | Database handles timezone edge cases |
| Responsive chart container | CSS media queries | Recharts `<ResponsiveContainer>` | Handles resize events, debouncing, and container queries automatically |
| NBA API client | Raw fetch calls | Structured module mirroring api-football.ts | Same auth pattern, same error handling, same rate limiting |

**Key insight:** The predictions-worker already solves the hardest problems (rate limiting, team upsert, AI generation, result resolution). NBA extends these patterns rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: NBA Has No Draws
**What goes wrong:** Football resolution logic handles draws. NBA games always have a winner (overtime rules). Using football resolver for NBA would create false "draw" results.
**Why it happens:** Copy-pasting football resolution logic without adapting for basketball rules.
**How to avoid:** Create separate `determineNbaResult()` function. NBA moneyline always resolves to win/loss. Spread bets use half-point lines (e.g., -5.5) to avoid pushes.
**Warning signs:** Any NBA prediction with result='push' on moneyline is a bug.

### Pitfall 2: API-Basketball vs API-NBA Confusion
**What goes wrong:** API-Sports offers TWO basketball APIs: `api-basketball` (covers all leagues worldwide) and `api-nba` (NBA-specific with more detail). They have different base URLs and slightly different response shapes.
**Why it happens:** The naming is confusing. The project requirements say "API-Basketball or API-Football."
**How to avoid:** Use **API-Basketball** (`v1.basketball.api-sports.io`) since it uses the same API key as API-Football and has odds support. The NBA league ID in API-Basketball is **12** (NBA, USA). The same `x-apisports-key` header works across all api-sports APIs.
**Warning signs:** Getting 403 errors when using a different base URL or auth header.

### Pitfall 3: NBA Spread and Total Line Storage
**What goes wrong:** The predictions table has an `odds` column for the decimal odds but no columns for spread value (e.g., -5.5) or total line (e.g., 220.5). Without these, spread and over/under bets cannot be resolved.
**Why it happens:** The schema was designed for football where picks are simpler (home/away/draw at given odds).
**How to avoid:** Add `spread_line DECIMAL(5,1)` and `total_line DECIMAL(5,1)` columns to the predictions table via migration. Store these when creating NBA predictions so the resolver can use them.
**Warning signs:** NBA spread/total predictions that can never be resolved because there's no line to compare against.

### Pitfall 4: Recharts in Astro Island SSR
**What goes wrong:** Recharts uses browser APIs (window, document) and will crash during SSR. If the stats page tries to server-render the chart, the build breaks.
**Why it happens:** Astro pre-renders pages by default.
**How to avoid:** Use `client:load` or `client:visible` on the statistics island. Never import Recharts in server-side Astro code. The entire statistics dashboard should be a single React island.
**Warning signs:** Build errors mentioning "window is not defined" or "document is not defined."

### Pitfall 5: NBA Season Calendar
**What goes wrong:** The NBA regular season runs October to April, playoffs April to June. During the offseason (July-September), there are no games. The worker would fetch zero fixtures daily for months.
**Why it happens:** Unlike European football which has multiple leagues with staggered schedules, NBA has one league with clear off/on periods.
**How to avoid:** Handle gracefully -- log "No NBA games today" without errors. Show an empty state on the frontend ("NBA season starts in October" or similar). Do NOT disable the worker cron during offseason; just let it skip NBA when no games are found.
**Warning signs:** Error logs filling up during summer months about "no fixtures found."

### Pitfall 6: Mixed Sport Sorting on Homepage
**What goes wrong:** Homepage shows "Today's Predictions" with both sports mixed. If sorted by match_date only, NBA tipoff times (US evening = PH morning next day) may sort oddly compared to European football kickoffs.
**Why it happens:** NBA games tip off at 7-10pm ET (7:30am-10:30am PHT next day) while European football is afternoon PHT.
**How to avoid:** Store all times in UTC in the database (already the case with TIMESTAMPTZ). Sort by `match_date ASC` -- this naturally interleaves by time. Just ensure the timezone display uses PHT consistently.
**Warning signs:** Games appearing out of chronological order.

## Code Examples

### API-Basketball Games Endpoint
```typescript
// workers/predictions-worker/src/api-basketball.ts
const API_BASE = 'https://v1.basketball.api-sports.io';

// NBA league ID in API-Basketball
export const NBA_LEAGUE = {
  id: 12,
  name: 'NBA',
  slug: 'nba',
  season: '2025-2026', // API-Basketball uses season format "YYYY-YYYY"
} as const;

export async function fetchNbaGames(
  apiKey: string,
  date: string // YYYY-MM-DD
): Promise<ApiBasketballGame[]> {
  const url = `${API_BASE}/games?league=${NBA_LEAGUE.id}&season=${NBA_LEAGUE.season}&date=${date}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!res.ok) {
    console.error(`API-Basketball error: ${res.status}`);
    return [];
  }
  const data = await res.json() as { response: ApiBasketballGame[] };
  return data.response;
}

export async function fetchNbaOdds(
  apiKey: string,
  gameId: number
): Promise<NbaOdds | null> {
  const url = `${API_BASE}/odds?game=${gameId}`;
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Parse spread, moneyline, totals from first bookmaker
  // ...
  return parsedOdds;
}
```

### NBA Game Response Shape (API-Basketball)
```typescript
// Based on API-Sports Basketball documentation patterns
interface ApiBasketballGame {
  id: number;
  date: string;        // ISO datetime
  timestamp: number;
  status: {
    short: string;     // "NS" (not started), "Q1"-"Q4", "OT", "FT" (finished), "HT"
    long: string;
  };
  league: {
    id: number;        // 12 for NBA
    name: string;
    type: string;
    season: string;
  };
  country: {
    id: number;
    name: string;      // "USA"
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  scores: {
    home: { total: number | null };
    away: { total: number | null };
  };
}
```

### Database Migration for NBA Support
```sql
-- 004_nba_support.sql

-- Add spread and total line columns for NBA predictions
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS spread_line DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS total_line DECIMAL(5,1);

-- Add NBA conference to teams table for badge display
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS conference TEXT CHECK (conference IN ('Eastern', 'Western'));

-- Seed NBA league
INSERT INTO public.leagues (name, slug, sport, country, api_source, api_league_id, is_active)
VALUES ('NBA', 'nba', 'basketball', 'USA', 'api-sports', 12, true)
ON CONFLICT (slug) DO NOTHING;

-- Index for stats queries (sport + status + settled_at)
CREATE INDEX IF NOT EXISTS idx_predictions_stats
  ON public.predictions (sport, status, settled_at)
  WHERE status = 'settled' AND published_site = true;
```

### Statistics Dashboard Island
```tsx
// src/components/statistics/StatsDashboard.tsx
// This is the main React island for the statistics page
// Uses client:load in the Astro page

export default function StatsDashboard({ lang }: { lang: 'tl' | 'en' }) {
  const [sport, setSport] = useState<string>('all');
  const [period, setPeriod] = useState<number | null>(null); // null = all time
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats when filters change
  useEffect(() => {
    fetchStats(sport, period).then(setStats).finally(() => setLoading(false));
  }, [sport, period]);

  return (
    <div>
      {/* Sport tabs: All | Football | Basketball */}
      {/* Time period chips: 7d | 30d | All Time */}
      {/* Hero stat cards: Win Rate, ROI, Streak */}
      {/* Profit chart (Recharts) */}
      {/* Recent picks table */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `sport: 'football'` in worker | Sport-parameterized worker with multiple sport modules | This phase | Enables NBA and future sports |
| No statistics page | React island with Recharts chart | This phase | Users can track performance |
| PredictionList football-only | Sport tabs in PredictionList | This phase | Unified predictions experience |
| Recharts 2.x | Recharts 3.x (current) | 2024 | Better React 19 support, improved performance |

## Open Questions

1. **API-Basketball exact NBA season format**
   - What we know: API-Basketball uses season format like "2025-2026" for NBA (vs API-Football using just "2025")
   - What's unclear: Exact season string for current 2025-2026 NBA season -- needs verification with a test API call
   - Recommendation: Make season configurable in NBA_LEAGUE constant, test with a real API call during implementation

2. **API-Basketball odds format**
   - What we know: API-Basketball has an odds endpoint similar to API-Football
   - What's unclear: Exact response shape for spread, moneyline, totals -- documentation is JS-rendered and couldn't be fetched
   - Recommendation: Make a test API call during implementation to see actual response shape, build parser accordingly

3. **API rate limits with both sports**
   - What we know: Free tier is 100 requests/day. The worker currently uses ~10-15 requests per football run (5 leagues + odds). Adding NBA adds more.
   - What's unclear: Whether 100/day is sufficient for both sports + resolution polling
   - Recommendation: NBA is a single league, so adds only 1-2 fetch calls + odds calls. Total should stay under 100/day. Monitor and upgrade plan if needed.

4. **Conference data availability**
   - What we know: User wants Eastern/Western conference badges on NBA cards
   - What's unclear: Whether API-Basketball returns conference info in the game response or if it needs a separate teams endpoint call
   - Recommendation: Check during implementation. Worst case, hardcode a conference lookup table (30 NBA teams rarely change conferences)

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `workers/predictions-worker/src/` -- all source files read and analyzed
- Existing Supabase schema: `supabase/migrations/00000000000000_foundation.sql` -- predictions, prediction_stats, leagues, teams tables
- Existing React components: `src/components/predictions/PredictionList.tsx`, `LeagueFilter.tsx`
- Existing SportTabs: `src/components/SportTabs.astro` -- already has basketball/football/boxing tabs

### Secondary (MEDIUM confidence)
- [API-Sports Basketball docs](https://api-sports.io/documentation/basketball/v1) -- endpoints confirmed: Games, Odds, Leagues, Teams, Standings
- [API-Sports pricing](https://api-sports.io/) -- free tier: 100 requests/day, same key for all sports APIs
- [Recharts npm](https://www.npmjs.com/package/recharts) -- v3.7.0, ~60KB gzipped
- [Recharts bundle size issue](https://github.com/recharts/recharts/issues/3697) -- confirms ~180KB min / ~60KB gzipped

### Tertiary (LOW confidence)
- NBA league ID = 12 in API-Basketball -- based on API-Sports ecosystem patterns, needs verification with test call
- API-Basketball game status codes (FT for finished) -- inferred from API-Football patterns, same provider
- Season format "2025-2026" -- common for basketball APIs but needs verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Recharts is well-documented, Supabase already in use, React already in use
- Architecture: HIGH - Extending existing patterns (worker, React islands, Supabase queries) -- no new paradigms
- API integration: MEDIUM - API-Basketball follows API-Football patterns but exact response shapes need runtime verification
- Pitfalls: HIGH - Based on direct analysis of existing code and basketball domain knowledge

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable stack, no fast-moving dependencies)
