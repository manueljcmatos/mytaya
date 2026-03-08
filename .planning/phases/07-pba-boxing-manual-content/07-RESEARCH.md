# Phase 7: PBA, Boxing & Manual Content - Research

**Researched:** 2026-03-07
**Domain:** Manual prediction entry, Philippine basketball leagues, boxing editorial content
**Confidence:** HIGH

## Summary

Phase 7 extends the existing prediction system to support manually-entered predictions for Philippine-identity sports (PBA, NCAA Philippines/UAAP, boxing) that lack reliable automation APIs. The core technical challenge is minimal: the database schema, card generation pipeline, Telegram publishing, and blog generation already handle predictions generically. Manual predictions entered via Supabase dashboard just need to land in the same `predictions` table with the correct fields and they automatically flow through the entire pipeline (card generation, Telegram drip publishing, result card posting, blog article generation).

The main new work falls into three categories: (1) database seeding for PBA/NCAA PH leagues and boxing, plus schema additions for boxing-specific fighter data, (2) frontend updates to add league filtering within basketball and a dedicated boxing section with fight card display, and (3) type system updates to accept `boxing` as a valid sport throughout the worker pipeline.

**Primary recommendation:** Extend the existing predictions table with boxing-specific nullable columns (fighter records, weight class, rounds), seed PBA/NCAA PH/boxing leagues, update TypeScript types to accept `boxing` sport, and build a boxing fight card UI component. No new worker pipelines or admin UIs needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Predictions created directly via Supabase dashboard table editor -- no custom admin page or CLI needed
- Solo operator (single author) -- no multi-user roles or access control required
- Manual predictions are first-class citizens in the existing pipeline: card generation (PNG via workers-og), Telegram drip publishing, and blog article generation all trigger automatically
- Resolution is manual via Supabase -- update the result field directly after match/fight ends, existing 30-min cron handles result card generation and Telegram result posting
- Database schema must support manual entry: fields like match_date, home_team, away_team (or fighter names for boxing), league, pick, odds, confidence, analysis text (bilingual) should be insertable via Supabase UI

### Claude's Discretion
- Boxing fight card visual layout and fighter profile display format
- How PBA/NCAA PH predictions coexist with NBA in the basketball section (tab structure, league grouping)
- How bilingual editorial content fields are structured in the database
- Whether boxing gets its own dedicated page/section or integrates into existing predictions flow
- Visual differentiation between automated and manual predictions (if any)
- PBA/NCAA team seeding in the teams table

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BASK-04 | PBA predictions can be created manually with full match details and analysis | Seed PBA league in leagues table; PBA teams inserted on-demand via Supabase; predictions table already has all needed fields for manual basketball entry |
| BASK-05 | NCAA Philippines / UAAP predictions can be created manually | Seed NCAA PH and UAAP leagues; same manual entry workflow as PBA via Supabase dashboard |
| BASK-06 | User can filter predictions by league (NBA, PBA, NCAA PH) on the basketball predictions page | LeagueFilter component already exists and works when sport=basketball is selected; just needs PBA/NCAA PH leagues in DB to appear |
| BOX-01 | Boxing predictions can be created manually as editorial content | Predictions table already supports sport='boxing'; need to ensure worker types accept boxing; manual entry via Supabase |
| BOX-02 | Each boxing prediction includes fighter profiles, records, odds, and analysis | Add boxing-specific nullable columns to predictions table (fighter_1_record, fighter_2_record, weight_class, scheduled_rounds); analysis fields already exist bilingual |
| BOX-03 | Boxing predictions are displayed in a dedicated section with fight card format | New boxing page with fight card layout component; distinct from team-sport prediction cards |
| BOX-04 | Boxing content is available in both Filipino and English | Existing bilingual columns (pick_label_tl/en, analysis_tl/en) handle this; new boxing columns are language-neutral (records, weight class) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | (existing) | Static site framework | Already used throughout project |
| React | (existing) | Interactive islands | PredictionList, PredictionDetail pattern |
| Supabase JS | (existing) | Database client | Already used for all data access |
| workers-og | (existing) | Card PNG generation | Already generates prediction/result cards |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | (existing) | Client-side data fetching | React islands pattern for boxing/prediction pages |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Boxing-specific table | Nullable columns on predictions | Predictions table is the single source of truth; boxing columns are nullable so they don't affect basketball/football entries. A separate table would break the pipeline integration. |
| Dedicated boxing worker | Manual entry via Supabase | No boxing API exists (confirmed in Out of Scope); manual is the only viable approach |

