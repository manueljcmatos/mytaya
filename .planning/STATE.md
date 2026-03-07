# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-07)

**Core value:** Every Filipino sports bettor visiting mytaya.com finds accurate, timely predictions for basketball, boxing, and football in their preferred language (Filipino or English)
**Current focus:** Phase 3 -- Football Predictions (Worker pipeline complete, frontend next)

## Current Position

Phase: 3 of 7 (Football Predictions)
Plan: 1 of 3 in current phase (03-01 done)
Status: In Progress
Last activity: 2026-03-07 -- Completed 03-01-PLAN.md (Predictions Worker Pipeline)

Progress: [######....] 32%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 3min
- Total execution time: 0.43 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 11min | 4min |
| 02-seo-compliance-affiliates | 4 | 13min | 3min |
| 03-football-predictions | 1 | 3min | 3min |

**Recent Trend:**
- Last 5 plans: 02-01 (2min), 02-02 (3min), 02-03 (5min), 02-04 (3min), 03-01 (3min)
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Football predictions first (API-Football proven from betpro), basketball and boxing later
- [Roadmap]: Prediction cards isolated in Phase 6 due to Satori/Workers technical risk
- [Roadmap]: PBA, NCAA PH, and boxing grouped as manual content workflows in final phase
- [01-01]: Deep teal (#0F766E) brand palette -- Philippine tropical identity, distinct from betpro's gold
- [01-01]: Bebas Neue (display) + Inter (body) typography -- distinct from betpro's Oswald/Outfit
- [01-01]: Denormalized sport column on predictions table for query performance
- [01-01]: Conditional Supabase client (null if env vars missing) -- no hardcoded fallback keys
- [01-02]: Wordmark 'MY' in brand primary + 'TAYA' in theme text using Bebas Neue display font
- [01-02]: x-default hreflang points to Filipino (tl) URL as the default locale
- [01-02]: LanguageSwitcher shows alternate language flag (what user switches TO)
- [01-02]: View transition support via astro:after-swap event listeners
- [01-03]: Homepage sections ordered: Hero, SportTabs, Predictions, Results, TelegramBanner, Blog, Operators
- [01-03]: EmptyState component uses props for message and optional icon slot
- [01-03]: SportTabs use query param pattern (?sport=basketball) for sport filtering
- [02-01]: Schema builders return plain objects (not strings) -- Layout.astro handles JSON.stringify
- [02-01]: News sitemap is empty placeholder -- Phase 5 populates with blog posts
- [02-01]: Responsible gambling route mappings added preemptively to avoid file conflicts with Plan 02
- [02-02]: Inlined Organization schema since lib/seo.ts from Plan 01 not yet executed
- [02-02]: Page content hardcoded per language file (too verbose for i18n keys)
- [02-02]: Lead capture i18n keys added preemptively to avoid ui.ts conflict with Plan 04
- [02-03]: Placeholder affiliate URLs (#placeholder-affiliate-url-*) -- real URLs need user verification before launch
- [02-03]: Logo placeholder uses branded gradient div with operator initials until real logos available
- [02-03]: Comparison summary table above card grid on listing pages for quick scanning
- [02-04]: Hardcoded bilingual translations in React island (can't use Astro's useTranslations)
- [02-04]: Supabase client created inline in LeadCaptureForm for client-side island isolation
- [02-04]: Upsert on email conflict to prevent duplicate lead errors
- [03-01]: Workers AI with @cf/meta/llama-3.1-8b-instruct for bilingual prediction generation (free, Cloudflare-native)
- [03-01]: Fallback prediction from odds when AI parsing fails
- [03-01]: Team upsert by api_team_id with slug-conflict fallback using api_team_id suffix
- [03-01]: Prediction slug format: league-home-vs-away-date to avoid duplicate conflicts
- [03-01]: Default 1.9 odds for non-1X2 picks when specific odds unavailable

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 6: Satori on Workers has 6+ documented failure modes -- needs PoC before committing to card templates
- Phase 7: PBA API data quality unverified -- must audit API-Basketball PBA endpoints before building pipeline
- Phase 2: PAGCOR operator licensing status must be verified at implementation time (regulations evolving)

## Session Continuity

Last session: 2026-03-07
Stopped at: Completed 03-01-PLAN.md (Predictions Worker Pipeline)
Resume file: None
