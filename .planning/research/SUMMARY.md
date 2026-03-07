# Project Research Summary

**Project:** MyTaya
**Domain:** Philippine sports betting predictions platform (bilingual)
**Researched:** 2026-03-07
**Confidence:** MEDIUM-HIGH

## Executive Summary

MyTaya is a bilingual (Filipino/English) sports betting predictions platform targeting the Philippine market, covering basketball (NBA, PBA), boxing, and football. The expert approach for this type of product is a statically generated content site built with Astro 5, backed by Supabase for data persistence and Cloudflare Workers for automated data pipelines. The key architectural insight is that this is fundamentally a content site with automated content generation -- not a real-time application. Astro's islands architecture keeps JavaScript minimal while enabling interactive elements (forms, charts) only where needed. A proven reference architecture exists from a similar project (betpro.cl), which validates the Astro + Supabase + Cloudflare Workers stack for sports prediction sites.

The recommended approach is to launch with football predictions first (API-Football integration is proven and fast to implement), then layer on NBA predictions (same API ecosystem), and defer PBA/boxing to later phases since they require manual or semi-automated workflows. Bilingual i18n must be foundational from day one -- retrofitting static-route-based i18n is prohibitively expensive. The monetization model is affiliate links to PAGCOR-licensed betting operators, not subscriptions. The competitive advantage comes from three things no Philippine competitor currently offers: native Filipino-language content, shareable branded prediction cards for Telegram, and an automated Telegram channel with drip-published daily tips.

The primary risks are: (1) PAGCOR regulatory compliance for affiliate content, which is actively tightening in 2026 and requires careful operator vetting; (2) Google YMYL classification penalizing the site unless proper E-E-A-T trust signals and responsible gambling content are present from launch; (3) Satori/resvg image generation on Cloudflare Workers having well-documented failure modes that must be validated with a proof-of-concept before building elaborate card templates; and (4) PBA data coverage from API-Basketball being potentially shallow, requiring a hybrid API + manual editorial approach rather than full automation.

## Key Findings

### Recommended Stack

The stack centers on Astro 5 for static site generation with React islands for interactivity, Supabase as the PostgreSQL database, and Cloudflare (Pages for hosting, Workers for cron-driven pipelines, R2 for image storage). Sports data comes from the API-Sports ecosystem (API-Football + API-Basketball) as the primary source, with BetsAPI as a supplementary source for UAAP/NCAA PH coverage. Image generation for prediction cards uses @cf-wasm/satori and @cf-wasm/resvg (Cloudflare Workers-compatible WASM wrappers). Tailwind CSS v4 handles styling. All committed technologies are well-matched to the domain.

**Core technologies:**
- **Astro 5.18.x:** Static site generator with built-in i18n routing, content collections, and zero-JS-by-default architecture -- ideal for SEO-driven content sites
- **Supabase:** Managed PostgreSQL with PostgREST API, RLS for public/private access control, and a schema designed for bilingual prediction data with odds tracking
- **Cloudflare Workers:** Edge compute for cron-driven prediction pipelines, blog generation (via Workers AI), image card generation, and Telegram publishing
- **API-Sports ecosystem:** Unified API for football (API-Football) and basketball (API-Basketball) with consistent auth and response format; covers NBA + PBA conferences
- **@cf-wasm/satori + @cf-wasm/resvg:** Workers-compatible image generation -- the only viable path for PNG card generation on Cloudflare's V8 isolate runtime

**Critical version constraints:** Pin @cf-wasm/satori at 0.1.x (bundles satori 0.15.2); satori 0.16+ has known Workers compatibility issues. Use @supabase/supabase-js 2.x (not v3). Workers interact with Supabase via raw fetch to PostgREST, not the SDK.

### Expected Features

**Must have (table stakes):**
- Daily match predictions with pick, confidence rating (1-5 stars), and bilingual analysis
- Win rate AND ROI tracking displayed prominently (ROI is more important than win rate for credibility)
- Affiliate operator cards for 5-6 PAGCOR-licensed operators (monetization engine)
- Mobile-responsive PWA (80%+ of PH internet access is mobile)
- Bilingual Filipino/English with static-route i18n
- Blog/news section with AI-generated match previews in both languages
- Responsible gambling page with PAGCOR-compliant messaging
- SEO with Schema.org structured data (SportsEvent, Article, BreadcrumbList)
- Dark/light theme toggle

**Should have (competitive advantage):**
- Shareable branded PNG prediction cards for social/Telegram sharing (no PH competitor has this)
- Automated Telegram channel with drip-published tips (Telegram is THE platform for PH betting communities)
- "Bet of the Day" featured pick on homepage
- Football predictions at launch (fastest path via API-Football), NBA added next
- Accumulator/parlay tips (popular in PH betting culture)

