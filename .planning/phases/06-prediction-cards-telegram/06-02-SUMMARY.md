---
phase: 06-prediction-cards-telegram
plan: 02
subsystem: infra
tags: [telegram-bot, cron, drip-publishing, og-image, download-button, cloudflare-workers]

# Dependency graph
requires:
  - phase: 06-prediction-cards-telegram
    provides: card-gen.ts for PNG generation, R2 storage, card_image_url on predictions
  - phase: 03-football-predictions
    provides: predictions pipeline and resolver in predictions-worker
  - phase: 04-nba-predictions
    provides: NBA pipeline and resolver in predictions-worker
provides:
  - Telegram Bot API integration (sendPredictionToTelegram, sendResultToTelegram, sendDailyRecap)
  - Hourly cron drip publishing of predictions 2-3h before match time
  - Daily recap message at 23:00 PHT with record, streak, and ROI
  - OG image integration on prediction detail pages (EN + TL)
  - Download button for prediction card PNG on detail pages
affects: [07-pba-boxing-manual plan (any new sport needs telegram hooks)]

# Tech tracking
tech-stack:
  added: []
  patterns: [Raw Telegram Bot HTTP API (no SDK), bilingual captions, non-blocking Telegram calls]

key-files:
  created:
    - workers/predictions-worker/src/telegram.ts
  modified:
    - workers/predictions-worker/src/index.ts
    - workers/predictions-worker/src/resolver.ts
    - workers/predictions-worker/wrangler.toml
    - src/pages/en/predictions/[slug].astro
    - src/pages/tl/hula/[slug].astro

key-decisions:
  - "Raw Telegram Bot HTTP API used (no SDK) to keep worker bundle small"
  - "Drip publishing window is 2-3 hours before match kickoff via hourly cron"
  - "Daily recap sent at 23:00 PHT (end of day) with record, streak, and ROI"
  - "Result cards posted to Telegram by re-fetching card_image_url after result card generation"
  - "Blog pages do not exist yet -- skipped blog OG integration per plan step 3"

patterns-established:
  - "Telegram as non-blocking distribution: all calls in try/catch, never disrupts pipelines"
  - "OG image pattern: card_image_url passed as ogImage prop to Layout, Layout handles absolute URLs"

requirements-completed: [CARD-03, TELE-01, TELE-02, TELE-03]

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 6 Plan 02: Telegram Publishing & OG Images Summary

**Telegram channel drip publishing with bilingual captions, result posting, daily recaps, and card PNG as OG image with download button on prediction pages**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T00:32:39Z
- **Completed:** 2026-03-08T00:36:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Telegram bot module with raw HTTP API for sendPhoto, sendMessage, bilingual prediction/result captions
- Hourly cron drip publishes predictions 2-3h before match, daily recap at 23:00 PHT with record/streak/ROI
- Result cards automatically posted to Telegram after football and NBA settlement
- Prediction detail pages (EN + TL) use card_image_url as OG image for social sharing
- Download button on prediction pages lets users save card PNG

## Task Commits

Each task was committed atomically:

1. **Task 1: Telegram bot module with drip scheduling and result posting** - `fc78a2f` (feat)
2. **Task 2: Frontend OG image integration and download button** - `5b5d34b` (feat)

## Files Created/Modified
- `workers/predictions-worker/src/telegram.ts` - Telegram Bot API integration with sendPhoto, sendMessage, captions, drip publishing, daily recap
- `workers/predictions-worker/src/index.ts` - Hourly cron dispatch for publishDuePredictions and sendDailyRecap
- `workers/predictions-worker/src/resolver.ts` - sendResultToTelegram calls after football and NBA settlement
- `workers/predictions-worker/wrangler.toml` - Added hourly cron trigger "0 * * * *"
- `src/pages/en/predictions/[slug].astro` - card_image_url as ogImage, "Download Card" button
- `src/pages/tl/hula/[slug].astro` - card_image_url as ogImage, "I-download ang Card" button

## Decisions Made
- Used raw Telegram Bot HTTP API (fetch-based, no SDK) to keep worker bundle small and avoid dependencies
- Drip publishing window is 2-3 hours before match kickoff, checked every hour via cron
- Daily recap sent at 23:00 PHT by checking PHT hour in the hourly cron handler
- Result card Telegram posting re-fetches card_image_url from DB after result card generation to get the updated URL
- Blog detail pages do not exist yet, so blog OG integration was skipped (plan step 3 was conditional)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- Set Telegram secrets: `wrangler secret put TELEGRAM_BOT_TOKEN` and `wrangler secret put TELEGRAM_CHANNEL_ID`
- Create a Telegram bot via @BotFather and add it as admin to the target channel

## Next Phase Readiness
- Phase 6 (Prediction Cards & Telegram) is fully complete
- All prediction/resolution pipelines generate cards, publish to Telegram, and use cards as OG images
- Ready for Phase 7 (PBA, NCAA PH, Boxing)

---
*Phase: 06-prediction-cards-telegram*
*Completed: 2026-03-07*

## Self-Check: PASSED
- All created/modified files exist on disk
- Both task commits verified (fc78a2f, 5b5d34b)
