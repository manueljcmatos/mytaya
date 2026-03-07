---
phase: 04-nba-predictions-statistics
plan: 02
subsystem: ui
tags: [react, astro, supabase, predictions, nba, basketball, sport-filtering]

# Dependency graph
requires:
  - phase: 03-football-predictions
    provides: PredictionList, PredictionCard, PredictionDetail, prediction queries
provides:
  - Sport-parameterized prediction queries (getTodayPredictions, getPastPredictions, getLeagues)
  - Sport tabs (All Sports/Football/Basketball) in PredictionList
  - NBA pick type display (ML, SPREAD, O/U) with spread/total line values
  - Sport-aware detail pages generating paths for all sports
affects: [04-nba-predictions-statistics, statistics-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [sport-parameterized queries, NBA pick type mapping, sport-conditional display]

key-files:
  created: []
  modified:
    - src/lib/predictions.ts
    - src/components/predictions/PredictionList.tsx
    - src/components/predictions/PredictionCard.astro
    - src/components/predictions/PredictionDetail.tsx
    - src/pages/en/predictions/[slug].astro
    - src/pages/tl/hula/[slug].astro
    - src/i18n/ui.ts

key-decisions:
  - "Sport tabs as pill buttons above Today/Past tabs for clear visual hierarchy"
  - "NBA sport badge uses orange accent color to distinguish from teal football badge"
  - "Spread/total line values displayed inline with pick type badge on cards"

patterns-established:
  - "Sport filtering: optional sport param defaults to all sports, sport !== 'all' adds .eq filter"
  - "NBA pick type mapping: moneyline_home/away -> ML, spread_home/away -> SPREAD, over/under -> O/U"

requirements-completed: [BASK-02]

# Metrics
duration: 5min
completed: 2026-03-07
---

# Phase 4 Plan 02: NBA Predictions Frontend Summary

**Sport-aware predictions frontend with sport tabs, NBA pick type display (ML/SPREAD/O/U), and spread/total line values on cards and detail pages**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-07T22:00:37Z
- **Completed:** 2026-03-07T22:05:53Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Removed all hardcoded `.eq('sport', 'football')` from frontend queries, making predictions sport-agnostic
- Added sport tabs (All Sports/Football/Basketball) to PredictionList with sport-filtered league queries
- NBA pick types display with readable labels (ML, SPREAD, O/U) and spread/total line values
- Detail pages now generate paths for both football and basketball predictions with sport-aware JSON-LD

## Task Commits

Each task was committed atomically:

1. **Task 1: Sport-parameterize queries and add sport tabs to PredictionList** - `ece0306` (feat)
2. **Task 2: Update prediction cards and detail pages for NBA display** - `eec0041` (feat)

## Files Created/Modified
- `src/lib/predictions.ts` - Sport-parameterized getTodayPredictions, getPastPredictions, getLeagues; added sport/spread_line/total_line to PREDICTION_FIELDS
- `src/components/predictions/PredictionList.tsx` - Sport tabs, sport state, NBA pick type map, sport icon indicators, sport-filtered queries
- `src/components/predictions/PredictionCard.astro` - Sport/spread_line/total_line props, sport icon badge, NBA pick type labels with line values
- `src/components/predictions/PredictionDetail.tsx` - Sport badge with basketball orange accent, spread/total line info section, NBA pick type map, bilingual NBA terms
- `src/pages/en/predictions/[slug].astro` - Removed football-only filter from getStaticPaths, sport-aware SportsEvent schema
- `src/pages/tl/hula/[slug].astro` - Removed football-only filter from getStaticPaths, sport-aware SportsEvent schema
- `src/i18n/ui.ts` - Added sport filtering keys and statistics page keys (for Plan 03)

## Decisions Made
- Sport tabs styled as pill buttons above the Today/Past tabs for clear visual hierarchy
- NBA sport badge uses orange accent color (#f97316) to distinguish from teal football branding
- Spread/total line values displayed inline with pick type badge on prediction cards
- SportsEvent JSON-LD dynamically sets sport based on prediction.sport field

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Frontend is fully sport-aware, ready for NBA predictions to appear alongside football
- Statistics page i18n keys pre-added for Plan 03
- All existing football functionality unchanged

---
*Phase: 04-nba-predictions-statistics*
*Completed: 2026-03-07*