**Defer (v2+):**
- PBA predictions (requires manual data workflow; validate demand with NBA first)
- NCAA Philippines basketball (even more niche, no API coverage)
- Boxing editorial series (manual content; build editorial capacity first)
- Advanced statistics dashboard (significant data work)
- User accounts (unnecessary for a read-only tips site; adds massive complexity)
- Live scores (competing with ESPN/FlashScore is futile)

### Architecture Approach

The system follows a pipeline architecture: Cloudflare Workers fetch data from sports APIs on cron schedules, generate bilingual predictions and blog posts (using Workers AI), store everything in Supabase with paired language columns, and Astro builds fully static HTML pages from Supabase data at scheduled intervals. The static output is served via Cloudflare Pages CDN. Prediction cards are generated as PNG images via Satori/resvg on Workers and stored in R2. Telegram publishing uses drip scheduling (one prediction every 30 minutes) to keep the channel active throughout the day rather than dumping all predictions at once.

**Major components:**
1. **Supabase PostgreSQL** -- Single source of truth for predictions, blog posts, leads, stats; bilingual columns for all text content; RLS for access control
2. **Predictions Worker** -- Morning cron fetches fixtures and generates picks; half-hourly cron drip-publishes to Telegram and marks predictions as site-visible; resolves match results
3. **Blog Worker** -- Daily cron generates bilingual AI blog posts from Workers AI
4. **Astro Static Site** -- Build-time data fetching from Supabase; generates `/tl/` and `/en/` page trees; React islands for lead forms and charts only
5. **Cloudflare Pages + R2** -- CDN delivery of static HTML; R2 stores generated prediction card images with no egress fees

### Critical Pitfalls

1. **Tracking win rate without ROI** -- Capture odds at prediction time in the database schema from day one. A 65% win rate on heavy favorites loses money. Display ROI alongside win rate, use unit-based tracking, and separate stats by sport/league.
2. **Google YMYL penalties** -- Include responsible gambling page, per-page disclaimers, author attribution, and Schema.org markup at launch. Only feature PAGCOR-licensed operators. Expect 6-12 months for domain authority to build.
3. **Broken hreflang killing bilingual SEO** -- Use `tl` (ISO 639-1) not `fil` for Filipino. Every page needs self-referential hreflang + bidirectional links + `x-default`. Build a CI validation check. Canonical URLs must match hreflang exactly.
4. **Satori image generation failing on Workers** -- Use @cf-wasm wrappers, not vanilla packages. Pre-fetch all images as base64. Use PNG only (not WebP). Build a proof-of-concept Worker early and validate on deployed infrastructure, not local dev.
5. **PAGCOR compliance exposure** -- Only feature operators on PAGCOR's licensed operator list. Include mandatory responsible gambling tagline in Filipino and English. Monitor PAGCOR regulatory changes quarterly. Document that MyTaya is editorial, not a gambling operator.
6. **PBA API data gaps** -- Audit API-Basketball PBA endpoints before building pipelines. Design for hybrid API + manual data from the start. NCAA PH data will be fully manual.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Database + Site Shell + i18n)
**Rationale:** Everything depends on the Supabase schema and the bilingual Astro site structure. These are the two foundational layers that cannot be retrofitted. The schema must include odds tracking from day one (Pitfall 1) and the i18n routing must be correct from the start (Pitfall 3).
**Delivers:** Supabase schema with all core tables (predictions, blog_posts, operators, stats), Astro project with bilingual routing (`/tl/` and `/en/`), base layout with hreflang tags, theme toggle, responsive design, translation infrastructure.
**Addresses:** Bilingual i18n structure, mobile-responsive design, dark/light theme, database schema with odds tracking
**Avoids:** Win rate without ROI (schema includes odds), broken hreflang (built correctly from day one), client-side-only translations (static generation per locale)

### Phase 2: Content + SEO + Compliance
**Rationale:** Before any prediction pipeline, the site needs its static content pages, SEO infrastructure, and PAGCOR compliance layer. These are prerequisites for search visibility and legal operation. Google YMYL compliance (Pitfall 2) and PAGCOR compliance (Pitfall 6) must ship with launch.
**Delivers:** Responsible gambling page, affiliate operator cards (PAGCOR-vetted), Schema.org structured data components, sitemap with hreflang, news sitemap, per-page disclaimers, blog page templates.
**Addresses:** Responsible gambling page, affiliate operator cards, SEO + Schema.org, blog section templates
**Avoids:** Google YMYL penalty, PAGCOR compliance exposure