**Installation:**
No new packages needed. All infrastructure exists.

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
  007_boxing_and_ph_leagues.sql     # New columns + league seeds

src/pages/
  en/boxing/index.astro             # Boxing section page
  tl/boksing/index.astro            # Boxing section page (TL)
  en/boxing/[slug].astro            # Boxing prediction detail
  tl/boksing/[slug].astro           # Boxing prediction detail (TL)

src/components/boxing/
  FightCard.tsx                      # Fight card display component (React island)
  FighterProfile.tsx                 # Fighter stats within fight card

workers/predictions-worker/src/
  types.ts                           # Extended: sport union includes 'boxing'
  card-templates.ts                  # Extended: boxing card template
```

### Pattern 1: Manual Entry via Supabase Dashboard
**What:** Operator inserts prediction rows directly in Supabase table editor. No admin UI needed.
**When to use:** PBA, NCAA PH, UAAP basketball predictions and all boxing predictions.
**How it works:** The operator fills in fields manually:
- `slug`: e.g., `pba-ginebra-vs-tnkp-tropang-giga-2026-03-15`
- `league_id`: select from leagues table (PBA, NCAA PH, etc.)
- `home_team_id` / `away_team_id`: select or create teams
- `match_date`: game date/time in ISO format
- `sport`: 'basketball' or 'boxing'
- `pick`, `pick_label_tl`, `pick_label_en`: manual prediction text
- `analysis_tl`, `analysis_en`: editorial analysis in both languages
- `odds`, `confidence`, `stake`: manual assignment
- `published_site`: set to `true` when ready to publish
- `api_fixture_id`: leave NULL (no API for manual sports)

**Critical:** Setting `published_site = true` makes it immediately visible. The existing hourly cron picks it up for Telegram drip publishing (2-3h before match_date). Card generation must be triggered -- see Pattern 3.

### Pattern 2: League Filtering for Basketball
**What:** The existing LeagueFilter component already filters by league_id when sport=basketball is active.
**When to use:** Already works. Just needs PBA/NCAA PH leagues seeded in DB.
**How it flows:**
1. User clicks "Basketball" sport tab in PredictionList
2. PredictionList fetches leagues where sport='basketball' and is_active=true
3. LeagueFilter renders pills for NBA, PBA, NCAA PH, UAAP
4. Clicking a league filters predictions by league_id

No code changes needed for this filtering -- it's already implemented. The leagues just need to exist in the database.

### Pattern 3: Card Generation for Manual Predictions
**What:** Manual predictions need card_image_url populated for Telegram publishing.
**When to use:** Every manual prediction that should appear on Telegram.
**Critical gap:** The current card generation happens inline during the automated prediction pipeline (in index.ts). Manual predictions bypass this pipeline entirely.

**Two approaches:**
1. **Manual card trigger via Supabase Edge Function** -- create a small Supabase Edge Function that generates a card when invoked with a prediction slug. Operator calls it after creating the prediction.
2. **Cron-based card generation** -- extend the existing 30-min resolver cron to also check for predictions with `published_site = true` and `card_image_url IS NULL`, then generate cards for them.

**Recommendation:** Option 2 (cron-based). It requires no manual step from the operator. Add a `generateMissingCards` function to the resolver cron that picks up predictions without card_image_url and generates them. This is simpler and aligns with the "manual predictions are first-class" constraint.

### Pattern 4: Boxing Fight Card Layout
**What:** Boxing predictions displayed in a fight-card format (fighter vs fighter with records, weight class, rounds).
**When to use:** Boxing section pages.
**Layout concept:**
```
+--------------------------------------------------+
|  [WEIGHT CLASS]           [SCHEDULED ROUNDS]      |
|                                                   |
|  FIGHTER 1              VS          FIGHTER 2     |
|  Record: 30-2-0                    Record: 28-1-0 |
|                                                   |
|  PICK: Fighter 1 by KO                           |
|  Odds: 1.85  |  Confidence: HIGH                 |
|                                                   |
|  Analysis text (bilingual)...                     |
+--------------------------------------------------+
```

**Data source:** The existing predictions table with boxing-specific nullable columns. Fighter names map to home_team/away_team (or use a dedicated fighters approach via teams table with boxing-specific fields).

### Pattern 5: Boxing Data Modeling
**What:** How to store boxing-specific data (fighter records, weight class, rounds) alongside the generic predictions schema.
**Recommendation:** Add nullable columns to the predictions table:
- `fighter_1_record TEXT` -- e.g., "30-2-0 (25 KO)"
- `fighter_2_record TEXT` -- e.g., "28-1-0 (20 KO)"
- `weight_class TEXT` -- e.g., "Welterweight", "Heavyweight"
- `scheduled_rounds INTEGER` -- e.g., 12

**Why not a separate table?** Boxing predictions must flow through the same pipeline as basketball/football (card gen, Telegram, blog). A separate table would require duplicating all pipeline logic. Nullable columns on the existing table mean boxing predictions are just predictions with extra metadata.

**Fighter names:** Use `home_team_id` and `away_team_id` pointing to the teams table. For boxing, "teams" are fighters. The teams table already has `name` and `slug` -- perfectly adequate for fighter names. The `league_id` field points to a boxing league (e.g., "WBC", "WBA", or generic "Boxing").

### Anti-Patterns to Avoid
- **Building a custom admin UI:** The user explicitly decided Supabase dashboard is sufficient. Don't create admin pages.
- **Creating a separate boxing predictions table:** This breaks pipeline integration. Use nullable columns on predictions.
- **Automating PBA/boxing data fetching:** No reliable APIs exist. Manual is the design choice.
- **Differentiating manual vs automated predictions visually:** Unless there's a strong reason, manual predictions should look identical to automated ones. They're all "predictions" to the end user.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card generation for manual predictions | Custom card generation endpoint | Extend existing cron to generate missing cards | Consistent with existing pipeline; no new infrastructure |
| Admin interface | Custom admin pages | Supabase dashboard table editor | User decision: solo operator, Supabase is sufficient |
| Boxing data API | Web scraper or API integration | Manual entry via Supabase | No reliable boxing APIs exist; editorial approach is the design choice |
| League filtering | New filter component | Existing LeagueFilter component | Already works; just needs league data in DB |

**Key insight:** Almost everything needed already exists. This phase is primarily about seeding data, adding nullable columns for boxing, updating types, and building one new UI component (boxing fight card display).

## Common Pitfalls

### Pitfall 1: Card Generation Gap for Manual Predictions
**What goes wrong:** Manual predictions get published_site=true but never get card_image_url, so Telegram publishing skips them or posts without images.
**Why it happens:** Card generation is currently inline in the automated pipeline, not in a standalone function accessible by cron.
**How to avoid:** Add a `generateMissingCards` function to the resolver cron that queries predictions where `published_site = true AND card_image_url IS NULL` and generates cards for each.
**Warning signs:** Predictions appearing on site but not on Telegram, or Telegram posts without images.

### Pitfall 2: TypeScript Type Narrowing for Sport
**What goes wrong:** The `PredictionInsert.sport` type is `'football' | 'basketball'` -- inserting boxing predictions through the worker will fail TypeScript checks.
**Why it happens:** Types were defined before boxing was in scope.
**How to avoid:** Update `types.ts` to include `'boxing'` in the sport union. Also update `card-templates.ts` types (`PredictionCardInput.sport`, `ResultCardInput.sport`), `BlogPostInsert.sport`, and any other sport-typed fields.
**Warning signs:** TypeScript compilation errors when the cron tries to process boxing predictions.

### Pitfall 3: Boxing Sport Tab Linking to Wrong Page
**What goes wrong:** The existing SportTabs.astro links boxing to `?sport=boxing` on the predictions page, but boxing should have its own dedicated page with fight card layout.
**Why it happens:** SportTabs was built assuming all sports share the predictions page.
**How to avoid:** Update SportTabs.astro to link boxing tab to `/en/boxing/` (or `/tl/boksing/`) instead of `?sport=boxing` on predictions.
**Warning signs:** Boxing predictions shown in generic prediction card format instead of fight card format.

### Pitfall 4: Manual Resolution Flow
**What goes wrong:** Operator forgets to set both `result` AND `status` fields when manually resolving, leaving prediction in inconsistent state.
**Why it happens:** Automated resolution sets both fields atomically, but manual resolution requires the operator to update two fields.
**How to avoid:** Document the resolution workflow clearly. Consider a Supabase database trigger that automatically sets `status = 'settled'` and `settled_at = now()` when `result` is set to a non-null value. This makes resolution a single-field operation.
**Warning signs:** Predictions with `result = 'win'` but `status = 'pending'` -- they won't appear in past results.

### Pitfall 5: PBA/NCAA PH Teams Not Pre-Seeded
**What goes wrong:** Operator has to manually create teams in the teams table before creating predictions, adding friction.
**Why it happens:** Unlike NBA where teams are auto-created by the API pipeline, PBA/NCAA PH teams don't come from any API.
**How to avoid:** Seed PBA and NCAA PH teams in the migration file. PBA has 12 teams, NCAA PH has 8-10. This is a one-time seed.
**Warning signs:** Operator creating duplicate team entries with slightly different names/slugs.

### Pitfall 6: Blog Generation Not Triggered for Manual Predictions
**What goes wrong:** Manual predictions don't get blog articles generated because blog generation runs in the daily cron before manual predictions exist.
**Why it happens:** Blog generation (`generateBlogArticles`) runs as part of the daily 06:00 UTC cron, immediately after automated prediction pipelines. Manual predictions are entered at arbitrary times.
**How to avoid:** Either (a) extend the blog generation cron to check for predictions without linked blog posts and generate them, or (b) accept that manual predictions may not have auto-generated blog posts (the operator can write blog posts manually via Supabase). Given the editorial nature of PBA/boxing content, manual blog posts may be preferred anyway.
**Warning signs:** PBA/boxing predictions without corresponding blog articles.

## Code Examples

### Migration: Boxing Columns and Philippine League Seeds
```sql
-- Add boxing-specific nullable columns to predictions
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS fighter_1_record TEXT,
  ADD COLUMN IF NOT EXISTS fighter_2_record TEXT,
  ADD COLUMN IF NOT EXISTS weight_class TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_rounds INTEGER;

