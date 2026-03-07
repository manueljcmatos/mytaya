---
phase: 03-football-predictions
plan: 01
subsystem: infra
tags: [cloudflare-workers, api-football, workers-ai, supabase, cron, predictions]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase predictions/teams/leagues schema and RLS policies
provides:
  - Cloudflare Worker predictions pipeline (fetch, predict, resolve)
  - API-Football client for fixtures, odds, and results
  - Workers AI bilingual prediction generator
  - Match resolver for all 7 pick types
  - 5 football league seeds with api_league_id mappings
  - Teams api_team_id unique index for upsert pattern
affects: [03-football-predictions, 04-api-stats-telegram]

# Tech tracking
tech-stack:
  added: [wrangler, @cloudflare/workers-types, @supabase/supabase-js (worker)]
  patterns: [cron-triggered worker pipeline, API rate limiting with delays, AI fallback on parse failure, team upsert by api_team_id]

key-files:
  created:
    - workers/predictions-worker/wrangler.toml
    - workers/predictions-worker/package.json
    - workers/predictions-worker/tsconfig.json
    - workers/predictions-worker/src/index.ts
    - workers/predictions-worker/src/api-football.ts
    - workers/predictions-worker/src/prediction-gen.ts
    - workers/predictions-worker/src/resolver.ts
    - workers/predictions-worker/src/supabase.ts
    - workers/predictions-worker/src/types.ts
    - supabase/migrations/003_seed_leagues.sql
  modified: []

key-decisions:
  - "Workers AI with @cf/meta/llama-3.1-8b-instruct for bilingual prediction generation (free, Cloudflare-native)"
  - "Fallback prediction from odds when AI parsing fails"
  - "Team upsert by api_team_id with slug-conflict fallback using api_team_id suffix"
  - "Prediction slug format: league-home-vs-away-date to avoid duplicate conflicts"
  - "Default 1.9 odds for non-1X2 picks (over/under/btts) when specific odds unavailable"

patterns-established:
  - "Rate limiting: 1100ms delay between API-Football calls for free tier compliance"
  - "AI response parsing: extract JSON with regex, validate fields, provide fallback"
  - "Worker cron dispatch: switch on controller.cron string for multi-schedule handlers"

requirements-completed: [FTBL-01, FTBL-03]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 3 Plan 1: Predictions Worker Pipeline Summary

**Cloudflare Worker data pipeline fetching daily fixtures from API-Football, generating bilingual AI predictions via Workers AI, and auto-resolving match results on 30-min cron**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T21:09:33Z
- **Completed:** 2026-03-07T21:13:15Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Cloudflare Worker with dual cron triggers: daily prediction generation (06:00 UTC) and 30-min match resolution
- API-Football client with rate-limited calls for fixtures, odds, and results across 5 European leagues
- Workers AI bilingual prediction generator with JSON parsing, validation, and odds-based fallback
- Match resolver correctly determining win/loss for all 7 pick types (home/away/draw/over/under/btts_yes/btts_no)
- Seed migration for 5 football leagues with api_league_id mapping and teams api_team_id unique index

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Cloudflare Worker project with API-Football client and prediction generator** - `cdad79c` (feat)
2. **Task 2: Create resolver, main scheduled handler, and seed migration** - `832f505` (feat)

## Files Created/Modified
- `workers/predictions-worker/wrangler.toml` - Worker config with cron triggers and AI binding
- `workers/predictions-worker/package.json` - Worker dependencies (supabase-js, wrangler, workers-types)
- `workers/predictions-worker/tsconfig.json` - ESNext TypeScript config for Workers
- `workers/predictions-worker/src/types.ts` - Env, ApiFootballFixture, MatchContext, PredictionInsert interfaces
- `workers/predictions-worker/src/supabase.ts` - Service-role Supabase client factory
- `workers/predictions-worker/src/api-football.ts` - API-Football client with TARGET_LEAGUES, rate limiting
- `workers/predictions-worker/src/prediction-gen.ts` - Workers AI bilingual prediction with fallback
- `workers/predictions-worker/src/resolver.ts` - Match resolution with determineResult for 7 pick types
- `workers/predictions-worker/src/index.ts` - Scheduled handler, fixture selection, team upsert, prediction storage
- `supabase/migrations/003_seed_leagues.sql` - 5 football leagues seed + teams api_team_id unique index

## Decisions Made
- Used Workers AI (@cf/meta/llama-3.1-8b-instruct) over OpenAI -- free, Cloudflare-native, simpler binding
- Fallback prediction generated from odds when AI response fails to parse -- ensures pipeline never silently skips fixtures
- Team upsert uses select-then-insert with api_team_id unique index; falls back to slug-with-id-suffix on slug conflicts
- Prediction slugs include league slug prefix (e.g., premier-league-arsenal-vs-chelsea-2026-03-07) to prevent cross-league duplicates
- Non-1X2 picks (over/under/btts) default to 1.9 odds when specific market odds unavailable

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed JSDoc comment with */30 cron pattern**
- **Found during:** Task 2 (index.ts scheduled handler)
- **Issue:** JSDoc comment containing `*/30 * * * *` terminated the comment block prematurely, causing TS parse errors
- **Fix:** Converted JSDoc to line comments for the cron pattern documentation
- **Files modified:** workers/predictions-worker/src/index.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 832f505 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed Workers AI type reference**
- **Found during:** Task 1 (prediction-gen.ts)
- **Issue:** `BaseAiTextGenerationModels` type does not exist in @cloudflare/workers-types; model string not in type map for newer models
- **Fix:** Cast AI binding to `any` for model name, simplified response type handling
- **Files modified:** workers/predictions-worker/src/prediction-gen.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** cdad79c (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required

The predictions worker requires external service configuration before deployment:

**API-Football:**
- Create free account at https://www.api-football.com/pricing
- Get API key from https://dashboard.api-football.com -> My Account -> API Key
- Set via: `wrangler secret put API_FOOTBALL_KEY`

**Supabase:**
- Get Project URL from Supabase Dashboard -> Settings -> API
- Get service_role key from Supabase Dashboard -> Settings -> API -> service_role (secret)
- Set SUPABASE_URL in wrangler.toml [vars] section
- Set via: `wrangler secret put SUPABASE_SERVICE_KEY`

## Next Phase Readiness
- Worker pipeline ready for deployment once secrets configured
- Seed migration (003_seed_leagues.sql) needs to be applied to Supabase
- Frontend prediction pages (Plan 02/03) can now query populated predictions data
- Teams will be auto-created by Worker on first run via upsert pattern

## Self-Check: PASSED

All 10 created files verified present. Both task commits (cdad79c, 832f505) verified in git log.

---
*Phase: 03-football-predictions*
*Completed: 2026-03-07*
