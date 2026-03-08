---
phase: 07-pba-boxing-manual-content
plan: 02
subsystem: ui, pages
tags: [boxing, astro, react, fight-card, bilingual, supabase, i18n]

requires:
  - phase: 07-pba-boxing-manual-content
    provides: Boxing database columns (fighter records, weight class, rounds), boxing card template
provides:
  - Boxing section pages (EN + TL) at /en/boxing/ and /tl/boksing/
  - FightCard component with fight-card layout and red accent
  - BoxingList React island with Supabase fetching and pagination
  - Boxing detail pages with SportsEvent schema and hreflang
  - SportTabs boxing link to dedicated section
  - Boxing route mappings for language switching
  - Boxing navigation item and i18n keys
affects: [07-03, manual-content-workflow]

tech-stack:
  added: []
  patterns:
    - "Boxing fight-card layout: red accent (#DC2626) border-left, VS divider, fighter records display"
    - "Dedicated sport section: boxing gets own pages instead of query param filtering"
    - "Supabase join flattening: Array.isArray check for team joins in client-side components"

key-files:
  created:
    - src/components/boxing/FightCard.tsx
    - src/components/boxing/BoxingList.tsx
    - src/pages/en/boxing/index.astro
    - src/pages/tl/boksing/index.astro
    - src/pages/en/boxing/[slug].astro
    - src/pages/tl/boksing/[slug].astro
  modified:
    - src/i18n/routes.ts
    - src/i18n/ui.ts
    - src/lib/constants.ts
    - src/components/SportTabs.astro

key-decisions:
  - "BoxingList uses red accent (#DC2626) for tab active state to match boxing sport branding"
  - "FightCard expandable analysis with toggle button on list, always expanded on detail page"
  - "SportTabs boxing link goes to /en/boxing/ (dedicated section) while basketball/football stay on ?sport= query param"
  - "Supabase join results flattened with Array.isArray check for compatibility"

patterns-established:
  - "Sport-specific section: sports with unique display needs get dedicated pages instead of shared predictions page"
  - "FightCard expanded prop: reusable component for both list (collapsed) and detail (expanded) contexts"

requirements-completed: [BOX-01, BOX-02, BOX-03, BOX-04]

duration: 4min
completed: 2026-03-08
---

# Phase 7 Plan 2: Boxing Section Pages Summary

**Dedicated boxing section with fight-card display, bilingual pages at /en/boxing/ and /tl/boksing/, and SportTabs routing to boxing-specific section**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T11:30:08Z
- **Completed:** 2026-03-08T11:34:25Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- FightCard component with fight-card layout showing fighter names, records, weight class, rounds, pick, odds, and result badges
- BoxingList React island with upcoming/past tabs, Supabase fetching, and load-more pagination
- Boxing section pages in both English and Filipino with boxing-specific SEO metadata
- Boxing detail pages with SportsEvent JSON-LD schema and hreflang cross-links
- SportTabs updated to link boxing to dedicated section instead of query parameter

## Task Commits

Each task was committed atomically:

1. **Task 1: Boxing section pages, BoxingList island, and FightCard component** - `01fb1e9` (feat)
2. **Task 2: Boxing detail pages, routes, i18n, and SportTabs update** - `b18c75d` (feat)

## Files Created/Modified
- `src/components/boxing/FightCard.tsx` - Fight card display with red accent, fighter profiles, expandable analysis
- `src/components/boxing/BoxingList.tsx` - Boxing predictions list with upcoming/past tabs, Supabase fetching
- `src/pages/en/boxing/index.astro` - English boxing section landing page
- `src/pages/tl/boksing/index.astro` - Filipino boxing section landing page
- `src/pages/en/boxing/[slug].astro` - English boxing detail page with SportsEvent schema
- `src/pages/tl/boksing/[slug].astro` - Filipino boxing detail page with SportsEvent schema
- `src/i18n/routes.ts` - Boxing route mappings for language switching
- `src/i18n/ui.ts` - Boxing i18n keys for titles, navigation, descriptions
- `src/lib/constants.ts` - Boxing nav item added to NAV_ITEMS
- `src/components/SportTabs.astro` - Boxing tab links to dedicated section

## Decisions Made
- BoxingList uses red accent (#DC2626) for tab active state to match boxing sport branding
- FightCard expandable analysis with toggle button on list, always expanded on detail page
- SportTabs boxing link goes to /en/boxing/ (dedicated section) while basketball/football stay on ?sport= query param
- Supabase join results flattened with Array.isArray check for compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Supabase join type mismatch in BoxingList**
- **Found during:** Task 1 (BoxingList implementation)
- **Issue:** Supabase returns FK joins as arrays, causing TypeScript type error when casting to BoxingPrediction[]
- **Fix:** Added Array.isArray flattening for home_team and away_team join results
- **Files modified:** src/components/boxing/BoxingList.tsx
- **Verification:** astro check shows no boxing-related errors
- **Committed in:** 01fb1e9 (Task 1 commit)

**2. [Rule 1 - Bug] Removed unused SPORTS import in SportTabs**
- **Found during:** Task 2 (SportTabs update)
- **Issue:** SPORTS import no longer needed after switching to explicit href config
- **Fix:** Removed unused import
- **Files modified:** src/components/SportTabs.astro
- **Committed in:** b18c75d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for type correctness and clean code. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Boxing section fully functional with fight-card display and bilingual pages
- Manual boxing predictions entered via Supabase dashboard will appear on the site
- SportTabs correctly routes users to boxing section
- Ready for Plan 03 (manual content workflow integration)

---
*Phase: 07-pba-boxing-manual-content*
*Completed: 2026-03-08*
