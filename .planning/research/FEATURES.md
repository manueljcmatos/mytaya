# Feature Research

**Domain:** Sports betting predictions platform (Philippine market)
**Researched:** 2026-03-07
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Daily match predictions with pick + reasoning | Core product -- every competitor (MightyTips, FreeSuperTips, ProTipster) publishes daily picks with analysis | MEDIUM | Need structured format: pick, confidence rating, short reasoning paragraph |
| Sport coverage for NBA + PBA + Boxing | Philippine audience cares about these three above all else; NBA is massive, PBA is local pride, boxing is cultural | HIGH | NBA via API-Football; PBA likely manual or alternative API; boxing fully editorial |
| Win rate / ROI tracker | Every credible tipster site displays historical accuracy; without it, users have zero reason to trust you | MEDIUM | Track per-sport, per-league, per-timeframe; display prominently on homepage |
| Mobile-responsive design | 80%+ of PH internet access is mobile; MightyTips, online-betting.ph all mobile-first | LOW | Astro + Tailwind handles this natively; PWA adds install capability |
| Free access (no paywall for predictions) | All major PH prediction sites are free; paywalls kill growth in price-sensitive PH market | LOW | Monetize through affiliate links, not subscriptions |
| Bilingual Filipino/English content | BK8, 22bet, Sbobet all offer Tagalog; PH users expect local language option | HIGH | Astro i18n static routing; all content must exist in both languages |
| Affiliate operator cards with bonuses | MightyTips shows 18+ operators with ratings, bonuses, links; this is the monetization engine | MEDIUM | Research PAGCOR-licensed operators: BK8, Bet88, OKBet, 1xBet, 22bet, Megapari |
| Match preview / analysis article per prediction | FreeSuperTips format: star rating + bullet summary + subheaded analysis + predictions at bottom | MEDIUM | Template-driven; AI-generated with editorial review |
| Confidence / star rating system | FreeSuperTips uses 1-3 stars; BetQL uses 1-5 stars; users want quick visual signal of tip strength | LOW | Simple 1-5 star or similar visual system on each prediction card |
| Responsible gambling page | PAGCOR requires responsible gaming awareness; 2026 regulations are getting stricter | LOW | Static page with PAGCOR links, self-exclusion info, addiction resources; use "Gambling is addictive, know when to stop" tagline in Filipino + English |
| SEO optimization with structured data | Sports betting SEO in 2026 requires Schema.org (SportsEvent, FAQ, Article); Google News eligibility needs news sitemap | MEDIUM | SportsEvent schema for match predictions; Article schema for blog posts; hreflang for bilingual |
| Blog / news section | Every competitor has editorial content; drives organic traffic and establishes authority | MEDIUM | AI-generated daily posts in both languages; cover matchups, league news, boxing fight previews |
| Dark/light theme toggle | Modern web expectation; PH users browse at night on mobile | LOW | Tailwind dark mode; persist preference in localStorage |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not expected, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Shareable prediction cards (PNG images) | No PH competitor generates branded image cards for Telegram/social sharing; viral growth mechanism | MEDIUM | Server-side or canvas-based image generation; branded template with pick, odds, confidence, MyTaya logo |
| Telegram channel with automated tips | Telegram is THE platform for PH betting communities; automated publishing creates a "set and forget" growth channel | HIGH | Telegram Bot API; Cloudflare Worker triggers on new prediction publish; format: image card + text summary |
| Filipino-first editorial voice | Most PH betting sites are translated from English by global companies; MyTaya writes natively in Filipino with cultural references, local slang, basketball memes | LOW | Editorial guideline, not a tech feature; "Taya" branding is already culturally rooted |
| PBA + NCAA PH coverage depth | MightyTips barely covers PBA; betimate has basic Philippines basketball; deep PBA/NCAA PH analysis is a gap | HIGH | Likely manual data entry for PBA/NCAA PH; no reliable API; differentiates from global sites |
| "Bet of the Day" featured pick | FreeSuperTips does this effectively; single high-confidence pick prominently displayed drives engagement | LOW | Editorially selected or highest-confidence pick auto-promoted; hero section on homepage |
| Prediction streak / hot tipster badges | Gamification element showing current winning streaks; builds trust and engagement | LOW | Derived from win rate data; visual badges on prediction cards |
| Boxing fight preview editorial series | No API means editorial is the product; deep-dive Pacquiao-era storytelling + modern PH boxing scene analysis | MEDIUM | Manual content; 2-3 posts per major fight; culturally resonant with Filipino audience |
| Football predictions (API-driven, immediate launch) | API-Football already integrated from betpro reference; launch with football while building basketball pipeline | LOW | Reuse betpro architecture; football is growing in PH (Azkals, Premier League following) |
| PWA with push notifications | Users install to home screen; push notifications for daily picks without needing Telegram | MEDIUM | Service worker + push subscription; Cloudflare Worker triggers notification on new prediction |
| Accumulator / parlay tips | Popular format in PH betting; combine multiple picks into one high-odds bet | LOW | Curated daily acca from existing single predictions; display combined odds |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / login system | "Let users save favorites, track their bets" | Massive complexity for a prediction site; auth, profiles, data storage, privacy compliance; kills the casual drop-in experience | Cookie-based preferences (theme, language); no accounts needed for a read-only tips site |
| Live scores / real-time match tracking | "Users want to follow games" | Requires WebSocket infrastructure, real-time APIs, high bandwidth costs; competing with ESPN, FlashScore, Sofascore who do this infinitely better | Link out to live score sites; focus on pre-match predictions which is the actual value prop |
| Community forum / chat | "Build a community around picks" | Moderation nightmare, spam magnet, liability for gambling-related user content; Telegram groups handle this better natively | Telegram group for community discussion; website stays content-focused |
| Paid VIP tips tier | "Monetize with premium picks" | Destroys trust in free picks ("you're giving me the bad ones for free"); PH market is price-sensitive; affiliate revenue is more sustainable | Monetize through affiliate operator links; all tips free |
| X/Twitter integration | "Share predictions on social media" | PH betting community is on Telegram, not X; dilutes focus; X API is expensive and unreliable | All-in on Telegram; add Facebook sharing only if organic demand appears |
| Live streaming | "Watch games on our site" | Licensing costs are astronomical; legal minefield; not the value proposition | Embed highlight clips or link to official streams |
| Mobile native app | "Users want an app" | App store review process for gambling content is brutal; PWA provides same experience | PWA with home screen install, push notifications, offline caching |
| Real-time odds comparison | "Show odds across bookmakers" | Requires partnerships or scraping; odds change constantly; complex real-time infrastructure | Show recommended operator for each pick with their current odds (static, refreshed periodically) |
| Boxing API integration | "Automate boxing predictions like basketball" | Boxing APIs are unreliable, sparse, and poorly maintained; fight schedules change constantly | Editorial boxing content is the product; manual picks with rich storytelling |
| Multi-language beyond Filipino/English | "Add Cebuano, Bisaya, etc." | Triples content creation burden; Filipino + English already covers 95%+ of PH internet users | Start with Filipino + English; evaluate regional languages only if clear demand signal |

