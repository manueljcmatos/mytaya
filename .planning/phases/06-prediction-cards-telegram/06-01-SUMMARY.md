---
phase: 06-prediction-cards-telegram
plan: 01
subsystem: infra
tags: [workers-og, satori, r2, png, card-generation, cloudflare-workers]

# Dependency graph
requires:
  - phase: 03-football-predictions
    provides: predictions pipeline and resolver in predictions-worker
  - phase: 04-nba-predictions
    provides: NBA pipeline and resolver in predictions-worker
provides:
  - generatePredictionCard and generateResultCard functions for PNG card generation
  - R2 bucket binding for card image storage
  - card-templates.ts with branded HTML builders for Satori
  - telegram_message_id column on predictions table
affects: [06-prediction-cards-telegram plan 02 (Telegram bot integration)]

# Tech tracking
tech-stack:
  added: [workers-og]
  patterns: [Satori HTML templates with inline flexbox, R2 PNG upload with public URL pattern]

key-files:
  created:
    - workers/predictions-worker/src/card-gen.ts
    - workers/predictions-worker/src/card-templates.ts
    - supabase/migrations/006_telegram_support.sql
  modified:
    - workers/predictions-worker/src/types.ts
    - workers/predictions-worker/src/index.ts
    - workers/predictions-worker/src/resolver.ts
    - workers/predictions-worker/wrangler.toml
    - workers/predictions-worker/package.json

key-decisions:
  - "R2 public URL uses cards.mytaya.com placeholder constant -- user configures R2 public access"
  - "Fonts loaded from R2 at fonts/ prefix -- must be manually uploaded (BebasNeue-Regular.ttf, Inter-Regular.ttf)"
  - "Card gen uses try/catch on every call so pipeline continues on card failure"
  - "Result card overwrites prediction card URL in card_image_url (result is final state)"
  - "Resolver queries extended with teams join for team names needed by card templates"

patterns-established:
  - "Card generation as non-blocking enhancement: always try/catch, never disrupt prediction/resolution pipeline"
  - "R2 key pattern: cards/{slug}.png for predictions, cards/{slug}-result.png for results"

requirements-completed: [CARD-01, CARD-02]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 6 Plan 01: Prediction Cards Summary

**Branded 1200x630 PNG card generation via workers-og with R2 storage, hooked into all 4 prediction/resolution pipelines**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T00:26:53Z
- **Completed:** 2026-03-08T00:29:58Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Card generation module (card-gen.ts) with generatePredictionCard and generateResultCard using workers-og ImageResponse
- Branded HTML templates (card-templates.ts) with dark theme, MY+TAYA wordmark, sport-themed accent colors, confidence badges, and WIN/LOSS/PUSH result badges
- Card generation hooked into all 4 pipeline paths: football predict, NBA predict, football resolve, NBA resolve
- R2 bucket binding configured, migration for telegram_message_id column ready

## Task Commits

Each task was committed atomically:

1. **Task 1: Card generation module, templates, and infrastructure** - `fda2a77` (feat)
2. **Task 2: Hook card generation into prediction and resolution pipelines** - `2f8c3d7` (feat)

## Files Created/Modified
- `workers/predictions-worker/src/card-gen.ts` - PNG generation via workers-og, R2 upload, Supabase card_image_url update
- `workers/predictions-worker/src/card-templates.ts` - HTML template builders for prediction and result cards (Satori CSS subset)
- `supabase/migrations/006_telegram_support.sql` - Adds telegram_message_id BIGINT column to predictions
- `workers/predictions-worker/src/types.ts` - Added CARDS_BUCKET, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID to Env
- `workers/predictions-worker/wrangler.toml` - R2 bucket binding and secret comments for Telegram
- `workers/predictions-worker/package.json` - workers-og dependency added
- `workers/predictions-worker/src/index.ts` - Card generation calls after football and NBA prediction upserts
- `workers/predictions-worker/src/resolver.ts` - Result card generation calls after football and NBA settlements

## Decisions Made
- R2 public URL uses `https://cards.mytaya.com` placeholder constant -- user configures R2 public access
- Fonts loaded from R2 bucket at `fonts/` prefix -- BebasNeue-Regular.ttf and Inter-Regular.ttf must be uploaded manually
- Card generation always wrapped in try/catch so prediction/resolution pipelines are never disrupted
- Result card overwrites prediction card URL since result is the final state
- Resolver queries extended with teams table join to get team names for card templates
- Used `(pred.home_team as any)?.name` cast for Supabase join type compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- Upload fonts to R2 bucket: `fonts/BebasNeue-Regular.ttf` and `fonts/Inter-Regular.ttf`
- Create R2 bucket `mytaya-cards` via Cloudflare dashboard
- Configure R2 public access with custom domain `cards.mytaya.com`
- Set secrets: `wrangler secret put TELEGRAM_BOT_TOKEN` and `wrangler secret put TELEGRAM_CHANNEL_ID`

## Next Phase Readiness
- Card generation infrastructure complete, ready for Plan 02 (Telegram bot integration)
- telegram_message_id column prepared for tracking sent messages
- TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID already declared in Env and wrangler.toml

---
*Phase: 06-prediction-cards-telegram*
*Completed: 2026-03-07*

## Self-Check: PASSED
- All created files exist on disk
- Both task commits verified (fda2a77, 2f8c3d7)