### Phase 3: Football Prediction Pipeline
**Rationale:** Football is the fastest path to a working prediction pipeline because API-Football integration is proven from the betpro reference project. This phase establishes the complete end-to-end flow: API fetch, prediction generation, Supabase storage, and Astro static rendering. Once this works, NBA uses the same pipeline with minor adjustments.
**Delivers:** Predictions Worker with morning cron, API-Football integration, prediction generation logic, result resolution, build trigger for Astro, prediction listing and detail pages in both languages.
**Uses:** API-Football, Cloudflare Workers (cron), Supabase PostgREST (raw fetch from Workers)
**Implements:** Build-time data fetching pattern, Workers as pure HTTP clients, drip publishing via cron

### Phase 4: Prediction Card Generation + Telegram
**Rationale:** Shareable prediction cards are the primary differentiator and the prerequisite for Telegram integration. This phase has the highest technical risk (Pitfall 4: Satori on Workers) and should be isolated so failures do not block the core prediction pipeline. Build a proof-of-concept first.
**Delivers:** PNG prediction card generation on Workers, R2 storage, OG image integration, Telegram bot publishing with drip scheduling, Telegram channel setup.
**Addresses:** Shareable PNG cards, Telegram bot with automated tips, Bet of the Day
**Avoids:** Satori/resvg Workers failures (PoC first, validated on deployed infrastructure)

### Phase 5: NBA + Win Rate Dashboard
**Rationale:** Once football predictions are flowing and the pipeline is proven, NBA is a low-cost addition (same API-Sports ecosystem). The win rate + ROI dashboard can now be built because there is real historical data to display.
**Delivers:** NBA prediction pipeline (extend existing Worker), win rate and ROI tracking pages, prediction streak badges, accumulator/parlay tips.
**Addresses:** NBA predictions, win rate/ROI tracker, prediction streaks, accumulator tips

### Phase 6: Blog Automation + PWA
**Rationale:** Blog automation depends on understanding Worker patterns established in Phases 3-4. PWA features (push notifications, offline caching) add polish once core content is flowing.
**Delivers:** Blog Worker with daily cron, Workers AI bilingual post generation, PWA manifest, push notification subscription, service worker.
**Addresses:** AI-generated blog posts, PWA with push notifications

### Phase 7: PBA + Boxing (Manual Content Workflows)
**Rationale:** PBA and boxing require fundamentally different workflows (manual/editorial vs. automated). Defer until automated sports are stable and editorial capacity exists. PBA needs API data quality validation before any pipeline work.
**Delivers:** Manual prediction entry interface, PBA prediction pipeline (hybrid API + manual), boxing editorial content workflow, NCAA PH coverage (fully manual).
**Addresses:** PBA predictions, boxing editorials, NCAA PH predictions

### Phase Ordering Rationale