## Feature Dependencies

```
[API-Football Integration]
    |--requires--> [Prediction Data Model in Supabase]
    |                   |--requires--> [Win Rate / ROI Tracker]
    |                   |--requires--> [Prediction Cards Display]
    |                                       |--enhances--> [Shareable PNG Cards]
    |                                       |--enhances--> [Bet of the Day]
    |
    |--enables--> [Football Predictions] (immediate, reuse betpro)
    |--enables--> [NBA Predictions] (API-Football covers NBA)

[Bilingual i18n Setup]
    |--requires--> [Astro i18n Routing Config]
    |--required-by--> [All Content Pages]
    |--required-by--> [Blog / News Section]
    |--required-by--> [Responsible Gambling Page]

[Supabase Prediction Schema]
    |--requires--> [Database Design]
    |--required-by--> [Win Rate Tracker]
    |--required-by--> [Telegram Bot Publishing]
    |--required-by--> [Shareable Prediction Cards]
    |--required-by--> [Blog Content Generation]

[Telegram Bot Integration]
    |--requires--> [Prediction Data in Supabase]
    |--requires--> [Shareable PNG Card Generation]
    |--enhances--> [User Acquisition via Telegram]

[Affiliate Operator Cards]
    |--requires--> [Operator Research + Data]
    |--independent-of--> [Prediction System]
    |--enhances--> [Match Preview Articles] (inline operator CTAs)

[PBA / NCAA PH Coverage]
    |--requires--> [Manual Data Entry Workflow]
    |--conflicts-with--> [Full Automation] (cannot fully automate without API)
```

