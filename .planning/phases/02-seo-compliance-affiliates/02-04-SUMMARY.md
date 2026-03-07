---
phase: 02-seo-compliance-affiliates
plan: 04
subsystem: ui
tags: [zod, react, supabase, lead-capture, forms]

requires:
  - phase: 02-seo-compliance-affiliates
    provides: "Lead capture i18n keys in ui.ts (Plan 02)"
provides:
  - "LeadCaptureForm React island with Zod email validation"
  - "Supabase leads table migration with RLS"
  - "leadSchema Zod validation export"
affects: [email-marketing, newsletter, analytics]

tech-stack:
  added: [zod]
  patterns: [react-island-with-inline-translations, zod-safeParse-validation, supabase-client-side-upsert]

key-files:
  created:
    - src/components/LeadCaptureForm.tsx
    - src/lib/schemas.ts
    - supabase/migrations/002_leads_table.sql
  modified:
    - src/pages/tl/index.astro
    - src/pages/en/index.astro
    - package.json

key-decisions:
  - "Hardcoded bilingual translations inside React component (can't use Astro's useTranslations in islands)"
  - "Supabase client created inline in component (not imported from lib/supabase.ts) for client-side island isolation"
  - "Upsert on email conflict to prevent duplicate lead errors"

patterns-established:
  - "React island translation pattern: hardcode translations object keyed by lang prop"
  - "Zod safeParse for form validation with user-facing error messages"

requirements-completed: [AFFL-04]

duration: 3min
completed: 2026-03-07
---

# Phase 2 Plan 4: Lead Capture Summary

**Email lead capture form with Zod validation, Supabase storage, and Telegram CTA on both homepages**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T17:16:38Z
- **Completed:** 2026-03-07T17:34:25Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Zod-validated email capture form with bilingual support (Filipino/English)
- Supabase leads table migration with RLS and INSERT-only anon policy
- Graceful fallback when Supabase env vars not configured
- Success state with Telegram channel CTA button

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Zod, create validation schemas and Supabase migration** - `572f439` (feat)
2. **Task 2: Create LeadCaptureForm component and add to homepages** - `e35085a` (feat)

## Files Created/Modified
- `src/lib/schemas.ts` - Zod leadSchema with email validation and LeadInput type export
- `src/components/LeadCaptureForm.tsx` - React island with form, validation, Supabase upsert, Telegram CTA
- `supabase/migrations/002_leads_table.sql` - Leads table DDL with RLS and anon INSERT policy
- `src/pages/tl/index.astro` - Added lead capture section between Telegram and Blog
- `src/pages/en/index.astro` - Added lead capture section between Telegram and Blog
- `package.json` - Added zod dependency

## Decisions Made
- Hardcoded bilingual translations inside React component since Astro's useTranslations is not available in React islands
- Created Supabase client inline in component rather than importing from lib/supabase.ts for client-side island isolation
- Used upsert with onConflict: 'email' to gracefully handle duplicate subscriptions
- Placed lead capture section between TelegramBanner and Blog sections for natural CTA flow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Before the lead capture form is fully functional:
- Run `supabase/migrations/002_leads_table.sql` in Supabase SQL editor
- Ensure `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` env vars are set
- Without env vars, form shows graceful "Coming soon" fallback

## Next Phase Readiness
- Lead capture infrastructure complete
- Zod schemas module ready for additional validation schemas in future phases
- Phase 2 (SEO, Compliance & Affiliates) fully complete

---
*Phase: 02-seo-compliance-affiliates*
*Completed: 2026-03-07*