-- Seed PBA league
INSERT INTO public.leagues (name, slug, sport, country, api_source, is_active)
VALUES ('PBA', 'pba', 'basketball', 'Philippines', 'manual', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed NCAA Philippines league
INSERT INTO public.leagues (name, slug, sport, country, api_source, is_active)
VALUES ('NCAA Philippines', 'ncaa-ph', 'basketball', 'Philippines', 'manual', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed UAAP league
INSERT INTO public.leagues (name, slug, sport, country, api_source, is_active)
VALUES ('UAAP', 'uaap', 'basketball', 'Philippines', 'manual', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Boxing league (generic -- individual sanctioning bodies are too granular)
INSERT INTO public.leagues (name, slug, sport, country, api_source, is_active)
VALUES ('Boxing', 'boxing', 'boxing', 'International', 'manual', true)
ON CONFLICT (slug) DO NOTHING;

-- Index for boxing-specific queries
CREATE INDEX IF NOT EXISTS idx_predictions_boxing
  ON public.predictions (sport, match_date)
  WHERE sport = 'boxing';
```

### Type Update: Include Boxing in Sport Union
```typescript
// types.ts - Update PredictionInsert
export interface PredictionInsert {
  // ... existing fields ...
  sport: 'football' | 'basketball' | 'boxing';
  // Boxing-specific (nullable)
  fighter_1_record?: string;
  fighter_2_record?: string;
  weight_class?: string;
  scheduled_rounds?: number;
}
```

### Card Template: Boxing Prediction Card
```typescript
// card-templates.ts - New boxing card builder
export interface BoxingCardInput {
  fighter1: string;
  fighter2: string;
  fighter1Record: string;
  fighter2Record: string;
  weightClass: string;
  scheduledRounds: number;
  matchDate: string;
  pick: string;
  odds: number;
  confidence: 'high' | 'medium' | 'low';
}

export function buildBoxingCardHtml(data: BoxingCardInput): string {
  // Satori-compatible inline flexbox layout
  // Fight card format: fighter 1 vs fighter 2 with records
  // Red accent color for boxing (#DC2626)
}
```

### Cron Extension: Generate Missing Cards
```typescript
// In resolver.ts or new file
async function generateMissingCards(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { data: uncarded } = await supabase
    .from('predictions')
    .select('slug, sport, home_team:teams!predictions_home_team_id_fkey(name), away_team:teams!predictions_away_team_id_fkey(name), league:leagues!predictions_league_id_fkey(name), match_date, pick_label_en, odds, confidence, fighter_1_record, fighter_2_record, weight_class, scheduled_rounds')
    .eq('published_site', true)
    .is('card_image_url', null)
    .limit(10);

  if (!uncarded?.length) return;

  for (const pred of uncarded) {
    // Generate card based on sport type
    // Boxing uses buildBoxingCardHtml, others use existing builders
  }
}
```

### React Component: Boxing Fight Card (simplified structure)
```tsx
// FightCard.tsx - Fight card display for boxing predictions
interface BoxingPrediction {
  id: string;
  slug: string;
  pick_label_tl: string;
  pick_label_en: string;
  analysis_tl: string | null;
  analysis_en: string | null;
  odds: number;
  confidence: string;
  match_date: string;
  fighter_1_record: string | null;
  fighter_2_record: string | null;
  weight_class: string | null;
  scheduled_rounds: number | null;
  home_team_name: string; // Fighter 1
  away_team_name: string; // Fighter 2
  result: string | null;
  status: string;
}
// Renders as fight card with fighter profiles, records, and prediction
```

### Route Map Update
```typescript
// routes.ts - Add boxing routes
tl: {
  // ... existing ...
  '/boksing/': '/boxing/',
},
en: {
  // ... existing ...
  '/boxing/': '/boksing/',
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate tables per sport | Single predictions table with sport column | Phase 1 (foundation) | All pipelines work generically; boxing predictions just add nullable columns |
| Custom admin for content entry | Supabase dashboard as admin | Project decision | No admin UI development needed |

**Deprecated/outdated:**
- No boxing APIs exist for reliable automation (confirmed in project Out of Scope). Editorial/manual approach is the only viable option.

## Open Questions

1. **PBA Team Roster for Seeding**
   - What we know: PBA has 12 active teams as of 2025-2026 season
   - What's unclear: Exact team names and whether to include historical teams
   - Recommendation: Seed current 12 PBA teams. NCAA PH and UAAP teams can be seeded with current rosters. Teams can be added manually later via Supabase.

2. **Blog Generation for Manual Predictions**
   - What we know: Current blog generation runs at 06:00 UTC as part of daily cron
   - What's unclear: Whether manual predictions should get auto-generated blog articles or manual editorial blog posts
   - Recommendation: Given the editorial nature of PBA/boxing content, the operator likely wants to write custom blog posts. Extend the cron to generate blog articles for uncovered predictions as a fallback, but don't make it a hard requirement.

3. **Boxing Sanctioning Body Granularity**
   - What we know: Boxing has multiple sanctioning bodies (WBC, WBA, IBF, WBO) plus regional organizations
   - What's unclear: Whether each sanctioning body should be a separate "league" or all boxing predictions fall under a generic "Boxing" league
   - Recommendation: Start with a single "Boxing" league. The weight_class and fight metadata provide enough differentiation. If the operator later wants to differentiate WBC vs WBA fights, additional leagues can be added.

4. **Supabase Database Trigger for Manual Resolution**
   - What we know: Manual resolution requires updating both `result` and `status` fields
   - What's unclear: Whether Supabase supports database triggers in the free tier
   - Recommendation: Implement a PostgreSQL trigger that sets `status = 'settled'` and `settled_at = now()` when `result` transitions from NULL to a value. This makes resolution a single-field operation for the operator. Supabase supports PostgreSQL triggers on all plans.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: Full read of all worker source files, migration files, frontend components, and type definitions
- Supabase migrations: Foundation schema, NBA support, blog enhancements, Telegram support
- Existing patterns: PredictionList.tsx, LeagueFilter.tsx, PredictionDetail.tsx, card-templates.ts, resolver.ts, index.ts

### Secondary (MEDIUM confidence)
- PBA league structure: 12 teams as of current season (general sports knowledge)
- PostgreSQL trigger support in Supabase: Available on all plans (training knowledge, high confidence)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed; everything extends existing infrastructure
- Architecture: HIGH - Patterns are clear extensions of existing codebase patterns
- Pitfalls: HIGH - Identified from direct code analysis of current pipeline gaps

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- no fast-moving dependencies)
