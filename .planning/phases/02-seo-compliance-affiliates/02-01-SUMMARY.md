---
phase: 02-seo-compliance-affiliates
plan: 01
subsystem: seo
tags: [schema-org, json-ld, sitemap, google-news, structured-data]

requires:
  - phase: 01-foundation
    provides: Layout.astro schema prop, constants.ts SITE object
provides:
  - Schema.org JSON-LD builder functions (SportsEvent, BlogPosting, Organization, Breadcrumb)
  - Google News sitemap endpoint at /news-sitemap.xml
  - Responsible gambling route mappings in i18n/routes.ts
affects: [02-seo-compliance-affiliates, 03-predictions-pipeline, 05-content-blog]

tech-stack:
  added: []
  patterns: [JSON-LD builder functions returning plain objects for Layout.astro schema prop]

key-files:
  created:
    - src/lib/seo.ts
    - src/pages/news-sitemap.xml.ts
  modified:
    - src/i18n/routes.ts

key-decisions:
  - "Schema builders return plain objects (not strings) -- Layout.astro handles JSON.stringify"
  - "News sitemap is empty placeholder -- Phase 5 populates with blog posts"
  - "Responsible gambling route mappings added preemptively to avoid file conflicts with Plan 02"

patterns-established:
  - "SEO schema builder pattern: typed input interface -> plain object with @context/@type"

requirements-completed: [SEO-01, SEO-02, SEO-03, SEO-04]

duration: 2min
completed: 2026-03-07
---

# Phase 02 Plan 01: SEO Structured Data & News Sitemap Summary

**Schema.org JSON-LD builders for SportsEvent, BlogPosting, Organization, Breadcrumb plus Google News sitemap endpoint**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T17:08:50Z
- **Completed:** 2026-03-07T17:10:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Four typed Schema.org JSON-LD builder functions for Google Rich Results
- Google News sitemap endpoint generating valid XML at /news-sitemap.xml
- Responsible gambling route mappings for both tl/en locales

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Schema.org JSON-LD builder functions** - `3302166` (feat)
2. **Task 2: Create Google News sitemap endpoint and update route map** - `4c6675a` (feat)

## Files Created/Modified
- `src/lib/seo.ts` - Four schema builder functions with TypeScript interfaces
- `src/pages/news-sitemap.xml.ts` - Google News sitemap static endpoint
- `src/i18n/routes.ts` - Added responsible gambling route mappings

## Decisions Made
- Schema builders return plain objects (not strings) -- Layout.astro handles JSON.stringify via set:html
- News sitemap ships as empty placeholder -- Phase 5 will populate with blog post entries
- Responsible gambling route mappings added in this plan to avoid file conflicts with Plan 02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema builders ready for consumption by prediction pages (Phase 3) and blog pages (Phase 5)
- News sitemap ready to be populated when blog content is created
- Responsible gambling routes ready for Plan 02 compliance pages

---
*Phase: 02-seo-compliance-affiliates*
*Completed: 2026-03-07*