### Dependency Notes

- **Football predictions before basketball:** API-Football integration is proven from betpro; launch with football to validate the platform while building the harder basketball pipeline
- **Bilingual setup must be foundational:** Retrofitting i18n is painful; it must be in the Astro routing from day one
- **Supabase schema is the critical path:** Every feature -- predictions, tracking, Telegram, cards -- depends on the data model being right
- **Telegram requires PNG generation first:** Bot publishing is most effective with visual prediction cards, not just text
- **PBA coverage requires manual workflow:** No reliable API means building an editorial/manual data entry process, which is fundamentally different from automated football predictions

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the concept.

- [ ] **Football predictions (API-driven)** -- Fastest to launch; reuse betpro architecture; validates platform while basketball is built
- [ ] **Bilingual site structure (Filipino/English)** -- Must be foundational; cannot retrofit
- [ ] **Prediction cards with confidence rating** -- Core product display; includes pick, reasoning, star rating
- [ ] **Win rate / ROI tracker** -- Establishes credibility from day one
- [ ] **Affiliate operator cards (5-6 PAGCOR-licensed operators)** -- Monetization from launch
- [ ] **Blog section with AI-generated match previews** -- SEO traffic driver; content in both languages
- [ ] **Responsible gambling page** -- PAGCOR compliance; simple static page
- [ ] **SEO with Schema.org structured data** -- SportsEvent + Article + hreflang for discoverability
- [ ] **Dark/light theme** -- Low effort, high polish signal
- [ ] **Mobile-responsive PWA** -- Home screen installable; PH users are mobile-first

### Add After Validation (v1.x)

Features to add once core is working and traffic is flowing.

- [ ] **NBA predictions (API-Football)** -- Add once football pipeline is proven; NBA is huge in PH
- [ ] **Shareable PNG prediction cards** -- Enable viral sharing on Telegram and social media
- [ ] **Telegram bot with automated tip publishing** -- Triggered by new prediction; card + summary format
- [ ] **Bet of the Day featured pick** -- Homepage hero section; highest-confidence daily pick
- [ ] **Accumulator / parlay tips** -- Daily combined picks from existing singles
- [ ] **Prediction streak badges** -- Gamification; visual winning streak indicators
- [ ] **Push notifications (PWA)** -- Notify users of daily picks without requiring Telegram

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **PBA predictions** -- Requires manual data workflow; validate demand with NBA first
- [ ] **NCAA Philippines basketball** -- Even more niche; only after PBA is proven
- [ ] **Boxing editorial series** -- Rich content but manual; build editorial capacity first
- [ ] **Advanced statistics dashboard** -- Head-to-head, form tables, league standings; significant data work
- [ ] **Multi-operator odds display** -- Show odds from multiple bookmakers per prediction; requires partnerships

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Football predictions (API-driven) | HIGH | LOW | P1 |
| Bilingual i18n structure | HIGH | MEDIUM | P1 |
| Prediction cards with rating | HIGH | LOW | P1 |
| Win rate / ROI tracker | HIGH | MEDIUM | P1 |
| Affiliate operator cards | HIGH | LOW | P1 |
| Blog / match previews | HIGH | MEDIUM | P1 |
| Responsible gambling page | MEDIUM | LOW | P1 |
| SEO + Schema.org | HIGH | MEDIUM | P1 |
| Dark/light theme | LOW | LOW | P1 |
| PWA support | MEDIUM | LOW | P1 |
| NBA predictions | HIGH | LOW | P2 |
| Shareable PNG cards | HIGH | MEDIUM | P2 |
| Telegram bot publishing | HIGH | HIGH | P2 |
| Bet of the Day | MEDIUM | LOW | P2 |
| Accumulator tips | MEDIUM | LOW | P2 |
| Prediction streaks | LOW | LOW | P2 |
| PWA push notifications | MEDIUM | MEDIUM | P2 |
| PBA predictions | HIGH | HIGH | P3 |
| NCAA PH predictions | MEDIUM | HIGH | P3 |
| Boxing editorials | MEDIUM | MEDIUM | P3 |
| Advanced stats dashboard | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible (after football validates)
- P3: Nice to have, future consideration (after PMF)

