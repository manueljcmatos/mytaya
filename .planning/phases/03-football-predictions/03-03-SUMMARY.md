---
phase: 03-football-predictions
plan: 03
subsystem: ui
tags: [react, supabase, astro, i18n, seo, json-ld, predictions, football]

# Dependency graph
requires:
  - phase: 03-football-predictions
    provides: PredictionList island patterns, prediction query helpers, i18n keys, listing pages
provides:
  - PredictionDetail React island with full prediction analysis, result display, and SportsEvent JSON-LD
  - Bilingual [slug] detail pages at /tl/hula/[slug] and /en/predictions/[slug]
  - Server-side SportsEvent schema via buildSportsEventSchema for SEO
  - Proper hreflang cross-linking between Filipino and English detail pages
affects: [04-basketball-boxing, 05-blog-content, 06-prediction-cards]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-side JSON-LD via Astro frontmatter + client-side injection, Supabase join queries for team/league names]

key-files:
  created:
    - src/components/predictions/PredictionDetail.tsx
    - src/pages/tl/hula/[slug].astro
    - src/pages/en/predictions/[slug].astro
  modified:
    - src/i18n/routes.ts

key-decisions:
  - "Hardcoded bilingual translations in PredictionDetail React island (consistent with PredictionList pattern)"
  - "Dual SportsEvent JSON-LD: server-side in Astro frontmatter + client-side injection from React island (search engines deduplicate)"
  - "Supabase join queries for team/league names in both Astro frontmatter and React island"
  - "Custom hreflang tags in page slot override Layout defaults for correct /hula/ <-> /predictions/ mapping"

patterns-established:
  - "Prediction detail pattern: Astro [slug] page with getStaticPaths + React client:load island for interactivity"
  - "SEO-heavy page pattern: server-side schema in Astro + client-side enrichment in React island"

requirements-completed: [FTBL-05]

# Metrics
duration: 2min
completed: 2026-03-07
---

# Phase 3 Plan 3: Prediction Detail Pages Summary

**Bilingual prediction detail pages with full analysis, SportsEvent JSON-LD schema, match info with team/league joins, and WIN/LOSS result display on permanent URLs**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T21:16:58Z
- **Completed:** 2026-03-07T21:19:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- PredictionDetail React island fetches prediction by slug with joined team/league names, displays match header, prediction box (pick/odds/confidence/stake), full bilingual analysis, and WIN/LOSS result section
- Bilingual [slug] pages with getStaticPaths querying Supabase for published football predictions
- SportsEvent JSON-LD injected both server-side (Astro frontmatter) and client-side (React useEffect) for maximum SEO coverage
- Proper hreflang cross-linking between /tl/hula/[slug] and /en/predictions/[slug] with custom slot overrides
- Route prefix matching confirmed working for slug subpaths in language switcher

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PredictionDetail React island** - `66645b8` (feat)
2. **Task 2: Create [slug] Astro pages and update i18n route mapping** - `69a1f54` (feat)

## Files Created/Modified
- `src/components/predictions/PredictionDetail.tsx` - React island for individual prediction detail with analysis, result display, and JSON-LD
- `src/pages/tl/hula/[slug].astro` - Filipino prediction detail page with server-side SEO
- `src/pages/en/predictions/[slug].astro` - English prediction detail page with server-side SEO
- `src/i18n/routes.ts` - Added comment confirming prefix matching handles slug subpaths

## Decisions Made
- Hardcoded bilingual translations in PredictionDetail React island (consistent with PredictionList and LeadCaptureForm pattern)
- Dual SportsEvent JSON-LD injection: server-side in Astro for crawlers that don't render JS, client-side for enrichment after data load
- Custom hreflang tags via Layout head slot to override Layout's default hreflang which doesn't handle route translation (/hula/ vs /predictions/)
- Supabase join queries (teams, leagues foreign keys) for team and league names in both frontmatter and island

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All football prediction pages complete (worker, listing, detail)
- Phase 3 fully delivered: prediction generation worker + bilingual listing + detail pages
- Ready for Phase 4 (basketball/boxing) or Phase 5 (blog content)

## Self-Check: PASSED

All 4 files verified present. Both task commits (66645b8, 69a1f54) verified in git log.

---
*Phase: 03-football-predictions*
*Completed: 2026-03-07*
