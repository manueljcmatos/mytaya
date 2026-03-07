---
phase: 02-seo-compliance-affiliates
plan: 02
subsystem: compliance
tags: [pagcor, responsible-gambling, 21+, astro, i18n]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Layout.astro, Footer.astro, i18n system, theme CSS custom properties
provides:
  - GamblingDisclaimer component (compact/full variants)
  - AgeNotice banner component
  - Responsible gambling pages (tl/en)
  - Footer 21+ badge and responsible gambling link
  - Compliance and lead capture i18n keys
affects: [operator-pages, prediction-pages, lead-capture]

# Tech tracking
tech-stack:
  added: []
  patterns: [compliance components with lang prop and bilingual inline text]

key-files:
  created:
    - src/components/compliance/GamblingDisclaimer.astro
    - src/components/compliance/AgeNotice.astro
    - src/pages/tl/responsableng-pagsusugal.astro
    - src/pages/en/responsible-gambling.astro
  modified:
    - src/components/Footer.astro
    - src/i18n/ui.ts

key-decisions:
  - "Inlined Organization schema since Plan 01 (seo.ts) not yet executed"
  - "Page content hardcoded in each language file rather than i18n keys (too long for translation system)"
  - "Lead capture i18n keys added in this plan to avoid ui.ts conflict with Plan 04"

patterns-established:
  - "Compliance components use lang prop with inline bilingual text objects"
  - "Long-form page content hardcoded per language file, not via i18n keys"

requirements-completed: [SEO-05, SEO-06]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 02 Plan 02: Responsible Gambling Compliance Summary

**PAGCOR-compliant responsible gambling pages (tl/en) with 21+ disclaimer components and footer updates**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T17:08:54Z
- **Completed:** 2026-03-07T17:12:06Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- GamblingDisclaimer component with compact (one-line) and full (card with hotline/resources) variants
- AgeNotice non-blocking 21+ banner for content sections
- Bilingual responsible gambling pages with PAGCOR hotline, problem gambling signs, self-exclusion resources, and MyTaya disclaimer
- Footer updated from 18+ to 21+ badge per PAGCOR requirements
- Footer now links to responsible gambling page and uses compact GamblingDisclaimer
- All compliance and lead capture i18n keys added

## Task Commits

Each task was committed atomically:

1. **Task 1: Create compliance components and responsible gambling pages** - `e9de890` (feat)
2. **Task 2: Update Footer with 21+ badge and responsible gambling link** - `82fd37f` (feat)

## Files Created/Modified
- `src/components/compliance/GamblingDisclaimer.astro` - Reusable gambling disclaimer with compact/full variants, 21+ badge, PAGCOR hotline
- `src/components/compliance/AgeNotice.astro` - Non-blocking 21+ age notice banner
- `src/pages/tl/responsableng-pagsusugal.astro` - Filipino responsible gambling page with PAGCOR content
- `src/pages/en/responsible-gambling.astro` - English responsible gambling page with PAGCOR content
- `src/components/Footer.astro` - Changed 18+ to 21+, added responsible gambling link, integrated compact GamblingDisclaimer
- `src/i18n/ui.ts` - Added nav.responsibleGambling, compliance.*, and lead.* translation keys

## Decisions Made
- Inlined Organization schema object since lib/seo.ts from Plan 01 does not exist yet
- Page content hardcoded per language file (too verbose for i18n keys)
- Lead capture i18n keys added preemptively to avoid file conflict with Plan 04

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GamblingDisclaimer component ready for use on operator review pages and prediction pages
- AgeNotice component ready for placement above content sections site-wide
- When Plan 01 (SEO) executes, responsible gambling pages can be updated to use buildOrganizationSchema from lib/seo.ts

## Self-Check: PASSED

All 6 files verified present. Both commit hashes (e9de890, 82fd37f) confirmed in git log.

---
*Phase: 02-seo-compliance-affiliates*
*Completed: 2026-03-07*