## Competitor Feature Analysis

| Feature | MightyTips.ph | Online-Betting.ph | FreeSuperTips | Betimate | MyTaya Approach |
|---------|---------------|-------------------|---------------|----------|-----------------|
| Daily predictions | Yes, multi-sport | Yes, multi-sport | Yes, football-heavy | Yes, algorithm-based | Yes, basketball + boxing + football focus |
| Star/confidence rating | No | No | Yes (1-3 stars) | No | Yes, 1-5 star system |
| Win rate tracking | No (operator reviews only) | No | Limited | Yes (basic) | Yes, prominent homepage tracker |
| Filipino language | No (English only) | No (English only) | No (English only) | No (English only) | Yes, native Filipino + English bilingual |
| Telegram integration | No | No | No | No | Yes, automated bot + channel |
| Shareable image cards | No | No | No | No | Yes, branded PNG cards |
| PBA/NCAA PH coverage | Minimal mentions | Minimal | No | Basic odds only | Deep editorial + predictions |
| Boxing predictions | No | Minimal | No | No | Yes, editorial series |
| Affiliate operators | 18+ operators | Yes | Yes (UK-focused) | Minimal | 5-6 PAGCOR-licensed PH operators |
| Blog/editorial | Yes (basic) | Yes (basic) | Yes (detailed) | No | Yes, AI-generated bilingual |
| Accumulator tips | No | No | Yes (key feature) | No | Yes, daily parlays |
| PWA | No | No | No | No | Yes, installable |

## Sources

- [MightyTips.ph](https://mightytips.ph/) -- Primary PH competitor; operator reviews and betting tips (MEDIUM confidence, direct site analysis)
- [Online-Betting.ph](https://online-betting.ph/betting-tips/) -- PH predictions with operator affiliates (MEDIUM confidence, direct site analysis)
- [FreeSuperTips](https://www.freesupertips.com/) -- Best-in-class tipster format with star ratings and accumulator tips (MEDIUM confidence, WebSearch)
- [BetQL](https://betql.co/) -- Star rating system and ROI tracking model (MEDIUM confidence, WebSearch)
- [Punter2Pro](https://punter2pro.com/best-sports-betting-tipsters-tipping-services/) -- Tipster service comparison and feature benchmarking (LOW confidence, WebSearch)
- [PAGCOR Responsible Gaming](https://www.pagcor.ph/regulatory/responsible-gaming.php) -- Official responsible gambling requirements (HIGH confidence, official source)
- [Chambers & Partners - PAGCOR Affiliate Rules](https://chambers.com/articles/pagcor-issues-rules-on-accreditation-of-gaming-affiliates-and-support-providers-under-new-regime) -- 2026 affiliate accreditation requirements (MEDIUM confidence, legal publication)
- [iGaming SEO Trends 2026](https://samblogs.com/igaming-seo-trends-2026/) -- Schema.org requirements for sports betting sites (LOW confidence, WebSearch)
- [Smart Betting Guide - Telegram Channels](https://smartbettingguide.com/telegram-sports-betting-groups/) -- Telegram betting community patterns (LOW confidence, WebSearch)
- [Content Stadium - Betting Social Media](https://www.contentstadium.com/blog/sports-betting-social-media-content-ideas/) -- Shareable prediction card content strategy (LOW confidence, WebSearch)

---
*Feature research for: Philippine sports betting predictions platform*
*Researched: 2026-03-07*