- **Foundation first:** Schema and i18n are impossible to retrofit cleanly. Every subsequent phase depends on these being correct.
- **Compliance before content:** PAGCOR and SEO compliance must ship at launch, not be bolted on. The cost of YMYL penalties and regulatory exposure is too high.
- **Football before basketball:** API-Football is proven (betpro reference). It validates the entire pipeline with the lowest risk. NBA extends it; PBA is a different beast entirely.
- **Image generation isolated:** Satori on Workers has documented failure modes. Isolating this phase prevents it from blocking the core prediction pipeline if it takes longer than expected.
- **Manual content last:** PBA and boxing require editorial workflows that are operationally different from automated pipelines. Build these only after the automated system is stable and traffic validates demand.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Prediction Cards + Telegram):** Satori on Workers has 6+ documented failure modes. Needs a proof-of-concept before committing to card template designs. Investigate `workers-og` as a higher-level alternative.
- **Phase 7 (PBA + Boxing):** PBA API data quality is unverified. Must run data audit against API-Basketball PBA endpoints. UAAP/NCAA PH coverage likely requires BetsAPI or full manual entry. Boxing has no API at all.
- **Phase 2 (Compliance):** PAGCOR regulations are actively evolving in 2026. Operator licensing status must be verified against current PAGCOR lists at implementation time.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Astro i18n routing and Supabase schema design are well-documented with official guides.
- **Phase 3 (Football Pipeline):** Proven reference architecture from betpro.cl. API-Football integration patterns are established.
- **Phase 5 (NBA + Dashboard):** Extends existing football pipeline. Standard data visualization patterns.
- **Phase 6 (Blog + PWA):** Workers AI and PWA are well-documented with official Cloudflare and web platform docs.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack (Astro, Supabase, CF) is proven via betpro reference. @cf-wasm packages are community-maintained, not official -- pin versions carefully. API-Basketball PBA coverage is listed but untested. |
| Features | MEDIUM | Feature landscape is well-mapped via competitor analysis. Filipino-market-specific needs (PAGCOR compliance, Telegram-first distribution) are less documented. Affiliate operator research needed at implementation. |
| Architecture | HIGH | Architecture is directly informed by a working reference project (betpro.cl). Data flow, Worker patterns, and build triggers are all validated patterns. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls are well-sourced (official docs, peer-reviewed research, practitioner experience). PAGCOR regulatory landscape is the most uncertain -- regulations are actively changing. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **PBA API data quality:** Must run a live data audit against API-Basketball PBA endpoints during Phase 7 planning. Query fixtures, player stats, and score update latency during an active PBA game before building any pipeline.
- **PAGCOR licensed operator list:** Must verify which operators are currently PAGCOR-licensed before building affiliate cards in Phase 2. The list changes; verify at implementation time, not during research.
- **hreflang language code (`tl` vs `fil`):** PITFALLS.md recommends `tl` (ISO 639-1) while STACK.md uses `fil`. Resolve this during Phase 1: use `tl` for Google hreflang (Google expects ISO 639-1) but note that Astro i18n config may use either. Test with Google Search Console.
- **@cf-wasm package longevity:** Community-maintained packages with no guaranteed maintenance. Have a fallback plan (Supabase Edge Functions with Node.js Satori) if @cf-wasm breaks with future Satori updates.
- **Workers AI quality for Filipino content:** Untested whether Cloudflare Workers AI produces high-quality Filipino-language blog content. May need to test against alternatives (OpenAI, Anthropic) during Phase 6.
- **Telegram Bot rate limits at scale:** Rate limit is 20 messages/minute per group. If publishing to multiple groups/channels, need queuing strategy. Test during Phase 4 with realistic message volumes.

## Sources

### Primary (HIGH confidence)
- [Astro i18n Routing Documentation](https://docs.astro.build/en/guides/internationalization/)
- [Astro + Supabase Guide](https://docs.astro.build/en/guides/backend/supabase/)
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Satori GitHub (Official)](https://github.com/vercel/satori)
- [Satori Workers Compatibility Issue #693](https://github.com/vercel/satori/issues/693)
- [API-Football Rate Limit Documentation](https://www.api-football.com/news/post/how-ratelimit-works)
- [API-Basketball Coverage](https://www.api-basketball.com/coverage)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Google Ads Gambling Policy](https://support.google.com/adspolicy/answer/6018017?hl=en)
- [ScienceDirect: ML Model Calibration vs Accuracy](https://www.sciencedirect.com/science/article/pii/S266682702400015X) (peer-reviewed)
- betpro.cl reference project (local codebase analysis)

### Secondary (MEDIUM confidence)
- [PAGCOR Regulatory Framework for Affiliates (Chambers & Partners)](https://chambers.com/articles/pagcor-issues-rules-on-accreditation-of-gaming-affiliates-and-support-providers-under-new-regime)
- [AGB: PAGCOR Tightens Regulations 2026](https://agbrief.com/news/philippines/11/02/2026/pagcor-tightens-regulations-on-online-gambling/)
- [DEV.to: 6 Pitfalls of OG Image Generation on CF Workers](https://dev.to/devoresyah/6-pitfalls-of-dynamic-og-image-generation-on-cloudflare-workers-satori-resvg-wasm-1kle)
- [Search Engine Journal: Common Hreflang Mistakes](https://www.searchenginejournal.com/ask-an-seo-what-are-the-most-common-hreflang-mistakes/556455/)
- [BetsAPI Philippines Basketball](https://betsapi.com/t/9815/Philippines)
- [MightyTips.ph](https://mightytips.ph/), [FreeSuperTips](https://www.freesupertips.com/) (competitor analysis)
- [PAGCOR Responsible Gaming](https://www.pagcor.ph/regulatory/responsible-gaming.php)

### Tertiary (LOW confidence)
- [iGaming SEO Trends 2026](https://samblogs.com/igaming-seo-trends-2026/)
- [AffPapa: iGaming SEO Strategies](https://affpapa.com/igaming-seo-strategies-you-need-a-practical-guide/)
- [Smart Betting Guide: Telegram Channels](https://smartbettingguide.com/telegram-sports-betting-groups/)

---
*Research completed: 2026-03-07*
*Ready for roadmap: yes*
