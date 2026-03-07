# Roadmap: MyTaya

## Overview

MyTaya delivers a bilingual Filipino/English sports betting predictions platform, built from foundation outward: database schema and i18n routing first (everything depends on these being correct from day one), then SEO/compliance infrastructure (YMYL penalties are permanent), then the proven football prediction pipeline (fastest to validate via betpro reference), extending to NBA and statistics, blog automation, shareable prediction cards with Telegram distribution (the competitive differentiator), and finally manual content workflows for PBA, boxing, and NCAA PH.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Supabase schema, Astro i18n routing, visual identity, theme toggle, PWA shell
- [ ] **Phase 2: SEO, Compliance & Affiliates** - Schema.org structured data, PAGCOR compliance, sitemaps, operator cards, lead capture
- [ ] **Phase 3: Football Predictions** - API-Football pipeline with automated fetch, display, and resolution
- [ ] **Phase 4: NBA Predictions & Statistics** - NBA prediction pipeline extending football, win rate/ROI dashboard
- [ ] **Phase 5: Blog Automation** - AI-generated bilingual blog posts via Workers, news sitemap
- [ ] **Phase 6: Prediction Cards & Telegram** - PNG card generation via Satori on Workers, Telegram bot with drip publishing
- [ ] **Phase 7: PBA, Boxing & Manual Content** - Manual prediction entry for PBA, NCAA PH, and boxing editorial

## Phase Details

### Phase 1: Foundation
**Goal**: Users can visit mytaya.com and see a bilingual, responsive site with Philippine-inspired design that works in both Filipino and English
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08
**Success Criteria** (what must be TRUE):
  1. User visiting mytaya.com sees content in Filipino or English based on browser language, and can manually switch languages from any page
  2. Each language version has its own URL path (/tl/ and /en/) with correct hreflang tags visible in page source
  3. Supabase predictions table exists with bilingual columns and odds-tracking fields, queryable via PostgREST
  4. User can toggle dark/light theme and the preference persists across browser sessions
  5. Site is installable as a PWA from the browser, with a fresh Philippine-inspired visual identity that is clearly distinct from betpro.cl
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Project setup: Astro 5 + Tailwind v4 + i18n config + theme system + Supabase schema
- [ ] 01-02-PLAN.md — Layout, Header, Footer, Language Switcher, Theme Toggle components
- [ ] 01-03-PLAN.md — Bilingual homepage + section pages with empty states + visual checkpoint

### Phase 2: SEO, Compliance & Affiliates
**Goal**: The site meets Google YMYL trust requirements and PAGCOR compliance standards, with monetization infrastructure in place
**Depends on**: Phase 1
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, AFFL-01, AFFL-02, AFFL-03, AFFL-04
**Success Criteria** (what must be TRUE):
  1. Prediction pages include Schema.org SportsEvent structured data visible in Google Rich Results Test
  2. A responsible gambling page exists with PAGCOR-compliant messaging in both languages, and gambling disclaimers appear on prediction pages
  3. Affiliate operator cards display PAGCOR-licensed operators with name, logo, bonus, and affiliate link on a dedicated operators page
  4. Lead capture form validates email input and stores submissions, accessible from site footer or dedicated signup section
  5. XML sitemap with hreflang annotations and news sitemap are generated and accessible at standard paths
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Football Predictions
**Goal**: Users can view daily football predictions that are automatically fetched, displayed, and resolved without manual intervention
**Depends on**: Phase 2
**Requirements**: FTBL-01, FTBL-02, FTBL-03, FTBL-04, FTBL-05
**Success Criteria** (what must be TRUE):
  1. Today's football predictions page shows matches fetched from API-Football with teams, league, time, odds, and prediction type in both languages
  2. Past predictions show resolved results (win/loss) updated automatically after matches conclude
  3. Individual prediction pages display detailed bilingual analysis with proper SEO metadata
  4. User can browse between today's pending predictions and historical resolved predictions
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: NBA Predictions & Statistics
**Goal**: Users can view NBA predictions alongside football, and track prediction performance across sports with win rate, ROI, and streaks
**Depends on**: Phase 3
**Requirements**: BASK-01, BASK-02, BASK-03, STAT-01, STAT-02, STAT-03, STAT-04, STAT-05
**Success Criteria** (what must be TRUE):
  1. Daily NBA predictions display teams, conference, odds, spread, and prediction type, fetched and resolved automatically
  2. Statistics dashboard shows overall win rate, ROI percentage, and current streak across all sports
  3. User can filter statistics by sport (football, basketball) to see per-sport performance
  4. Profit chart visualizes prediction performance over time with historical data
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Blog Automation
**Goal**: The site publishes daily AI-generated sports articles in both languages, boosting SEO and providing fresh content
**Depends on**: Phase 3
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05
**Success Criteria** (what must be TRUE):
  1. New blog posts appear daily without manual intervention, generated by a Cloudflare Worker using Workers AI
  2. Each blog post exists in both Filipino and English with proper SEO metadata and Schema.org BlogPosting markup
  3. Blog index page shows paginated articles with featured/recent sections
  4. News sitemap includes blog posts and is formatted for Google News eligibility
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Prediction Cards & Telegram
**Goal**: Every prediction has a shareable branded PNG card, and predictions are automatically published to a Telegram channel throughout the day
**Depends on**: Phase 3
**Requirements**: CARD-01, CARD-02, CARD-03, TELE-01, TELE-02, TELE-03
**Success Criteria** (what must be TRUE):
  1. Each prediction has an associated PNG card showing match details, odds, prediction, and MyTaya branding, generated via Cloudflare Worker
  2. Prediction cards are downloadable and shareable on social media with proper OG image integration
  3. Telegram bot publishes predictions to a group channel automatically with drip scheduling (not all at once)
  4. Match results and resolutions are posted to Telegram when matches conclude
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: PBA, Boxing & Manual Content
**Goal**: Users can find predictions and editorial content for PBA, NCAA Philippines, and boxing -- the sports that define Philippine identity
**Depends on**: Phase 4
**Requirements**: BASK-04, BASK-05, BASK-06, BOX-01, BOX-02, BOX-03, BOX-04
**Success Criteria** (what must be TRUE):
  1. PBA predictions can be created manually with full match details and analysis, displayed alongside automated predictions
  2. NCAA Philippines / UAAP predictions can be created and displayed in both languages
  3. User can filter predictions by league (NBA, PBA, NCAA PH) on the basketball predictions page
  4. Boxing section displays editorial predictions in fight card format with fighter profiles, records, odds, and bilingual analysis
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7
Note: Phases 5 and 6 both depend on Phase 3 (not on each other) and could execute in parallel.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Planning complete | - |
| 2. SEO, Compliance & Affiliates | 0/0 | Not started | - |
| 3. Football Predictions | 0/0 | Not started | - |
| 4. NBA Predictions & Statistics | 0/0 | Not started | - |
| 5. Blog Automation | 0/0 | Not started | - |
| 6. Prediction Cards & Telegram | 0/0 | Not started | - |
| 7. PBA, Boxing & Manual Content | 0/0 | Not started | - |
