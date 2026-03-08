# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-07)

**Core value:** Every Filipino sports bettor visiting mytaya.com finds accurate, timely predictions for basketball, boxing, and football in their preferred language (Filipino or English)
**Current focus:** Phase 7 in progress -- PBA, boxing, and manual content workflows

## Current Position

Phase: 7 of 7 (PBA Boxing Manual Content)
Plan: 2 of 3 in current phase
Status: In Progress
Last activity: 2026-03-08 -- Completed 07-01-PLAN.md (Boxing & PH Leagues Foundation)

Progress: [######################] 89%

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: 3min
- Total execution time: 0.89 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 11min | 4min |
| 02-seo-compliance-affiliates | 4 | 13min | 3min |
| 03-football-predictions | 3 | 9min | 3min |

**Recent Trend:**
- Last 5 plans: 05-01 (3min), 05-02 (8min), 06-01 (3min), 06-02 (4min), 07-01 (3min)
- Trend: Consistent

*Updated after each plan completion*
| Phase 04 P01 | 3min | 2 tasks | 7 files |
| Phase 04 P02 | 5min | 2 tasks | 7 files |
| Phase 04 P03 | 3min | 2 tasks | 10 files |
| Phase 05 P01 | 3min | 2 tasks | 5 files |
| Phase 05 P02 | 8min | 2 tasks | 8 files |
| Phase 06 P01 | 3min | 2 tasks | 9 files |
| Phase 06 P02 | 4min | 2 tasks | 6 files |
| Phase 07 P01 | 3min | 2 tasks | 5 files |

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
- [03-02]: Hardcoded bilingual translations in PredictionList React island (consistent with LeadCaptureForm pattern)
- [03-02]: Inline Supabase client creation in PredictionList for client-side island isolation
- [03-02]: Date grouping uses Intl.DateTimeFormat with Asia/Manila timezone (no date-fns needed)
- [03-02]: PredictionCard.astro for SSG contexts; PredictionList renders cards inline for client-side
- [03-03]: Hardcoded bilingual translations in PredictionDetail React island (consistent with PredictionList pattern)
- [03-03]: Dual SportsEvent JSON-LD: server-side in Astro + client-side in React island (search engines deduplicate)
- [03-03]: Custom hreflang tags in page slot override Layout defaults for correct /hula/ <-> /predictions/ mapping
- [03-03]: Supabase join queries for team/league names in both Astro frontmatter and React island
- [04-01]: Same x-apisports-key for both API-Football and API-Basketball (no new secret)
- [04-01]: NBA pipeline isolated with try/catch so football pipeline continues on NBA failure
- [04-02]: Sport tabs as pill buttons above Today/Past tabs for clear visual hierarchy
- [04-02]: NBA sport badge uses orange accent color (#f97316) to distinguish from teal football branding
- [04-02]: Spread/total line values displayed inline with pick type badge on cards
- [04-01]: Half-point lines prevent pushes on spread/totals; push result supported for whole-number lines
- [04-03]: Recharts 3.8.0 for charting -- pure React, SVG-based, works with CSS vars for theme-aware styling
- [04-03]: Statistics computed on-read from predictions table (no separate aggregation table)
- [04-03]: Streak calculation skips push results to count only consecutive wins or losses
- [05-01]: Sequential await for prediction pipelines instead of ctx.waitUntil to ensure blog generation runs after predictions exist in DB
- [05-01]: Programmatic blog slug generation with sport prefix (not AI-generated) per research pitfall #5
- [05-01]: Shared appendResultToPost helper between football and NBA resolvers for bilingual result appendix
- [05-02]: Inline Supabase client in BlogList React island consistent with PredictionList pattern
- [05-02]: Result section parsed from markdown content via regex matching ## Result/Resulta headers
- [05-02]: News sitemap generates 2 entries per post (EN + TL) with XML entity escaping
- [05-02]: Blog detail pages render markdown with basic heading/paragraph parsing (no full markdown lib)
- [06-01]: R2 public URL uses cards.mytaya.com placeholder constant -- user configures R2 public access
- [06-01]: Fonts loaded from R2 at fonts/ prefix -- must be manually uploaded (BebasNeue-Regular.ttf, Inter-Regular.ttf)
- [06-01]: Card generation always wrapped in try/catch so pipelines are never disrupted
- [06-01]: Result card overwrites prediction card URL (result is final state)
- [06-01]: Resolver queries extended with teams join for team names needed by card templates
- [06-02]: Raw Telegram Bot HTTP API (no SDK) to keep worker bundle small
- [06-02]: Drip publishing window is 2-3 hours before match kickoff via hourly cron
- [06-02]: Daily recap sent at 23:00 PHT with record, streak, and ROI
- [06-02]: Result card Telegram posting re-fetches card_image_url after generation for updated URL
- [06-02]: Blog pages do not exist yet -- skipped blog OG integration
- [07-01]: Auto-settle trigger simplifies manual resolution to single result field update via Supabase dashboard
- [07-01]: generateMissingCards integrated into resolveFinishedMatches (runs every cron cycle, non-blocking)
- [07-01]: Boxing card uses red accent (#DC2626) with fight-card layout showing fighter records and weight class
- [07-01]: api_fixture_id made nullable (number | null) to support manual predictions without API source

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 6: Satori on Workers has 6+ documented failure modes -- needs PoC before committing to card templates
- Phase 7: PBA API data quality unverified -- must audit API-Basketball PBA endpoints before building pipeline
- Phase 2: PAGCOR operator licensing status must be verified at implementation time (regulations evolving)

## Session Continuity

Last session: 2026-03-08
Stopped at: Completed 07-01-PLAN.md (Boxing & PH Leagues Foundation)
Resume file: None
